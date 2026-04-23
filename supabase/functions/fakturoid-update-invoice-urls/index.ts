import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import {
  getFakturoidAccessToken,
  getAccountSlug,
  getInvoiceById,
} from "../_shared/fakturoid.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function syncInternalCronSecret(
  supabaseAdmin: ReturnType<typeof createClient>,
): Promise<void> {
  const internalCronSecret = Deno.env.get("INTERNAL_CRON_SECRET");
  if (!internalCronSecret) {
    throw new Error("Missing INTERNAL_CRON_SECRET");
  }

  const { error } = await supabaseAdmin
    .from("internal_function_secrets")
    .upsert(
      {
        name: "internal-cron",
        secret: internalCronSecret,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "name" },
    );

  if (error) {
    throw new Error(`Failed to sync internal cron secret: ${error.message}`);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    // This is an admin-only function, check for secret key
    const adminKey = req.headers.get("X-Admin-Key");
    const expectedKey = Deno.env.get("INTERNAL_CRON_SECRET");
    if (adminKey !== expectedKey) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await syncInternalCronSecret(supabaseAdmin);

    const body = await req.json().catch(() => ({})) as { invoice_ids?: string[] };
    const invoiceIds = Array.isArray(body.invoice_ids)
      ? body.invoice_ids.filter((id) => typeof id === "string" && id.trim().length > 0)
      : [];

    // Get linked invoices (optionally filtered by ids)
    let query = supabaseAdmin
      .from("issued_invoices")
      .select("id, invoice_number, fakturoid_id, fakturoid_url")
      .not("fakturoid_id", "is", null);

    if (invoiceIds.length > 0) {
      query = query.in("id", invoiceIds);
    }

    const { data: invoices, error: fetchError } = await query;

    if (fetchError) throw fetchError;

    const accountSlug = getAccountSlug();
    const accessToken = await getFakturoidAccessToken();

    const updates: Array<{
      id: string;
      old_invoice_number: string;
      new_invoice_number: string;
      old_url: string | null;
      new_url: string | null;
    }> = [];

    for (const invoice of invoices || []) {
      // Fetch invoice from Fakturoid to get public URL + canonical number
      const fakturoidInvoice = await getInvoiceById(
        accessToken,
        accountSlug,
        parseInt(invoice.fakturoid_id)
      );

      const fakturoidNumber = typeof fakturoidInvoice.number === "string" ? fakturoidInvoice.number.trim() : "";
      const nextPublicUrl = fakturoidInvoice.public_html_url ?? null;
      const nextInvoiceNumber = fakturoidNumber || invoice.invoice_number;
      const shouldUpdateUrl = !!nextPublicUrl && nextPublicUrl !== invoice.fakturoid_url;
      const shouldUpdateNumber = !!fakturoidNumber && fakturoidNumber !== invoice.invoice_number;

      if (!shouldUpdateUrl && !shouldUpdateNumber) {
        continue;
      }

      const { error: updateError } = await supabaseAdmin
        .from("issued_invoices")
        .update({
          ...(shouldUpdateUrl ? { fakturoid_url: nextPublicUrl } : {}),
          ...(shouldUpdateNumber ? { invoice_number: nextInvoiceNumber } : {}),
        })
        .eq("id", invoice.id);

      if (!updateError) {
        if (shouldUpdateNumber) {
          await supabaseAdmin
            .from("extra_works")
            .update({ invoice_number: nextInvoiceNumber })
            .eq("invoice_id", invoice.id);
        }
        updates.push({
          id: invoice.id,
          old_invoice_number: invoice.invoice_number,
          new_invoice_number: nextInvoiceNumber,
          old_url: invoice.fakturoid_url,
          new_url: nextPublicUrl,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        updated: updates.length,
        details: updates,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Internal error";
    console.error("Update invoice URLs error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
