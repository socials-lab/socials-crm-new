import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FetchEventsRequest {
  time_min?: string; // ISO string, defaults to now
  time_max?: string; // ISO string, defaults to 30 days from now
  max_results?: number; // defaults to 100
}

interface RefreshResult {
  accessToken: string | null;
  shouldClearTokens: boolean;
  error?: string;
}

async function refreshAccessToken(
  supabaseAdmin: ReturnType<typeof createClient>,
  userId: string,
  refreshToken: string
): Promise<RefreshResult> {
  const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID");
  const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET");

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return { accessToken: null, shouldClearTokens: false, error: "OAuth not configured" };
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Token refresh failed:", errorText);

    // Check if the refresh token is invalid/revoked
    // Google returns "invalid_grant" when token is revoked or expired
    try {
      const errorData = JSON.parse(errorText);
      if (errorData.error === "invalid_grant") {
        console.log("Refresh token is invalid/revoked, clearing tokens for user:", userId);
        // Clear the invalid tokens so user knows to reconnect
        await supabaseAdmin
          .from("calendar_tokens")
          .delete()
          .eq("user_id", userId);
        return {
          accessToken: null,
          shouldClearTokens: true,
          error: "Google přístup byl odvolán. Prosím znovu propojte svůj účet."
        };
      }
    } catch {
      // Couldn't parse error, continue with generic handling
    }

    return { accessToken: null, shouldClearTokens: false, error: "Token refresh failed" };
  }

  const tokenData = await response.json();
  const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

  // Update tokens in DB
  await supabaseAdmin
    .from("calendar_tokens")
    .update({
      access_token: tokenData.access_token,
      expires_at: expiresAt.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  return { accessToken: tokenData.access_token, shouldClearTokens: false };
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

    // Parse request body
    let body: FetchEventsRequest = {};
    try {
      const text = await req.text();
      if (text) {
        body = JSON.parse(text);
      }
    } catch {
      // No body or invalid JSON, use defaults
    }

    const now = new Date();
    const timeMin = body.time_min || now.toISOString();
    const timeMax = body.time_max || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const maxResults = body.max_results || 100;

    // Get user's calendar tokens
    const { data: tokens, error: tokensError } = await supabaseAdmin
      .from("calendar_tokens")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (tokensError || !tokens) {
      return new Response(
        JSON.stringify({ error: "Google Calendar není propojeno", events: [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if access token is expired and refresh if needed
    let accessToken = tokens.access_token;
    const tokenExpiry = new Date(tokens.expires_at);

    if (tokenExpiry < new Date(Date.now() + 60000)) { // Refresh if expires in < 1 minute
      const refreshResult = await refreshAccessToken(supabaseAdmin, user.id, tokens.refresh_token);
      if (!refreshResult.accessToken) {
        return new Response(
          JSON.stringify({
            error: refreshResult.error || "Nepodařilo se obnovit přístupový token",
            events: [],
            tokenRevoked: refreshResult.shouldClearTokens, // Signal to frontend to update state
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      accessToken = refreshResult.accessToken;
    }

    // Fetch events from Google Calendar
    const calendarUrl = new URL("https://www.googleapis.com/calendar/v3/calendars/primary/events");
    calendarUrl.searchParams.set("timeMin", timeMin);
    calendarUrl.searchParams.set("timeMax", timeMax);
    calendarUrl.searchParams.set("maxResults", maxResults.toString());
    calendarUrl.searchParams.set("singleEvents", "true");
    calendarUrl.searchParams.set("orderBy", "startTime");

    const response = await fetch(calendarUrl.toString(), {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google Calendar fetch error:", errorText);

      // If 401, token might be invalid - try refresh once more
      if (response.status === 401) {
        const refreshResult = await refreshAccessToken(supabaseAdmin, user.id, tokens.refresh_token);
        if (refreshResult.accessToken) {
          const retryResponse = await fetch(calendarUrl.toString(), {
            headers: {
              "Authorization": `Bearer ${refreshResult.accessToken}`,
            },
          });

          if (retryResponse.ok) {
            const retryData = await retryResponse.json();
            return new Response(
              JSON.stringify({ events: retryData.items || [] }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        } else if (refreshResult.shouldClearTokens) {
          // Token was revoked, return specific error
          return new Response(
            JSON.stringify({
              error: refreshResult.error || "Google přístup byl odvolán",
              events: [],
              tokenRevoked: true,
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      return new Response(
        JSON.stringify({ error: `Google Calendar chyba: ${response.status}`, events: [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const calendarData = await response.json();

    return new Response(
      JSON.stringify({ events: calendarData.items || [] }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Calendar fetch events error:", error);
    const errorMessage = error instanceof Error ? error.message : "Interní chyba serveru";
    return new Response(
      JSON.stringify({ error: errorMessage, events: [] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
