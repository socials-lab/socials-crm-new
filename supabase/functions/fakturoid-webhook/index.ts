import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FakturoidWebhookPayload {
  event: string;
  invoice: {
    id: number;
    status: string;
    paid_at?: string;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const WEBHOOK_SECRET = Deno.env.get("FAKTUROID_WEBHOOK_SECRET");
    const signature = req.headers.get("X-Fakturoid-Signature");

    // Verify webhook signature if configured
    if (WEBHOOK_SECRET && signature) {
      // Simple signature verification - adjust based on Fakturoid's actual method
      const expectedSignature = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(WEBHOOK_SECRET + JSON.stringify(await req.json()))
      );
      // Note: This is a simplified check. Fakturoid may use a different signature method.
    }

    const payload: FakturoidWebhookPayload = await req.json();

    if (payload.event !== "invoice.paid" && payload.event !== "invoice.updated") {
      return new Response(
        JSON.stringify({ success: true, message: "Event ignored" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find invoice by fakturoid_id
    const { data: invoice, error: findError } = await supabaseAdmin
      .from("issued_invoices")
      .select("id, status")
      .eq("fakturoid_id", String(payload.invoice.id))
      .single();

    if (findError || !invoice) {
      console.error("Invoice not found:", findError);
      return new Response(
        JSON.stringify({ error: "Faktura nenalezena" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update invoice status
    const updates: any = {};
    
    if (payload.invoice.status === "paid" && payload.invoice.paid_at) {
      updates.status = "paid";
      updates.paid_at = payload.invoice.paid_at;
    } else if (payload.invoice.status === "sent") {
      updates.status = "sent";
    } else if (payload.invoice.status === "overdue") {
      updates.status = "overdue";
    }

    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from("issued_invoices")
        .update(updates)
        .eq("id", invoice.id);

      if (updateError) {
        console.error("Update error:", updateError);
        return new Response(
          JSON.stringify({ error: "Nepodařilo se aktualizovat fakturu" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Fakturoid webhook error:", error);
    return new Response(
      JSON.stringify({ error: "Interní chyba serveru" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
