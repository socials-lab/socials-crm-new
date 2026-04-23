import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function toNullableNumber(v: unknown): number | null {
  if (v === '' || v === undefined || v === null) return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Parse to YYYY-MM-DD for DATE column. Returns null if invalid. */
function toDateOnly(v: unknown): string | null {
  if (!v) return null;
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const d = v instanceof Date ? v : new Date(String(v));
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

function toNullableString(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
}

function isExpired(value: string | null | undefined): boolean {
  if (!value) return true;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return true;
  return parsed.getTime() <= Date.now();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const data = await req.json();

    if (!data.onboardingToken) {
      return new Response(
        JSON.stringify({ error: "Onboarding token is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const fullName = String(data.full_name ?? '').trim();
    const email = String(data.email ?? '').trim();
    if (!fullName || !email) {
      return new Response(
        JSON.stringify({ error: "Full name and email are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify applicant exists and onboarding not yet completed
    const { data: applicant, error: fetchError } = await supabaseAdmin
      .from("applicants")
      .select("id, onboarding_completed_at, onboarding_access_expires_at")
      .eq("onboarding_access_token", data.onboardingToken)
      .single();

    if (fetchError || !applicant) {
      return new Response(
        JSON.stringify({ error: "Applicant not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (applicant.onboarding_completed_at) {
      return new Response(
        JSON.stringify({ error: "Onboarding already completed" }),
        { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (isExpired(applicant.onboarding_access_expires_at)) {
      return new Response(
        JSON.stringify({ error: "Onboarding link expired" }),
        { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update applicant with onboarding data (normalize types for DB)
    const { error: updateError } = await supabaseAdmin
      .from("applicants")
      .update({
        full_name: fullName,
        email: email,
        phone: toNullableString(data.phone),
        birthday: toDateOnly(data.birthday),
        avatar_url: toNullableString(data.avatar_url),
        personal_email: toNullableString(data.personal_email),
        ico: toNullableString(data.ico),
        company_name: toNullableString(data.company_name),
        dic: toNullableString(data.dic),
        billing_country: toNullableString(data.billing_country),
        billing_street: toNullableString(data.billing_street),
        billing_city: toNullableString(data.billing_city),
        billing_zip: toNullableString(data.billing_zip),
        hourly_rate: toNullableNumber(data.hourly_rate),
        bank_account: toNullableString(data.bank_account),
        onboarding_completed_at: new Date().toISOString(),
        onboarding_access_token: null,
        onboarding_access_expires_at: null,
      })
      .eq("id", applicant.id);

    if (updateError) {
      console.error("Update applicant error:", updateError);
      return new Response(
        JSON.stringify({
          error: "Failed to save onboarding data",
          details: updateError.message || updateError.code || String(updateError),
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Notify admin/management/super-admin users about completed applicant onboarding.
    // Email sending is handled asynchronously by DB trigger on notifications table.
    try {
      const { data: rolesData, error: rolesError } = await supabaseAdmin
        .from("user_roles")
        .select("user_id, role, is_super_admin, is_active")
        .eq("is_active", true);

      if (rolesError) {
        console.error("Fetch user roles for onboarding notification failed:", rolesError);
      } else if (Array.isArray(rolesData) && rolesData.length > 0) {
        const recipientIds = Array.from(
          new Set(
            rolesData
              .filter((r: { role?: string | null; is_super_admin?: boolean | null }) =>
                r?.is_super_admin === true || r?.role === "admin" || r?.role === "management")
              .map((r: { user_id: string }) => r.user_id),
          ),
        );

        if (recipientIds.length > 0) {
          const notifications = recipientIds.map((userId) => ({
            user_id: userId,
            type: "form_completed",
            title: "Onboarding kolegy vyplněn",
            message: `Kandidát "${fullName}" dokončil onboarding formulář.`,
            link: `/recruitment?openApplicant=${applicant.id}`,
            metadata: {
              applicant_id: applicant.id,
              full_name: fullName,
              email,
            },
          }));

          const { error: notifError } = await supabaseAdmin
            .from("notifications")
            .insert(notifications);

          if (notifError) {
            console.error("Create onboarding notifications failed:", notifError);
          }
        }
      }
    } catch (notifErr) {
      console.error("Onboarding notification pipeline failed:", notifErr);
      // Do not fail the onboarding submission due to notification issue.
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Submit applicant onboarding error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
