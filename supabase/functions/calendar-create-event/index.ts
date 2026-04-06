import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CalendarEventRequest {
  meeting_id: string;
}

interface RefreshResult {
  accessToken: string | null;
  shouldClearTokens: boolean;
  error?: string;
}

interface GoogleApiErrorPayload {
  error?: {
    code?: number;
    message?: string;
    status?: string;
    errors?: Array<{ reason?: string; message?: string }>;
  };
}

function parseGoogleApiError(raw: string): GoogleApiErrorPayload | null {
  try {
    return JSON.parse(raw) as GoogleApiErrorPayload;
  } catch {
    return null;
  }
}

function isInsufficientScopeError(payload: GoogleApiErrorPayload | null): boolean {
  if (!payload?.error) return false;
  if (payload.error.status === "PERMISSION_DENIED") return true;
  return (payload.error.errors || []).some((err) => err.reason === "insufficientPermissions");
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

    try {
      const errorData = JSON.parse(errorText);
      if (errorData.error === "invalid_grant") {
        console.log("Refresh token is invalid/revoked, clearing tokens for user:", userId);
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
      // Couldn't parse error
    }

    return { accessToken: null, shouldClearTokens: false, error: "Token refresh failed" };
  }

  const tokenData = await response.json();
  const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

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

  const startTime = Date.now();
  let meetingId: string | null = null;
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
    const { meeting_id }: CalendarEventRequest = await req.json();
    meetingId = meeting_id;
    
    if (!meeting_id) {
      return new Response(
        JSON.stringify({ error: "Chybí meeting_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch meeting with participants
    const { data: meeting, error: meetingError } = await supabaseAdmin
      .from("meetings")
      .select(`
        *,
        meeting_participants (
          colleague_id,
          external_email,
          external_name,
          role
        )
      `)
      .eq("id", meeting_id)
      .single();

    if (meetingError || !meeting) {
      return new Response(
        JSON.stringify({ error: "Meeting nenalezen" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user's calendar tokens
    const { data: tokens, error: tokensError } = await supabaseAdmin
      .from("calendar_tokens")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (tokensError || !tokens) {
      return new Response(
        JSON.stringify({ error: "Google Calendar není propojeno" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Refresh token if expired or about to expire
    let accessToken = tokens.access_token;
    const tokenExpiry = new Date(tokens.expires_at);

    if (tokenExpiry < new Date(Date.now() + 60000)) { // Refresh if expires in < 1 minute
      const refreshResult = await refreshAccessToken(supabaseAdmin, user.id, tokens.refresh_token);
      if (!refreshResult.accessToken) {
        return new Response(
          JSON.stringify({
            error: refreshResult.error || "Nepodařilo se obnovit přístupový token",
            tokenRevoked: refreshResult.shouldClearTokens,
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      accessToken = refreshResult.accessToken;
    }

    // Get participant emails
    const attendees: string[] = [];
    if (meeting.meeting_participants) {
      for (const participant of meeting.meeting_participants) {
        if (participant.external_email) {
          attendees.push(participant.external_email);
        } else if (participant.colleague_id) {
          const { data: colleague } = await supabaseAdmin
            .from("colleagues")
            .select("email")
            .eq("id", participant.colleague_id)
            .single();
          if (colleague?.email) {
            attendees.push(colleague.email);
          }
        }
      }
    }

    // Create Google Calendar event
    const eventStart = new Date(meeting.scheduled_at);
    const eventEnd = new Date(eventStart.getTime() + meeting.duration_minutes * 60000);

    const calendarEvent = {
      summary: meeting.title,
      description: meeting.description || meeting.agenda || "",
      start: {
        dateTime: eventStart.toISOString(),
        timeZone: "Europe/Prague",
      },
      end: {
        dateTime: eventEnd.toISOString(),
        timeZone: "Europe/Prague",
      },
      location: meeting.location || "",
      attendees: attendees.map(email => ({ email })),
      conferenceData: meeting.meeting_link ? {
        createRequest: {
          requestId: meeting.id,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      } : undefined,
    };

    const response = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(calendarEvent),
    });

    if (!response.ok) {
      const errorText = await response.text();
      const durationMs = Date.now() - startTime;
      console.error("Google Calendar error:", errorText);
      const googleError = parseGoogleApiError(errorText);
      const googleMessage = googleError?.error?.message || errorText;
      
      // Log failed API call
      await supabaseAdmin.from('integration_log').insert({
        service: 'google_calendar',
        action: 'create_event',
        related_table: 'meetings',
        related_record_id: meetingId,
        request_payload: calendarEvent,
        response_status: response.status,
        response_payload: { error: errorText },
        is_success: false,
        error_message: googleMessage,
        triggered_by: userId,
        duration_ms: durationMs,
      });

      if (response.status === 403 && isInsufficientScopeError(googleError)) {
        return new Response(
          JSON.stringify({
            error: "Google Calendar nemá potřebná oprávnění. Prosím znovu propojte Google účet.",
            reauthRequired: true,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: `Google Calendar chyba: ${googleMessage}` }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const googleEvent = await response.json();
    const durationMs = Date.now() - startTime;
    
    // Update meeting with Google event ID
    const { error: updateError } = await supabaseAdmin
      .from("meetings")
      .update({
        google_event_id: googleEvent.id,
        calendar_invites_sent_at: new Date().toISOString(),
      })
      .eq("id", meeting_id);

    if (updateError) {
      console.error("Update error:", updateError);
      
      // Log failed update
      await supabaseAdmin.from('integration_log').insert({
        service: 'google_calendar',
        action: 'create_event',
        related_table: 'meetings',
        related_record_id: meetingId,
        request_payload: calendarEvent,
        response_status: response.status,
        response_payload: googleEvent,
        is_success: false,
        error_message: `Update failed: ${updateError.message}`,
        triggered_by: userId,
        duration_ms: durationMs,
      });
      
      return new Response(
        JSON.stringify({ error: "Událost vytvořena, ale nepodařilo se uložit ID" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log successful integration call
    await supabaseAdmin.from('integration_log').insert({
      service: 'google_calendar',
      action: 'create_event',
      related_table: 'meetings',
      related_record_id: meetingId,
      request_payload: calendarEvent,
      response_status: response.status,
      response_payload: googleEvent,
      is_success: true,
      triggered_by: userId,
      duration_ms: durationMs,
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        google_event_id: googleEvent.id,
        event_url: googleEvent.htmlLink,
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
        service: 'google_calendar',
        action: 'create_event',
        related_table: 'meetings',
        related_record_id: meetingId,
        is_success: false,
        error_message: errorMessage,
        triggered_by: userId,
        duration_ms: durationMs,
      });
    } catch (logError) {
      console.error("Failed to log integration error:", logError);
    }
    
    console.error("Calendar create event error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
