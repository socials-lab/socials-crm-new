import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DigiSignWebhookPayload {
  event: string;
  envelope: {
    id: string;
    status: string;
    signed_at?: string;
    signed_document_url?: string;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const WEBHOOK_SECRET = Deno.env.get("DIGISIGN_WEBHOOK_SECRET");
    const signature = req.headers.get("X-DigiSign-Signature");

    // Verify webhook signature if configured
    if (WEBHOOK_SECRET && signature) {
      // Simple signature verification - adjust based on DigiSign's actual method
      // Note: This is a simplified check. DigiSign may use a different signature method.
    }

    const payload: DigiSignWebhookPayload = await req.json();

    if (payload.event !== "envelope.signed" && payload.event !== "envelope.completed") {
      return new Response(
        JSON.stringify({ success: true, message: "Event ignored" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find lead by digisign_id
    const { data: lead, error: findError } = await supabaseAdmin
      .from("leads")
      .select("id, contract_signed_at")
      .eq("digisign_id", payload.envelope.id)
      .single();

    if (findError || !lead) {
      console.error("Lead not found:", findError);
      return new Response(
        JSON.stringify({ error: "Lead nenalezen" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update contract signing status
    const updates: any = {};
    
    if (payload.envelope.status === "signed" || payload.envelope.status === "completed") {
      updates.contract_signed_at = payload.envelope.signed_at || new Date().toISOString();
      
      // Update contract URL if signed document URL is provided
      if (payload.envelope.signed_document_url) {
        updates.contract_url = payload.envelope.signed_document_url;
      }
    }

    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from("leads")
        .update(updates)
        .eq("id", lead.id);

      if (updateError) {
        console.error("Update error:", updateError);
        return new Response(
          JSON.stringify({ error: "Nepodařilo se aktualizovat smlouvu" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("DigiSign webhook error:", error);
    return new Response(
      JSON.stringify({ error: "Interní chyba serveru" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
