import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
};

const allowedApplicantSources = [
  "website",
  "linkedin",
  "referral",
  "job_portal",
  "other",
] as const;

const allowedApplicantStages = [
  "new_applicant",
  "invited_interview",
  "interview_done",
  "offer_sent",
  "hired",
  "rejected",
  "bad_fit",
  "withdrawn",
  "postponed",
] as const;

interface CreateApplicantPayload {
  full_name: string;
  email: string;
  position: string;
  phone?: string | null;
  cover_letter?: string | null;
  cv_url?: string | null;
  video_url?: string | null;
  loom_video_url?: string | null;
  portfolio_url?: string | null;
  source?: typeof allowedApplicantSources[number] | null;
  source_custom?: string | null;
  stage?: typeof allowedApplicantStages[number] | null;
  owner_id?: string | null;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getAuthSecret(req: Request): string | null {
  const headerSecret = req.headers.get("x-webhook-secret");
  if (headerSecret) return headerSecret;

  const authHeader = req.headers.get("authorization");
  if (!authHeader) return null;
  if (authHeader.startsWith("Bearer ")) return authHeader.slice(7);
  return authHeader;
}

function validateStringField(name: string, value: unknown): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Invalid field "${name}": expected non-empty string`);
  }
  return value.trim();
}

function validateOptionalStringField(name: string, value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") {
    throw new Error(`Invalid field "${name}": expected string`);
  }
  return value.trim();
}

function validateEmailField(value: unknown): string {
  const email = validateStringField("email", value).toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Invalid field "email": expected valid email');
  }
  return email;
}

function validateOptionalUrlField(name: string, value: unknown): string | null | undefined {
  const normalized = validateOptionalStringField(name, value);
  if (normalized === undefined || normalized === null || normalized.length === 0) {
    return normalized;
  }
  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    throw new Error(`Invalid field "${name}": expected valid URL`);
  }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error(`Invalid field "${name}": expected http/https URL`);
  }
  return parsed.toString();
}

function validatePayload(input: unknown): CreateApplicantPayload {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid payload: expected JSON object");
  }

  const payload = input as Record<string, unknown>;
  const source = validateOptionalStringField("source", payload.source);
  const stage = validateOptionalStringField("stage", payload.stage);
  const sourceCustom = validateOptionalStringField("source_custom", payload.source_custom);

  if (source !== undefined && source !== null && !allowedApplicantSources.includes(source as typeof allowedApplicantSources[number])) {
    throw new Error(`Invalid field "source": expected one of ${allowedApplicantSources.join(", ")}`);
  }

  if (stage !== undefined && stage !== null && !allowedApplicantStages.includes(stage as typeof allowedApplicantStages[number])) {
    throw new Error(`Invalid field "stage": expected one of ${allowedApplicantStages.join(", ")}`);
  }

  if (source !== "other" && sourceCustom !== undefined && sourceCustom !== null && sourceCustom.length > 0) {
    throw new Error('Invalid field "source_custom": allowed only when source is "other"');
  }

  return {
    full_name: validateStringField("full_name", payload.full_name),
    email: validateEmailField(payload.email),
    position: validateStringField("position", payload.position),
    phone: validateOptionalStringField("phone", payload.phone),
    cover_letter: validateOptionalStringField("cover_letter", payload.cover_letter),
    cv_url: validateOptionalUrlField("cv_url", payload.cv_url),
    video_url: validateOptionalUrlField("video_url", payload.video_url),
    loom_video_url: validateOptionalUrlField("loom_video_url", payload.loom_video_url),
    portfolio_url: validateOptionalUrlField("portfolio_url", payload.portfolio_url),
    source: source as CreateApplicantPayload["source"],
    source_custom: sourceCustom,
    stage: stage as CreateApplicantPayload["stage"],
    owner_id: validateOptionalStringField("owner_id", payload.owner_id),
  };
}

function buildApplicantInsert(payload: CreateApplicantPayload): Record<string, unknown> {
  const applicant: Record<string, unknown> = {
    full_name: payload.full_name,
    email: payload.email,
    position: payload.position,
  };

  const optionalFields: Array<keyof CreateApplicantPayload> = [
    "phone",
    "cover_letter",
    "cv_url",
    "video_url",
    "loom_video_url",
    "portfolio_url",
    "source",
    "source_custom",
    "stage",
    "owner_id",
  ];

  for (const field of optionalFields) {
    if (payload[field] !== undefined) {
      applicant[field] = payload[field];
    }
  }

  return applicant;
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
    service: "applicant_webhook",
    action: "create_applicant",
    related_table: "applicants",
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
  let applicantId: string | null = null;

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const webhookSecret = Deno.env.get("APPLICANT_WEBHOOK_SECRET") || Deno.env.get("WEBHOOK_SECRET");
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

    let payload: CreateApplicantPayload;
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
          errorMessage: 'Invalid field "owner_id": colleague not found',
          durationMs: Date.now() - startTime,
        });
        return jsonResponse({ error: 'Invalid field "owner_id": colleague not found' }, 400);
      }

      if (owner.status !== "active") {
        await logIntegration(supabaseAdmin, {
          requestPayload,
          responseStatus: 400,
          isSuccess: false,
          errorMessage: 'Invalid field "owner_id": colleague must be active',
          durationMs: Date.now() - startTime,
        });
        return jsonResponse({ error: 'Invalid field "owner_id": colleague must be active' }, 400);
      }
    }

    const applicantInsert = buildApplicantInsert(payload);
    const { data: insertedApplicant, error: insertError } = await supabaseAdmin
      .from("applicants")
      .insert(applicantInsert)
      .select("id")
      .single();

    if (insertError || !insertedApplicant) {
      await logIntegration(supabaseAdmin, {
        requestPayload,
        responseStatus: 500,
        isSuccess: false,
        errorMessage: insertError?.message ?? "Applicant insert failed",
        durationMs: Date.now() - startTime,
      });
      return jsonResponse({ error: "Failed to create applicant" }, 500);
    }

    applicantId = insertedApplicant.id;
    const responsePayload = { success: true, applicant_id: applicantId };

    await logIntegration(supabaseAdmin, {
      relatedRecordId: applicantId,
      requestPayload,
      responseStatus: 201,
      responsePayload,
      isSuccess: true,
      durationMs: Date.now() - startTime,
    });

    return jsonResponse(responsePayload, 201);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    console.error("create-applicant-webhook error:", error);

    try {
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      await logIntegration(supabaseAdmin, {
        relatedRecordId: applicantId,
        requestPayload,
        responseStatus: 500,
        isSuccess: false,
        errorMessage,
        durationMs: Date.now() - startTime,
      });
    } catch (logError) {
      console.error("Failed to log create-applicant-webhook error:", logError);
    }

    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
