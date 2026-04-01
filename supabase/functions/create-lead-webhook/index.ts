import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
};

const allowedLeadSources = [
  "referral",
  "inbound",
  "cold_outreach",
  "event",
  "linkedin",
  "website",
  "other",
] as const;

const allowedLeadStages = [
  "new_lead",
  "meeting_done",
  "waiting_access",
  "access_received",
  "preparing_offer",
  "offer_sent",
  "won",
  "lost",
  "postponed",
] as const;

const allowedIndustries = [
  "Ecommerce",
  "LeadGen",
] as const;

const ALLOWED_CURRENCIES = ["CZK", "EUR", "USD"] as const;

function normalizeCurrency(value: string | null | undefined): string | undefined {
  if (value === undefined || value === null || value.trim() === "") return undefined;
  const trimmed = value.trim().toUpperCase();
  if (!ALLOWED_CURRENCIES.includes(trimmed as typeof ALLOWED_CURRENCIES[number])) {
    throw new Error(`Invalid field "currency": expected one of ${ALLOWED_CURRENCIES.join(", ")}`);
  }
  return trimmed;
}

interface CreateLeadPayload {
  company_name: string;
  ico: string;
  dic?: string | null;
  billing_street?: string | null;
  billing_city?: string | null;
  billing_zip?: string | null;
  billing_country?: string | null;
  billing_email?: string | null;
  contact_name: string;
  contact_email?: string | null;
  contact_phone?: string | null;
  contact_position?: string | null;
  website?: string | null;
  industry?: string | null;
  source?: typeof allowedLeadSources[number] | null;
  source_custom?: string | null;
  stage?: typeof allowedLeadStages[number] | null;
  client_message?: string | null;
  ad_spend_monthly?: number | null;
  summary?: string | null;
  potential_service?: string | null;
  owner_id?: string | null;
  estimated_price?: number | null;
  currency?: string | null;
  probability_percent?: number | null;
  court_name?: string | null;
  court_file_number?: string | null;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getAuthSecret(req: Request): string | null {
  const headerSecret = req.headers.get("x-webhook-secret");
  if (headerSecret) {
    return headerSecret;
  }

  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return null;
  }

  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  return authHeader;
}

function validateStringField(name: string, value: unknown): string | null {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Invalid field "${name}": expected non-empty string`);
  }
  return value.trim();
}

function validateOptionalStringField(name: string, value: unknown): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  if (typeof value !== "string") {
    throw new Error(`Invalid field "${name}": expected string`);
  }
  return value.trim();
}

function validateOptionalNumberField(name: string, value: unknown): number | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error(`Invalid field "${name}": expected number`);
  }
  return value;
}

function validatePayload(input: unknown): CreateLeadPayload {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid payload: expected JSON object");
  }

  const payload = input as Record<string, unknown>;
  const source = validateOptionalStringField("source", payload.source);
  const stage = validateOptionalStringField("stage", payload.stage);
  const industry = validateOptionalStringField("industry", payload.industry);
  const sourceCustom = validateOptionalStringField("source_custom", payload.source_custom);

  if (source !== undefined && source !== null && !allowedLeadSources.includes(source as typeof allowedLeadSources[number])) {
    throw new Error(`Invalid field "source": expected one of ${allowedLeadSources.join(", ")}`);
  }

  if (stage !== undefined && stage !== null && !allowedLeadStages.includes(stage as typeof allowedLeadStages[number])) {
    throw new Error(`Invalid field "stage": expected one of ${allowedLeadStages.join(", ")}`);
  }

  if (industry !== undefined && industry !== null && !allowedIndustries.includes(industry as typeof allowedIndustries[number])) {
    throw new Error(`Invalid field "industry": expected one of ${allowedIndustries.join(", ")}`);
  }

  if (source !== "other" && sourceCustom !== undefined && sourceCustom !== null && sourceCustom.length > 0) {
    throw new Error('Invalid field "source_custom": allowed only when source is "other"');
  }

  return {
    company_name: validateStringField("company_name", payload.company_name) as string,
    ico: validateStringField("ico", payload.ico) as string,
    dic: validateOptionalStringField("dic", payload.dic),
    contact_name: validateStringField("contact_name", payload.contact_name) as string,
    contact_email: validateOptionalStringField("contact_email", payload.contact_email),
    contact_phone: validateOptionalStringField("contact_phone", payload.contact_phone),
    contact_position: validateOptionalStringField("contact_position", payload.contact_position),
    website: validateOptionalStringField("website", payload.website),
    industry,
    billing_street: validateOptionalStringField("billing_street", payload.billing_street),
    billing_city: validateOptionalStringField("billing_city", payload.billing_city),
    billing_zip: validateOptionalStringField("billing_zip", payload.billing_zip),
    billing_country: validateOptionalStringField("billing_country", payload.billing_country),
    billing_email: validateOptionalStringField("billing_email", payload.billing_email),
    source: source as CreateLeadPayload["source"],
    source_custom: sourceCustom,
    stage: stage as CreateLeadPayload["stage"],
    client_message: validateOptionalStringField("client_message", payload.client_message),
    ad_spend_monthly: validateOptionalNumberField("ad_spend_monthly", payload.ad_spend_monthly),
    summary: validateOptionalStringField("summary", payload.summary),
    potential_service: validateOptionalStringField("potential_service", payload.potential_service),
    owner_id: validateOptionalStringField("owner_id", payload.owner_id),
    estimated_price: validateOptionalNumberField("estimated_price", payload.estimated_price),
    currency: normalizeCurrency(validateOptionalStringField("currency", payload.currency)),
    probability_percent: validateOptionalNumberField("probability_percent", payload.probability_percent),
    court_name: validateOptionalStringField("court_name", payload.court_name),
    court_file_number: validateOptionalStringField("court_file_number", payload.court_file_number),
  };
}

function buildLeadInsert(payload: CreateLeadPayload): Record<string, unknown> {
  const lead: Record<string, unknown> = {
    company_name: payload.company_name,
    ico: payload.ico,
    contact_name: payload.contact_name,
  };

  const optionalFields: Array<keyof CreateLeadPayload> = [
    "dic",
    "billing_street",
    "billing_city",
    "billing_zip",
    "billing_country",
    "billing_email",
    "contact_email",
    "contact_phone",
    "contact_position",
    "website",
    "industry",
    "source",
    "source_custom",
    "stage",
    "client_message",
    "ad_spend_monthly",
    "summary",
    "potential_service",
    "owner_id",
    "estimated_price",
    "currency",
    "probability_percent",
    "court_name",
    "court_file_number",
  ];

  for (const field of optionalFields) {
    if (payload[field] !== undefined) {
      lead[field] = payload[field];
    }
  }

  return lead;
}

async function logIntegration(
  supabaseAdmin: ReturnType<typeof createClient>,
  params: {
    relatedRecordId?: string | null;
    requestPayload: unknown;
    responseStatus?: number;
    isSuccess: boolean;
    errorMessage?: string;
    durationMs: number;
    responsePayload?: unknown;
  },
) {
  const { error } = await supabaseAdmin.from("integration_log").insert({
    service: "lead_webhook",
    action: "create_lead",
    related_table: "leads",
    related_record_id: params.relatedRecordId ?? null,
    request_payload: params.requestPayload,
    response_status: params.responseStatus ?? null,
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

  const startTime = Date.now();
  let requestPayload: unknown = null;
  let leadId: string | null = null;

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const webhookSecret = Deno.env.get("WEBHOOK_SECRET");
    if (!webhookSecret) {
      return jsonResponse({ error: "Webhook secret not configured" }, 500);
    }

    const requestSecret = getAuthSecret(req);
    if (!requestSecret || requestSecret !== webhookSecret) {
      await logIntegration(supabaseAdmin, {
        requestPayload: null,
        responseStatus: 401,
        isSuccess: false,
        errorMessage: "Unauthorized webhook request",
        durationMs: Date.now() - startTime,
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
        durationMs: Date.now() - startTime,
      });
      return jsonResponse({ error: "Invalid JSON payload" }, 400);
    }

    let payload: CreateLeadPayload;
    try {
      payload = validatePayload(requestPayload);
    } catch (validationError) {
      const errorMessage = validationError instanceof Error ? validationError.message : "Payload validation failed";
      await logIntegration(supabaseAdmin, {
        requestPayload,
        responseStatus: 400,
        isSuccess: false,
        errorMessage,
        durationMs: Date.now() - startTime,
      });
      return jsonResponse({ error: errorMessage }, 400);
    }

    if (payload.owner_id) {
      const { data: owner, error: ownerError } = await supabaseAdmin
        .from("colleagues")
        .select("id, status")
        .eq("id", payload.owner_id)
        .single();

      if (ownerError || !owner) {
        await logIntegration(supabaseAdmin, {
          requestPayload,
          responseStatus: 400,
          isSuccess: false,
          errorMessage: "Invalid field \"owner_id\": colleague not found",
          durationMs: Date.now() - startTime,
        });
        return jsonResponse({ error: "Invalid field \"owner_id\": colleague not found" }, 400);
      }

      if (owner.status !== "active") {
        await logIntegration(supabaseAdmin, {
          requestPayload,
          responseStatus: 400,
          isSuccess: false,
          errorMessage: "Invalid field \"owner_id\": colleague must be active",
          durationMs: Date.now() - startTime,
        });
        return jsonResponse({ error: "Invalid field \"owner_id\": colleague must be active" }, 400);
      }
    }

    const leadInsert = buildLeadInsert(payload);
    const { data: insertedLead, error: insertError } = await supabaseAdmin
      .from("leads")
      .insert(leadInsert)
      .select("id")
      .single();

    if (insertError || !insertedLead) {
      await logIntegration(supabaseAdmin, {
        requestPayload,
        responseStatus: 500,
        isSuccess: false,
        errorMessage: insertError?.message ?? "Lead insert failed",
        durationMs: Date.now() - startTime,
      });
      return jsonResponse({ error: "Failed to create lead" }, 500);
    }

    leadId = insertedLead.id;
    const responsePayload = { success: true, lead_id: leadId };

    await logIntegration(supabaseAdmin, {
      relatedRecordId: leadId,
      requestPayload,
      responseStatus: 201,
      responsePayload,
      isSuccess: true,
      durationMs: Date.now() - startTime,
    });

    return jsonResponse(responsePayload, 201);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    console.error("create-lead-webhook error:", error);

    try {
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      await logIntegration(supabaseAdmin, {
        relatedRecordId: leadId,
        requestPayload,
        responseStatus: 500,
        isSuccess: false,
        errorMessage,
        durationMs: Date.now() - startTime,
      });
    } catch (logError) {
      console.error("Failed to log create-lead-webhook error:", logError);
    }

    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
