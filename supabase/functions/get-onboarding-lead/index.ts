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

    // Prefer the latest active public offer snapshot for onboarding pricing.
    // This keeps onboarding prices stable even if lead services are edited later.
    const { data: latestOffer } = await supabaseAdmin
      .from("public_offers")
      .select("services, monthly_discount_percent, discount_scope, created_at")
      .eq("lead_id", leadId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const leadServices = Array.isArray(lead.potential_services) ? lead.potential_services : [];
    const offerServices = Array.isArray(latestOffer?.services) ? latestOffer.services : [];

    const normalizedOfferServices = offerServices
      .map((service: any, index: number) => {
        const price = Number(service?.price);
        if (!Number.isFinite(price)) return null;

        const currency = typeof service?.currency === "string" && service.currency.trim() !== ""
          ? service.currency
          : "CZK";
        const billingType = service?.billing_type === "one_off" ? "one_off" : "monthly";
        const originalPrice = Number(service?.original_price);

        return {
          id: String(service?.id || service?.service_id || `offer-service-${index}`),
          service_id: String(service?.service_id || service?.id || `offer-service-${index}`),
          name: String(service?.name || "Služba"),
          selected_tier: service?.selected_tier || null,
          price,
          original_price: Number.isFinite(originalPrice) ? originalPrice : null,
          discount_reason: typeof service?.discount_reason === "string" ? service.discount_reason : null,
          currency,
          billing_type: billingType,
        };
      })
      .filter(Boolean);

    const resolvedPotentialServices = normalizedOfferServices.length > 0
      ? normalizedOfferServices
      : leadServices;

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
          potential_services: resolvedPotentialServices,
          monthly_discount_percent: latestOffer?.monthly_discount_percent ?? null,
          discount_scope: latestOffer?.discount_scope ?? null,
          offer_snapshot_created_at: latestOffer?.created_at ?? null,
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
