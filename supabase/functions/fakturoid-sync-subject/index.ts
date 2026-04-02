import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import {
  getFakturoidAccessToken,
  getAccountSlug,
  updateSubject,
  getCountryCode,
  type FakturoidSubject,
} from "../_shared/fakturoid.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface SyncSubjectRequest {
  client_id: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const startTime = Date.now();
  let clientId: string | null = null;
  let userId: string | null = null;

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Chybí autorizace" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Neplatná autorizace" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    userId = user.id;

    // Parse request
    const { client_id }: SyncSubjectRequest = await req.json();
    clientId = client_id;

    if (!client_id) {
      return new Response(
        JSON.stringify({ success: false, error: "Chybí client_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch client data
    const { data: client, error: clientError } = await supabaseAdmin
      .from("clients")
      .select("*")
      .eq("id", client_id)
      .single();

    if (clientError || !client) {
      return new Response(
        JSON.stringify({ success: false, error: "Klient nenalezen" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if client has Fakturoid ID
    if (!client.fakturoid_subject_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Klient nemá propojený Fakturoid kontakt",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Fakturoid credentials
    const accountSlug = getAccountSlug();
    const accessToken = await getFakturoidAccessToken();

    // Build subject data from client billing fields
    const subjectData: Record<string, unknown> = {
      name: client.name,
    };

    if (client.ico) subjectData.registration_no = client.ico;
    if (client.dic) subjectData.vat_no = client.dic;
    if (client.billing_street) subjectData.street = client.billing_street;
    if (client.billing_city) subjectData.city = client.billing_city;
    if (client.billing_zip) subjectData.zip = client.billing_zip;
    if (client.billing_country) subjectData.country = getCountryCode(client.billing_country);
    if (client.billing_email) subjectData.email = client.billing_email;
    if (client.website) subjectData.web = client.website;

    // Try to get phone from primary contact
    const { data: primaryContact } = await supabaseAdmin
      .from("client_contacts")
      .select("phone")
      .eq("client_id", client_id)
      .eq("is_primary", true)
      .single();

    if (primaryContact?.phone) {
      subjectData.phone = primaryContact.phone;
    }

    // Update subject in Fakturoid
    const fakturoidSubject = await updateSubject(
      accessToken,
      accountSlug,
      client.fakturoid_subject_id,
      subjectData
    );

    const durationMs = Date.now() - startTime;

    await supabaseAdmin.from("integration_log").insert({
      service: "fakturoid",
      action: "sync_subject",
      related_table: "clients",
      related_record_id: clientId,
      request_payload: subjectData,
      response_payload: fakturoidSubject,
      response_status: 200,
      is_success: true,
      triggered_by: userId,
      duration_ms: durationMs,
    });

    return new Response(
      JSON.stringify({
        success: true,
        fakturoid_subject_id: fakturoidSubject.id,
        message: "Kontakt byl synchronizován ve Fakturoid",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Interní chyba serveru";

    try {
      await supabaseAdmin.from("integration_log").insert({
        service: "fakturoid",
        action: "sync_subject",
        related_table: "clients",
        related_record_id: clientId,
        is_success: false,
        error_message: errorMessage,
        triggered_by: userId,
        duration_ms: durationMs,
      });
    } catch (logError) {
      console.error("Failed to log integration error:", logError);
    }

    console.error("Fakturoid sync subject error:", error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
