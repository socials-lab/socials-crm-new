import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import {
  getFakturoidAccessToken,
  getAccountSlug,
  getSubjectById,
} from "../_shared/fakturoid.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface GetSubjectRequest {
  subject_id: number;
}

function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match?.[1]) return null;
  return match[1].trim();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const startTime = Date.now();
  let userId: string | null = null;
  let subjectId: number | null = null;

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const logIntegration = async (params: {
    isSuccess: boolean;
    status?: number;
    errorMessage?: string;
    requestPayload?: Record<string, unknown>;
    responsePayload?: Record<string, unknown>;
  }) => {
    try {
      await supabaseAdmin.from("integration_log").insert({
        service: "fakturoid",
        action: "get_subject",
        related_table: "fakturoid_subject",
        related_record_id: subjectId ? String(subjectId) : null,
        is_success: params.isSuccess,
        response_status: params.status ?? null,
        error_message: params.errorMessage ?? null,
        request_payload: params.requestPayload ?? null,
        response_payload: params.responsePayload ?? null,
        triggered_by: userId,
        duration_ms: Date.now() - startTime,
      });
    } catch (logError) {
      console.error("Failed to write get_subject integration log:", logError);
    }
  };

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    const token = extractBearerToken(authHeader);
    if (!token) {
      await logIntegration({
        isSuccess: false,
        status: 401,
        errorMessage: "Unauthorized: missing bearer token",
        requestPayload: {
          auth_header_present: !!authHeader,
          auth_header_prefix: authHeader ? authHeader.slice(0, 16) : null,
        },
      });
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized", message: "Missing or invalid authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      await logIntegration({
        isSuccess: false,
        status: 401,
        errorMessage: `Unauthorized: ${authError?.message || "user not found"}`,
        requestPayload: {
          token_length: token.length,
          auth_header_prefix: authHeader ? authHeader.slice(0, 16) : null,
        },
      });
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized", message: "User session is invalid or expired" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    userId = user.id;

    // Parse request
    const { subject_id }: GetSubjectRequest = await req.json();
    subjectId = subject_id ?? null;

    if (!subject_id) {
      await logIntegration({
        isSuccess: false,
        status: 400,
        errorMessage: "Missing subject_id",
      });
      return new Response(
        JSON.stringify({ success: false, error: "Chybí subject_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Fakturoid credentials
    const accountSlug = getAccountSlug();
    const accessToken = await getFakturoidAccessToken();

    // Fetch subject from Fakturoid
    const subject = await getSubjectById(accessToken, accountSlug, subject_id);

    await logIntegration({
      isSuccess: true,
      status: 200,
      requestPayload: { subject_id },
      responsePayload: { subject_id: subject.id, name: subject.name },
    });

    return new Response(
      JSON.stringify({
        success: true,
        subject,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Interní chyba serveru";
    console.error("Fakturoid get subject error:", error);
    await logIntegration({
      isSuccess: false,
      status: 500,
      errorMessage,
      requestPayload: subjectId ? { subject_id: subjectId } : undefined,
    });
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
