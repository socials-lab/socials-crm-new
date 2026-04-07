import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type MetaInsightRow = {
  date_start?: string;
  spend?: string;
};

function formatDate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hmacSha256(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await globalThis.crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await globalThis.crypto.subtle.sign("HMAC", key, enc.encode(message));
  return toHex(sig);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const year = Number(body?.year);
    const month = Number(body?.month);

    if (!Number.isInteger(year) || year < 2020 || year > 2100) {
      return new Response(
        JSON.stringify({ error: "Invalid year" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (!Number.isInteger(month) || month < 1 || month > 12) {
      return new Response(
        JSON.stringify({ error: "Invalid month" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const metaToken = Deno.env.get("META_ACCESS_TOKEN");
    const rawAccountId = Deno.env.get("META_AD_ACCOUNT_ID");
    const appSecret = Deno.env.get("META_APP_SECRET");

    if (!metaToken || !rawAccountId) {
      return new Response(
        JSON.stringify({ error: "Missing META_ACCESS_TOKEN or META_AD_ACCOUNT_ID secret" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const accountId = rawAccountId.startsWith("act_") ? rawAccountId : `act_${rawAccountId}`;
    const since = formatDate(new Date(Date.UTC(year, month - 1, 1)));
    const until = formatDate(new Date(Date.UTC(year, month, 0)));

    // Build appsecret_proof if app secret is available
    let proofParam = "";
    if (appSecret) {
      const proof = await hmacSha256(appSecret, metaToken);
      proofParam = `&appsecret_proof=${proof}`;
    }

    const allRows: MetaInsightRow[] = [];
    let nextUrl =
      `https://graph.facebook.com/v21.0/${accountId}/insights` +
      `?fields=date_start,spend` +
      `&level=account&time_increment=1` +
      `&time_range=${encodeURIComponent(JSON.stringify({ since, until }))}` +
      `&limit=500` +
      `&access_token=${encodeURIComponent(metaToken)}` +
      proofParam;

    while (nextUrl) {
      const response = await fetch(nextUrl);
      const payload = await response.json();

      if (!response.ok || payload?.error) {
        const metaErr = payload?.error;
        const message = metaErr?.message || `Meta API error (${response.status})`;
        const metaType = metaErr?.type || "";
        const metaCode = metaErr?.code || "";
        console.error("Meta API error:", JSON.stringify(payload?.error));
        return new Response(
          JSON.stringify({
            error: "Meta API failed",
            details: message,
            meta_type: metaType,
            meta_code: metaCode,
          }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const data = Array.isArray(payload?.data) ? payload.data : [];
      for (const row of data) {
        allRows.push(row as MetaInsightRow);
      }

      nextUrl = typeof payload?.paging?.next === "string" ? payload.paging.next : "";
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { error: deleteError } = await supabaseAdmin
      .from("marketing_ad_spend_entries")
      .delete()
      .eq("year", year)
      .eq("month", month)
      .eq("channel", "meta");
    if (deleteError) {
      throw deleteError;
    }

    const inserts = allRows
      .map((row) => {
        const spend = Number(row.spend ?? 0);
        const spendDate = String(row.date_start ?? "").slice(0, 10);
        if (!Number.isFinite(spend) || spend < 0 || !/^\d{4}-\d{2}-\d{2}$/.test(spendDate)) return null;
        return {
          year,
          month,
          spend_date: spendDate,
          channel: "meta",
          amount: spend,
          note: "Meta Ads auto-sync",
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    if (inserts.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from("marketing_ad_spend_entries")
        .insert(inserts);
      if (insertError) {
        throw insertError;
      }
    }

    const total = inserts.reduce((sum, row) => sum + Number(row.amount || 0), 0);
    return new Response(
      JSON.stringify({
        success: true,
        synced_days: inserts.length,
        total_spend: total,
        account_id: accountId,
        period: { year, month, since, until },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("sync-meta-ad-spend error:", err);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: err instanceof Error ? err.message : String(err),
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
