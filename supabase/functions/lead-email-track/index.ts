import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TRACKING_PIXEL = new Uint8Array([
  0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00,
  0x80, 0x00, 0x00, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x21,
  0xf9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2c, 0x00, 0x00,
  0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44,
  0x01, 0x00, 0x3b,
]);

function trackingPixelResponse(): Response {
  return new Response(TRACKING_PIXEL, {
    headers: {
      ...corsHeaders,
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startedAt = Date.now();
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let trackingToken: string | null = null;

  try {
    const requestUrl = new URL(req.url);
    trackingToken = requestUrl.searchParams.get("token");

    if (!trackingToken) {
      throw new Error("Missing tracking token");
    }

    const { data: openedRows, error: openError } = await supabaseAdmin
      .from("lead_email_tracking")
      .update({ opened_at: new Date().toISOString() })
      .eq("tracking_token", trackingToken)
      .is("opened_at", null)
      .select("lead_id, subject, to_recipients")
      .limit(1);

    if (openError) {
      throw new Error(`Failed to update lead email open: ${openError.message}`);
    }

    const firstOpenRow = openedRows?.[0];

    if (firstOpenRow?.lead_id) {
      const recipients = Array.isArray(firstOpenRow.to_recipients)
        ? firstOpenRow.to_recipients.filter((email) => typeof email === "string")
        : [];
      const subject = typeof firstOpenRow.subject === "string" ? firstOpenRow.subject : null;

      const note = {
        id: `email-open-${trackingToken}`,
        lead_id: firstOpenRow.lead_id,
        author_id: "system",
        author_name: "System",
        text: "Klient pravdepodobne otevrel odeslany e-mail (open tracking).",
        note_type: "email_received",
        call_date: null,
        subject,
        recipients,
        created_at: new Date().toISOString(),
      };

      const { error: noteError } = await supabaseAdmin.rpc("append_lead_note_if_missing", {
        _lead_id: firstOpenRow.lead_id,
        _note: note,
      });

      if (noteError) {
        throw new Error(`Failed to append lead open note: ${noteError.message}`);
      }
    }

    await supabaseAdmin.from("integration_log").insert({
      service: "lead_email_tracking",
      action: "track_open",
      request_payload: { tracking_token: trackingToken },
      response_status: 200,
      response_payload: { first_open: !!firstOpenRow },
      is_success: true,
      error_message: null,
      triggered_by: null,
      duration_ms: Date.now() - startedAt,
    });

    return trackingPixelResponse();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown lead email tracking error";
    console.error("lead-email-track error:", errorMessage);

    await supabaseAdmin.from("integration_log").insert({
      service: "lead_email_tracking",
      action: "track_open_error",
      request_payload: { tracking_token: trackingToken },
      response_status: 500,
      response_payload: null,
      is_success: false,
      error_message: errorMessage,
      triggered_by: null,
      duration_ms: Date.now() - startedAt,
    });

    return trackingPixelResponse();
  }
});
