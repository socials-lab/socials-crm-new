import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GmailSendRequest {
  to: string;
  subject: string;
  html: string;
  bcc?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let userId: string | null = null;

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
    const { to, subject, html, bcc }: GmailSendRequest = await req.json();
    
    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ error: "Chybí povinná pole: to, subject, html" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
      // Refresh token
      const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID");
      const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET");

      if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
        return new Response(
          JSON.stringify({ error: "Google OAuth není nakonfigurováno" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const refreshResponse = await fetch("https://oauth2.googleapis.com/token", {
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
      });

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

    // Encode subject for UTF-8 (RFC 2047 encoded-word syntax)
    const encodeSubject = (subj: string) => {
      const encoder = new TextEncoder();
      const bytes = encoder.encode(subj);
      const base64 = btoa(String.fromCharCode(...bytes));
      return `=?UTF-8?B?${base64}?=`;
    };

    // Create email message in RFC 2822 format
    const emailHeaders = [
      `From: ${fromEmail}`,
      `To: ${to}`,
    ];

    // Process BCC - ensure each email is trimmed and properly formatted
    if (bcc) {
      const bccList = bcc.split(',').map(e => e.trim()).filter(e => e.length > 0);
      if (bccList.length > 0) {
        emailHeaders.push(`Bcc: ${bccList.join(', ')}`);
      }
    }

    emailHeaders.push(
      `Subject: ${encodeSubject(subject)}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset=utf-8`,
      `Content-Transfer-Encoding: base64`,
      ``,
      btoa(String.fromCharCode(...new TextEncoder().encode(html)))
    );
    const emailMessage = emailHeaders.join('\r\n');

    console.log('Sending email to:', to, 'BCC:', bcc);

    // Encode the entire message in base64url format (required by Gmail API)
    const encoder = new TextEncoder();
    const messageBytes = encoder.encode(emailMessage);
    const base64Message = btoa(String.fromCharCode(...messageBytes))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Send email via Gmail API
    const gmailResponse = await fetch(
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
    );

    if (!gmailResponse.ok) {
      const errorText = await gmailResponse.text();
      const durationMs = Date.now() - startTime;
      console.error("Gmail API error:", errorText);
      
      // Log failed API call
      await supabaseAdmin.from('integration_log').insert({
        service: 'gmail',
        action: 'send_email',
        request_payload: { to, subject, bcc: bcc || null },
        response_status: gmailResponse.status,
        response_payload: { error: errorText },
        is_success: false,
        error_message: errorText,
        triggered_by: userId,
        duration_ms: durationMs,
      });
      
      return new Response(
        JSON.stringify({ error: `Gmail API chyba: ${errorText}` }),
        { status: gmailResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const gmailResult = await gmailResponse.json();
    const durationMs = Date.now() - startTime;
    
    // Log successful integration call
    await supabaseAdmin.from('integration_log').insert({
      service: 'gmail',
      action: 'send_email',
      request_payload: { to, subject, bcc: bcc || null },
      response_status: gmailResponse.status,
      response_payload: gmailResult,
      is_success: true,
      triggered_by: userId,
      duration_ms: durationMs,
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        messageId: gmailResult.id,
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
      await supabaseAdmin.from('integration_log').insert({
        service: 'gmail',
        action: 'send_email',
        is_success: false,
        error_message: errorMessage,
        triggered_by: userId,
        duration_ms: durationMs,
      });
    } catch (logError) {
      console.error("Failed to log integration error:", logError);
    }
    
    console.error("Gmail send email error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
