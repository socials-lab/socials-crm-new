import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DigiSignContractRequest {
  lead_id: string;
  template_id?: string;
}

interface DigiSignEnvelopePayload {
  template_id?: string;
  signers: Array<{
    email: string;
    name: string;
    order: number;
  }>;
  data: Record<string, any>;
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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Chybí autorizace" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Neplatná autorizace" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { lead_id, template_id }: DigiSignContractRequest = await req.json();
    
    if (!lead_id) {
      return new Response(
        JSON.stringify({ error: "Chybí lead_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch lead data
    const { data: lead, error: leadError } = await supabaseAdmin
      .from("leads")
      .select("*")
      .eq("id", lead_id)
      .single();

    if (leadError || !lead) {
      return new Response(
        JSON.stringify({ error: "Lead nenalezen" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get DigiSign credentials
    const DIGISIGN_API_KEY = Deno.env.get("DIGISIGN_API_KEY");

    if (!DIGISIGN_API_KEY) {
      return new Response(
        JSON.stringify({ error: "DigiSign není nakonfigurováno" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prepare contract data
    const contractData = {
      company_name: lead.company_name,
      ico: lead.ico,
      dic: lead.dic,
      contact_name: lead.contact_name,
      contact_email: lead.contact_email,
      contact_phone: lead.contact_phone,
      billing_street: lead.billing_street,
      billing_city: lead.billing_city,
      billing_zip: lead.billing_zip,
      billing_country: lead.billing_country,
      services: lead.potential_services || [],
      estimated_price: lead.estimated_price,
      currency: lead.currency,
    };

    // Create envelope in DigiSign
    const digisignUrl = "https://api.digisign.cz/v1/envelopes";
    const payload: DigiSignEnvelopePayload = {
      template_id: template_id || Deno.env.get("DIGISIGN_DEFAULT_TEMPLATE_ID"),
      signers: [
        {
          email: lead.contact_email || lead.billing_email || "",
          name: lead.contact_name,
          order: 1,
        },
      ],
      data: contractData,
    };

    const response = await fetch(digisignUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${DIGISIGN_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("DigiSign error:", errorText);
      return new Response(
        JSON.stringify({ error: `DigiSign chyba: ${errorText}` }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const digisignEnvelope = await response.json();
    const contractUrl = digisignEnvelope.signing_url || digisignEnvelope.url;
    
    // Update lead with DigiSign ID and contract URL
    const { error: updateError } = await supabaseAdmin
      .from("leads")
      .update({
        digisign_id: String(digisignEnvelope.id),
        contract_url: contractUrl,
        contract_created_at: new Date().toISOString(),
      })
      .eq("id", lead_id);

    if (updateError) {
      console.error("Update error:", updateError);
      return new Response(
        JSON.stringify({ error: "Smlouva vytvořena v DigiSign, ale nepodařilo se uložit ID" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        digisign_id: digisignEnvelope.id,
        contract_url: contractUrl,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("DigiSign create contract error:", error);
    const errorMessage = error instanceof Error ? error.message : "Interní chyba serveru";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
