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
};

const IMPORTANT_TYPES = ["contract_signed", "lead_converted", "form_completed"];

type NotificationPayload = {
  notification_id?: string;
  user_id?: string;
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
};

function buildEmailHtml(
  title: string,
  message: string,
  type: string,
  link: string | null,
  appUrl: string,
): string {
  const config = NOTIFICATION_EMAIL_CONFIG[type] || {
    emoji: "🔔",
    color: "#6b7280",
  };
  const fullLink = link ? `${appUrl}${link}` : appUrl;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="background-color:${config.color};padding:16px 24px;">
              <span style="font-size:24px;">${config.emoji}</span>
              <span style="color:#ffffff;font-size:16px;font-weight:600;margin-left:8px;vertical-align:middle;">${title}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:24px;">
              <p style="margin:0 0 20px;color:#27272a;font-size:15px;line-height:1.6;">
                ${message}
              </p>
              <a href="${fullLink}" style="display:inline-block;background-color:${config.color};color:#ffffff;text-decoration:none;padding:10px 20px;border-radius:6px;font-size:14px;font-weight:500;">
                Zobrazit v aplikaci
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px;border-top:1px solid #e4e4e7;">
              <p style="margin:0;color:#a1a1aa;font-size:12px;">
                Toto je automatická notifikace ze Socials CRM.
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
  status: "sent" | "skipped" | "failed",
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

    let notification: NotificationRecord | null = null;

    if (body.notification_id) {
      notificationIdForError = body.notification_id;
      const { data, error } = await supabaseAdmin
        .from("notifications")
        .select("id,user_id,type,title,message,link")
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

      notification = data as NotificationRecord;

      if (body.user_id && body.user_id !== notification.user_id) {
        return new Response(
          JSON.stringify({ error: "User mismatch for notification" }),
          {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

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
    } else {
      const {
        user_id,
        type,
        title,
        message,
        link,
      }: {
        user_id?: string;
        type?: string;
        title?: string;
        message?: string;
        link?: string | null;
      } = body;

      if (!user_id || !type || !title || !message) {
        return new Response(
          JSON.stringify({ error: "Missing required fields" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      notification = {
        id: "manual",
        user_id,
        type,
        title,
        message,
        link: link ?? null,
      };
    }

    const user_id = notification.user_id;
    const type = notification.type;
    const title = notification.title;
    const message = notification.message;
    const link = notification.link;

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.admin.getUserById(user_id);

    if (userError || !user?.email) {
      if (body.notification_id) {
        await markDelivery(
          supabaseAdmin,
          body.notification_id,
          "failed",
          "user_not_found",
          userError?.message || "User email not found",
        );
      }
      return new Response(
        JSON.stringify({ error: "User email not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email_notification_level")
      .eq("id", user_id)
      .single();

    const level = profile?.email_notification_level || "none";

    if (level === "none") {
      if (body.notification_id) {
        await markDelivery(supabaseAdmin, body.notification_id, "skipped", "disabled");
      }
      return new Response(
        JSON.stringify({ skipped: true, reason: "disabled" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (level === "important" && !IMPORTANT_TYPES.includes(type)) {
      if (body.notification_id) {
        await markDelivery(
          supabaseAdmin,
          body.notification_id,
          "skipped",
          "not_important",
        );
      }
      return new Response(
        JSON.stringify({ skipped: true, reason: "not_important" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const appUrl = Deno.env.get("APP_URL") || "https://crm.socials.cz";
    const html = buildEmailHtml(title, message, type, link, appUrl);
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
      to: user.email,
      subject,
      html,
    });

    if (body.notification_id) {
      await markDelivery(supabaseAdmin, body.notification_id, "sent");
    }

    console.log(
      `Notification email sent to ${user.email}: ${info.messageId} (type: ${type})`,
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
