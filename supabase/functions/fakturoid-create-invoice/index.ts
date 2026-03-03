import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
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
  is_reverse_charge?: boolean;
  currency?: string;
}

interface FakturoidInvoiceItem {
  name: string;
  quantity: number;
  unit_name: string;
  unit_price: number;
  vat_rate: number;
}

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

function parseNumber(value: unknown, context: string, opts: { min?: number; allowZero?: boolean } = {}): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    throw new ValidationError(`Invalid numeric value for ${context}`);
  }
  if (opts.min !== undefined && parsed < opts.min) {
    throw new ValidationError(`Invalid numeric value for ${context}: must be >= ${opts.min}`);
  }
  if (opts.allowZero === false && parsed === 0) {
    throw new ValidationError(`Invalid numeric value for ${context}: must be > 0`);
  }
  return parsed;
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

    const invoiceCurrency = requireCurrency(invoice.currency, `invoice ${invoice_id}`);
    const lineItems = (invoice.invoice_line_items ?? []) as InvoiceLineItem[];

    const hasMixedCurrency = lineItems.some(
      (item) => requireCurrency(item.currency, `line item "${item.line_description}"`) !== invoiceCurrency
    );
    if (hasMixedCurrency) {
      const lineCurrencies = [...new Set(lineItems.map((i) => requireCurrency(i.currency, `line item "${i.line_description}"`)))];
      return new Response(
        JSON.stringify({
          error: `Nekonzistentní měny: faktura má měnu ${invoiceCurrency}, položky mají: ${lineCurrencies.join(", ")}. Sjednoťte měny před exportem do Fakturoid.`,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Fakturoid credentials
    const accountSlug = getAccountSlug();
    const accessToken = await getFakturoidAccessToken();

    // Check if account is VAT payer (plátce DPH)
    // Set FAKTUROID_VAT_PAYER=true if you become VAT registered
    const isVatPayer = Deno.env.get("FAKTUROID_VAT_PAYER") === "true";

    // Map line items to Fakturoid format
    const lines: FakturoidInvoiceItem[] = lineItems.map((item, index) => ({
      name: item.line_description,
      quantity: parseNumber(item.quantity, `line item ${index + 1} quantity`, { min: 0, allowZero: false }),
      unit_name: item.unit_name || 'ks',
      unit_price: parseNumber(item.unit_price, `line item ${index + 1} unit_price`, { min: 0 }),
      // Non-CZK = reverse charge (transferred_tax_liability) => vat 0
      // Non-VAT payer: always 0%, VAT payer: use reverse charge or line item rate
      vat_rate: invoiceCurrency !== 'CZK' ? 0 : (isVatPayer ? (item.is_reverse_charge ? 0 : parseNumber(item.vat_rate ?? 21, `line item ${index + 1} vat_rate`, { min: 0 })) : 0),
    }));

    // Non-CZK invoices must be issued with reverse charge (přenesená daňová odpovědnost)
    const useReverseCharge = invoiceCurrency !== 'CZK';

    // Note: We don't send issued_on or due dates - let Fakturoid use its server's current date
    // This avoids date validation issues when local system clock differs from Fakturoid's server
    // Fakturoid will use today's date for issued_on and calculate due based on account settings (default 14 days)
    const payload = {
      subject_id: client.fakturoid_subject_id,
      lines,
      currency: invoiceCurrency,
      transferred_tax_liability: useReverseCharge,
      // due_in: 14 means "due 14 days from issued_on" - Fakturoid will calculate actual date
      due_in: 14,
      note: `Faktura ${invoice.invoice_number}`,
    };

    // Create invoice in Fakturoid
    const fakturoidInvoice = await createInvoice(accessToken, accountSlug, payload);
    const durationMs = Date.now() - startTime;

    // Use the public URL (accessible without login) if available, otherwise fall back to admin URL
    const fakturoidInvoiceUrl = fakturoidInvoice.public_html_url
      || fakturoidInvoice.html_url
      || `https://app.fakturoid.cz/${accountSlug}/invoices/${fakturoidInvoice.id}`;

    const { error: updateError } = await supabaseAdmin
      .from("issued_invoices")
      .update({
        fakturoid_id: String(fakturoidInvoice.id),
        fakturoid_url: fakturoidInvoiceUrl,
      })
      .eq("id", invoice_id);

    if (updateError) {
      // Invoice was created in Fakturoid but DB update failed
      // Log detailed error for recovery and return Fakturoid IDs to user
      await supabaseAdmin.from('integration_log').insert({
        service: 'fakturoid',
        action: 'create_invoice_db_update_failed',
        related_table: 'issued_invoices',
        related_record_id: invoiceId,
        request_payload: { ...payload, currency_diagnostics: { invoice_currency: invoiceCurrency, line_count: lineItems.length } },
        response_payload: {
          fakturoid_invoice: fakturoidInvoice,
          db_error: updateError.message,
          recovery_info: {
            fakturoid_id: fakturoidInvoice.id,
            fakturoid_url: fakturoidInvoiceUrl,
            local_invoice_id: invoiceId,
          }
        },
        is_success: false,
        error_message: `ORPHAN RISK: Invoice created in Fakturoid (ID: ${fakturoidInvoice.id}) but DB update failed: ${updateError.message}`,
        triggered_by: userId,
        duration_ms: durationMs,
      });

      // Return partial success with Fakturoid IDs so user can manually link
      return new Response(
        JSON.stringify({
          partial_success: true,
          error: "Faktura byla vytvořena ve Fakturoid, ale nepodařilo se propojit s CRM. Prosím, propojte manuálně.",
          fakturoid_id: fakturoidInvoice.id,
          fakturoid_url: fakturoidInvoiceUrl,
          local_invoice_id: invoiceId,
          requires_manual_link: true,
        }),
        { status: 207, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
    const status = error instanceof ValidationError ? 400 : 500;
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
