import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DIGISIGN_API_URL = "https://api.digisign.org/api";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Chybí autorizace" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { lead_id } = await req.json();
    if (!lead_id) {
      return new Response(
        JSON.stringify({ error: "Chybí lead_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: lead, error: leadError } = await supabaseAdmin
      .from("leads")
      .select("id, digisign_id, contract_signed_at, contract_url, converted_to_engagement_id, company_name")
      .eq("id", lead_id)
      .single();

    if (leadError || !lead) {
      return new Response(
        JSON.stringify({ error: "Lead nenalezen" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!lead.digisign_id) {
      return new Response(
        JSON.stringify({ error: "Lead nemá DigiSign ID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Authenticate with DigiSign
    const DIGISIGN_ACCESS_KEY = Deno.env.get("DIGISIGN_ACCESS_KEY");
    const DIGISIGN_SECRET_KEY = Deno.env.get("DIGISIGN_SECRET_KEY");

    if (!DIGISIGN_ACCESS_KEY || !DIGISIGN_SECRET_KEY) {
      return new Response(
        JSON.stringify({ error: "DigiSign není nakonfigurováno" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const authRes = await fetch(`${DIGISIGN_API_URL}/auth-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessKey: DIGISIGN_ACCESS_KEY, secretKey: DIGISIGN_SECRET_KEY }),
    });

    if (!authRes.ok) {
      return new Response(
        JSON.stringify({ error: "DigiSign autentizace selhala" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const authData = await authRes.json();
    const token = authData?.token || authData?.access_token;
    if (!token) {
      return new Response(
        JSON.stringify({ error: "DigiSign auth token chybí v odpovědi" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const headers = { Authorization: `Bearer ${token}` };

    // Fetch envelope status
    const envelopeRes = await fetch(`${DIGISIGN_API_URL}/envelopes/${lead.digisign_id}`, { headers });
    if (!envelopeRes.ok) {
      const errText = await envelopeRes.text();
      return new Response(
        JSON.stringify({ error: `DigiSign obálka nedostupná: ${envelopeRes.status}`, detail: errText }),
        { status: envelopeRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const envelope = await envelopeRes.json();
    const envelopeStatus = envelope.status; // "completed", "draft", "sent", "declined", "expired"
    const isCompleted = envelopeStatus === "completed";

    console.log(`Envelope ${lead.digisign_id} status: ${envelopeStatus}`);

    let signedDocumentUrl: string | null = null;
    const envelopeDetailUrl = `https://app.digisign.org/selfcare/envelopes/${lead.digisign_id}/detail`;

    if (isCompleted) {
      signedDocumentUrl = envelopeDetailUrl;

      // Try to get signed document download link
      try {
        const docsRes = await fetch(`${DIGISIGN_API_URL}/envelopes/${lead.digisign_id}/documents`, { headers });
        if (docsRes.ok) {
          const docsData = await docsRes.json();
          const items = docsData.items || docsData;
          if (Array.isArray(items) && items.length > 0 && items[0].id) {
            signedDocumentUrl = `${DIGISIGN_API_URL}/envelopes/${lead.digisign_id}/documents/${items[0].id}/download`;
          }
        }
      } catch (docErr) {
        console.error("Failed to get document download URL:", docErr);
      }

      // Update lead
      const now = new Date().toISOString();
      const leadUpdates: Record<string, unknown> = {
        signed_contract_url: signedDocumentUrl,
      };
      if (!lead.contract_signed_at) {
        leadUpdates.contract_signed_at = now;
      }

      await supabaseAdmin.from("leads").update(leadUpdates).eq("id", lead.id);

      // Propagate to engagement
      if (lead.converted_to_engagement_id) {
        const engUpdates: Record<string, unknown> = {
          signed_contract_url: signedDocumentUrl,
        };
        if (lead.contract_url) {
          engUpdates.contract_url = lead.contract_url;
        }
        await supabaseAdmin
          .from("engagements")
          .update(engUpdates)
          .eq("id", lead.converted_to_engagement_id);
        console.log(`Propagated to engagement ${lead.converted_to_engagement_id}`);
      }

      // Log
      await supabaseAdmin.from("integration_log").insert({
        service: "digisign",
        action: "manual_status_check",
        related_table: "leads",
        related_record_id: lead.id,
        request_payload: { envelope_id: lead.digisign_id, status: envelopeStatus },
        response_payload: { signed_contract_url: signedDocumentUrl, propagated_to_engagement: lead.converted_to_engagement_id },
        is_success: true,
      });
    }

    // Get recipients info for display
    let recipients: { name: string; email: string; signedAt: string | null }[] = [];
    try {
      const recipientsRes = await fetch(`${DIGISIGN_API_URL}/envelopes/${lead.digisign_id}/recipients`, { headers });
      if (recipientsRes.ok) {
        const recipientsData = await recipientsRes.json();
        const items = recipientsData.items || recipientsData;
        if (Array.isArray(items)) {
          recipients = items.map((r: any) => ({
            name: r.name || "",
            email: r.email || "",
            signedAt: r.signedAt || r.signed_at || null,
          }));
        }
      }
    } catch (_) { /* ignore */ }

    return new Response(
      JSON.stringify({
        success: true,
        envelope_status: envelopeStatus,
        is_completed: isCompleted,
        signed_contract_url: signedDocumentUrl,
        envelope_detail_url: envelopeDetailUrl,
        recipients,
        propagated_to_engagement: isCompleted ? lead.converted_to_engagement_id : null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("DigiSign check-status error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Interní chyba" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
