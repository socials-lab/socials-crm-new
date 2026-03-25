import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_INTERACTION_TYPES = [
  "webinar_registration",
  "lead_magnet_download",
  "webinar_attended",
  "other",
] as const;

interface ProspectWebhookPayload {
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  interaction_type: typeof ALLOWED_INTERACTION_TYPES[number];
  interaction_title: string;
  metadata?: Record<string, unknown> | null;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getAuthToken(req: Request): string | null {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return null;
  }
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return authHeader;
}

function sanitizeOptionalString(value: unknown): string | null {
  if (value === undefined || value === null) {
    return null;
  }
  if (typeof value !== "string") {
    throw new Error("Invalid optional field type: expected string");
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function validatePayload(input: unknown): ProspectWebhookPayload {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid payload: expected JSON object");
  }

  const payload = input as Record<string, unknown>;
  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  const interactionType = typeof payload.interaction_type === "string" ? payload.interaction_type : "";
  const interactionTitle = typeof payload.interaction_title === "string" ? payload.interaction_title.trim() : "";

  if (!name) {
    throw new Error('Missing required field "name"');
  }
  if (!email) {
    throw new Error('Missing required field "email"');
  }
  if (!interactionTitle) {
    throw new Error('Missing required field "interaction_title"');
  }
  if (!ALLOWED_INTERACTION_TYPES.includes(interactionType as typeof ALLOWED_INTERACTION_TYPES[number])) {
    throw new Error(`Invalid field "interaction_type": expected one of ${ALLOWED_INTERACTION_TYPES.join(", ")}`);
  }

  return {
    name,
    email,
    phone: sanitizeOptionalString(payload.phone),
    company: sanitizeOptionalString(payload.company),
    interaction_type: interactionType as ProspectWebhookPayload["interaction_type"],
    interaction_title: interactionTitle,
    metadata: (payload.metadata as Record<string, unknown> | null | undefined) ?? null,
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
    triggeredBy?: string | null;
    durationMs: number;
  },
) {
  const { error } = await supabaseAdmin.from("integration_log").insert({
    service: "prospect_webhook",
    action: "ingest_prospect",
    related_table: "prospects",
    related_record_id: params.relatedRecordId ?? null,
    request_payload: params.requestPayload,
    response_status: params.responseStatus,
    response_payload: params.responsePayload ?? null,
    is_success: params.isSuccess,
    error_message: params.errorMessage ?? null,
    triggered_by: params.triggeredBy ?? null,
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

  const startTime = Date.now();
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let requestPayload: unknown = null;
  let triggeredBy: string | null = null;
  let prospectId: string | null = null;

  if (req.method !== "POST") {
    await logIntegration(supabaseAdmin, {
      requestPayload: null,
      responseStatus: 405,
      isSuccess: false,
      errorMessage: "Method not allowed",
      durationMs: Date.now() - startTime,
    });
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const token = getAuthToken(req);
    if (token) {
      const { data } = await supabaseAdmin.auth.getUser(token);
      triggeredBy = data.user?.id ?? null;
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
        triggeredBy,
        durationMs: Date.now() - startTime,
      });
      return jsonResponse({ error: "Invalid JSON payload" }, 400);
    }

    let payload: ProspectWebhookPayload;
    try {
      payload = validatePayload(requestPayload);
    } catch (validationError) {
      const errorMessage = validationError instanceof Error ? validationError.message : "Payload validation failed";
      await logIntegration(supabaseAdmin, {
        requestPayload,
        responseStatus: 400,
        isSuccess: false,
        errorMessage,
        triggeredBy,
        durationMs: Date.now() - startTime,
      });
      return jsonResponse({ error: errorMessage }, 400);
    }

    const { data: existingProspect, error: existingError } = await supabaseAdmin
      .from("prospects")
      .select("id")
      .eq("email", payload.email)
      .maybeSingle();

    if (existingError) {
      throw new Error(`Failed to check existing prospect: ${existingError.message}`);
    }

    if (existingProspect) {
      prospectId = existingProspect.id;
      const updates: Record<string, string | null> = {
        name: payload.name,
      };
      if (payload.phone !== null) {
        updates.phone = payload.phone;
      }
      if (payload.company !== null) {
        updates.company = payload.company;
      }

      const { error: updateError } = await supabaseAdmin
        .from("prospects")
        .update(updates)
        .eq("id", prospectId);

      if (updateError) {
        throw new Error(`Failed to update existing prospect: ${updateError.message}`);
      }
    } else {
      const { data: insertedProspect, error: insertError } = await supabaseAdmin
        .from("prospects")
        .insert({
          name: payload.name,
          email: payload.email,
          phone: payload.phone,
          company: payload.company,
        })
        .select("id")
        .single();

      if (insertError || !insertedProspect) {
        throw new Error(`Failed to create prospect: ${insertError?.message ?? "Unknown insert error"}`);
      }
      prospectId = insertedProspect.id;
    }

    const { error: interactionError } = await supabaseAdmin
      .from("prospect_interactions")
      .insert({
        prospect_id: prospectId,
        type: payload.interaction_type,
        title: payload.interaction_title,
        metadata: payload.metadata ?? null,
        occurred_at: new Date().toISOString(),
      });

    if (interactionError) {
      throw new Error(`Failed to create interaction: ${interactionError.message}`);
    }

    const responsePayload = { success: true, prospect_id: prospectId };
    await logIntegration(supabaseAdmin, {
      requestPayload,
      responseStatus: 201,
      responsePayload,
      isSuccess: true,
      relatedRecordId: prospectId,
      triggeredBy,
      durationMs: Date.now() - startTime,
    });
    return jsonResponse(responsePayload, 201);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    console.error("prospect-webhook error:", error);
    await logIntegration(supabaseAdmin, {
      requestPayload,
      responseStatus: 500,
      isSuccess: false,
      errorMessage,
      relatedRecordId: prospectId,
      triggeredBy,
      durationMs: Date.now() - startTime,
    });
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
