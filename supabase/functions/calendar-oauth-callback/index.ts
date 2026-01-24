import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OAuthCallbackRequest {
  code: string;
  redirect_uri: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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

    const { code, redirect_uri }: OAuthCallbackRequest = await req.json();
    
    if (!code) {
      return new Response(
        JSON.stringify({ error: "Chybí authorization code" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID");
    const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET");

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return new Response(
        JSON.stringify({ error: "Google OAuth není nakonfigurováno" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Exchange authorization code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Token exchange error:", errorText);
      return new Response(
        JSON.stringify({ error: `Google OAuth chyba: ${errorText}` }),
        { status: tokenResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tokenData = await tokenResponse.json();
    
    console.log("Token response:", JSON.stringify({ 
      hasAccessToken: !!tokenData.access_token, 
      hasRefreshToken: !!tokenData.refresh_token,
      scope: tokenData.scope,
      error: tokenData.error,
      error_description: tokenData.error_description
    }));
    
    if (tokenData.error) {
      return new Response(
        JSON.stringify({ error: `Google OAuth chyba: ${tokenData.error_description || tokenData.error}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (!tokenData.access_token || !tokenData.refresh_token) {
      return new Response(
        JSON.stringify({ error: "Neplatná odpověď z Google OAuth - chybí tokeny" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

    // Parse granted scopes from token response
    // Google returns scope as space-separated string in the response
    const grantedScopes = tokenData.scope 
      ? tokenData.scope.split(' ').filter((s: string) => s.length > 0)
      : ['https://www.googleapis.com/auth/calendar']; // Default fallback

    console.log("Attempting to upsert tokens for user:", user.id);
    console.log("Scopes to store:", JSON.stringify(grantedScopes));

    // Upsert calendar tokens with scopes
    const { error: upsertError } = await supabaseAdmin
      .from("calendar_tokens")
      .upsert({
        user_id: user.id,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: expiresAt.toISOString(),
        scopes: grantedScopes,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });

    if (upsertError) {
      console.error("Token storage error - full details:", JSON.stringify(upsertError, null, 2));
      return new Response(
        JSON.stringify({ error: `Nepodařilo se uložit tokeny: ${upsertError.message || upsertError.code || 'Unknown error'}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log("Tokens stored successfully");

    return new Response(
      JSON.stringify({ 
        success: true,
        expires_at: expiresAt.toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Calendar OAuth callback error:", error);
    const errorMessage = error instanceof Error ? error.message : "Interní chyba serveru";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
