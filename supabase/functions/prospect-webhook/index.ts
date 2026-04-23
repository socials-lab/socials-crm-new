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

  const rawBody = await req.text();
  let requestPayload: unknown = rawBody;

  try {
    requestPayload = rawBody ? JSON.parse(rawBody) : null;
  } catch {
    requestPayload = rawBody;
  }

  await logIntegration(supabaseAdmin, {
    requestPayload,
    responseStatus: 410,
    responsePayload: { error: "Legacy prospect-webhook is disabled. Use prospect-crm-sync instead." },
    isSuccess: false,
    errorMessage: "Legacy prospect-webhook disabled",
    durationMs: Date.now() - startTime,
  });

  return jsonResponse(
    {
      error: "Legacy prospect-webhook is disabled. Use prospect-crm-sync instead.",
    },
    410,
  );
});
