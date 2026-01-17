import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FakturoidInvoiceRequest {
  invoice_id: string;
}

interface InvoiceLineItem {
  line_description: string;
  quantity: number;
  unit_price: number;
}

interface FakturoidInvoiceItem {
  name: string;
  quantity: number;
  unit_price: number;
  vat_rate: number;
}

interface FakturoidInvoicePayload {
  subject_id: number;
  lines: FakturoidInvoiceItem[];
  due: string;
  issue_date: string;
  note?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let invoiceId: string | null = null;
  let userId: string | null = null;

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

    userId = user.id;
    const { invoice_id }: FakturoidInvoiceRequest = await req.json();
    invoiceId = invoice_id;
    
    if (!invoice_id) {
      return new Response(
        JSON.stringify({ error: "Chybí invoice_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch invoice with line items
    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from("issued_invoices")
      .select(`
        *,
        invoice_line_items (*)
      `)
      .eq("id", invoice_id)
      .single();

    if (invoiceError || !invoice) {
      return new Response(
        JSON.stringify({ error: "Faktura nenalezena" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch client to get Fakturoid subject_id (if stored)
    const { data: client } = await supabaseAdmin
      .from("clients")
      .select("id, name, fakturoid_subject_id")
      .eq("id", invoice.client_id)
      .single();

    if (!client?.fakturoid_subject_id) {
      return new Response(
        JSON.stringify({ error: "Klient nemá přiřazené Fakturoid ID. Nejprve vytvořte klienta ve Fakturoid." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Fakturoid credentials
    const FAKTUROID_ACCOUNT_SLUG = Deno.env.get("FAKTUROID_ACCOUNT_SLUG");
    const FAKTUROID_API_KEY = Deno.env.get("FAKTUROID_API_KEY");

    if (!FAKTUROID_ACCOUNT_SLUG || !FAKTUROID_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Fakturoid není nakonfigurováno" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Map line items to Fakturoid format
    const lines: FakturoidInvoiceItem[] = (invoice.invoice_line_items as InvoiceLineItem[]).map((item) => ({
      name: item.line_description,
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
      vat_rate: 21, // Default VAT rate - adjust as needed
    }));

    // Prepare invoice payload
    const issueDate = new Date(invoice.issued_at).toISOString().split('T')[0];
    const dueDate = new Date(invoice.issued_at);
    dueDate.setDate(dueDate.getDate() + 14); // 14 days payment term

    const payload: FakturoidInvoicePayload = {
      subject_id: client.fakturoid_subject_id,
      lines,
      due: dueDate.toISOString().split('T')[0],
      issue_date: issueDate,
      note: `Faktura ${invoice.invoice_number}`,
    };

    // Create invoice in Fakturoid
    const fakturoidUrl = `https://app.fakturoid.cz/api/v2/accounts/${FAKTUROID_ACCOUNT_SLUG}/invoices.json`;
    const response = await fetch(fakturoidUrl, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${btoa(`${FAKTUROID_API_KEY}:`)}`,
        "Content-Type": "application/json",
        "User-Agent": "Socials CRM",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      const durationMs = Date.now() - startTime;
      console.error("Fakturoid error:", errorText);
      
      // Log failed API call
      await supabaseAdmin.from('integration_log').insert({
        service: 'fakturoid',
        action: 'create_invoice',
        related_table: 'issued_invoices',
        related_record_id: invoiceId,
        request_payload: payload,
        response_status: response.status,
        response_payload: { error: errorText },
        is_success: false,
        error_message: errorText,
        triggered_by: userId,
        duration_ms: durationMs,
      });
      
      return new Response(
        JSON.stringify({ error: `Fakturoid chyba: ${errorText}` }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const fakturoidInvoice = await response.json();
    const durationMs = Date.now() - startTime;
    
    // Update invoice with Fakturoid IDs
    const fakturoidInvoiceUrl = `https://app.fakturoid.cz/invoices/${fakturoidInvoice.id}`;
    
    const { error: updateError } = await supabaseAdmin
      .from("issued_invoices")
      .update({
        fakturoid_id: String(fakturoidInvoice.id),
        fakturoid_url: fakturoidInvoiceUrl,
      })
      .eq("id", invoice_id);

    if (updateError) {
      console.error("Update error:", updateError);
      
      // Log failed update
      await supabaseAdmin.from('integration_log').insert({
        service: 'fakturoid',
        action: 'create_invoice',
        related_table: 'issued_invoices',
        related_record_id: invoiceId,
        request_payload: payload,
        response_status: response.status,
        response_payload: fakturoidInvoice,
        is_success: false,
        error_message: `Update failed: ${updateError.message}`,
        triggered_by: userId,
        duration_ms: durationMs,
      });
      
      return new Response(
        JSON.stringify({ error: "Faktura vytvořena ve Fakturoid, ale nepodařilo se uložit ID" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log successful integration call
    await supabaseAdmin.from('integration_log').insert({
      service: 'fakturoid',
      action: 'create_invoice',
      related_table: 'issued_invoices',
      related_record_id: invoiceId,
      request_payload: payload,
      response_status: response.status,
      response_payload: fakturoidInvoice,
      is_success: true,
      triggered_by: userId,
      duration_ms: durationMs,
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        fakturoid_id: fakturoidInvoice.id,
        fakturoid_url: fakturoidInvoiceUrl,
      }),
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
        action: 'create_invoice',
        related_table: 'issued_invoices',
        related_record_id: invoiceId,
        is_success: false,
        error_message: errorMessage,
        triggered_by: userId,
        duration_ms: durationMs,
      });
    } catch (logError) {
      console.error("Failed to log integration error:", logError);
    }
    
    console.error("Fakturoid create invoice error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
