import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
};

const ALLOWED_EVENT_TYPES = [
  "webinar_registration",
  "webinar_attended",
  "lead_magnet_registration",
  "lead_magnet_download",
  "satisfaction_survey_submitted",
  "custom",
] as const;

type EventType = typeof ALLOWED_EVENT_TYPES[number];

interface SyncPayload {
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  event_type: EventType;
  event_title: string;
  occurred_at?: string | null;
  metadata?: Record<string, unknown> | null;
  source_system?: string | null;
  external_contact_id?: string | null;
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

function sanitizeOptionalString(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") throw new Error("Invalid optional field type: expected string");
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseOccurredAt(value: unknown): string {
  if (value === undefined || value === null) return new Date().toISOString();
  if (typeof value !== "string" || value.trim().length === 0) return new Date().toISOString();
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) {
    throw new Error('Invalid field "occurred_at": expected ISO datetime');
  }
  return parsed.toISOString();
}

function validatePayload(input: unknown): SyncPayload {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid payload: expected JSON object");
  }
  const payload = input as Record<string, unknown>;

  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  const eventType = typeof payload.event_type === "string" ? payload.event_type : "";
  const eventTitle = typeof payload.event_title === "string" ? payload.event_title.trim() : "";

  if (!name) throw new Error('Missing required field "name"');
  if (!email) throw new Error('Missing required field "email"');
  if (!eventTitle) throw new Error('Missing required field "event_title"');
  if (!ALLOWED_EVENT_TYPES.includes(eventType as EventType)) {
    throw new Error(`Invalid field "event_type": expected one of ${ALLOWED_EVENT_TYPES.join(", ")}`);
  }

  return {
    name,
    email,
    phone: sanitizeOptionalString(payload.phone),
    company: sanitizeOptionalString(payload.company),
    event_type: eventType as EventType,
    event_title: eventTitle,
    occurred_at: parseOccurredAt(payload.occurred_at),
    metadata: (payload.metadata as Record<string, unknown> | null | undefined) ?? null,
    source_system: sanitizeOptionalString(payload.source_system),
    external_contact_id: sanitizeOptionalString(payload.external_contact_id),
  };
}

function mapInteractionType(eventType: EventType): "webinar_registration" | "lead_magnet_download" | "webinar_attended" | "other" {
  if (eventType === "webinar_registration") return "webinar_registration";
  if (eventType === "webinar_attended") return "webinar_attended";
  if (eventType === "lead_magnet_registration" || eventType === "lead_magnet_download") return "lead_magnet_download";
  return "other";
}

function buildLeadNote(prospectId: string, payload: SyncPayload): Record<string, unknown> {
  const normalizedOccurredAt = String(payload.occurred_at || "").replace(/[^0-9TZ:-]/g, "");
  const normalizedType = String(payload.event_type || "custom").replace(/[^a-z0-9_:-]/gi, "_");
  const normalizedExternal = String(payload.external_contact_id || "noext").replace(/[^a-z0-9_:-]/gi, "_");
  return {
    id: `prospect-event-${prospectId}-${normalizedType}-${normalizedOccurredAt}-${normalizedExternal}`,
    lead_id: null,
    author_id: "system",
    author_name: "System",
    text: `[Prospect sync] ${payload.event_title}`,
    note_type: "meeting",
    call_date: null,
    event_type: payload.event_type,
    source_system: payload.source_system,
    external_contact_id: payload.external_contact_id,
    metadata: payload.metadata ?? {},
    created_at: new Date().toISOString(),
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
    service: "prospect_crm_sync",
    action: "upsert_prospect_event",
    related_table: "prospects",
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
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const startedAt = Date.now();
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let requestPayload: unknown = null;
  let prospectId: string | null = null;

  try {
    const expectedSecret = Deno.env.get("PROSPECT_SYNC_WEBHOOK_SECRET") || Deno.env.get("WEBHOOK_SECRET");
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

    const payload = validatePayload(requestPayload);

    const { data: existingProspect, error: existingError } = await supabaseAdmin
      .from("prospects")
      .select("id, converted_to_lead_id")
      .ilike("email", payload.email)
      .maybeSingle();

    if (existingError) {
      throw new Error(`Failed to check existing prospect: ${existingError.message}`);
    }

    let convertedLeadId: string | null = null;
    let action: "created" | "updated";

    if (existingProspect) {
      prospectId = existingProspect.id;
      convertedLeadId = existingProspect.converted_to_lead_id ?? null;
      action = "updated";

      const updates: Record<string, string | null> = { name: payload.name };
      if (payload.phone !== null) updates.phone = payload.phone;
      if (payload.company !== null) updates.company = payload.company;

      const { error: updateError } = await supabaseAdmin
        .from("prospects")
        .update(updates)
        .eq("id", prospectId);

      if (updateError) {
        throw new Error(`Failed to update prospect: ${updateError.message}`);
      }
    } else {
      action = "created";
      const { data: insertedProspect, error: insertError } = await supabaseAdmin
        .from("prospects")
        .insert({
          name: payload.name,
          email: payload.email,
          phone: payload.phone,
          company: payload.company,
          status: "new",
        })
        .select("id, converted_to_lead_id")
        .single();

      if (insertError || !insertedProspect) {
        throw new Error(`Failed to create prospect: ${insertError?.message ?? "Unknown insert error"}`);
      }
      prospectId = insertedProspect.id;
      convertedLeadId = insertedProspect.converted_to_lead_id ?? null;
    }

    const interactionMetadata = {
      ...(payload.metadata ?? {}),
      original_event_type: payload.event_type,
      source_system: payload.source_system,
      external_contact_id: payload.external_contact_id,
    };

    const { error: interactionError } = await supabaseAdmin
      .from("prospect_interactions")
      .insert({
        prospect_id: prospectId,
        type: mapInteractionType(payload.event_type),
        title: payload.event_title,
        metadata: interactionMetadata,
        occurred_at: payload.occurred_at,
      });

    if (interactionError) {
      throw new Error(`Failed to create prospect interaction: ${interactionError.message}`);
    }

    if (convertedLeadId) {
      const note = buildLeadNote(prospectId, payload);
      await supabaseAdmin.rpc("append_lead_note_if_missing", {
        _lead_id: convertedLeadId,
        _note: note,
      });

      await supabaseAdmin
        .from("lead_history")
        .insert({
          lead_id: convertedLeadId,
          change_type: "note_added",
          field_name: null,
          field_label: "Prospect event",
          old_value: null,
          new_value: payload.event_title,
          changed_by: null,
          changed_by_name: "System",
        });
    }

    const responsePayload = {
      success: true,
      action,
      prospect_id: prospectId,
      lead_id: convertedLeadId,
      interaction_type: mapInteractionType(payload.event_type),
    };

    await logIntegration(supabaseAdmin, {
      requestPayload,
      responseStatus: 200,
      responsePayload,
      isSuccess: true,
      relatedRecordId: prospectId,
      durationMs: Date.now() - startedAt,
    });

    return jsonResponse(responsePayload, 200);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    console.error("prospect-crm-sync error:", error);

    await logIntegration(supabaseAdmin, {
      requestPayload,
      responseStatus: 500,
      isSuccess: false,
      errorMessage,
      relatedRecordId: prospectId,
      durationMs: Date.now() - startedAt,
    });
    return jsonResponse({ error: errorMessage }, 500);
  }
});
