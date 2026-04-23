import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getAccessToken(req: Request): string | null {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return null;
  }
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return authHeader;
}

function generateOnboardingToken(): string {
  return `${crypto.randomUUID().replaceAll("-", "")}${crypto.randomUUID().replaceAll("-", "")}`;
}

function buildExpiryIso(): string {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 14);
  return expiresAt.toISOString();
}

function isFutureIso(value: string | null | undefined): boolean {
  if (!value) {
    return false;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return false;
  }
  return parsed.getTime() > Date.now();
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
    service: "applicant_onboarding_link",
    action: "issue_or_reuse_link",
    related_table: "applicants",
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

  const startedAt = Date.now();
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let requestPayload: unknown = null;
  let triggeredBy: string | null = null;
  let applicantId: string | null = null;

  if (req.method !== "POST") {
    await logIntegration(supabaseAdmin, {
      requestPayload,
      responseStatus: 405,
      isSuccess: false,
      errorMessage: "Method not allowed",
      durationMs: Date.now() - startedAt,
    });
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const accessToken = getAccessToken(req);
    if (!accessToken) {
      await logIntegration(supabaseAdmin, {
        requestPayload,
        responseStatus: 401,
        isSuccess: false,
        errorMessage: "Missing authorization header",
        durationMs: Date.now() - startedAt,
      });
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    if (authError || !authData.user) {
      await logIntegration(supabaseAdmin, {
        requestPayload,
        responseStatus: 401,
        isSuccess: false,
        errorMessage: "Invalid authorization token",
        durationMs: Date.now() - startedAt,
      });
      return jsonResponse({ error: "Unauthorized" }, 401);
    }
    triggeredBy = authData.user.id;

    requestPayload = await req.json();
    applicantId = typeof (requestPayload as { applicantId?: unknown })?.applicantId === "string"
      ? (requestPayload as { applicantId: string }).applicantId
      : null;

    if (!applicantId) {
      await logIntegration(supabaseAdmin, {
        requestPayload,
        responseStatus: 400,
        isSuccess: false,
        errorMessage: "Applicant ID is required",
        triggeredBy,
        durationMs: Date.now() - startedAt,
      });
      return jsonResponse({ error: "Applicant ID is required" }, 400);
    }

    const { data: applicant, error: applicantError } = await supabaseAdmin
      .from("applicants")
      .select("id, onboarding_completed_at, onboarding_access_token, onboarding_access_expires_at")
      .eq("id", applicantId)
      .single();

    if (applicantError || !applicant) {
      await logIntegration(supabaseAdmin, {
        requestPayload,
        responseStatus: 404,
        isSuccess: false,
        errorMessage: "Applicant not found",
        relatedRecordId: applicantId,
        triggeredBy,
        durationMs: Date.now() - startedAt,
      });
      return jsonResponse({ error: "Applicant not found" }, 404);
    }

    if (applicant.onboarding_completed_at) {
      await logIntegration(supabaseAdmin, {
        requestPayload,
        responseStatus: 410,
        isSuccess: false,
        errorMessage: "Onboarding already completed",
        relatedRecordId: applicantId,
        triggeredBy,
        durationMs: Date.now() - startedAt,
      });
      return jsonResponse({ error: "Onboarding already completed" }, 410);
    }

    if (applicant.onboarding_access_token && isFutureIso(applicant.onboarding_access_expires_at)) {
      const responsePayload = {
        token: applicant.onboarding_access_token,
        expiresAt: applicant.onboarding_access_expires_at,
        reused: true,
      };

      await logIntegration(supabaseAdmin, {
        requestPayload,
        responseStatus: 200,
        responsePayload,
        isSuccess: true,
        relatedRecordId: applicantId,
        triggeredBy,
        durationMs: Date.now() - startedAt,
      });
      return jsonResponse(responsePayload, 200);
    }

    const token = generateOnboardingToken();
    const expiresAt = buildExpiryIso();

    const { error: updateError } = await supabaseAdmin
      .from("applicants")
      .update({
        onboarding_access_token: token,
        onboarding_access_expires_at: expiresAt,
      })
      .eq("id", applicantId);

    if (updateError) {
      throw new Error(`Failed to issue onboarding link: ${updateError.message}`);
    }

    const responsePayload = {
      token,
      expiresAt,
      reused: false,
    };

    await logIntegration(supabaseAdmin, {
      requestPayload,
      responseStatus: 200,
      responsePayload,
      isSuccess: true,
      relatedRecordId: applicantId,
      triggeredBy,
      durationMs: Date.now() - startedAt,
    });
    return jsonResponse(responsePayload, 200);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    console.error("create-applicant-onboarding-link error:", error);
    await logIntegration(supabaseAdmin, {
      requestPayload,
      responseStatus: 500,
      isSuccess: false,
      errorMessage,
      relatedRecordId: applicantId,
      triggeredBy,
      durationMs: Date.now() - startedAt,
    });
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
