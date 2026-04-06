import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import {
  getFakturoidAccessToken,
  getAccountSlug,
  getSubjectById,
  listAllInvoices,
  listInvoicesBySubject,
  type FakturoidInvoiceListItem,
} from "../_shared/fakturoid.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ImportRequest {
  dry_run?: boolean;
  only_active_clients?: boolean;
  include_all_fakturoid_account?: boolean;
  limit_per_client?: number;
}

interface ClientRow {
  id: string;
  name: string | null;
  brand_name: string | null;
  status: string | null;
  fakturoid_subject_id: number | null;
}

interface EngagementRow {
  id: string;
  client_id: string;
  name: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string | null;
}

interface InvoiceRow {
  id: string;
  invoice_number: string;
  fakturoid_id: string | null;
  fakturoid_url: string | null;
  status: string | null;
  paid_at: string | null;
}

interface UserRoleRow {
  user_id: string;
  role: string | null;
  is_super_admin: boolean | null;
  is_active: boolean | null;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.length > 0) return message;
  }
  return "Unknown error";
}

async function isAuthorizedOperator(
  supabaseAdmin: ReturnType<typeof createClient>,
  req: Request
): Promise<boolean> {
  const adminKey = req.headers.get("X-Admin-Key");
  const expectedKey = Deno.env.get("ADMIN_SECRET") || "update-urls-secret-2026";
  if (adminKey && adminKey === expectedKey) {
    return true;
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }

  const token = authHeader.replace("Bearer ", "");
  const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !authData.user) {
    return false;
  }

  const { data: roleRow, error: roleError } = await supabaseAdmin
    .from("user_roles")
    .select("user_id, role, is_super_admin, is_active")
    .eq("user_id", authData.user.id)
    .maybeSingle<UserRoleRow>();

  if (roleError || !roleRow || roleRow.is_active === false) {
    return false;
  }

  return !!roleRow.is_super_admin || roleRow.role === "admin" || roleRow.role === "management";
}

function toDateOnly(value: string | null | undefined): string | null {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return null;
  return `${parsed.getUTCFullYear()}-${String(parsed.getUTCMonth() + 1).padStart(2, "0")}-${String(parsed.getUTCDate()).padStart(2, "0")}`;
}

function toIssuedAtTimestamp(value: string | null | undefined): string {
  const dateOnly = toDateOnly(value);
  if (!dateOnly) return new Date().toISOString();
  return `${dateOnly}T12:00:00.000Z`;
}

function parseAmount(invoice: FakturoidInvoiceListItem): number {
  const raw = invoice.total_with_vat ?? invoice.total ?? invoice.native_total ?? 0;
  const parsed = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

function mapPaymentStatus(rawStatus: string | undefined): string {
  const status = String(rawStatus || "").toLowerCase();
  if (status === "paid") return "paid";
  if (status === "overdue") return "overdue";
  if (status === "sent" || status === "open" || status === "unpaid") return "sent";
  if (status === "cancelled") return "cancelled";
  return "sent";
}

function parseSubjectId(value: unknown): number | null {
  const id = Number(value);
  if (!Number.isFinite(id) || id <= 0) return null;
  return id;
}

function pickEngagementForInvoice(
  engagements: EngagementRow[],
  issuedOn: string | null
): EngagementRow | null {
  if (engagements.length === 0) return null;
  if (engagements.length === 1) return engagements[0];

  const issuedDate = issuedOn ? new Date(`${issuedOn}T12:00:00.000Z`) : null;
  if (issuedDate && Number.isFinite(issuedDate.getTime())) {
    const activeAtIssue = engagements.filter((engagement) => {
      const start = engagement.start_date ? new Date(`${engagement.start_date}T00:00:00.000Z`) : null;
      const end = engagement.end_date ? new Date(`${engagement.end_date}T23:59:59.999Z`) : null;
      return (!start || start <= issuedDate) && (!end || end >= issuedDate);
    });
    if (activeAtIssue.length === 1) return activeAtIssue[0];
    if (activeAtIssue.length > 1) {
      const currentlyActive = activeAtIssue.filter((engagement) => engagement.status === "active");
      if (currentlyActive.length === 1) return currentlyActive[0];
      return currentlyActive[0] ?? activeAtIssue[0];
    }
  }

  const currentlyActive = engagements.filter((engagement) => engagement.status === "active");
  if (currentlyActive.length === 1) return currentlyActive[0];
  return currentlyActive[0] ?? engagements[0];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const startedAt = Date.now();

  try {
    if (!(await isAuthorizedOperator(supabaseAdmin, req))) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json().catch(() => ({})) as ImportRequest;
    const dryRun = body.dry_run === true;
    const onlyActiveClients = body.only_active_clients !== false;
    const includeAllFakturoidAccount = body.include_all_fakturoid_account === true;
    const limitPerClient = Math.max(1, Math.min(body.limit_per_client ?? 500, 2000));

    let clientsQuery = supabaseAdmin
      .from("clients")
      .select("id, name, brand_name, status, fakturoid_subject_id")
      .not("fakturoid_subject_id", "is", null);

    if (onlyActiveClients) {
      clientsQuery = clientsQuery.eq("status", "active");
    }

    const { data: clients, error: clientsError } = await clientsQuery;
    if (clientsError) throw clientsError;

    const typedClients = (clients || []) as ClientRow[];
    if (typedClients.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No clients matched filter.",
          inserted: 0,
          updated: 0,
          skipped: 0,
          processed_clients: 0,
          duration_ms: Date.now() - startedAt,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const clientIds = typedClients.map((client) => client.id);
    const bySubjectId = new Map<number, ClientRow>();
    for (const client of typedClients) {
      const subjectId = parseSubjectId(client.fakturoid_subject_id);
      if (subjectId) bySubjectId.set(subjectId, client);
    }

    const { data: engagements, error: engagementsError } = await supabaseAdmin
      .from("engagements")
      .select("id, client_id, name, start_date, end_date, status")
      .in("client_id", clientIds)
      .is("deleted_at", null);
    if (engagementsError) throw engagementsError;

    const existingInvoicesQuery = supabaseAdmin
      .from("issued_invoices")
      .select("id, invoice_number, fakturoid_id, fakturoid_url, status, paid_at");
    const { data: existingInvoices, error: existingInvoicesError } = includeAllFakturoidAccount
      ? await existingInvoicesQuery
      : await existingInvoicesQuery.in("client_id", clientIds);
    if (existingInvoicesError) throw existingInvoicesError;

    const byClientEngagements = new Map<string, EngagementRow[]>();
    (engagements as EngagementRow[] || []).forEach((engagement) => {
      const bucket = byClientEngagements.get(engagement.client_id) || [];
      bucket.push(engagement);
      byClientEngagements.set(engagement.client_id, bucket);
    });

    const existingByFakturoidId = new Map<string, InvoiceRow>();
    const existingByInvoiceNumber = new Map<string, InvoiceRow>();
    (existingInvoices as InvoiceRow[] || []).forEach((invoice) => {
      if (invoice.fakturoid_id) {
        existingByFakturoidId.set(String(invoice.fakturoid_id), invoice);
      }
      existingByInvoiceNumber.set(String(invoice.invoice_number), invoice);
    });

    const accountSlug = getAccountSlug();
    const accessToken = await getFakturoidAccessToken();

    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    let fakturoidInvoicesFetched = 0;
    const errors: Array<{ client_id: string; invoice_number?: string; message: string }> = [];

    const subjectNameCache = new Map<number, string>();

    if (includeAllFakturoidAccount) {
      const allInvoices = await listAllInvoices(accessToken, accountSlug, {
        maxPages: 5000,
      });
      fakturoidInvoicesFetched = allInvoices.length;

      for (const fakturoidInvoice of allInvoices) {
        try {
          const invoiceNumber = String(fakturoidInvoice.number || "").trim();
          if (!invoiceNumber) {
            skipped += 1;
            continue;
          }

          const fakturoidId = String(fakturoidInvoice.id);
          const issuedOn = toDateOnly(fakturoidInvoice.issued_on);
          const paidAt = toDateOnly(fakturoidInvoice.paid_at || fakturoidInvoice.paid_on);
          const invoiceStatus = mapPaymentStatus(fakturoidInvoice.status);
          const fakturoidUrl = fakturoidInvoice.public_html_url
            || fakturoidInvoice.html_url
            || `https://app.fakturoid.cz/${accountSlug}/invoices/${fakturoidId}`;
          const subjectId = parseSubjectId(fakturoidInvoice.subject_id);
          const mappedClient = subjectId ? bySubjectId.get(subjectId) ?? null : null;

          const existing = existingByFakturoidId.get(fakturoidId) || existingByInvoiceNumber.get(invoiceNumber) || null;
          if (existing) {
            const updatePayload: Record<string, unknown> = {};
            if (!existing.fakturoid_id) updatePayload.fakturoid_id = fakturoidId;
            if (existing.fakturoid_url !== fakturoidUrl) updatePayload.fakturoid_url = fakturoidUrl;
            if ((existing.status || "") !== invoiceStatus) updatePayload.status = invoiceStatus;
            if ((existing.paid_at || null) !== paidAt) updatePayload.paid_at = paidAt;

            const canSyncInvoiceNumber =
              existing.invoice_number !== invoiceNumber &&
              /^FV-[0-9]{4}-[0-9]+$/.test(existing.invoice_number);
            if (canSyncInvoiceNumber) {
              updatePayload.invoice_number = invoiceNumber;
            }

            if (Object.keys(updatePayload).length === 0) {
              skipped += 1;
              continue;
            }

            if (!dryRun) {
              const { error: updateError } = await supabaseAdmin
                .from("issued_invoices")
                .update(updatePayload)
                .eq("id", existing.id);
              if (updateError) throw updateError;
            }
            updated += 1;
            continue;
          }

          const engagement = mappedClient
            ? pickEngagementForInvoice(byClientEngagements.get(mappedClient.id) || [], issuedOn)
            : null;

          let subjectName: string | null = null;
          if (!mappedClient && subjectId) {
            subjectName = subjectNameCache.get(subjectId) ?? null;
            if (!subjectName) {
              try {
                const subject = await getSubjectById(accessToken, accountSlug, subjectId);
                subjectName = String(subject.name || "").trim() || null;
                if (subjectName) subjectNameCache.set(subjectId, subjectName);
              } catch {
                // Best-effort only: unknown subjects are still imported.
              }
            }
          }

          const issuedAt = toIssuedAtTimestamp(issuedOn);
          const issuedDate = new Date(issuedAt);
          const year = issuedDate.getUTCFullYear();
          const month = issuedDate.getUTCMonth() + 1;

          const insertPayload = {
            engagement_id: engagement?.id ?? null,
            engagement_name: engagement?.name ?? "Historická faktura",
            client_id: mappedClient?.id ?? null,
            client_name:
              mappedClient?.name
              || mappedClient?.brand_name
              || subjectName
              || (subjectId ? `Fakturoid subjekt #${subjectId}` : "Neznámý klient"),
            year,
            month,
            invoice_number: invoiceNumber,
            fakturoid_id: fakturoidId,
            fakturoid_url: fakturoidUrl,
            line_items: [],
            total_amount: parseAmount(fakturoidInvoice),
            currency: (fakturoidInvoice.currency || "CZK").toUpperCase(),
            issued_at: issuedAt,
            status: invoiceStatus,
            paid_at: paidAt,
          };

          if (!dryRun) {
            const { error: insertError } = await supabaseAdmin
              .from("issued_invoices")
              .insert(insertPayload);
            if (insertError) {
              const message = getErrorMessage(insertError);
              if (message.toLowerCase().includes("duplicate key value")) {
                skipped += 1;
                continue;
              }
              throw insertError;
            }
          }
          inserted += 1;
        } catch (invoiceError) {
          errors.push({
            client_id: "all-fakturoid",
            invoice_number: String(fakturoidInvoice.number || ""),
            message: getErrorMessage(invoiceError),
          });
        }
      }
    } else {
      for (const client of typedClients) {
      try {
        const subjectId = Number(client.fakturoid_subject_id);
        if (!Number.isFinite(subjectId) || subjectId <= 0) {
          skipped += 1;
          continue;
        }

        const fakturoidInvoices = await listInvoicesBySubject(accessToken, accountSlug, subjectId, {
          maxPages: 200,
        });
        fakturoidInvoicesFetched += fakturoidInvoices.length;

        const trimmedInvoices = fakturoidInvoices
          .filter((invoice) => invoice.number && String(invoice.number).trim().length > 0)
          .slice(0, limitPerClient);

        for (const fakturoidInvoice of trimmedInvoices) {
          try {
            const fakturoidId = String(fakturoidInvoice.id);
            const invoiceNumber = String(fakturoidInvoice.number).trim();
            const issuedOn = toDateOnly(fakturoidInvoice.issued_on);
            const paidAt = toDateOnly(fakturoidInvoice.paid_at || fakturoidInvoice.paid_on);
            const invoiceStatus = mapPaymentStatus(fakturoidInvoice.status);
            const fakturoidUrl = fakturoidInvoice.public_html_url
              || fakturoidInvoice.html_url
              || `https://app.fakturoid.cz/${accountSlug}/invoices/${fakturoidId}`;

            const existing = existingByFakturoidId.get(fakturoidId) || existingByInvoiceNumber.get(invoiceNumber) || null;
            if (existing) {
              const updatePayload: Record<string, unknown> = {};
              if (!existing.fakturoid_id) updatePayload.fakturoid_id = fakturoidId;
              if (existing.fakturoid_url !== fakturoidUrl) updatePayload.fakturoid_url = fakturoidUrl;
              if ((existing.status || "") !== invoiceStatus) updatePayload.status = invoiceStatus;
              if ((existing.paid_at || null) !== paidAt) updatePayload.paid_at = paidAt;

              const canSyncInvoiceNumber =
                existing.invoice_number !== invoiceNumber &&
                /^FV-[0-9]{4}-[0-9]+$/.test(existing.invoice_number);
              if (canSyncInvoiceNumber) {
                updatePayload.invoice_number = invoiceNumber;
              }

              if (Object.keys(updatePayload).length === 0) {
                skipped += 1;
                continue;
              }

              if (!dryRun) {
                const { error: updateError } = await supabaseAdmin
                  .from("issued_invoices")
                  .update(updatePayload)
                  .eq("id", existing.id);
                if (updateError) throw updateError;
              }
              updated += 1;
              continue;
            }

            const engagement = pickEngagementForInvoice(
              byClientEngagements.get(client.id) || [],
              issuedOn
            );

            const issuedAt = toIssuedAtTimestamp(issuedOn);
            const issuedDate = new Date(issuedAt);
            const year = issuedDate.getUTCFullYear();
            const month = issuedDate.getUTCMonth() + 1;

            const insertPayload = {
              engagement_id: engagement?.id ?? null,
              engagement_name: engagement?.name ?? "Historická faktura",
              client_id: client.id,
              client_name: client.name || client.brand_name || "Neznámý klient",
              year,
              month,
              invoice_number: invoiceNumber,
              fakturoid_id: fakturoidId,
              fakturoid_url: fakturoidUrl,
              line_items: [],
              total_amount: parseAmount(fakturoidInvoice),
              currency: (fakturoidInvoice.currency || "CZK").toUpperCase(),
              issued_at: issuedAt,
              status: invoiceStatus,
              paid_at: paidAt,
            };

            if (!dryRun) {
              const { error: insertError } = await supabaseAdmin
                .from("issued_invoices")
                .insert(insertPayload);
              if (insertError) {
                const message = getErrorMessage(insertError);
                // Duplicate means another invoice already exists with same number/id in CRM.
                if (message.toLowerCase().includes("duplicate key value")) {
                  skipped += 1;
                  continue;
                }
                throw insertError;
              }
            }
            inserted += 1;
          } catch (invoiceError) {
            errors.push({
              client_id: client.id,
              invoice_number: String(fakturoidInvoice.number || ""),
              message: getErrorMessage(invoiceError),
            });
          }
        }
      } catch (clientError) {
        errors.push({
          client_id: client.id,
          message: getErrorMessage(clientError),
        });
      }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        dry_run: dryRun,
        processed_clients: typedClients.length,
        include_all_fakturoid_account: includeAllFakturoidAccount,
        fakturoid_invoices_fetched: fakturoidInvoicesFetched,
        inserted,
        updated,
        skipped,
        errors,
        duration_ms: Date.now() - startedAt,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Internal error";
    console.error("Historical invoice import failed:", error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
