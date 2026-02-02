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
    const expectedKey = Deno.env.get("ADMIN_SECRET") || "update-urls-secret-2026";
    if (adminKey !== expectedKey) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get all invoices that have fakturoid_id but URL doesn't contain /p/ (not public)
    const { data: invoices, error: fetchError } = await supabaseAdmin
      .from("issued_invoices")
      .select("id, invoice_number, fakturoid_id, fakturoid_url")
      .not("fakturoid_id", "is", null);

    if (fetchError) throw fetchError;

    const accountSlug = getAccountSlug();
    const accessToken = await getFakturoidAccessToken();

    const updates: Array<{ invoice_number: string; old_url: string; new_url: string }> = [];

    for (const invoice of invoices || []) {
      // Skip if already has public URL
      if (invoice.fakturoid_url?.includes("/p/")) {
        continue;
      }

      // Fetch invoice from Fakturoid to get public URL
      const fakturoidInvoice = await getInvoiceById(
        accessToken,
        accountSlug,
        parseInt(invoice.fakturoid_id)
      );

      if (fakturoidInvoice.public_html_url) {
        // Update the URL in database
        const { error: updateError } = await supabaseAdmin
          .from("issued_invoices")
          .update({ fakturoid_url: fakturoidInvoice.public_html_url })
          .eq("id", invoice.id);

        if (!updateError) {
          updates.push({
            invoice_number: invoice.invoice_number,
            old_url: invoice.fakturoid_url,
            new_url: fakturoidInvoice.public_html_url,
          });
        }
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
