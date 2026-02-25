import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GoogleAuthExchangeRequest {
  code: string;
  redirect_uri: string;
  branch: string;
  anon_key: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, redirect_uri, branch, anon_key }: GoogleAuthExchangeRequest = await req.json();

    if (!code || !redirect_uri || !branch || !anon_key) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: code, redirect_uri, branch, anon_key" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!/^[a-z0-9]{20}$/i.test(branch)) {
      return new Response(
        JSON.stringify({ error: "Invalid branch ref" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const anonKey = anon_key;

    const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID");
    const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET");

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return new Response(
        JSON.stringify({ error: "Google OAuth not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Exchange authorization code for tokens with Google
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
      console.error("Google token exchange error:", errorText);
      return new Response(
        JSON.stringify({ error: "Google OAuth error: " + errorText }),
        { status: tokenResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return new Response(
        JSON.stringify({ error: "Google OAuth error: " + (tokenData.error_description || tokenData.error) }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!tokenData.id_token || !tokenData.access_token) {
      return new Response(
        JSON.stringify({ error: "Google OAuth response missing id_token or access_token" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Exchange Google tokens for a Supabase session
    const supabaseAuthResponse = await fetch(
      "https://" + branch + ".supabase.co/auth/v1/token?grant_type=id_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": anonKey,
        },
        body: JSON.stringify({
          provider: "google",
          id_token: tokenData.id_token,
          access_token: tokenData.access_token,
        }),
      }
    );

    const supabaseData = await supabaseAuthResponse.json();

    if (!supabaseAuthResponse.ok) {
      console.error("Supabase auth error:", JSON.stringify(supabaseData));
      return new Response(
        JSON.stringify({ error: "Supabase auth error", details: supabaseData }),
        { status: supabaseAuthResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify(supabaseData),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Google auth exchange error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
