import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Verify API key
  const authHeader = req.headers.get("authorization");
  const expectedKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  
  if (!authHeader || authHeader !== `Bearer ${expectedKey}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const data = await req.json();
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Build the update object from enrichment data
    const updates: Record<string, any> = {};
    
    // Contact info (update existing fields)
    if (data.first_name || data.last_name) {
      updates.contact_name = [data.first_name, data.last_name].filter(Boolean).join(' ');
    }
    if (data.email) updates.contact_email = data.email;
    if (data.phone) updates.contact_phone = data.phone;
    if (data.website_url) updates.website = data.website_url;
    
    // Company info
    if (data.company_name) updates.company_name = data.company_name;
    if (data.ico) updates.ico = data.ico;
    if (data.company_address) updates.company_address = data.company_address;
    if (data.is_vat_payer !== undefined) updates.is_vat_payer = data.is_vat_payer;
    if (data.is_ecommerce !== undefined) updates.is_ecommerce = data.is_ecommerce;
    if (data.business_type) updates.business_type = data.business_type;
    
    // Marketing info
    if (data.platform) updates.enrichment_platform = data.platform;
    if (data.ad_spend_range) updates.enrichment_ad_spend_range = data.ad_spend_range;
    if (data.services_needed) updates.enrichment_services_needed = data.services_needed;
    if (data.marketing_experience) updates.marketing_experience = data.marketing_experience;
    if (data.marketing_maturity) updates.marketing_maturity = data.marketing_maturity;
    if (data.has_creative_team) updates.has_creative_team = data.has_creative_team;
    if (data.pain_point) updates.pain_point = data.pain_point;
    
    // Tracking & scoring
    if (data.has_ga4 !== undefined) updates.has_ga4 = data.has_ga4;
    if (data.has_gtm !== undefined) updates.has_gtm = data.has_gtm;
    if (data.has_meta_pixel !== undefined) updates.has_meta_pixel = data.has_meta_pixel;
    if (data.has_google_ads !== undefined) updates.has_google_ads = data.has_google_ads;
    if (data.tracking_detected !== undefined) updates.tracking_detected = data.tracking_detected;
    if (data.lead_score !== undefined) updates.lead_score = data.lead_score;
    if (data.credibility_score !== undefined) updates.credibility_score = data.credibility_score;
    if (data.qualification_tier) updates.enrichment_qualification_tier = data.qualification_tier;
    
    // Social media
    if (data.facebook_url) updates.facebook_url = data.facebook_url;
    if (data.instagram_url) updates.instagram_url = data.instagram_url;
    
    // Booking
    if (data.booking_status) updates.booking_status = data.booking_status;
    if (data.booking_datetime) updates.booking_datetime = data.booking_datetime;
    if (data.booking_meet_link) updates.booking_meet_link = data.booking_meet_link;
    
    // AI research & meta
    if (data.company_research) updates.company_research = data.company_research;
    if (data.completed !== undefined) updates.enrichment_completed = data.completed;
    if (data.id) updates.enrichment_id = data.id;

    // Find the lead - try by enrichment_id first, then by email, then by company_name + ico
    let leadId: string | null = null;

    if (data.id) {
      const { data: byEnrichmentId } = await supabase
        .from('leads')
        .select('id')
        .eq('enrichment_id', data.id)
        .limit(1);
      if (byEnrichmentId?.length) leadId = byEnrichmentId[0].id;
    }

    if (!leadId && data.email) {
      const { data: byEmail } = await supabase
        .from('leads')
        .select('id')
        .eq('contact_email', data.email)
        .limit(1);
      if (byEmail?.length) leadId = byEmail[0].id;
    }

    if (!leadId && data.company_name) {
      const { data: byCompany } = await supabase
        .from('leads')
        .select('id')
        .ilike('company_name', `%${data.company_name}%`)
        .limit(1);
      if (byCompany?.length) leadId = byCompany[0].id;
    }

    if (!leadId) {
      // Create a new lead
      const { data: newLead, error: insertError } = await supabase
        .from('leads')
        .insert({
          company_name: data.company_name || 'Unknown',
          contact_name: updates.contact_name || data.email || 'Unknown',
          contact_email: data.email || null,
          contact_phone: data.phone || null,
          website: data.website_url || null,
          ico: data.ico || '',
          source: 'website',
          stage: 'new_lead',
          ...updates,
        })
        .select('id')
        .single();

      if (insertError) throw insertError;
      leadId = newLead.id;

      return new Response(JSON.stringify({ 
        success: true, 
        action: 'created',
        lead_id: leadId 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update existing lead
    const { error: updateError } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', leadId);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ 
      success: true, 
      action: 'updated',
      lead_id: leadId 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Lead enrichment webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
