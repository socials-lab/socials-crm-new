import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    if (!data.applicantId) {
      return new Response(
        JSON.stringify({ error: "Applicant ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify applicant exists and onboarding not yet completed
    const { data: applicant, error: fetchError } = await supabaseAdmin
      .from("applicants")
      .select("id, onboarding_completed_at")
      .eq("id", data.applicantId)
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

    // Update applicant with onboarding data
    const { error: updateError } = await supabaseAdmin
      .from("applicants")
      .update({
        full_name: data.full_name,
        email: data.email,
        phone: data.phone || null,
        ico: data.ico,
        company_name: data.company_name,
        dic: data.dic || null,
        billing_street: data.billing_street || null,
        billing_city: data.billing_city || null,
        billing_zip: data.billing_zip || null,
        hourly_rate: data.hourly_rate || null,
        bank_account: data.bank_account || null,
        onboarding_completed_at: new Date().toISOString(),
      })
      .eq("id", data.applicantId);

    if (updateError) {
      console.error("Update applicant error:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to save onboarding data" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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
