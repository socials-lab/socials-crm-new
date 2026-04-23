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

function invalidClickResponse(): Response {
  return new Response("Invalid or expired tracking link.", {
    status: 404,
    headers: {
      ...corsHeaders,
      "Content-Type": "text/plain; charset=utf-8",
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

  try {
    const requestUrl = new URL(req.url);
    const trackingId = requestUrl.searchParams.get("id");
    const type = requestUrl.searchParams.get("type");
    const linkToken = requestUrl.searchParams.get("link");

    if (!type) {
      throw new Error("Missing tracking parameters");
    }
    if (type !== "open" && type !== "click") {
      throw new Error("Invalid tracking type");
    }

    if (type === "open") {
      if (!trackingId) {
        throw new Error("Missing tracking id for open tracking");
      }

      const { data: recipient, error: recipientError } = await supabaseAdmin
        .from("broadcast_recipients")
        .select("id, broadcast_id, opened_at")
        .eq("tracking_id", trackingId)
        .single();

      if (recipientError || !recipient) {
        throw new Error("Recipient tracking id not found");
      }

      const nowIso = new Date().toISOString();
      const { data: updatedRows, error: openUpdateError } = await supabaseAdmin
        .from("broadcast_recipients")
        .update({ opened_at: nowIso })
        .eq("id", recipient.id)
        .is("opened_at", null)
        .select("id");

      if (openUpdateError) {
        throw new Error(`Failed to update open tracking: ${openUpdateError.message}`);
      }

      if ((updatedRows ?? []).length > 0) {
        const { error: incrementError } = await supabaseAdmin.rpc("increment_broadcast_counter", {
          _broadcast_id: recipient.broadcast_id,
          _column: "open_count",
        });
        if (incrementError) throw new Error(`Failed to increment open_count: ${incrementError.message}`);
      }

      await supabaseAdmin.from("integration_log").insert({
        service: "broadcast",
        action: "track_open",
        request_payload: { tracking_id: trackingId },
        response_status: 200,
        response_payload: { recipient_id: recipient.id },
        is_success: true,
        error_message: null,
        triggered_by: null,
        duration_ms: Date.now() - startedAt,
      });

      return trackingPixelResponse();
    }

    if (!linkToken) {
      return invalidClickResponse();
    }

    const { data: trackedLink, error: trackedLinkError } = await supabaseAdmin
      .from("broadcast_tracked_links")
      .select("id, broadcast_id, recipient_id, target_url, clicked_at")
      .eq("link_token", linkToken)
      .single();

    if (trackedLinkError || !trackedLink) {
      return invalidClickResponse();
    }

    const { data: recipient, error: recipientError } = await supabaseAdmin
      .from("broadcast_recipients")
      .select("id, broadcast_id, opened_at, clicked_at")
      .eq("id", trackedLink.recipient_id)
      .single();

    if (recipientError || !recipient) {
      return invalidClickResponse();
    }

    const nowIso = new Date().toISOString();
    const clickUpdatePayload: Record<string, string> = { clicked_at: nowIso };
    if (!recipient.opened_at) {
      clickUpdatePayload.opened_at = nowIso;
    }

    const { data: clickUpdatedRows, error: clickUpdateError } = await supabaseAdmin
      .from("broadcast_recipients")
      .update(clickUpdatePayload)
      .eq("id", recipient.id)
      .is("clicked_at", null)
      .select("id");

    if (clickUpdateError) {
      throw new Error(`Failed to update click tracking: ${clickUpdateError.message}`);
    }

    if (!trackedLink.clicked_at) {
      const { error: trackedLinkUpdateError } = await supabaseAdmin
        .from("broadcast_tracked_links")
        .update({ clicked_at: nowIso })
        .eq("id", trackedLink.id)
        .is("clicked_at", null);

      if (trackedLinkUpdateError) {
        throw new Error(`Failed to update tracked link click: ${trackedLinkUpdateError.message}`);
      }
    }

    if ((clickUpdatedRows ?? []).length > 0) {
      const { error: clickIncrementError } = await supabaseAdmin.rpc("increment_broadcast_counter", {
        _broadcast_id: recipient.broadcast_id,
        _column: "click_count",
      });
      if (clickIncrementError) throw new Error(`Failed to increment click_count: ${clickIncrementError.message}`);

      if (!recipient.opened_at) {
        const { error: openIncrementError } = await supabaseAdmin.rpc("increment_broadcast_counter", {
          _broadcast_id: recipient.broadcast_id,
          _column: "open_count",
        });
        if (openIncrementError) throw new Error(`Failed to increment open_count on click: ${openIncrementError.message}`);
      }
    }

    await supabaseAdmin.from("integration_log").insert({
      service: "broadcast",
      action: "track_click",
      request_payload: { tracking_id: trackingId },
      response_status: 302,
      response_payload: { recipient_id: recipient.id },
      is_success: true,
      error_message: null,
      triggered_by: null,
      duration_ms: Date.now() - startedAt,
    });

    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        Location: trackedLink.target_url,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown broadcast tracking error";
    console.error("broadcast-track error:", errorMessage);

    await supabaseAdmin.from("integration_log").insert({
      service: "broadcast",
      action: "track_error",
      request_payload: null,
      response_status: 500,
      response_payload: null,
      is_success: false,
      error_message: errorMessage,
      triggered_by: null,
      duration_ms: Date.now() - startedAt,
    });

    const type = (() => {
      try {
        return new URL(req.url).searchParams.get("type");
      } catch {
        return null;
      }
    })();

    if (type === "click") {
      return invalidClickResponse();
    }

    return trackingPixelResponse();
  }
});
