import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface BroadcastRecipient {
  email: string;
  contact_name?: string | null;
  company?: string | null;
}

interface SendBroadcastPayload {
  subject: string;
  body: string;
  recipients: BroadcastRecipient[];
  cc_emails?: string[];
  bcc_emails?: string[];
  broadcast_id: string;
}

const DEFAULT_BCC = "danny@socials.cz";
const MAX_BROADCAST_RECIPIENTS = 250;

function normalizeEmailList(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return values
    .filter((value) => typeof value === "string")
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value.length > 0);
}

function response(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function encodeBase64Utf8(value: string): string {
  const bytes = new TextEncoder().encode(value);
  const chunkSize = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function encodeSubject(subject: string): string {
  return `=?UTF-8?B?${encodeBase64Utf8(subject)}?=`;
}

function toBase64Url(value: string): string {
  return encodeBase64Utf8(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function refreshGoogleToken(
  supabaseAdmin: ReturnType<typeof createClient>,
  userId: string,
  refreshToken: string,
): Promise<{ accessToken: string; expiresAtIso: string }> {
  const googleClientId = Deno.env.get("GOOGLE_CLIENT_ID");
  const googleClientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
  if (!googleClientId || !googleClientSecret) {
    throw new Error("Google OAuth is not configured on the project");
  }

  const refreshResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: googleClientId,
      client_secret: googleClientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!refreshResponse.ok) {
    const errorText = await refreshResponse.text();
    throw new Error(`Google token refresh failed: ${errorText}`);
  }

  const refreshData = await refreshResponse.json();
  if (!refreshData.access_token) {
    throw new Error("Google token refresh response missing access_token");
  }

  const expiresAtIso = new Date(Date.now() + ((refreshData.expires_in ?? 3600) * 1000)).toISOString();
  const { error: updateError } = await supabaseAdmin
    .from("calendar_tokens")
    .update({
      access_token: refreshData.access_token,
      expires_at: expiresAtIso,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (updateError) {
    throw new Error(`Failed to persist refreshed Google token: ${updateError.message}`);
  }

  return { accessToken: refreshData.access_token as string, expiresAtIso };
}

async function sendGmailMessageWithRetry(
  accessToken: string,
  rawMessage: string,
): Promise<Response> {
  const maxAttempts = 4;
  let attempt = 0;
  let lastResponse: Response | null = null;

  while (attempt < maxAttempts) {
    attempt += 1;
    const gmailResponse = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw: rawMessage }),
    });

    if (gmailResponse.ok) return gmailResponse;

    const shouldRetry = gmailResponse.status === 429 || gmailResponse.status === 500 || gmailResponse.status === 503;
    if (!shouldRetry || attempt >= maxAttempts) {
      lastResponse = gmailResponse;
      break;
    }

    const retryAfter = gmailResponse.headers.get("retry-after");
    const retryAfterMs = retryAfter ? Number(retryAfter) * 1000 : 0;
    const backoffMs = retryAfterMs > 0 ? retryAfterMs : 400 * (2 ** (attempt - 1));
    await sleep(backoffMs);
    lastResponse = gmailResponse;
  }

  if (!lastResponse) throw new Error("Gmail send failed without HTTP response");
  return lastResponse;
}

async function markBroadcastState(
  supabaseAdmin: ReturnType<typeof createClient>,
  broadcastId: string | null,
  payload: Record<string, unknown>,
): Promise<void> {
  if (!broadcastId) return;
  const { error } = await supabaseAdmin
    .from("broadcasts")
    .update(payload)
    .eq("id", broadcastId);
  if (error) {
    console.error("Failed to update broadcast state:", error.message);
  }
}

async function createTrackedLink(
  supabaseAdmin: ReturnType<typeof createClient>,
  broadcastId: string,
  recipientId: string,
  targetUrl: string,
): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from("broadcast_tracked_links")
    .insert({
      broadcast_id: broadcastId,
      recipient_id: recipientId,
      target_url: targetUrl,
    })
    .select("link_token")
    .single();

  if (error || !data?.link_token) {
    throw new Error(`Failed to create tracked link: ${error?.message ?? "Missing link token"}`);
  }

  return data.link_token as string;
}

async function rewriteTrackedLinks(
  supabaseAdmin: ReturnType<typeof createClient>,
  htmlBody: string,
  trackingBaseUrl: string,
  broadcastId: string,
  recipientId: string,
): Promise<string> {
  const hrefRegex = /href="(https?:\/\/[^"]+)"/g;
  let result = "";
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = hrefRegex.exec(htmlBody)) !== null) {
    const rawUrl = match[1];
    const linkToken = await createTrackedLink(supabaseAdmin, broadcastId, recipientId, rawUrl);
    const trackedUrl = `${trackingBaseUrl}?type=click&link=${encodeURIComponent(linkToken)}`;
    result += htmlBody.slice(lastIndex, match.index);
    result += `href="${trackedUrl}"`;
    lastIndex = match.index + match[0].length;
  }

  result += htmlBody.slice(lastIndex);
  return result;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startedAt = Date.now();
  let triggeredBy: string | null = null;
  let requestPayloadForLog: Record<string, unknown> | null = null;
  let broadcastIdForError: string | null = null;

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      throw new Error("Missing user authorization token for personal Gmail sender");
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: authData } = await supabaseAdmin.auth.getUser(token);
    triggeredBy = authData.user?.id ?? null;
    if (!triggeredBy) throw new Error("Invalid user authorization token");

    const payload = (await req.json()) as SendBroadcastPayload;
    const subject = payload.subject?.trim();
    const body = payload.body?.trim();
    const recipients = Array.isArray(payload.recipients) ? payload.recipients : [];
    const ccEmails = normalizeEmailList(payload.cc_emails);
    const bccEmails = Array.from(new Set([...normalizeEmailList(payload.bcc_emails), ...normalizeEmailList([DEFAULT_BCC])]));
    const broadcastId = payload.broadcast_id;
    broadcastIdForError = broadcastId;

    requestPayloadForLog = {
      subject_length: subject?.length ?? 0,
      recipient_count: recipients.length,
      cc_count: ccEmails.length,
      bcc_count: bccEmails.length,
      has_broadcast_id: Boolean(broadcastId),
    };

    if (!subject) throw new Error("Missing subject");
    if (!body) throw new Error("Missing body");
    if (!broadcastId) throw new Error("Missing broadcast_id");
    if (recipients.length === 0) throw new Error("Missing recipients");
    if (ccEmails.length > 0) {
      throw new Error("CC is not allowed for broadcasts to protect recipient privacy. Use BCC only.");
    }
    if (recipients.length > MAX_BROADCAST_RECIPIENTS) {
      throw new Error("Too many recipients in one broadcast. Split the send into smaller batches.");
    }

    await markBroadcastState(supabaseAdmin, broadcastId, {
      send_status: "sending",
      failed_count: 0,
      last_error: null,
      recipient_count: recipients.length,
    });

    const { data: tokenRow, error: tokenError } = await supabaseAdmin
      .from("calendar_tokens")
      .select("access_token, refresh_token, expires_at, scopes")
      .eq("user_id", triggeredBy)
      .single();
    if (tokenError || !tokenRow) {
      throw new Error("Google account is not connected for this sender.");
    }
    const scopes = Array.isArray(tokenRow.scopes) ? tokenRow.scopes : [];
    if (!scopes.includes("https://www.googleapis.com/auth/gmail.send")) {
      throw new Error("Connected Google account is missing gmail.send scope. Reconnect Google.");
    }
    if (!tokenRow.refresh_token) {
      throw new Error("Missing Google refresh token. Reconnect Google.");
    }

    let gmailAccessToken = tokenRow.access_token as string;
    const expiresAt = tokenRow.expires_at ? new Date(tokenRow.expires_at) : new Date(0);
    if (Number.isNaN(expiresAt.getTime()) || expiresAt <= new Date(Date.now() + 30_000)) {
      const refreshed = await refreshGoogleToken(supabaseAdmin, triggeredBy, tokenRow.refresh_token);
      gmailAccessToken = refreshed.accessToken;
    }

    let senderSignature = "";
    let senderEmail: string | null = authData.user?.email ?? null;
    const { data: colleague } = await supabaseAdmin
      .from("colleagues")
      .select("email_signature, email")
      .eq("profile_id", triggeredBy)
      .limit(1)
      .maybeSingle();
    senderSignature = colleague?.email_signature ?? "";
    if (!senderEmail && colleague?.email) senderEmail = colleague.email;
    if (!senderEmail) throw new Error("Unable to resolve sender email for Gmail send.");

    const trackingBaseUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/broadcast-track`;

    let sentCount = 0;
    const failedRecipients: string[] = [];

    for (const recipient of recipients) {
      if (!recipient?.email) {
        failedRecipients.push("(missing-email)");
        continue;
      }

      const { data: recipientRow, error: recipientInsertError } = await supabaseAdmin
        .from("broadcast_recipients")
        .insert({
          broadcast_id: broadcastId,
          email: recipient.email,
          contact_name: recipient.contact_name ?? null,
          company: recipient.company ?? null,
        })
        .select("id, tracking_id")
        .single();

      if (recipientInsertError || !recipientRow?.tracking_id || !recipientRow?.id) {
        console.error("broadcast recipient insert failed:", recipientInsertError);
        failedRecipients.push(recipient.email);
        continue;
      }

      const trackingId = recipientRow.tracking_id as string;

      let personalizedBody = body
        .replace(/\{contact_name\}/g, recipient.contact_name ?? "")
        .replace(/\{company\}/g, recipient.company ?? "")
        .replace(/\{signature\}/g, senderSignature);

      personalizedBody = await rewriteTrackedLinks(
        supabaseAdmin,
        personalizedBody,
        trackingBaseUrl,
        broadcastId,
        recipientRow.id as string,
      );

      const trackingPixel = `<img src="${trackingBaseUrl}?id=${trackingId}&type=open" width="1" height="1" style="display:none" alt="" />`;
      const htmlBody = `${personalizedBody}${trackingPixel}`;

      const emailHeaders = [
        `To: ${recipient.email}`,
      ];
      emailHeaders.push(`Reply-To: ${senderEmail}`);
      if (bccEmails.length > 0) {
        emailHeaders.push(`Bcc: ${bccEmails.join(", ")}`);
      }
      emailHeaders.push(
        `Subject: ${encodeSubject(subject)}`,
        "MIME-Version: 1.0",
        "Content-Type: text/html; charset=utf-8",
        "Content-Transfer-Encoding: base64",
        "",
        encodeBase64Utf8(htmlBody),
      );
      const rawMessage = toBase64Url(emailHeaders.join("\r\n"));

      try {
        let gmailResponse = await sendGmailMessageWithRetry(gmailAccessToken, rawMessage);
        if (gmailResponse.status === 401) {
          const refreshed = await refreshGoogleToken(supabaseAdmin, triggeredBy, tokenRow.refresh_token);
          gmailAccessToken = refreshed.accessToken;
          gmailResponse = await sendGmailMessageWithRetry(gmailAccessToken, rawMessage);
        }
        if (!gmailResponse.ok) {
          const responseText = await gmailResponse.text();
          throw new Error(`Gmail send failed (${gmailResponse.status}): ${responseText}`);
        }
        sentCount += 1;
      } catch (sendError) {
        console.error("broadcast send failed:", recipient.email, sendError);
        failedRecipients.push(recipient.email);
      }
    }

    const failedCount = failedRecipients.length;
    const sendStatus =
      sentCount === 0
        ? "failed"
        : failedCount > 0
          ? "partial_failed"
          : "sent";

    await markBroadcastState(supabaseAdmin, broadcastId, {
      recipient_count: recipients.length,
      failed_count: failedCount,
      send_status: sendStatus,
      last_error: failedCount > 0 ? `${failedCount} recipient(s) failed` : null,
    });

    await supabaseAdmin.from("integration_log").insert({
      service: "broadcast",
      action: "send_broadcast",
      request_payload: requestPayloadForLog,
      response_status: 200,
      response_payload: {
        provider: "gmail_api",
        recipient_count: recipients.length,
        sent_count: sentCount,
        failed_count: failedCount,
      },
      is_success: failedCount === 0,
      error_message: failedCount > 0 ? "Some recipients failed to send" : null,
      triggered_by: triggeredBy,
      duration_ms: Date.now() - startedAt,
    });

    return response({
      success: failedCount === 0,
      sent: sentCount,
      failed: failedRecipients,
      status: sendStatus,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown broadcast send error";
    console.error("send-broadcast error:", error);

    await markBroadcastState(supabaseAdmin, broadcastIdForError, {
      send_status: "failed",
      failed_count: 0,
      last_error: errorMessage,
    });

    await supabaseAdmin.from("integration_log").insert({
      service: "broadcast",
      action: "send_broadcast",
      request_payload: requestPayloadForLog,
      response_status: 500,
      response_payload: null,
      is_success: false,
      error_message: errorMessage,
      triggered_by: triggeredBy,
      duration_ms: Date.now() - startedAt,
    });

    return response({ error: errorMessage }, 500);
  }
});
