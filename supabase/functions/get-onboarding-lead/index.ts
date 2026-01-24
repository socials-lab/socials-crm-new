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

    const { leadId } = await req.json();
    
    if (!leadId) {
      return new Response(
        JSON.stringify({ error: "Lead ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch lead data - only expose fields needed for onboarding
    const { data: lead, error: leadError } = await supabaseAdmin
      .from("leads")
      .select(`
        id,
        company_name,
        ico,
        dic,
        website,
        industry,
        billing_street,
        billing_city,
        billing_zip,
        billing_country,
        billing_email,
        contact_name,
        contact_position,
        contact_email,
        contact_phone,
        owner_id,
        potential_services,
        onboarding_form_completed_at
      `)
      .eq("id", leadId)
      .single();

    if (leadError || !lead) {
      return new Response(
        JSON.stringify({ error: "Lead not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If already completed, don't allow access
    if (lead.onboarding_form_completed_at) {
      return new Response(
        JSON.stringify({ error: "Onboarding form already completed" }),
        { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get owner info for contact display
    let ownerName = "tým Socials";
    let ownerEmail = "info@socials.cz";
    
    if (lead.owner_id) {
      const { data: owner } = await supabaseAdmin
        .from("colleagues")
        .select("full_name, email")
        .eq("id", lead.owner_id)
        .single();
      
      if (owner) {
        ownerName = owner.full_name || ownerName;
        ownerEmail = owner.email || ownerEmail;
      }
    }

    return new Response(
      JSON.stringify({
        lead: {
          ...lead,
          owner_name: ownerName,
          owner_email: ownerEmail,
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Get onboarding lead error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
