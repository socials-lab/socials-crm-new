import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function isExpired(value: string | null | undefined): boolean {
  if (!value) {
    return true;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return true;
  }
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

    const { onboardingToken } = await req.json();

    if (!onboardingToken) {
      return new Response(
        JSON.stringify({ error: "Onboarding token is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: applicant, error } = await supabaseAdmin
      .from("applicants")
      .select("id, full_name, email, phone, position, birthday, personal_email, avatar_url, ico, company_name, dic, billing_country, billing_street, billing_city, billing_zip, hourly_rate, bank_account, onboarding_completed_at, onboarding_access_expires_at")
      .eq("onboarding_access_token", onboardingToken)
      .single();

    if (error) {
      console.error("Get applicant onboarding query error:", error);
      if (error.code === "PGRST116") {
        return new Response(
          JSON.stringify({ error: "Applicant not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "Failed to load applicant onboarding", details: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!applicant) {
      return new Response(
        JSON.stringify({ error: "Invalid onboarding link" }),
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

    return new Response(
      JSON.stringify({ applicant }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Get applicant onboarding error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
