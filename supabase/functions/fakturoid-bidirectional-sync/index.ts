import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import {
  getFakturoidAccessToken,
  getAccountSlug,
  getSubjectById,
  updateSubject,
  getCountryCode,
  COUNTRY_CODE_MAP,
  type FakturoidSubject,
} from "../_shared/fakturoid.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface SyncRequest {
  client_id: string;
  // If true, import fields from Fakturoid that are empty in CRM
  import_missing?: boolean;
}

interface SyncResult {
  success: boolean;
  action: 'no_changes' | 'crm_pushed' | 'imported' | 'both';
  fields_pushed_to_fakturoid?: string[];
  fields_imported_from_fakturoid?: string[];
  message: string;
}

// Reverse country code lookup
const CODE_TO_COUNTRY: Record<string, string> = {};
for (const [name, code] of Object.entries(COUNTRY_CODE_MAP)) {
  // Prefer Czech names
  if (name.includes('č') || name.includes('á') || name.includes('é')) {
    CODE_TO_COUNTRY[code] = name;
  } else if (!CODE_TO_COUNTRY[code]) {
    CODE_TO_COUNTRY[code] = name;
  }
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
    const { client_id, import_missing = false }: SyncRequest = await req.json();
    clientId = client_id;

    if (!client_id) {
      return new Response(
        JSON.stringify({ success: false, error: "Chybí client_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch client data from CRM
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

    // Get primary contact phone
    const { data: primaryContact } = await supabaseAdmin
      .from("client_contacts")
      .select("phone")
      .eq("client_id", client_id)
      .eq("is_primary", true)
      .single();

    const crmPhone = primaryContact?.phone || null;

    // Get Fakturoid credentials and fetch subject
    const accountSlug = getAccountSlug();
    const accessToken = await getFakturoidAccessToken();
    const fakturoidSubject = await getSubjectById(
      accessToken,
      accountSlug,
      client.fakturoid_subject_id
    );

    // Compare CRM data with Fakturoid data
    // CRM wins on conflicts - we push CRM data to Fakturoid if different
    // Note: phone is handled separately as it lives in client_contacts, not clients
    const crmToFakturoidMap: Record<string, { crmField: string; fakturoidField: keyof FakturoidSubject; crmValue: string | null; transform?: (v: string) => string; canImport: boolean }> = {
      name: { crmField: 'name', fakturoidField: 'name', crmValue: client.name, canImport: true },
      ico: { crmField: 'ico', fakturoidField: 'registration_no', crmValue: client.ico, canImport: true },
      dic: { crmField: 'dic', fakturoidField: 'vat_no', crmValue: client.dic, canImport: true },
      billing_street: { crmField: 'billing_street', fakturoidField: 'street', crmValue: client.billing_street, canImport: true },
      billing_city: { crmField: 'billing_city', fakturoidField: 'city', crmValue: client.billing_city, canImport: true },
      billing_zip: { crmField: 'billing_zip', fakturoidField: 'zip', crmValue: client.billing_zip, canImport: true },
      billing_country: { crmField: 'billing_country', fakturoidField: 'country', crmValue: client.billing_country, transform: getCountryCode, canImport: true },
      billing_email: { crmField: 'billing_email', fakturoidField: 'email', crmValue: client.billing_email, canImport: true },
      website: { crmField: 'website', fakturoidField: 'web', crmValue: client.website, canImport: true },
      // Phone lives in client_contacts, not clients - can push to Fakturoid but cannot import
      phone: { crmField: 'phone', fakturoidField: 'phone', crmValue: crmPhone, canImport: false },
    };

    const fieldsToPushToFakturoid: Record<string, unknown> = {};
    const fieldsToImportFromFakturoid: Record<string, string | null> = {};

    for (const [key, mapping] of Object.entries(crmToFakturoidMap)) {
      const crmValue = mapping.crmValue;
      const fakturoidValue = fakturoidSubject[mapping.fakturoidField] as string | undefined;

      // Transform CRM value if needed (e.g., country name to code)
      const crmValueForComparison = crmValue && mapping.transform
        ? mapping.transform(crmValue)
        : crmValue;

      if (crmValue && crmValue !== '') {
        // CRM has a value
        if (crmValueForComparison !== fakturoidValue) {
          // CRM value differs from Fakturoid - CRM WINS, push to Fakturoid
          fieldsToPushToFakturoid[mapping.fakturoidField] = crmValueForComparison;
        }
      } else if (fakturoidValue && fakturoidValue !== '' && import_missing && mapping.canImport) {
        // CRM is empty but Fakturoid has a value - import if requested and field can be imported
        // Convert country code back to name
        let valueToImport = fakturoidValue;
        if (key === 'billing_country' && CODE_TO_COUNTRY[fakturoidValue]) {
          valueToImport = CODE_TO_COUNTRY[fakturoidValue];
        }
        fieldsToImportFromFakturoid[mapping.crmField] = valueToImport;
      }
    }

    const result: SyncResult = {
      success: true,
      action: 'no_changes',
      message: 'Žádné změny k synchronizaci',
    };

    // Push CRM data to Fakturoid if there are differences
    if (Object.keys(fieldsToPushToFakturoid).length > 0) {
      await updateSubject(
        accessToken,
        accountSlug,
        client.fakturoid_subject_id,
        fieldsToPushToFakturoid
      );
      result.fields_pushed_to_fakturoid = Object.keys(fieldsToPushToFakturoid);
      result.action = 'crm_pushed';
      result.message = `Synchronizováno ${Object.keys(fieldsToPushToFakturoid).length} polí do Fakturoid`;
    }

    // Import from Fakturoid to CRM if requested and there are empty fields
    if (Object.keys(fieldsToImportFromFakturoid).length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from("clients")
        .update(fieldsToImportFromFakturoid)
        .eq("id", client_id);

      if (updateError) {
        console.error("Failed to import Fakturoid data:", updateError);
      } else {
        result.fields_imported_from_fakturoid = Object.keys(fieldsToImportFromFakturoid);
        result.action = result.action === 'crm_pushed' ? 'both' : 'imported';
        result.message = result.action === 'both'
          ? `Synchronizováno ${result.fields_pushed_to_fakturoid?.length || 0} polí do Fakturoid, importováno ${result.fields_imported_from_fakturoid.length} polí`
          : `Importováno ${result.fields_imported_from_fakturoid.length} polí z Fakturoid`;
      }
    }

    const durationMs = Date.now() - startTime;

    await supabaseAdmin.from("integration_log").insert({
      service: "fakturoid",
      action: "bidirectional_sync",
      related_table: "clients",
      related_record_id: clientId,
      request_payload: { import_missing },
      response_payload: result,
      response_status: 200,
      is_success: true,
      triggered_by: userId,
      duration_ms: durationMs,
    });

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Interní chyba serveru";

    try {
      await supabaseAdmin.from("integration_log").insert({
        service: "fakturoid",
        action: "bidirectional_sync",
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

    console.error("Fakturoid bidirectional sync error:", error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
