import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.9.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const NOTIFICATION_EMAIL_CONFIG: Record<string, { emoji: string; color: string }> = {
  new_lead: { emoji: "🎯", color: "#3b82f6" },
  form_completed: { emoji: "📋", color: "#10b981" },
  contract_signed: { emoji: "✍️", color: "#8b5cf6" },
  lead_converted: { emoji: "🎉", color: "#22c55e" },
  access_granted: { emoji: "🔑", color: "#f59e0b" },
  offer_sent: { emoji: "📤", color: "#ec4899" },
  colleague_birthday: { emoji: "🎂", color: "#f43f5e" },
  new_feedback_idea: { emoji: "💡", color: "#eab308" },
  extra_work_created: { emoji: "🔧", color: "#f97316" },
  extra_work_approved: { emoji: "✅", color: "#16a34a" },
};

const IMPORTANT_TYPES = ["contract_signed", "lead_converted", "form_completed"];
const FORCE_DELIVERY_TYPES = ["extra_work_created", "extra_work_approved"];

type NotificationPayload = {
  notification_id?: string;
  user_id?: string;
  dispatch_token?: string;
  type?: string;
  title?: string;
  message?: string;
  link?: string | null;
};

type NotificationRecord = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
};

const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  new_lead: "Nový lead",
  form_completed: "Vyplněný formulář",
  contract_signed: "Podepsaná smlouva",
  lead_converted: "Lead převeden",
  access_granted: "Přístupy přijaty",
  offer_sent: "Nabídka odeslána",
  colleague_birthday: "Narozeniny kolegy",
  new_feedback_idea: "Nový feedback nápad",
  extra_work_created: "Nová vícepráce",
  extra_work_approved: "Vícepráce schválena klientem",
};

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function humanDate(isoValue: string | null): string {
  if (!isoValue) return "—";
  const date = new Date(isoValue);
  if (!Number.isFinite(date.getTime())) return isoValue;
  return date.toLocaleString("cs-CZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildSummaryRows(notification: NotificationRecord): Array<{ label: string; value: string }> {
  const rows: Array<{ label: string; value: string }> = [
    { label: "Typ", value: NOTIFICATION_TYPE_LABELS[notification.type] || notification.type },
    { label: "Vytvořeno", value: humanDate(notification.created_at) },
  ];

  const metadata =
    notification.metadata && typeof notification.metadata === "object" && !Array.isArray(notification.metadata)
      ? notification.metadata
      : {};
  const metadataLabelMap: Record<string, string> = {
    company_name: "Firma",
    lead_id: "Lead ID",
    client_id: "Client ID",
    engagement_id: "Zakázka ID",
    colleague_id: "Kolega ID",
  };

  for (const [key, rawValue] of Object.entries(metadata)) {
    if (rawValue === null || rawValue === undefined) continue;
    if (typeof rawValue === "object") continue;
    const label = metadataLabelMap[key];
    if (!label) continue;
    rows.push({ label, value: String(rawValue) });
  }

  if (notification.link) {
    rows.push({ label: "CRM odkaz", value: notification.link });
  }

  return rows;
}

function buildEmailHtml(
  notification: NotificationRecord,
  linkUrl: string,
  appUrl: string,
): string {
  const config = NOTIFICATION_EMAIL_CONFIG[notification.type] || {
    emoji: "🔔",
    color: "#6b7280",
  };
  const summaryRows = buildSummaryRows(notification)
    .map((row) => `
      <tr>
        <td style="padding:8px 0;color:#71717a;font-size:12px;width:120px;">${escapeHtml(row.label)}</td>
        <td style="padding:8px 0;color:#18181b;font-size:13px;font-weight:500;">${escapeHtml(row.value)}</td>
      </tr>
    `)
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background-color:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 6px 24px rgba(15,23,42,0.08);border:1px solid #e4e4e7;">
          <tr>
            <td style="background:linear-gradient(90deg, ${config.color} 0%, #111827 100%);padding:18px 24px;">
              <span style="font-size:22px;">${config.emoji}</span>
              <span style="color:#ffffff;font-size:16px;font-weight:700;margin-left:8px;vertical-align:middle;">Socials CRM</span>
            </td>
          </tr>
          <tr>
            <td style="padding:24px;">
              <h2 style="margin:0 0 10px;color:#111827;font-size:20px;line-height:1.3;">${escapeHtml(notification.title)}</h2>
              <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.6;">
                ${escapeHtml(notification.message)}
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:12px 14px;margin-bottom:18px;">
                ${summaryRows}
              </table>
              <a href="${escapeHtml(linkUrl)}" style="display:inline-block;background-color:${config.color};color:#ffffff;text-decoration:none;padding:11px 20px;border-radius:8px;font-size:14px;font-weight:600;">
                Otevřít detail v CRM
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:14px 24px;border-top:1px solid #e4e4e7;background:#fafafa;">
              <p style="margin:0;color:#6b7280;font-size:12px;">
                Automatická notifikace ze Socials CRM • ${escapeHtml(appUrl)}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function markDelivery(
  supabaseAdmin: ReturnType<typeof createClient>,
  notificationId: string,
  status: "processing" | "sent" | "skipped" | "failed",
  reason?: string,
  errorMessage?: string,
) {
  const patch: Record<string, string | null> = {
    status,
    reason: reason ?? null,
    error_message: errorMessage ?? null,
  };
  if (status === "sent") {
    patch.sent_at = new Date().toISOString();
  }

  await supabaseAdmin
    .from("notification_email_deliveries")
    .update(patch)
    .eq("notification_id", notificationId);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let notificationIdForError: string | undefined;

  try {
    const SMTP_USER = Deno.env.get("SMTP_USER");
    const SMTP_PASS = Deno.env.get("SMTP_PASS");

    if (!SMTP_USER || !SMTP_PASS) {
      console.error("SMTP credentials not configured");
      return new Response(
        JSON.stringify({ error: "SMTP credentials not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body: NotificationPayload = await req.json();

    if (!body.notification_id) {
      return new Response(
        JSON.stringify({ error: "notification_id is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    notificationIdForError = body.notification_id;

    const { data, error } = await supabaseAdmin
      .from("notifications")
      .select("id,user_id,type,title,message,link,metadata,created_at")
      .eq("id", body.notification_id)
      .maybeSingle();

    if (error || !data) {
      console.error("Notification not found for email send", {
        notification_id: body.notification_id,
        error,
      });
      return new Response(
        JSON.stringify({ error: "Notification not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const notification = data as NotificationRecord;

    if (body.user_id && body.user_id !== notification.user_id) {
      return new Response(
        JSON.stringify({ error: "User mismatch for notification" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (body.dispatch_token) {
      const { data: deliveryRow, error: deliveryLookupError } = await supabaseAdmin
        .from("notification_email_deliveries")
        .select("notification_id, status")
        .eq("notification_id", notification.id)
        .eq("dispatch_token", body.dispatch_token)
        .maybeSingle<{ notification_id: string; status: string }>();

      if (deliveryLookupError) {
        console.error("Failed to load notification delivery row", deliveryLookupError);
        return new Response(
          JSON.stringify({ error: "Failed to load delivery state" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      if (!deliveryRow) {
        return new Response(
          JSON.stringify({ error: "Unauthorized notification dispatch" }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      if (deliveryRow.status !== "pending") {
        return new Response(
          JSON.stringify({ skipped: true, reason: "already_processed" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const { data: claimedRows, error: claimError } = await supabaseAdmin
        .from("notification_email_deliveries")
        .update({
          status: "processing",
          reason: null,
          error_message: null,
        })
        .eq("notification_id", notification.id)
        .eq("dispatch_token", body.dispatch_token)
        .eq("status", "pending")
        .select("notification_id");

      if (claimError) {
        console.error("Failed to claim notification delivery row", claimError);
        return new Response(
          JSON.stringify({ error: "Failed to claim delivery" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      if (!claimedRows || claimedRows.length === 0) {
        return new Response(
          JSON.stringify({ skipped: true, reason: "already_processed" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    } else {
      const { data: inserted, error: insertDeliveryError } = await supabaseAdmin
        .from("notification_email_deliveries")
        .insert({
          notification_id: notification.id,
          status: "pending",
        })
        .select("id")
        .maybeSingle();

      if (insertDeliveryError) {
        const msg = String(insertDeliveryError.message || "");
        if (msg.toLowerCase().includes("duplicate") || msg.includes("unique")) {
          return new Response(
            JSON.stringify({ skipped: true, reason: "already_processed" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
        console.error("Failed to initialize delivery record", insertDeliveryError);
      }

      if (!inserted && !insertDeliveryError) {
        return new Response(
          JSON.stringify({ skipped: true, reason: "already_processed" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    const user_id = notification.user_id;
    const type = notification.type;
    const title = notification.title;
    const message = notification.message;
    const link = notification.link;
    const createdAt = notification.created_at;

    let routedEmails: string[] = [];
    let includeRoutedEmails = false;
    try {
      const { data: routeRow } = await supabaseAdmin
        .from("notification_email_routes")
        .select("recipient_emails, is_enabled")
        .eq("notification_type", type)
        .maybeSingle<{ recipient_emails: string[] | null; is_enabled: boolean | null }>();

      routedEmails = (routeRow?.is_enabled === false ? [] : (routeRow?.recipient_emails || []))
        .map((email) => String(email || "").trim().toLowerCase())
        .filter((email) => email.length > 0);

      // Prevent duplicate route sends for multi-recipient notification inserts.
      if (routedEmails.length > 0 && createdAt) {
        const { data: firstRow } = await supabaseAdmin
          .from("notifications")
          .select("id")
          .eq("type", type)
          .eq("title", title)
          .eq("message", message)
          .eq("created_at", createdAt)
          .order("id", { ascending: true })
          .limit(1)
          .maybeSingle<{ id: string }>();
        includeRoutedEmails = firstRow?.id === notification.id;
      }
    } catch (routeError) {
      console.error("Failed to evaluate notification email routes:", routeError);
    }

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.admin.getUserById(user_id);

    let userEmail: string | null = null;
    if (!userError && user?.email) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("email_notification_level")
        .eq("id", user_id)
        .single();

      const level = profile?.email_notification_level || "none";
      if (
        FORCE_DELIVERY_TYPES.includes(type) ||
        level === "all" ||
        (level === "important" && IMPORTANT_TYPES.includes(type))
      ) {
        userEmail = user.email.trim().toLowerCase();
      }
    }

    const recipients = Array.from(
      new Set([
        ...(userEmail ? [userEmail] : []),
        ...(includeRoutedEmails ? routedEmails : []),
      ]),
    );

    if (recipients.length === 0) {
      if (body.notification_id) {
        await markDelivery(supabaseAdmin, body.notification_id, "skipped", "no_recipients");
      }
      return new Response(
        JSON.stringify({ skipped: true, reason: "no_recipients" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const appUrl = (Deno.env.get("APP_URL") || "https://crm.socials.cz").replace(/\/+$/, "");
    const linkUrl = link
      ? (link.startsWith("http://") || link.startsWith("https://")
          ? link
          : `${appUrl}${link.startsWith("/") ? "" : "/"}${link}`)
      : appUrl;
    const html = buildEmailHtml(notification, linkUrl, appUrl);
    const subject = `${NOTIFICATION_EMAIL_CONFIG[type]?.emoji || "🔔"} ${title}`;

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: `Socials CRM <${SMTP_USER}>`,
      to: recipients[0],
      bcc: recipients.length > 1 ? recipients.slice(1).join(", ") : undefined,
      subject,
      html,
    });

    if (body.notification_id) {
      await markDelivery(supabaseAdmin, body.notification_id, "sent");
    }

    console.log(
      `Notification email sent to ${recipients.join(", ")}: ${info.messageId} (type: ${type})`,
    );

    return new Response(
      JSON.stringify({ success: true, messageId: info.messageId }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Send notification email error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    if (notificationIdForError) {
      try {
        const supabaseAdmin = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        );
        await markDelivery(
          supabaseAdmin,
          notificationIdForError,
          "failed",
          "send_error",
          errorMessage,
        );
      } catch {
        // noop - avoid masking original error response
      }
    }

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
