import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.9.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, signature",
};

const DIGISIGN_API_URL = "https://api.digisign.org/api";

const WEBHOOK_TIMESTAMP_TOLERANCE_MS = 5 * 60 * 1000; // 5 minutes
const SIGNED_CONTRACT_NOTIFY_TO = [
  "danny@socials.cz",
  "dana.bauerova@socials.cz",
  "otas@socials.cz",
  "david.hala@socials.cz",
];

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

function escapeHtml(value: string | null | undefined): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function sendContractSignedSummaryEmail(params: {
  leadId: string;
  companyName: string | null;
  envelopeId: string;
  signedAtIso: string;
  leadDetailUrl: string;
  signedContractUrl: string | null;
  draftUrl: string | null;
}): Promise<void> {
  const SMTP_USER = Deno.env.get("SMTP_USER");
  const SMTP_PASS = Deno.env.get("SMTP_PASS");
  if (!SMTP_USER || !SMTP_PASS) {
    throw new Error("Missing SMTP credentials for signed contract notification");
  }

  const signedAtLabel = new Date(params.signedAtIso).toLocaleString("cs-CZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:24px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#fff;border:1px solid #e4e4e7;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="padding:18px 22px;background:#065f46;color:#fff;">
              <div style="font-size:18px;font-weight:700;">✅ Smlouva byla podepsána</div>
              <div style="font-size:13px;opacity:0.95;margin-top:4px;">DigiSign potvrdil podpis smlouvy a CRM bylo aktualizováno.</div>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 22px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;color:#111827;">
                <tr><td style="padding:6px 0;color:#71717a;width:180px;">Firma</td><td style="padding:6px 0;font-weight:600;">${escapeHtml(params.companyName || "Neznámá firma")}</td></tr>
                <tr><td style="padding:6px 0;color:#71717a;">Lead ID</td><td style="padding:6px 0;">${escapeHtml(params.leadId)}</td></tr>
                <tr><td style="padding:6px 0;color:#71717a;">DigiSign obálka</td><td style="padding:6px 0;">${escapeHtml(params.envelopeId)}</td></tr>
                <tr><td style="padding:6px 0;color:#71717a;">Podepsáno</td><td style="padding:6px 0;">${escapeHtml(signedAtLabel)}</td></tr>
              </table>
              <div style="margin-top:18px;display:flex;gap:10px;flex-wrap:wrap;">
                <a href="${escapeHtml(params.leadDetailUrl)}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:10px 14px;border-radius:8px;font-size:13px;font-weight:600;">
                  Otevřít detail leadu v CRM
                </a>
                ${
                  params.signedContractUrl
                    ? `<a href="${escapeHtml(params.signedContractUrl)}" style="display:inline-block;background:#e5e7eb;color:#111827;text-decoration:none;padding:10px 14px;border-radius:8px;font-size:13px;font-weight:600;">Otevřít podepsanou smlouvu</a>`
                    : ""
                }
                ${
                  params.draftUrl
                    ? `<a href="${escapeHtml(params.draftUrl)}" style="display:inline-block;background:#f3f4f6;color:#111827;text-decoration:none;padding:10px 14px;border-radius:8px;font-size:13px;font-weight:600;">Otevřít DigiSign draft</a>`
                    : ""
                }
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: `Socials CRM <${SMTP_USER}>`,
    to: SIGNED_CONTRACT_NOTIFY_TO.join(", "),
    subject: `Podepsaná smlouva: ${params.companyName || "Neznámá firma"}`,
    html,
  });
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
    // DIGISIGN_WEBHOOK_SECRET may contain multiple comma-separated secrets
    // (one per registered event) — we try each until one validates.
    const WEBHOOK_SECRETS_RAW = Deno.env.get("DIGISIGN_WEBHOOK_SECRET");
    const signatureHeader = req.headers.get("Signature");

    if (!WEBHOOK_SECRETS_RAW) {
      console.error("DIGISIGN_WEBHOOK_SECRET is not configured");
      return new Response(
        JSON.stringify({ error: "Webhook secret not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const secrets = WEBHOOK_SECRETS_RAW.split(",").map(s => s.trim()).filter(Boolean);
    let signatureValid = false;
    let lastError = "";
    for (const secret of secrets) {
      const result = await verifySignature(signatureHeader, rawBody, secret);
      if (result.valid) {
        signatureValid = true;
        break;
      }
      lastError = result.error || "";
    }

    if (!signatureValid) {
      console.error("Invalid webhook signature (tried", secrets.length, "secrets):", lastError);
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
      .select("id, contract_signed_at, digisign_id, company_name, contract_url, converted_to_engagement_id")
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
    let signedDocumentUrl: string | null = null;

    switch (payload.event) {
      case "envelopeCompleted": {
        const signedAt = new Date().toISOString();
        updates.contract_signed_at = signedAt;
        console.log(`Envelope ${envelopeId} completed - contract signed`);

        // Build the DigiSign selfcare link as base signed contract URL
        const envelopeDetailUrl = `https://app.digisign.org/selfcare/envelopes/${envelopeId}/detail`;
        signedDocumentUrl = envelopeDetailUrl;

        // Try to get a direct signed PDF download URL from DigiSign API
        try {
          const DIGISIGN_ACCESS_KEY = Deno.env.get("DIGISIGN_ACCESS_KEY");
          const DIGISIGN_SECRET_KEY = Deno.env.get("DIGISIGN_SECRET_KEY");

          if (DIGISIGN_ACCESS_KEY && DIGISIGN_SECRET_KEY) {
            const authRes = await fetch(`${DIGISIGN_API_URL}/auth-token`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ accessKey: DIGISIGN_ACCESS_KEY, secretKey: DIGISIGN_SECRET_KEY }),
            });

            if (authRes.ok) {
              const authData = await authRes.json();
              const token = authData.token;

              // Fetch envelope documents to get signed PDF
              const docsRes = await fetch(`${DIGISIGN_API_URL}/envelopes/${envelopeId}/documents`, {
                headers: { Authorization: `Bearer ${token}` },
              });

              if (docsRes.ok) {
                const docsData = await docsRes.json();
                const items = docsData.items || docsData;
                if (Array.isArray(items) && items.length > 0) {
                  const doc = items[0];
                  const docId = doc.id;
                  if (docId) {
                    signedDocumentUrl = `${DIGISIGN_API_URL}/envelopes/${envelopeId}/documents/${docId}/download`;
                    console.log(`Signed document download URL: ${signedDocumentUrl}`);
                  }
                }
              }
            }
          }
        } catch (docError) {
          console.error("Failed to fetch signed document URL (using fallback):", docError);
        }

        updates.signed_contract_url = signedDocumentUrl;
        break;
      }

      case "envelopeDeclined":
        console.log(`Envelope ${envelopeId} declined`);
        break;

      case "envelopeExpired":
        console.log(`Envelope ${envelopeId} expired`);
        break;
    }

    // Apply updates to lead
    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from("leads")
        .update(updates)
        .eq("id", lead.id);

      if (updateError) {
        const durationMs = Date.now() - startTime;
        console.error("Update error:", updateError);

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

    // Propagate signed contract URL to engagement (if lead already converted)
    if (payload.event === "envelopeCompleted" && lead.converted_to_engagement_id) {
      try {
        const engagementUpdates: Record<string, unknown> = {};
        if (signedDocumentUrl) {
          engagementUpdates.signed_contract_url = signedDocumentUrl;
        }
        if (lead.contract_url) {
          engagementUpdates.contract_url = lead.contract_url;
        }
        if (Object.keys(engagementUpdates).length > 0) {
          await supabaseAdmin
            .from("engagements")
            .update(engagementUpdates)
            .eq("id", lead.converted_to_engagement_id);
          console.log(`Propagated signed contract URL to engagement ${lead.converted_to_engagement_id}`);
        }
      } catch (engError) {
        console.error("Failed to propagate to engagement:", engError);
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
              metadata: {
                lead_id: lead.id,
                company_name: companyName,
                signed_contract_url: signedDocumentUrl,
              },
            }))
          );
        }
      } catch (notifError) {
        console.error("Failed to create notifications:", notifError);
      }

      try {
        const appUrl = (Deno.env.get("APP_URL") || "https://crm.socials.cz").replace(/\/+$/, "");
        const leadDetailUrl = `${appUrl}/leads?openLead=${lead.id}`;
        await sendContractSignedSummaryEmail({
          leadId: lead.id,
          companyName: lead.company_name || null,
          envelopeId,
          signedAtIso: (updates.contract_signed_at as string) || new Date().toISOString(),
          leadDetailUrl,
          signedContractUrl: signedDocumentUrl,
          draftUrl: lead.contract_url || null,
        });
        await supabaseAdmin.from("integration_log").insert({
          service: "digisign",
          action: "notify_contract_signed_summary_email",
          related_table: "leads",
          related_record_id: lead.id,
          request_payload: {
            lead_id: lead.id,
            envelope_id: envelopeId,
            recipients: SIGNED_CONTRACT_NOTIFY_TO,
          },
          is_success: true,
        });
      } catch (mailError) {
        console.error("Failed to send signed contract summary email:", mailError);
        await supabaseAdmin.from("integration_log").insert({
          service: "digisign",
          action: "notify_contract_signed_summary_email",
          related_table: "leads",
          related_record_id: lead.id,
          request_payload: {
            lead_id: lead.id,
            envelope_id: envelopeId,
            recipients: SIGNED_CONTRACT_NOTIFY_TO,
          },
          is_success: false,
          error_message: mailError instanceof Error ? mailError.message : "unknown email error",
        });
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
