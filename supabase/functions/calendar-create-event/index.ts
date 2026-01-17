import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CalendarEventRequest {
  meeting_id: string;
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

    if (tokensError || !tokens || new Date(tokens.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "Google Calendar není propojeno nebo token vypršel" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Refresh token if needed (simplified - should call refresh-token function)
    const accessToken = tokens.access_token;

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
        error_message: errorText,
        triggered_by: userId,
        duration_ms: durationMs,
      });
      
      return new Response(
        JSON.stringify({ error: `Google Calendar chyba: ${errorText}` }),
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
