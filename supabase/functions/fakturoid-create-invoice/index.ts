import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  getFakturoidAccessToken,
  getAccountSlug,
  createInvoice,
} from "../_shared/fakturoid.ts";

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
  vat_rate?: number;
  unit_name?: string;
}

interface FakturoidInvoiceItem {
  name: string;
  quantity: number;
  unit_name: string;
  unit_price: number;
  vat_rate: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let invoiceId: string | null = null;
  let userId: string | null = null;

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
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

    // Fetch client to get Fakturoid subject_id
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
    const accountSlug = getAccountSlug();
    const accessToken = await getFakturoidAccessToken();

    // Map line items to Fakturoid format
    const lines: FakturoidInvoiceItem[] = (invoice.invoice_line_items as InvoiceLineItem[]).map((item) => ({
      name: item.line_description,
      quantity: Number(item.quantity),
      unit_name: item.unit_name || 'ks',
      unit_price: Number(item.unit_price),
      vat_rate: item.vat_rate ?? 21,
    }));

    // Prepare invoice payload
    const issueDate = new Date(invoice.issued_at).toISOString().split('T')[0];
    const dueDate = new Date(invoice.issued_at);
    dueDate.setDate(dueDate.getDate() + 14);

    const payload = {
      subject_id: client.fakturoid_subject_id,
      lines,
      due: dueDate.toISOString().split('T')[0],
      issued_on: issueDate,
      note: `Faktura ${invoice.invoice_number}`,
    };

    // Create invoice in Fakturoid
    const fakturoidInvoice = await createInvoice(accessToken, accountSlug, payload);
    const durationMs = Date.now() - startTime;

    // Update invoice with Fakturoid IDs
    const fakturoidInvoiceUrl = fakturoidInvoice.html_url || `https://app.fakturoid.cz/accounts/${accountSlug}/invoices/${fakturoidInvoice.id}`;

    const { error: updateError } = await supabaseAdmin
      .from("issued_invoices")
      .update({
        fakturoid_id: String(fakturoidInvoice.id),
        fakturoid_url: fakturoidInvoiceUrl,
      })
      .eq("id", invoice_id);

    if (updateError) {
      await supabaseAdmin.from('integration_log').insert({
        service: 'fakturoid',
        action: 'create_invoice',
        related_table: 'issued_invoices',
        related_record_id: invoiceId,
        request_payload: payload,
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

    await supabaseAdmin.from('integration_log').insert({
      service: 'fakturoid',
      action: 'create_invoice',
      related_table: 'issued_invoices',
      related_record_id: invoiceId,
      request_payload: payload,
      response_payload: fakturoidInvoice,
      response_status: 201,
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

    try {
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
