import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import {
  getFakturoidAccessToken,
  getAccountSlug,
  searchSubjectByIco,
  createSubject,
  getCountryCode,
  type FakturoidSubject,
} from "../_shared/fakturoid.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface CreateSubjectRequest {
  // Mode 1: Pass client_id to look up data from DB (existing flow)
  client_id?: string;
  // Mode 2: Pass lead data directly (for lead conversion, before client exists)
  ico?: string;
  name?: string;
  dic?: string;
  street?: string;
  city?: string;
  zip?: string;
  country?: string;
  email?: string;
  phone?: string;
  website?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const startTime = Date.now();
  let clientId: string | null = null;
  let userId: string | null = null;
  let isDirectMode = false;

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    // Authenticate user (optional - for logging purposes)
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      if (user) {
        userId = user.id;
      }
    }

    // Parse request - supports two modes:
    // Mode 1: client_id provided - look up client data from DB
    // Mode 2: Direct data (ico, name, etc.) - use for lead conversion before client exists
    const requestData: CreateSubjectRequest = await req.json();
    const { client_id } = requestData;
    clientId = client_id || null;

    // Determine mode and get subject data
    let subjectName: string;
    let subjectIco: string | undefined;
    let subjectDic: string | undefined;
    let subjectStreet: string | undefined;
    let subjectCity: string | undefined;
    let subjectZip: string | undefined;
    let subjectCountry: string | undefined;
    let subjectEmail: string | undefined;
    let subjectPhone: string | undefined;
    let subjectWebsite: string | undefined;

    if (client_id) {
      // MODE 1: Fetch client data from DB
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

      // Check if already has Fakturoid ID
      if (client.fakturoid_subject_id) {
        return new Response(
          JSON.stringify({
            success: true,
            fakturoid_subject_id: client.fakturoid_subject_id,
            message: "Klient již má Fakturoid ID",
            existing: true,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      subjectName = client.name;
      subjectIco = client.ico;
      subjectDic = client.dic;
      subjectStreet = client.billing_street;
      subjectCity = client.billing_city;
      subjectZip = client.billing_zip;
      subjectCountry = client.billing_country;
      subjectEmail = client.billing_email;
      subjectWebsite = client.website;

      // Determine phone: request body > primary contact lookup
      subjectPhone = requestData.phone;
      if (!subjectPhone) {
        const { data: primaryContact } = await supabaseAdmin
          .from("client_contacts")
          .select("phone")
          .eq("client_id", client_id)
          .eq("is_primary", true)
          .single();
        if (primaryContact?.phone) {
          subjectPhone = primaryContact.phone;
        }
      }
    } else if (requestData.name && requestData.ico) {
      // MODE 2: Direct data from lead conversion
      isDirectMode = true;
      subjectName = requestData.name;
      subjectIco = requestData.ico;
      subjectDic = requestData.dic;
      subjectStreet = requestData.street;
      subjectCity = requestData.city;
      subjectZip = requestData.zip;
      subjectCountry = requestData.country;
      subjectEmail = requestData.email;
      subjectPhone = requestData.phone;
      subjectWebsite = requestData.website;
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Chybí povinné údaje: client_id nebo (name + ico)",
          details: "Použijte client_id pro existujícího klienta, nebo name + ico pro přímá data z leadu"
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Fakturoid credentials
    const accountSlug = getAccountSlug();
    const accessToken = await getFakturoidAccessToken();

    // Search for existing subject by IČO (avoid duplicates in Fakturoid)
    let fakturoidSubject: FakturoidSubject | null = null;

    if (subjectIco) {
      fakturoidSubject = await searchSubjectByIco(accessToken, accountSlug, subjectIco);
    }

    if (fakturoidSubject) {
      // Found existing subject in Fakturoid
      if (client_id) {
        // Link it to the client in DB - only if not already set (race condition protection)
        const { data: updatedClient, error: updateError } = await supabaseAdmin
          .from("clients")
          .update({ fakturoid_subject_id: fakturoidSubject.id })
          .eq("id", client_id)
          .is("fakturoid_subject_id", null)
          .select("fakturoid_subject_id")
          .single();

        if (updateError && updateError.code !== 'PGRST116') {
          // PGRST116 = no rows returned (another request already set the ID)
          throw new Error(`Failed to update client: ${updateError.message}`);
        }

        // If update didn't apply, another request already set the ID - that's fine
        if (!updatedClient) {
          console.log(`Client ${client_id} was already linked by another request`);
        }
      }

      const durationMs = Date.now() - startTime;

      await supabaseAdmin.from("integration_log").insert({
        service: "fakturoid",
        action: "link_existing_subject",
        related_table: isDirectMode ? "leads" : "clients",
        related_record_id: clientId,
        response_payload: { subject_id: fakturoidSubject.id, name: fakturoidSubject.name },
        is_success: true,
        triggered_by: userId,
        duration_ms: durationMs,
      });

      return new Response(
        JSON.stringify({
          success: true,
          fakturoid_subject_id: fakturoidSubject.id,
          message: "Nalezen existující kontakt ve Fakturoid",
          existing: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use advisory lock to prevent race condition before creating subject in Fakturoid
    // This prevents creating orphan subjects if multiple requests come in simultaneously
    if (client_id) {
      // Acquire advisory lock for this client
      const { error: lockError } = await supabaseAdmin.rpc('acquire_client_lock', { p_client_id: client_id });
      if (lockError) {
        console.error("Failed to acquire advisory lock:", lockError);
        // Continue anyway - we still have the .is() check as fallback
      }

      // Re-check if client already has Fakturoid ID (double-check pattern)
      const { data: clientRecheck } = await supabaseAdmin
        .from("clients")
        .select("fakturoid_subject_id")
        .eq("id", client_id)
        .single();

      if (clientRecheck?.fakturoid_subject_id) {
        const durationMs = Date.now() - startTime;
        await supabaseAdmin.from("integration_log").insert({
          service: "fakturoid",
          action: "create_subject_skipped",
          related_table: "clients",
          related_record_id: clientId,
          response_payload: { reason: "already_linked", fakturoid_subject_id: clientRecheck.fakturoid_subject_id },
          is_success: true,
          triggered_by: userId,
          duration_ms: durationMs,
        });

        return new Response(
          JSON.stringify({
            success: true,
            fakturoid_subject_id: clientRecheck.fakturoid_subject_id,
            message: "Klient již má Fakturoid ID (nastaveno jiným požadavkem)",
            existing: true,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Build subject data for Fakturoid API
    const subjectData: Record<string, unknown> = {
      name: subjectName,
      type: "customer",
    };

    // Only set custom_id if we have a client_id (not for direct mode)
    if (client_id) {
      subjectData.custom_id = client_id;
    }

    if (subjectIco) subjectData.registration_no = subjectIco;
    if (subjectDic) subjectData.vat_no = subjectDic;
    if (subjectStreet) subjectData.street = subjectStreet;
    if (subjectCity) subjectData.city = subjectCity;
    if (subjectZip) subjectData.zip = subjectZip;
    if (subjectCountry) subjectData.country = getCountryCode(subjectCountry);
    if (subjectEmail) subjectData.email = subjectEmail;
    if (subjectWebsite) subjectData.web = subjectWebsite;
    if (subjectPhone) subjectData.phone = subjectPhone;

    // Create new subject in Fakturoid
    fakturoidSubject = await createSubject(accessToken, accountSlug, subjectData);

    // Update client with Fakturoid ID using atomic RPC function
    if (client_id) {
      const { data: setResult, error: setError } = await supabaseAdmin.rpc('try_set_fakturoid_subject_id', {
        p_client_id: client_id,
        p_fakturoid_subject_id: fakturoidSubject.id
      });

      if (setError) {
        console.error("Failed to set Fakturoid subject ID:", setError);
        // Don't throw - the subject was created in Fakturoid, we should return success
        // but log this as an issue
        await supabaseAdmin.from("integration_log").insert({
          service: "fakturoid",
          action: "set_subject_id_failed",
          related_table: "clients",
          related_record_id: clientId,
          error_message: setError.message,
          response_payload: { fakturoid_subject_id: fakturoidSubject.id },
          is_success: false,
          triggered_by: userId,
          duration_ms: Date.now() - startTime,
        });
      } else if (setResult && !setResult[0]?.success) {
        // Another request won the race - log but don't fail
        console.log(`Client ${client_id} was already linked by another request to ${setResult[0]?.existing_subject_id}`);
      }
    }

    const durationMs = Date.now() - startTime;

    await supabaseAdmin.from("integration_log").insert({
      service: "fakturoid",
      action: "create_subject",
      related_table: isDirectMode ? "leads" : "clients",
      related_record_id: clientId,
      request_payload: subjectData,
      response_payload: fakturoidSubject,
      response_status: 201,
      is_success: true,
      triggered_by: userId,
      duration_ms: durationMs,
    });

    return new Response(
      JSON.stringify({
        success: true,
        fakturoid_subject_id: fakturoidSubject.id,
        message: "Kontakt vytvořen ve Fakturoid",
        existing: false,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Interní chyba serveru";

    try {
      await supabaseAdmin.from("integration_log").insert({
        service: "fakturoid",
        action: "create_subject",
        related_table: isDirectMode ? "leads" : "clients",
        related_record_id: clientId,
        is_success: false,
        error_message: errorMessage,
        triggered_by: userId,
        duration_ms: durationMs,
      });
    } catch (logError) {
      console.error("Failed to log integration error:", logError);
    }

    console.error("Fakturoid create subject error:", error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
