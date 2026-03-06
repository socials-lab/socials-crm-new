import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GoogleAuthExchangeRequest {
  code: string;
  redirect_uri: string;
  branch: string;
  anon_key: string;
}

interface IntegrationLogData {
  correlationId: string;
  startedAt: number;
  service: string;
  action: string;
  requestPayload: Record<string, unknown> | null;
  responseStatus: number | null;
  responsePayload: Record<string, unknown> | null;
  isSuccess: boolean;
  errorMessage: string | null;
}

function getCorrelationId(req: Request): string {
  const headerCorrelationId = req.headers.get("x-correlation-id");
  if (headerCorrelationId && headerCorrelationId.trim()) {
    return headerCorrelationId.trim();
  }
  return crypto.randomUUID();
}

function responseWithCorrelationId(
  correlationId: string,
  body: Record<string, unknown>,
  status = 200,
): Response {
  return new Response(
    JSON.stringify({ ...body, correlation_id: correlationId }),
    {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "x-correlation-id": correlationId,
      },
    },
  );
}

async function writeIntegrationLog(
  supabaseAdmin: ReturnType<typeof createClient>,
  logData: IntegrationLogData,
): Promise<void> {
  const durationMs = Date.now() - logData.startedAt;
  const { error } = await supabaseAdmin
    .from("integration_log")
    .insert({
      service: logData.service,
      action: logData.action,
      request_payload: logData.requestPayload,
      response_status: logData.responseStatus,
      response_payload: logData.responsePayload,
      is_success: logData.isSuccess,
      error_message: logData.errorMessage,
      duration_ms: durationMs,
    });

  if (error) {
    console.error("Failed to write integration log:", {
      correlation_id: logData.correlationId,
      error: error.message,
    });
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const correlationId = getCorrelationId(req);
  const startedAt = Date.now();
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const { code, redirect_uri, branch, anon_key }: GoogleAuthExchangeRequest = await req.json();
    const requestPayload = {
      branch,
      redirect_uri,
      has_code: Boolean(code),
      has_anon_key: Boolean(anon_key),
    };

    if (!code || !redirect_uri || !branch || !anon_key) {
      const errorMessage = "Missing required fields: code, redirect_uri, branch, anon_key";
      await writeIntegrationLog(supabaseAdmin, {
        correlationId,
        startedAt,
        service: "auth",
        action: "google_auth_exchange",
        requestPayload,
        responseStatus: 400,
        responsePayload: null,
        isSuccess: false,
        errorMessage,
      });
      return responseWithCorrelationId(correlationId, { error: errorMessage }, 400);
    }

    if (!/^[a-z0-9]{20}$/i.test(branch)) {
      const errorMessage = "Invalid branch ref";
      await writeIntegrationLog(supabaseAdmin, {
        correlationId,
        startedAt,
        service: "auth",
        action: "google_auth_exchange",
        requestPayload,
        responseStatus: 400,
        responsePayload: null,
        isSuccess: false,
        errorMessage,
      });
      return responseWithCorrelationId(correlationId, { error: errorMessage }, 400);
    }

    const anonKey = anon_key;

    const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID");
    const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET");

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      const errorMessage = "Google OAuth not configured";
      await writeIntegrationLog(supabaseAdmin, {
        correlationId,
        startedAt,
        service: "auth",
        action: "google_auth_exchange",
        requestPayload,
        responseStatus: 500,
        responsePayload: null,
        isSuccess: false,
        errorMessage,
      });
      return responseWithCorrelationId(correlationId, { error: errorMessage }, 500);
    }

    // Exchange authorization code for tokens with Google
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      const errorMessage = "Google OAuth error: " + errorText;
      console.error("Google token exchange error:", {
        correlation_id: correlationId,
        error: errorText,
      });
      await writeIntegrationLog(supabaseAdmin, {
        correlationId,
        startedAt,
        service: "auth",
        action: "google_auth_exchange",
        requestPayload,
        responseStatus: tokenResponse.status,
        responsePayload: null,
        isSuccess: false,
        errorMessage,
      });
      return responseWithCorrelationId(correlationId, { error: errorMessage }, tokenResponse.status);
    }

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      const errorMessage = "Google OAuth error: " + (tokenData.error_description || tokenData.error);
      await writeIntegrationLog(supabaseAdmin, {
        correlationId,
        startedAt,
        service: "auth",
        action: "google_auth_exchange",
        requestPayload,
        responseStatus: 400,
        responsePayload: null,
        isSuccess: false,
        errorMessage,
      });
      return responseWithCorrelationId(correlationId, { error: errorMessage }, 400);
    }

    if (!tokenData.id_token || !tokenData.access_token) {
      const errorMessage = "Google OAuth response missing id_token or access_token";
      await writeIntegrationLog(supabaseAdmin, {
        correlationId,
        startedAt,
        service: "auth",
        action: "google_auth_exchange",
        requestPayload,
        responseStatus: 400,
        responsePayload: null,
        isSuccess: false,
        errorMessage,
      });
      return responseWithCorrelationId(correlationId, { error: errorMessage }, 400);
    }

    // Exchange Google tokens for a Supabase session
    const supabaseAuthResponse = await fetch(
      "https://" + branch + ".supabase.co/auth/v1/token?grant_type=id_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": anonKey,
        },
        body: JSON.stringify({
          provider: "google",
          id_token: tokenData.id_token,
          access_token: tokenData.access_token,
        }),
      }
    );

    const supabaseData = await supabaseAuthResponse.json();

    if (!supabaseAuthResponse.ok) {
      const responsePayload = {
        provider: "google",
        details: supabaseData,
      };
      console.error("Supabase auth error:", {
        correlation_id: correlationId,
        status: supabaseAuthResponse.status,
        details: supabaseData,
      });
      await writeIntegrationLog(supabaseAdmin, {
        correlationId,
        startedAt,
        service: "auth",
        action: "google_auth_exchange",
        requestPayload,
        responseStatus: supabaseAuthResponse.status,
        responsePayload,
        isSuccess: false,
        errorMessage: "Supabase auth error",
      });
      return responseWithCorrelationId(
        correlationId,
        { error: "Supabase auth error", details: supabaseData },
        supabaseAuthResponse.status,
      );
    }

    await writeIntegrationLog(supabaseAdmin, {
      correlationId,
      startedAt,
      service: "auth",
      action: "google_auth_exchange",
      requestPayload,
      responseStatus: 200,
      responsePayload: {
        provider: "google",
        user_id: supabaseData?.user?.id ?? null,
      },
      isSuccess: true,
      errorMessage: null,
    });

    return responseWithCorrelationId(correlationId, supabaseData);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    console.error("Google auth exchange error:", {
      correlation_id: correlationId,
      error: errorMessage,
    });
    await writeIntegrationLog(supabaseAdmin, {
      correlationId,
      startedAt,
      service: "auth",
      action: "google_auth_exchange",
      requestPayload: null,
      responseStatus: 500,
      responsePayload: null,
      isSuccess: false,
      errorMessage,
    });
    return responseWithCorrelationId(correlationId, { error: errorMessage }, 500);
  }
});
