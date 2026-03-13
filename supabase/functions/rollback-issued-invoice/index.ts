import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RollbackRequest {
  invoice_id: string;
  reason?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let userId: string | null = null;
  let invoiceId: string | null = null;

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
      if (!authError && user) {
        userId = user.id;
      } else {
        console.warn("Proceeding without validated user context in rollback-issued-invoice", authError);
      }
    }
    const body: RollbackRequest = await req.json();
    invoiceId = body.invoice_id;

    if (!invoiceId) {
      return new Response(
        JSON.stringify({ error: "Chybí invoice_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: deletedRows, error: deleteError } = await supabaseAdmin
      .from("issued_invoices")
      .delete()
      .eq("id", invoiceId)
      .select("id, invoice_number");

    if (deleteError) {
      return new Response(
        JSON.stringify({ error: `Rollback selhal: ${deleteError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!deletedRows || deletedRows.length === 0) {
      return new Response(
        JSON.stringify({ error: "Faktura pro rollback nebyla nalezena" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const durationMs = Date.now() - startTime;
    await supabaseAdmin.from("integration_log").insert({
      service: "invoicing",
      action: "rollback_issued_invoice",
      related_table: "issued_invoices",
      related_record_id: invoiceId,
      request_payload: body,
      response_payload: deletedRows[0],
      response_status: 200,
      is_success: true,
      triggered_by: userId,
      duration_ms: durationMs,
    });

    return new Response(
      JSON.stringify({ success: true, invoice_id: invoiceId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Interní chyba serveru";

    try {
      await supabaseAdmin.from("integration_log").insert({
        service: "invoicing",
        action: "rollback_issued_invoice",
        related_table: "issued_invoices",
        related_record_id: invoiceId,
        is_success: false,
        error_message: errorMessage,
        triggered_by: userId,
        duration_ms: durationMs,
      });
    } catch {
      // Keep original error response
    }

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
