import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.9.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Notification type configuration for email formatting
const NOTIFICATION_EMAIL_CONFIG: Record<
  string,
  { emoji: string; color: string }
> = {
  new_lead: { emoji: "🎯", color: "#3b82f6" },
  form_completed: { emoji: "📋", color: "#10b981" },
  contract_signed: { emoji: "✍️", color: "#8b5cf6" },
  lead_converted: { emoji: "🎉", color: "#22c55e" },
  access_granted: { emoji: "🔑", color: "#f59e0b" },
  offer_sent: { emoji: "📤", color: "#ec4899" },
  colleague_birthday: { emoji: "🎂", color: "#f43f5e" },
  new_feedback_idea: { emoji: "💡", color: "#eab308" },
};

function buildEmailHtml(
  title: string,
  message: string,
  type: string,
  link: string | null,
  appUrl: string
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
          <!-- Header bar -->
          <tr>
            <td style="background-color:${config.color};padding:16px 24px;">
              <span style="font-size:24px;">${config.emoji}</span>
              <span style="color:#ffffff;font-size:16px;font-weight:600;margin-left:8px;vertical-align:middle;">${title}</span>
            </td>
          </tr>
          <!-- Body -->
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
          <!-- Footer -->
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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
        }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Accept the notification record from the trigger
    const body = await req.json();

    // pg_net sends the body as-is from the trigger
    const {
      user_id,
      type,
      title,
      message,
      link,
    }: {
      user_id: string;
      type: string;
      title: string;
      message: string;
      link: string | null;
    } = body;

    if (!user_id || !type || !title || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Look up user email
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.admin.getUserById(user_id);

    if (userError || !user?.email) {
      console.error("Could not find user email:", userError);
      return new Response(
        JSON.stringify({ error: "User email not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check user's email notification preference
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email_notification_level")
      .eq("id", user_id)
      .single();

    const level = profile?.email_notification_level || "none";
    const IMPORTANT_TYPES = ["contract_signed", "lead_converted", "form_completed"];

    if (level === "none") {
      console.log(`Email notifications disabled for user ${user_id}, skipping`);
      return new Response(
        JSON.stringify({ skipped: true, reason: "disabled" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (level === "important" && !IMPORTANT_TYPES.includes(type)) {
      console.log(`Notification type ${type} not important, skipping for user ${user_id}`);
      return new Response(
        JSON.stringify({ skipped: true, reason: "not_important" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build email
    const appUrl =
      Deno.env.get("APP_URL") ||
      "https://empndmpeyrdycjdesoxr.lovable.app";
    const html = buildEmailHtml(title, message, type, link, appUrl);
    const subject = `${NOTIFICATION_EMAIL_CONFIG[type]?.emoji || "🔔"} ${title}`;

    // Send via SMTP
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

    console.log(
      `Notification email sent to ${user.email}: ${info.messageId} (type: ${type})`
    );

    return new Response(
      JSON.stringify({ success: true, messageId: info.messageId }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Send notification email error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
