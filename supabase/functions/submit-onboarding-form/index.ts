import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Signatory {
  name: string;
  position?: string;
  email: string;
  phone?: string;
}

interface ProjectContact {
  name: string;
  email: string;
  phone?: string;
}

interface OnboardingFormData {
  leadId: string;
  company_name: string;
  ico: string;
  dic?: string;
  website?: string;
  industry?: string;
  billing_street?: string;
  billing_city?: string;
  billing_zip?: string;
  billing_country?: string;
  billing_email?: string;
  signatories: Signatory[];
  projectContacts: ProjectContact[];
  startDate: string;
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

    const data: OnboardingFormData = await req.json();
    
    if (!data.leadId) {
      return new Response(
        JSON.stringify({ error: "Lead ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify lead exists and is not already completed
    const { data: lead, error: leadError } = await supabaseAdmin
      .from("leads")
      .select("id, onboarding_form_completed_at")
      .eq("id", data.leadId)
      .single();

    if (leadError || !lead) {
      return new Response(
        JSON.stringify({ error: "Lead not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (lead.onboarding_form_completed_at) {
      return new Response(
        JSON.stringify({ error: "Onboarding form already completed" }),
        { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update lead with onboarding data
    const primarySignatory = data.signatories[0];
    const { error: updateError } = await supabaseAdmin
      .from("leads")
      .update({
        company_name: data.company_name,
        ico: data.ico,
        dic: data.dic || null,
        website: data.website || null,
        industry: data.industry || null,
        billing_street: data.billing_street || null,
        billing_city: data.billing_city || null,
        billing_zip: data.billing_zip || null,
        billing_country: data.billing_country || null,
        billing_email: data.billing_email || null,
        // Update contact with primary signatory
        contact_name: primarySignatory.name,
        contact_position: primarySignatory.position || null,
        contact_email: primarySignatory.email,
        contact_phone: primarySignatory.phone || null,
        // Store signatories and project contacts as JSON
        onboarding_signatories: data.signatories,
        onboarding_project_contacts: data.projectContacts,
        onboarding_start_date: data.startDate,
        onboarding_form_completed_at: new Date().toISOString(),
      })
      .eq("id", data.leadId);

    if (updateError) {
      console.error("Update lead error:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to save form data" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Submit onboarding form error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
