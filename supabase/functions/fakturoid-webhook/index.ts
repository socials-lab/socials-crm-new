import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FakturoidWebhookPayload {
  webhook_id: number;
  event_name: string;
  created_at: string;
  body: {
    invoice: {
      id: number;
      status: string;
      paid_at?: string;
    };
    payment?: {
      id: number;
      paid_on: string;
      amount: string;
    };
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let invoiceId: string | null = null;

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Read body once and parse
    const bodyText = await req.text();
    const payload: FakturoidWebhookPayload = JSON.parse(bodyText);

    // Verify webhook authorization header (REQUIRED)
    const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET");
    if (!WEBHOOK_SECRET) {
      console.error("WEBHOOK_SECRET not configured - rejecting webhook");
      return new Response(
        JSON.stringify({ error: "Webhook secret not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (authHeader !== WEBHOOK_SECRET) {
      console.error("Webhook authorization failed");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (payload.event_name !== "invoice_paid" && payload.event_name !== "invoice_updated") {
      return new Response(
        JSON.stringify({ success: true, message: "Event ignored" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find invoice by fakturoid_id
    const { data: invoice, error: findError } = await supabaseAdmin
      .from("issued_invoices")
      .select("id, status")
      .eq("fakturoid_id", String(payload.body.invoice.id))
      .single();

    if (findError || !invoice) {
      const durationMs = Date.now() - startTime;
      console.error("Invoice not found:", findError);
      
      // Log webhook error
      await supabaseAdmin.from('integration_log').insert({
        service: 'fakturoid',
        action: 'webhook_invoice_update',
        related_table: 'issued_invoices',
        request_payload: payload,
        is_success: false,
        error_message: `Invoice not found: ${findError?.message || 'Unknown'}`,
        duration_ms: durationMs,
      });
      
      return new Response(
        JSON.stringify({ error: "Faktura nenalezena" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    invoiceId = invoice.id;

    // Update invoice status
    const updates: Record<string, unknown> = {};
    
    if (payload.body.invoice.status === "paid") {
      updates.status = "paid";
      // Payment date comes from payment object, not invoice
      updates.paid_at = payload.body.payment?.paid_on || new Date().toISOString().split('T')[0];
    } else if (payload.body.invoice.status === "sent") {
      updates.status = "sent";
    } else if (payload.body.invoice.status === "overdue") {
      updates.status = "overdue";
    }

    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from("issued_invoices")
        .update(updates)
        .eq("id", invoice.id);

      if (updateError) {
        const durationMs = Date.now() - startTime;
        console.error("Update error:", updateError);
        
        // Log update error
        await supabaseAdmin.from('integration_log').insert({
          service: 'fakturoid',
          action: 'webhook_invoice_update',
          related_table: 'issued_invoices',
          related_record_id: invoiceId,
          request_payload: payload,
          is_success: false,
          error_message: `Update failed: ${updateError.message}`,
          duration_ms: durationMs,
        });
        
        return new Response(
          JSON.stringify({ error: "Nepodařilo se aktualizovat fakturu" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const durationMs = Date.now() - startTime;
    
    // Log successful webhook
    await supabaseAdmin.from('integration_log').insert({
      service: 'fakturoid',
      action: 'webhook_invoice_update',
      related_table: 'issued_invoices',
      related_record_id: invoiceId,
      request_payload: payload,
      response_status: 200,
      is_success: true,
      duration_ms: durationMs,
    });

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Interní chyba serveru";
    
    // Log error
    try {
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      await supabaseAdmin.from('integration_log').insert({
        service: 'fakturoid',
        action: 'webhook_invoice_update',
        related_table: 'issued_invoices',
        related_record_id: invoiceId,
        request_payload: null,
        is_success: false,
        error_message: errorMessage,
        duration_ms: durationMs,
      });
    } catch (logError) {
      console.error("Failed to log integration error:", logError);
    }
    
    console.error("Fakturoid webhook error:", error);
    return new Response(
      JSON.stringify({ error: "Interní chyba serveru" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
