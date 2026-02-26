import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_BCC = 'danny@socials.cz';

interface GmailSendRequest {
  to: string;
  subject: string;
  html: string;
  cc?: string;
  bcc?: string;
}

const withTimeout = async <T>(promise: Promise<T>, ms: number, label: string): Promise<T> => {
  let timeoutId: number | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`${label} timeout after ${ms}ms`)), ms) as unknown as number;
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let userId: string | null = null;
  let currentStage = 'init';

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Chybí autorizace" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Neplatná autorizace" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    userId = user.id;
    const { to, subject, html, cc, bcc }: GmailSendRequest = await req.json();
    
    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ error: "Chybí povinná pole: to, subject, html" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    currentStage = 'load_calendar_tokens';
    // Get user's Google tokens
    const { data: tokens, error: tokensError } = await supabaseAdmin
      .from("calendar_tokens")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (tokensError || !tokens) {
      return new Response(
        JSON.stringify({ error: "Google účet není propojen" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user has Gmail scope
    const hasGmailScope = tokens.scopes && Array.isArray(tokens.scopes) && 
      tokens.scopes.includes('https://www.googleapis.com/auth/gmail.send');
    
    if (!hasGmailScope) {
      return new Response(
        JSON.stringify({ error: "Google účet nemá oprávnění pro odesílání emailů. Prosím znovu propojte svůj Google účet." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if token is expired and refresh if needed
    let accessToken = tokens.access_token;
    const expiresAt = new Date(tokens.expires_at);
    
    if (expiresAt <= new Date()) {
      currentStage = 'refresh_google_token';
      // Refresh token
      const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID");
      const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET");

      if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
        return new Response(
          JSON.stringify({ error: "Google OAuth není nakonfigurováno" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const refreshResponse = await withTimeout(
        fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            client_id: GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            refresh_token: tokens.refresh_token,
            grant_type: "refresh_token",
          }),
        }),
        12000,
        'Google token refresh'
      );

      if (!refreshResponse.ok) {
        const errorText = await refreshResponse.text();
        console.error("Token refresh error:", errorText);

        // Check if refresh token is revoked/invalid
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error === "invalid_grant") {
            // Clear invalid tokens so user knows to reconnect
            await supabaseAdmin
              .from("calendar_tokens")
              .delete()
              .eq("user_id", user.id);
            return new Response(
              JSON.stringify({
                error: "Google přístup byl odvolán. Prosím znovu propojte svůj účet.",
                tokenRevoked: true,
              }),
              { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        } catch {
          // Couldn't parse error, continue with generic handling
        }

        return new Response(
          JSON.stringify({ error: `Chyba při obnovení tokenu: ${errorText}` }),
          { status: refreshResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const refreshData = await refreshResponse.json();
      accessToken = refreshData.access_token;
      const newExpiresAt = new Date(Date.now() + refreshData.expires_in * 1000);

      // Update tokens in database
      await supabaseAdmin
        .from("calendar_tokens")
        .update({
          access_token: accessToken,
          expires_at: newExpiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);
    }

    // Get user's email from auth metadata or colleagues table
    let fromEmail = user.email;
    if (!fromEmail) {
      const { data: colleague } = await supabaseAdmin
        .from("colleagues")
        .select("email")
        .eq("profile_id", user.id)
        .single();
      if (colleague?.email) {
        fromEmail = colleague.email;
      }
    }

    if (!fromEmail) {
      return new Response(
        JSON.stringify({ error: "Nepodařilo se zjistit email odesílatele" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const uint8ToBinary = (bytes: Uint8Array) => {
      const chunkSize = 0x8000;
      let binary = '';
      for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
      }
      return binary;
    };

    const encodeBase64Utf8 = (value: string) => {
      const encoder = new TextEncoder();
      return btoa(uint8ToBinary(encoder.encode(value)));
    };

    // Encode subject for UTF-8 (RFC 2047 encoded-word syntax)
    const encodeSubject = (subj: string) => {
      const base64 = encodeBase64Utf8(subj);
      return `=?UTF-8?B?${base64}?=`;
    };

    // Create email message in RFC 2822 format
    const emailHeaders = [
      `From: ${fromEmail}`,
      `To: ${to}`,
    ];

    const parseEmails = (value?: string) =>
      (value || '')
        .split(',')
        .map((email) => email.trim().toLowerCase())
        .filter((email) => email.length > 0);

    // Process CC
    const ccList = parseEmails(cc);
    if (ccList.length > 0) {
      emailHeaders.push(`Cc: ${ccList.join(', ')}`);
    }

    // Process BCC + enforce default BCC everywhere
    const bccList = Array.from(new Set([...parseEmails(DEFAULT_BCC), ...parseEmails(bcc)]));
    if (bccList.length > 0) {
      emailHeaders.push(`Bcc: ${bccList.join(', ')}`);
    }

    emailHeaders.push(
      `Subject: ${encodeSubject(subject)}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset=utf-8`,
      `Content-Transfer-Encoding: base64`,
      ``,
      encodeBase64Utf8(html)
    );
    const emailMessage = emailHeaders.join('\r\n');

    console.log('Sending email to:', to, 'CC:', ccList.join(', '), 'BCC:', bccList.join(', '));

    // Encode the entire message in base64url format (required by Gmail API)
    const base64Message = encodeBase64Utf8(emailMessage)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Send email via Gmail API
    currentStage = 'gmail_send';
    const gmailResponse = await withTimeout(
      fetch(
        "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            raw: base64Message,
          }),
        }
      ),
      15000,
      'Gmail send'
    );

    if (!gmailResponse.ok) {
      const errorText = await gmailResponse.text();
      const durationMs = Date.now() - startTime;
      console.error("Gmail API error:", errorText);
      
      // Log failed API call (best effort, non-blocking)
      void supabaseAdmin.from('integration_log').insert({
        service: 'gmail',
        action: 'send_email',
        request_payload: { to, subject, cc: ccList.length > 0 ? ccList.join(', ') : null, bcc: bccList.length > 0 ? bccList.join(', ') : null },
        response_status: gmailResponse.status,
        response_payload: { error: errorText },
        is_success: false,
        error_message: errorText,
        triggered_by: userId,
        duration_ms: durationMs,
      }).then(() => {}).catch((logErr) => console.error('Integration log failed:', logErr));
      
      return new Response(
        JSON.stringify({
          error: `Gmail API chyba: ${errorText}`,
          stage: currentStage,
          durationMs,
        }),
        { status: gmailResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const gmailResult = await gmailResponse.json();
    const durationMs = Date.now() - startTime;
    
    // Log successful integration call (best effort, non-blocking)
    void supabaseAdmin.from('integration_log').insert({
      service: 'gmail',
      action: 'send_email',
      request_payload: { to, subject, cc: ccList.length > 0 ? ccList.join(', ') : null, bcc: bccList.length > 0 ? bccList.join(', ') : null },
      response_status: gmailResponse.status,
      response_payload: gmailResult,
      is_success: true,
      triggered_by: userId,
      duration_ms: durationMs,
    }).then(() => {}).catch((logErr) => console.error('Integration log failed:', logErr));

    return new Response(
      JSON.stringify({ 
        success: true,
        messageId: gmailResult.id,
        debug: {
          durationMs,
          stage: currentStage,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Interní chyba serveru";
    
    // Log error
    try {
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      void supabaseAdmin.from('integration_log').insert({
        service: 'gmail',
        action: 'send_email',
        is_success: false,
        error_message: errorMessage,
        triggered_by: userId,
        duration_ms: durationMs,
      }).then(() => {}).catch((logErr) => console.error('Integration log failed:', logErr));
    } catch (logError) {
      console.error("Failed to log integration error:", logError);
    }
    
    console.error("Gmail send email error:", error);
    return new Response(
      JSON.stringify({
        error: errorMessage,
        stage: currentStage,
        durationMs,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
