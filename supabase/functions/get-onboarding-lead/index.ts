import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_CURRENCIES = ["CZK", "EUR", "USD"] as const;

class ValidationError extends Error {}

function requireCurrency(value: unknown, context: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new ValidationError(`Missing currency for ${context}`);
  }
  const currency = value.trim().toUpperCase();
  if (!ALLOWED_CURRENCIES.includes(currency as typeof ALLOWED_CURRENCIES[number])) {
    throw new ValidationError(`Invalid currency "${currency}" for ${context}`);
  }
  return currency;
}

function normalizeServices(
  services: unknown[],
  source: "offer" | "lead",
) {
  return services.map((service, index) => {
    const serviceRecord = (service && typeof service === "object") ? service as Record<string, unknown> : {};
    const price = Number(serviceRecord.price);
    if (!Number.isFinite(price)) {
      throw new ValidationError(`Invalid price for ${source} service ${index}`);
    }

    const currency = requireCurrency(serviceRecord.currency, `${source} service ${index}`);
    const billingType = serviceRecord.billing_type === "one_off" ? "one_off" : "monthly";
    const originalPrice = Number(serviceRecord.original_price);

    return {
      id: String(serviceRecord.id || serviceRecord.service_id || `${source}-service-${index}`),
      service_id: String(serviceRecord.service_id || serviceRecord.id || `${source}-service-${index}`),
      name: String(serviceRecord.name || "Služba"),
      selected_tier: serviceRecord.selected_tier || null,
      price,
      original_price: Number.isFinite(originalPrice) ? originalPrice : null,
      discount_reason: typeof serviceRecord.discount_reason === "string" ? serviceRecord.discount_reason : null,
      currency,
      billing_type: billingType,
    };
  });
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

    const normalizedOfferServices = normalizeServices(offerServices, "offer");
    const normalizedLeadServices = normalizeServices(leadServices, "lead");

    const resolvedPotentialServices = normalizedOfferServices.length > 0
      ? normalizedOfferServices
      : normalizedLeadServices;

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
    const status = error instanceof ValidationError ? 400 : 500;
    const message = error instanceof ValidationError ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
