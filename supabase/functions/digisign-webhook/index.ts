import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, signature",
};

const WEBHOOK_TIMESTAMP_TOLERANCE_MS = 5 * 60 * 1000; // 5 minutes

// DigiSign webhook payload format per API docs
interface DigiSignWebhookPayload {
  id: string;           // Webhook event ID
  event: string;        // e.g., "envelopeCompleted"
  name: string;         // e.g., "envelope.completed"
  time: string;         // ISO timestamp
  entityName: string;   // "envelope" or "recipient"
  entityId: string;     // The envelope/recipient ID
  data: {
    status?: string;
  };
}

// Verify HMAC-SHA256 signature with replay protection
// Header format: "Signature: t=<timestamp>,s=<signature>"
async function verifySignature(
  signatureHeader: string | null,
  body: string,
  secret: string
): Promise<{ valid: boolean; error?: string }> {
  if (!signatureHeader) {
    return { valid: false, error: "Missing signature header" };
  }

  try {
    // Parse the signature header
    const parts = signatureHeader.split(",");
    let timestamp = "";
    let signature = "";

    for (const part of parts) {
      const [key, value] = part.split("=");
      if (key === "t") {
        timestamp = value;
      } else if (key === "s") {
        signature = value;
      }
    }

    if (!timestamp || !signature) {
      return { valid: false, error: "Missing timestamp or signature in header" };
    }

    // Replay protection: reject old timestamps
    const timestampMs = parseInt(timestamp, 10) * 1000; // Assuming Unix seconds
    const now = Date.now();
    if (Math.abs(now - timestampMs) > WEBHOOK_TIMESTAMP_TOLERANCE_MS) {
      return { valid: false, error: `Timestamp too old or in future: ${timestamp}` };
    }

    // Create the payload to verify
    const payload = `${timestamp}.${body}`;

    // Compute expected signature using Web Crypto API
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(payload);

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (signature !== expectedSignature) {
      return { valid: false, error: "Signature mismatch" };
    }

    return { valid: true };
  } catch (error) {
    console.error("Signature verification error:", error);
    return { valid: false, error: `Verification error: ${error}` };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let leadId: string | null = null;
  let envelopeId: string | null = null;

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get the raw body for signature verification
    const rawBody = await req.text();

    // Verify webhook signature - REQUIRED for security
    const WEBHOOK_SECRET = Deno.env.get("DIGISIGN_WEBHOOK_SECRET");
    const signatureHeader = req.headers.get("Signature");

    if (!WEBHOOK_SECRET) {
      console.error("DIGISIGN_WEBHOOK_SECRET is not configured - webhook verification disabled is a security risk");
      return new Response(
        JSON.stringify({ error: "Webhook secret not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { valid, error } = await verifySignature(signatureHeader, rawBody, WEBHOOK_SECRET);
    if (!valid) {
      console.error("Invalid webhook signature:", error);
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse the payload
    const payload: DigiSignWebhookPayload = JSON.parse(rawBody);

    console.log(`Received webhook event: ${payload.event} for ${payload.entityName}: ${payload.entityId}`);

    // Only handle envelope events, ignore recipient-level events
    if (payload.entityName !== "envelope") {
      console.log(`Ignoring non-envelope event: ${payload.entityName}`);
      return new Response(
        JSON.stringify({ success: true, message: "Non-envelope event ignored" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    envelopeId = payload.entityId;

    // Handle different event types
    // DigiSign uses: envelopeCompleted, envelopeDeclined, envelopeExpired, envelopeViewed
    const handledEvents = ["envelopeCompleted", "envelopeDeclined", "envelopeExpired"];

    if (!handledEvents.includes(payload.event)) {
      console.log(`Ignoring event: ${payload.event}`);
      return new Response(
        JSON.stringify({ success: true, message: "Event ignored" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!envelopeId) {
      return new Response(
        JSON.stringify({ error: "Missing envelope ID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find lead by digisign_id
    const { data: lead, error: findError } = await supabaseAdmin
      .from("leads")
      .select("id, contract_signed_at, digisign_id, company_name")
      .eq("digisign_id", envelopeId)
      .single();

    if (findError || !lead) {
      const durationMs = Date.now() - startTime;
      console.error("Lead not found for envelope:", envelopeId, findError);

      // Log webhook error
      await supabaseAdmin.from("integration_log").insert({
        service: "digisign",
        action: "webhook_received",
        related_table: "leads",
        request_payload: payload,
        is_success: false,
        error_message: `Lead not found for envelope: ${envelopeId}`,
        duration_ms: durationMs,
      });

      return new Response(
        JSON.stringify({ error: "Lead nenalezen" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    leadId = lead.id;

    // Prepare updates based on event type
    const updates: Record<string, unknown> = {};

    switch (payload.event) {
      case "envelopeCompleted":
        // All signers have signed
        updates.contract_signed_at = new Date().toISOString();
        console.log(`Envelope ${envelopeId} completed - contract signed`);
        break;

      case "envelopeDeclined":
        // A signer declined to sign
        console.log(`Envelope ${envelopeId} declined`);
        break;

      case "envelopeExpired":
        // Envelope expired before all signatures
        console.log(`Envelope ${envelopeId} expired`);
        break;
    }

    // Apply updates
    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from("leads")
        .update(updates)
        .eq("id", lead.id);

      if (updateError) {
        const durationMs = Date.now() - startTime;
        console.error("Update error:", updateError);

        // Log update error
        await supabaseAdmin.from("integration_log").insert({
          service: "digisign",
          action: "webhook_received",
          related_table: "leads",
          related_record_id: leadId,
          request_payload: payload,
          is_success: false,
          error_message: `Update failed: ${updateError.message}`,
          duration_ms: durationMs,
        });

        return new Response(
          JSON.stringify({ error: "Nepodařilo se aktualizovat smlouvu" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Notify admins on contract signed
    if (payload.event === "envelopeCompleted") {
      try {
        const { data: adminUsers } = await supabaseAdmin
          .from("user_roles")
          .select("user_id")
          .in("role", ["admin", "management"])
          .eq("is_active", true);

        if (adminUsers && adminUsers.length > 0) {
          const companyName = (lead as Record<string, unknown>).company_name || "Neznámý";
          await supabaseAdmin.from("notifications").insert(
            adminUsers.map((u: { user_id: string }) => ({
              user_id: u.user_id,
              type: "contract_signed",
              title: "Smlouva podepsána!",
              message: `Smlouva podepsána pro: "${companyName}"`,
              link: `/leads?openLead=${lead.id}`, 
              metadata: { lead_id: lead.id, company_name: companyName },
            }))
          );
        }
      } catch (notifError) {
        console.error("Failed to create notifications:", notifError);
      }
    }

    const durationMs = Date.now() - startTime;

    // Log successful webhook
    await supabaseAdmin.from("integration_log").insert({
      service: "digisign",
      action: "webhook_received",
      related_table: "leads",
      related_record_id: leadId,
      request_payload: payload,
      response_status: 200,
      is_success: true,
      duration_ms: durationMs,
    });

    return new Response(
      JSON.stringify({ success: true, event: payload.event }),
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
      await supabaseAdmin.from("integration_log").insert({
        service: "digisign",
        action: "webhook_received",
        related_table: "leads",
        related_record_id: leadId,
        request_payload: { envelope_id: envelopeId },
        is_success: false,
        error_message: errorMessage,
        duration_ms: durationMs,
      });
    } catch (logError) {
      console.error("Failed to log integration error:", logError);
    }

    console.error("DigiSign webhook error:", error);
    return new Response(
      JSON.stringify({ error: "Interní chyba serveru" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
