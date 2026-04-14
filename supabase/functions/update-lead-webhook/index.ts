import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
};

interface UpdateLeadWebhookPayload {
  lead_id: string;
  booking_datetime: string;
  booking_meet_link: string;
  booking_status?: string | null;
  meeting_request_sent_at?: string | null;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getRequestSecret(req: Request): string | null {
  const headerSecret = req.headers.get("x-webhook-secret");
  if (headerSecret) return headerSecret;

  const authHeader = req.headers.get("authorization");
  if (!authHeader) return null;
  if (authHeader.startsWith("Bearer ")) return authHeader.slice(7);
  return authHeader;
}

function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function parseIsoDateTime(name: string, value: unknown): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Invalid field "${name}": expected ISO datetime string`);
  }
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) {
    throw new Error(`Invalid field "${name}": expected ISO datetime string`);
  }
  return parsed.toISOString();
}

function parseOptionalIsoDateTime(name: string, value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return parseIsoDateTime(name, value);
}

function parseUrl(name: string, value: unknown): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Invalid field "${name}": expected URL string`);
  }
  let parsed: URL;
  try {
    parsed = new URL(value.trim());
  } catch {
    throw new Error(`Invalid field "${name}": expected valid URL`);
  }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error(`Invalid field "${name}": expected http/https URL`);
  }
  return parsed.toString();
}

function parseOptionalString(name: string, value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") {
    throw new Error(`Invalid field "${name}": expected string`);
  }
  return value.trim();
}

function validatePayload(input: unknown): UpdateLeadWebhookPayload {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid payload: expected JSON object");
  }

  const payload = input as Record<string, unknown>;
  const leadId = parseOptionalString("lead_id", payload.lead_id);
  if (!leadId) {
    throw new Error('Missing required field "lead_id"');
  }
  if (!isValidUuid(leadId)) {
    throw new Error('Invalid field "lead_id": expected UUID');
  }

  return {
    lead_id: leadId,
    booking_datetime: parseIsoDateTime("booking_datetime", payload.booking_datetime),
    booking_meet_link: parseUrl("booking_meet_link", payload.booking_meet_link),
    booking_status: parseOptionalString("booking_status", payload.booking_status),
    meeting_request_sent_at: parseOptionalIsoDateTime("meeting_request_sent_at", payload.meeting_request_sent_at),
  };
}

async function logIntegration(
  supabaseAdmin: ReturnType<typeof createClient>,
  params: {
    requestPayload: unknown;
    responseStatus: number;
    responsePayload?: unknown;
    isSuccess: boolean;
    errorMessage?: string;
    relatedRecordId?: string | null;
    durationMs: number;
  },
) {
  const { error } = await supabaseAdmin.from("integration_log").insert({
    service: "lead_webhook",
    action: "update_lead_booking",
    related_table: "leads",
    related_record_id: params.relatedRecordId ?? null,
    request_payload: params.requestPayload,
    response_status: params.responseStatus,
    response_payload: params.responsePayload ?? null,
    is_success: params.isSuccess,
    error_message: params.errorMessage ?? null,
    duration_ms: params.durationMs,
  });

  if (error) {
    console.error("Failed to write integration_log:", error);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST" && req.method !== "PATCH") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const startedAt = Date.now();
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let requestPayload: unknown = null;
  let leadIdForLog: string | null = null;

  try {
    const expectedSecret = Deno.env.get("LEAD_UPDATE_WEBHOOK_SECRET") || Deno.env.get("WEBHOOK_SECRET");
    if (!expectedSecret) {
      return jsonResponse({ error: "Webhook secret not configured" }, 500);
    }

    const requestSecret = getRequestSecret(req);
    if (!requestSecret || requestSecret !== expectedSecret) {
      await logIntegration(supabaseAdmin, {
        requestPayload: null,
        responseStatus: 401,
        isSuccess: false,
        errorMessage: "Unauthorized webhook request",
        durationMs: Date.now() - startedAt,
      });
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const rawBody = await req.text();
    try {
      requestPayload = JSON.parse(rawBody);
    } catch {
      await logIntegration(supabaseAdmin, {
        requestPayload: rawBody,
        responseStatus: 400,
        isSuccess: false,
        errorMessage: "Invalid JSON payload",
        durationMs: Date.now() - startedAt,
      });
      return jsonResponse({ error: "Invalid JSON payload" }, 400);
    }

    let payload: UpdateLeadWebhookPayload;
    try {
      payload = validatePayload(requestPayload);
    } catch (validationError) {
      const errorMessage = validationError instanceof Error ? validationError.message : "Payload validation failed";
      await logIntegration(supabaseAdmin, {
        requestPayload,
        responseStatus: 400,
        isSuccess: false,
        errorMessage,
        durationMs: Date.now() - startedAt,
      });
      return jsonResponse({ error: errorMessage }, 400);
    }

    leadIdForLog = payload.lead_id;

    const updateData: Record<string, unknown> = {
      booking_datetime: payload.booking_datetime,
      booking_meet_link: payload.booking_meet_link,
      booking_status: payload.booking_status ?? "scheduled",
      updated_at: new Date().toISOString(),
    };

    if (payload.meeting_request_sent_at !== undefined) {
      updateData.meeting_request_sent_at = payload.meeting_request_sent_at;
    }

    const { data: updatedLead, error: updateError } = await supabaseAdmin
      .from("leads")
      .update(updateData)
      .eq("id", payload.lead_id)
      .is("deleted_at", null)
      .select("id, booking_datetime, booking_meet_link, booking_status, meeting_request_sent_at")
      .maybeSingle();

    if (updateError) {
      await logIntegration(supabaseAdmin, {
        requestPayload,
        relatedRecordId: payload.lead_id,
        responseStatus: 500,
        isSuccess: false,
        errorMessage: updateError.message ?? "Lead update failed",
        durationMs: Date.now() - startedAt,
      });
      return jsonResponse({ error: "Failed to update lead booking fields" }, 500);
    }

    if (!updatedLead) {
      await logIntegration(supabaseAdmin, {
        requestPayload,
        relatedRecordId: payload.lead_id,
        responseStatus: 404,
        isSuccess: false,
        errorMessage: "Lead not found",
        durationMs: Date.now() - startedAt,
      });
      return jsonResponse({ error: "Lead not found" }, 404);
    }

    const responsePayload = {
      success: true,
      lead_id: updatedLead.id,
      booking_datetime: updatedLead.booking_datetime,
      booking_meet_link: updatedLead.booking_meet_link,
      booking_status: updatedLead.booking_status,
      meeting_request_sent_at: updatedLead.meeting_request_sent_at,
    };

    await logIntegration(supabaseAdmin, {
      requestPayload,
      relatedRecordId: updatedLead.id,
      responseStatus: 200,
      responsePayload,
      isSuccess: true,
      durationMs: Date.now() - startedAt,
    });

    return jsonResponse(responsePayload, 200);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    console.error("update-lead-webhook error:", error);

    try {
      await logIntegration(supabaseAdmin, {
        requestPayload,
        relatedRecordId: leadIdForLog,
        responseStatus: 500,
        isSuccess: false,
        errorMessage,
        durationMs: Date.now() - startedAt,
      });
    } catch (logError) {
      console.error("Failed to log update-lead-webhook error:", logError);
    }

    return jsonResponse({ error: "Internal server error" }, 500);
  }
});

