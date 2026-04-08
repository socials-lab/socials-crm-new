import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const NOTIFICATION_TYPES = [
  "new_lead",
  "form_completed",
  "contract_signed",
  "lead_converted",
  "access_granted",
  "offer_sent",
  "colleague_birthday",
  "new_feedback_idea",
] as const;

type NotificationType = typeof NOTIFICATION_TYPES[number];

type RouteRow = {
  notification_type: NotificationType;
  recipient_emails: string[] | null;
  is_enabled: boolean | null;
};

type ListRequest = { action: "list" };
type UpsertRequest = {
  action: "upsert";
  routes: Array<{
    notification_type: NotificationType;
    recipient_emails: string[];
    is_enabled: boolean;
  }>;
};

type RequestBody = ListRequest | UpsertRequest;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeEmails(emails: string[]): string[] {
  const unique = new Set<string>();
  for (const raw of emails) {
    const normalized = String(raw || "").trim().toLowerCase();
    if (!normalized) continue;
    if (!isValidEmail(normalized)) {
      throw new Error(`Invalid email format: ${raw}`);
    }
    unique.add(normalized);
  }
  return Array.from(unique);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return jsonResponse({ error: "Missing authorization header" }, 401);
    }
    const token = authHeader.replace("Bearer ", "").trim();
    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !authData.user?.id) {
      return jsonResponse({ error: "Invalid authorization token" }, 401);
    }

    const userId = authData.user.id;
    const { data: roleRow, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role, is_super_admin, is_active")
      .eq("user_id", userId)
      .maybeSingle<{ role: string | null; is_super_admin: boolean | null; is_active: boolean | null }>();

    if (
      roleError ||
      !roleRow ||
      roleRow.is_active === false ||
      !(roleRow.is_super_admin || roleRow.role === "admin" || roleRow.role === "management")
    ) {
      return jsonResponse({ error: "Insufficient permissions" }, 403);
    }

    const body = (await req.json().catch(() => ({}))) as RequestBody;
    if (!body || typeof body !== "object" || !("action" in body)) {
      return jsonResponse({ error: "Invalid payload" }, 400);
    }

    if (body.action === "list") {
      const { data, error } = await supabaseAdmin
        .from("notification_email_routes")
        .select("notification_type, recipient_emails, is_enabled")
        .order("notification_type", { ascending: true });

      if (error) {
        return jsonResponse({ error: error.message }, 500);
      }

      const existing = new Map<string, RouteRow>(
        (data || []).map((row) => [row.notification_type, row as RouteRow]),
      );

      const routes = NOTIFICATION_TYPES.map((type) => {
        const row = existing.get(type);
        return {
          notification_type: type,
          recipient_emails: row?.recipient_emails || [],
          is_enabled: row?.is_enabled ?? true,
        };
      });

      return jsonResponse({ routes });
    }

    if (body.action === "upsert") {
      if (!Array.isArray(body.routes) || body.routes.length === 0) {
        return jsonResponse({ error: "routes array is required" }, 400);
      }

      const payload = body.routes.map((route) => {
        if (!NOTIFICATION_TYPES.includes(route.notification_type)) {
          throw new Error(`Unsupported notification_type: ${route.notification_type}`);
        }
        return {
          notification_type: route.notification_type,
          recipient_emails: normalizeEmails(route.recipient_emails || []),
          is_enabled: Boolean(route.is_enabled),
          updated_by: userId,
          updated_at: new Date().toISOString(),
        };
      });

      const { error } = await supabaseAdmin
        .from("notification_email_routes")
        .upsert(payload, { onConflict: "notification_type" });

      if (error) {
        return jsonResponse({ error: error.message }, 500);
      }

      return jsonResponse({ success: true });
    }

    return jsonResponse({ error: "Unsupported action" }, 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonResponse({ error: message }, 500);
  }
});
