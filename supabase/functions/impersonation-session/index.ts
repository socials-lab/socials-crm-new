import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Action = "start" | "stop" | "status";

interface ImpersonationRequest {
  action: Action;
  target_user_id?: string;
}

function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  return match[1].trim();
}

function decodeJwtPayload(token: string): Record<string, unknown> {
  const parts = token.split(".");
  if (parts.length < 2) {
    throw new Error("Invalid JWT format.");
  }
  const payloadPart = parts[1]
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(parts[1].length / 4) * 4, "=");
  const decoded = atob(payloadPart);
  return JSON.parse(decoded) as Record<string, unknown>;
}

async function loadProfile(
  supabaseAdmin: ReturnType<typeof createClient>,
  userId: string,
): Promise<{ id: string; full_name: string | null; email: string | null } | null> {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, email")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startedAt = Date.now();
  let callerId: string | null = null;

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const token = extractBearerToken(req.headers.get("Authorization"));
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid authorization header." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const tokenPayload = decodeJwtPayload(token);
    const sessionIdRaw = tokenPayload["session_id"];
    const sessionId = typeof sessionIdRaw === "string" ? sessionIdRaw : null;
    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: "Missing session_id in JWT." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !authData.user) {
      return new Response(
        JSON.stringify({ error: "Invalid authorization token." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const caller = authData.user;
    callerId = caller.id;

    const body = (await req.json()) as ImpersonationRequest;
    if (body.action !== "start" && body.action !== "stop" && body.action !== "status") {
      return new Response(
        JSON.stringify({ error: "Invalid action. Use 'start', 'stop' or 'status'." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (body.action === "status") {
      const { data: activeSession, error: activeSessionError } = await supabaseAdmin
        .from("impersonation_sessions")
        .select("impersonated_user_id, expires_at")
        .eq("impersonator_user_id", caller.id)
        .eq("impersonator_session_id", sessionId)
        .is("stopped_at", null)
        .gt("expires_at", new Date().toISOString())
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (activeSessionError) throw activeSessionError;

      const impersonatedProfile = activeSession?.impersonated_user_id
        ? await loadProfile(supabaseAdmin, activeSession.impersonated_user_id)
        : null;

      return new Response(
        JSON.stringify({
          success: true,
          is_impersonating: !!activeSession?.impersonated_user_id,
          effective_user_id: activeSession?.impersonated_user_id ?? caller.id,
          impersonated_user_id: activeSession?.impersonated_user_id ?? null,
          impersonated_profile: impersonatedProfile,
          expires_at: activeSession?.expires_at ?? null,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: callerRole, error: callerRoleError } = await supabaseAdmin
      .from("user_roles")
      .select("is_super_admin, is_active")
      .eq("user_id", caller.id)
      .maybeSingle();

    if (callerRoleError) {
      throw callerRoleError;
    }

    if (!callerRole?.is_super_admin || callerRole.is_active === false) {
      return new Response(
        JSON.stringify({ error: "Only active superadmins can impersonate users." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (body.action === "start") {
      const targetUserId = body.target_user_id;
      if (!targetUserId) {
        return new Response(
          JSON.stringify({ error: "target_user_id is required when action=start." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      if (targetUserId === caller.id) {
        return new Response(
          JSON.stringify({ error: "Cannot impersonate yourself." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const { data: targetRole, error: targetRoleError } = await supabaseAdmin
        .from("user_roles")
        .select("is_super_admin, is_active")
        .eq("user_id", targetUserId)
        .maybeSingle();

      if (targetRoleError) {
        throw targetRoleError;
      }

      if (!targetRole || targetRole.is_active === false) {
        return new Response(
          JSON.stringify({ error: "Target user is missing an active CRM role." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      if (targetRole.is_super_admin) {
        return new Response(
          JSON.stringify({ error: "Superadmin to superadmin impersonation is not allowed." }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const { error: closeExistingError } = await supabaseAdmin
        .from("impersonation_sessions")
        .update({
          stopped_at: new Date().toISOString(),
          stopped_by: caller.id,
        })
        .eq("impersonator_user_id", caller.id)
        .eq("impersonator_session_id", sessionId)
        .is("stopped_at", null);
      if (closeExistingError) throw closeExistingError;

      const { error: sessionInsertError } = await supabaseAdmin
        .from("impersonation_sessions")
        .insert({
          impersonator_user_id: caller.id,
          impersonator_session_id: sessionId,
          impersonated_user_id: targetUserId,
          started_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          stopped_at: null,
          stopped_by: null,
        });
      if (sessionInsertError) throw sessionInsertError;

      await supabaseAdmin.from("integration_log").insert({
        service: "impersonation",
        action: "start",
        request_payload: { target_user_id: targetUserId },
        response_status: 200,
        response_payload: { effective_user_id: targetUserId },
        is_success: true,
        triggered_by: caller.id,
        duration_ms: Date.now() - startedAt,
      });

      return new Response(
        JSON.stringify({ success: true, is_impersonating: true, effective_user_id: targetUserId }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { error: stopSessionError } = await supabaseAdmin
      .from("impersonation_sessions")
      .update({
        stopped_at: new Date().toISOString(),
        stopped_by: caller.id,
      })
      .eq("impersonator_user_id", caller.id)
      .eq("impersonator_session_id", sessionId)
      .is("stopped_at", null);
    if (stopSessionError) throw stopSessionError;

    await supabaseAdmin.from("integration_log").insert({
      service: "impersonation",
      action: "stop",
      request_payload: {},
      response_status: 200,
      response_payload: { effective_user_id: caller.id },
      is_success: true,
      triggered_by: caller.id,
      duration_ms: Date.now() - startedAt,
    });

    return new Response(
      JSON.stringify({ success: true, is_impersonating: false, effective_user_id: caller.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    console.error("impersonation-session error:", error);

    try {
      if (callerId) {
        const supabaseAdmin = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        );
        await supabaseAdmin.from("integration_log").insert({
          service: "impersonation",
          action: "error",
          request_payload: {},
          response_status: 500,
          response_payload: { error: message },
          is_success: false,
          error_message: message,
          triggered_by: callerId,
          duration_ms: Date.now() - startedAt,
        });
      }
    } catch (logError) {
      console.error("impersonation-session log error:", logError);
    }

    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
