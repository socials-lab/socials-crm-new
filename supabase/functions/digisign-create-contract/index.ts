import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import nodemailer from "npm:nodemailer@6.9.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DIGISIGN_API_URL = "https://api.digisign.org/api";
const FETCH_TIMEOUT_MS = 30000; // 30 seconds timeout

// Fetch with timeout
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = FETCH_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

interface Signatory {
  name: string;
  position?: string;
  email: string;
  phone?: string;
}

interface ContractData {
  company_name: string;
  billing_address: string;
  ico: string;
  dic: string | null;
  court_name: string;
  court_file_number: string;
  signatories: Signatory[];
  website_url: string;
  additional_emails: string;
  invoice_email: string;
  monthly_fee: number;
  setup_fee: number;
  contract_date: string;
  products: string;
}

interface GoogleServiceAccount {
  client_email: string;
  private_key: string;
  token_uri?: string;
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function parseGoogleDocId(rawUrl: string): string | null {
  if (!rawUrl) return null;
  const trimmed = rawUrl.trim();
  const idOnlyMatch = trimmed.match(/^[a-zA-Z0-9_-]{20,}$/);
  if (idOnlyMatch?.[0]) return idOnlyMatch[0];
  const urlMatch = trimmed.match(/https:\/\/docs\.google\.com\/document\/d\/([^/]+)/i);
  return urlMatch?.[1] || null;
}

function base64UrlEncode(input: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < input.length; i++) binary += String.fromCharCode(input[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function getGoogleServiceAccount(): GoogleServiceAccount | null {
  const b64Json = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON_B64");
  const rawJson = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON");
  const parsed = b64Json ? atob(b64Json) : rawJson;
  if (!parsed) return null;
  try {
    const account = JSON.parse(parsed) as GoogleServiceAccount;
    if (!account.client_email || !account.private_key) return null;
    return account;
  } catch {
    return null;
  }
}

interface PricingService {
  name: string;
  price: number;
  billing_type: "monthly" | "one_off";
  service_type?: string | null;
  country_variants?: Array<{
    country_code: string;
    multiplier: number;
    price: number;
  }>;
}

function normalizePricingServices(rawServices: unknown[]): PricingService[] {
  return rawServices
    .map((serviceRaw: unknown, index: number) => {
      const service = serviceRaw as Record<string, unknown>;
      const price = Number(service?.price);
      if (!Number.isFinite(price)) return null;

      return {
        name: String(service?.name || `Služba ${index + 1}`),
        price,
        billing_type: service?.billing_type === "one_off" ? "one_off" : "monthly",
        service_type: typeof service?.service_type === "string" ? service.service_type : null,
        country_variants: Array.isArray(service?.country_variants)
          ? (service.country_variants as Array<Record<string, unknown>>)
              .map((variant) => {
                const countryCodeRaw = variant?.country_code;
                const multiplierRaw = Number(variant?.multiplier);
                const variantPriceRaw = Number(variant?.price);
                const countryCode = typeof countryCodeRaw === "string" ? countryCodeRaw.trim().toUpperCase() : "";
                if (!countryCode) return null;
                return {
                  country_code: countryCode,
                  multiplier: Number.isFinite(multiplierRaw) ? multiplierRaw : 0,
                  price: Number.isFinite(variantPriceRaw) ? variantPriceRaw : 0,
                };
              })
              .filter((variant): variant is { country_code: string; multiplier: number; price: number } => variant !== null)
          : [],
      } as PricingService;
    })
    .filter((service): service is PricingService => service !== null);
}

function calculateFees(
  services: PricingService[],
  monthlyDiscountPercent: number,
  discountScope: "core_only" | "all_services"
): { monthlyFee: number; setupFee: number } {
  const coreMonthly = services
    .filter((s) => s.billing_type === "monthly" && s.service_type === "core")
    .reduce((sum, s) => sum + s.price, 0);

  const addonMonthly = services
    .filter((s) => s.billing_type === "monthly" && s.service_type !== "core")
    .reduce((sum, s) => sum + s.price, 0);

  const totalMonthly = coreMonthly + addonMonthly;
  const setupFee = services
    .filter((s) => s.billing_type === "one_off")
    .reduce((sum, s) => sum + s.price, 0);

  const normalizedDiscountPercent = Number.isFinite(monthlyDiscountPercent)
    ? Math.min(100, Math.max(0, monthlyDiscountPercent))
    : 0;

  const discountBase = discountScope === "all_services" ? totalMonthly : coreMonthly;
  const discountedBase = normalizedDiscountPercent > 0
    ? Math.round(discountBase * (1 - normalizedDiscountPercent / 100))
    : discountBase;

  const monthlyFee = discountScope === "all_services"
    ? discountedBase
    : discountedBase + addonMonthly;

  return { monthlyFee, setupFee };
}

// Step 1: Get auth token
async function getAuthToken(accessKey: string, secretKey: string): Promise<string> {
  const response = await fetchWithTimeout(`${DIGISIGN_API_URL}/auth-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accessKey, secretKey }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Auth failed: ${error}`);
  }

  const data = await response.json();
  return data.token;
}

// Step 2: Create empty envelope
async function createEnvelope(token: string, name: string, emailBody: string): Promise<{ envelopeId: string; selfLink: string }> {
  const response = await fetchWithTimeout(`${DIGISIGN_API_URL}/envelopes`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      emailBody,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Create envelope failed: ${error}`);
  }

  const data = await response.json();
  // DigiSign returns _links.self with the API path, we'll use it to build the app URL
  const selfLink = data._links?.self || `/api/envelopes/${data.id}`;
  return { envelopeId: data.id, selfLink };
}

function buildDigisignDraftUrl(envelopeId: string, selfLink?: string | null): string {
  const normalizedIdFromSelfLink = (() => {
    if (!selfLink) return null;
    const apiMatch = selfLink.match(/\/api\/envelopes\/([a-zA-Z0-9-]+)/i);
    if (apiMatch?.[1]) return apiMatch[1];
    const genericMatch = selfLink.match(/\/envelopes\/([a-zA-Z0-9-]+)/i);
    if (genericMatch?.[1]) return genericMatch[1];
    return null;
  })();
  const finalEnvelopeId = normalizedIdFromSelfLink || envelopeId;
  return `https://app.digisign.org/selfcare/envelopes/${finalEnvelopeId}/detail`;
}

function buildContractTitle(companyName: string | null | undefined): string {
  const normalizedCompanyName = (companyName || "").trim() || "Klient";
  return `${normalizedCompanyName} - Smlouva o propagaci`;
}

// Step 3: Upload PDF file
async function uploadFile(token: string, pdfBuffer: ArrayBuffer, filename: string): Promise<string> {
  const formData = new FormData();
  formData.append("file", new Blob([pdfBuffer], { type: "application/pdf" }), filename);

  const response = await fetchWithTimeout(`${DIGISIGN_API_URL}/files`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Upload file failed: ${error}`);
  }

  const data = await response.json();
  return data.id;
}

// Step 4: Attach document to envelope
async function attachDocument(token: string, envelopeId: string, fileId: string, documentName: string): Promise<string> {
  const response = await fetchWithTimeout(`${DIGISIGN_API_URL}/envelopes/${envelopeId}/documents`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      file: `/api/files/${fileId}`,
      name: documentName,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Attach document failed: ${error}`);
  }

  const data = await response.json();
  return data.id;
}

// Recipient data for PATCH request
interface RecipientInput {
  role: string;
  signatureType: string;
  name: string;
  email: string;
  mobile?: string;
  company?: string;
  identificationNumber?: string;
}

// Step 5: Add all recipients at once (PATCH with array)
async function addRecipients(
  token: string,
  envelopeId: string,
  recipients: RecipientInput[]
): Promise<string[]> {
  const response = await fetchWithTimeout(`${DIGISIGN_API_URL}/envelopes/${envelopeId}/recipients`, {
    method: "PATCH",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(recipients),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Add recipients failed: ${error}`);
  }

  const data = await response.json();
  // Response is an array of recipient objects with ids
  return Array.isArray(data) ? data.map((r: { id: string }) => r.id) : [data.id];
}

// Step 6: Add signature tag by placeholder
async function addSignatureTag(
  token: string,
  envelopeId: string,
  recipientId: string,
  placeholder: string
): Promise<void> {
  const response = await fetchWithTimeout(`${DIGISIGN_API_URL}/envelopes/${envelopeId}/tags/by-placeholder`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      recipient: `/api/envelopes/${envelopeId}/recipients/${recipientId}`,
      type: "signature",
      placeholder,
      positioning: "center",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Add tag failed: ${error}`);
  }
}

// Generate PDF via our service
async function generateContractPdf(pdfGeneratorUrl: string, contractData: ContractData): Promise<ArrayBuffer> {
  const response = await fetchWithTimeout(`${pdfGeneratorUrl}/generate/contract`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(contractData),
  }, 60000); // 60s for PDF generation

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`PDF generation failed: ${error}`);
  }

  return response.arrayBuffer();
}

async function getGoogleAccessToken(scopes: string[]): Promise<string> {
  const serviceAccount = getGoogleServiceAccount();
  if (!serviceAccount) {
    throw new Error("Google Service Account není nakonfigurován");
  }
  const impersonatedEmail = (Deno.env.get("GOOGLE_DRIVE_IMPERSONATE_EMAIL") || "").trim();

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload: Record<string, string | number> = {
    iss: serviceAccount.client_email,
    scope: scopes.join(" "),
    aud: serviceAccount.token_uri || "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };
  if (impersonatedEmail) {
    payload.sub = impersonatedEmail;
  }

  const encodedHeader = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const encodedPayload = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(serviceAccount.private_key),
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    privateKey,
    new TextEncoder().encode(signingInput),
  );
  const encodedSignature = base64UrlEncode(new Uint8Array(signature));
  const assertion = `${signingInput}.${encodedSignature}`;

  const tokenResponse = await fetchWithTimeout(
    serviceAccount.token_uri || "https://oauth2.googleapis.com/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion,
      }),
    },
    30000,
  );

  if (!tokenResponse.ok) {
    const body = await tokenResponse.text();
    throw new Error(`Google OAuth token failed (${tokenResponse.status}): ${body.slice(0, 200)}`);
  }

  const tokenData = await tokenResponse.json();
  if (!tokenData?.access_token) {
    throw new Error("Google OAuth token response neobsahuje access_token");
  }
  return tokenData.access_token as string;
}

async function createAndFillGoogleDocTemplate(
  templateDocId: string,
  documentName: string,
  replacements: Record<string, string>,
): Promise<{ docId: string; docUrl: string; pdf: ArrayBuffer }> {
  const accessToken = await getGoogleAccessToken([
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/documents",
  ]);

  const fileMetaResponse = await fetchWithTimeout(
    `https://www.googleapis.com/drive/v3/files/${templateDocId}?supportsAllDrives=true&fields=id,name,parents,driveId`,
    {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
      },
    },
    30000,
  );

  if (!fileMetaResponse.ok) {
    const body = await fileMetaResponse.text();
    throw new Error(`Google Docs metadata fetch failed (${fileMetaResponse.status}): ${body.slice(0, 220)}`);
  }

  const fileMeta = await fileMetaResponse.json();
  const templateParents = Array.isArray(fileMeta?.parents) ? (fileMeta.parents as string[]) : [];
  const configuredOutputFolderId = Deno.env.get("GOOGLE_CONTRACT_OUTPUT_FOLDER_ID") || "";
  const targetParents = configuredOutputFolderId
    ? [configuredOutputFolderId]
    : templateParents;

  if (!targetParents || targetParents.length === 0) {
    throw new Error(
      "Nelze určit cílovou složku pro kopii Google dokumentu. Nastavte GOOGLE_CONTRACT_OUTPUT_FOLDER_ID."
    );
  }

  const copyResponse = await fetchWithTimeout(
    `https://www.googleapis.com/drive/v3/files/${templateDocId}/copy?supportsAllDrives=true&fields=id,parents`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: documentName,
        parents: targetParents,
      }),
    },
    30000,
  );

  if (!copyResponse.ok) {
    const body = await copyResponse.text();
    const normalizedBody = body.toLowerCase();
    const quotaError =
      copyResponse.status === 403 &&
      (
        normalizedBody.includes("service accounts do not have storage quota") ||
        normalizedBody.includes("storage quota has been exceeded") ||
        normalizedBody.includes("quota")
      );
    if (quotaError) {
      throw new Error(`GOOGLE_COPY_QUOTA:${body.slice(0, 500)}`);
    }
    throw new Error(`Google Docs copy failed (${copyResponse.status}): ${body.slice(0, 220)}`);
  }

  const copyData = await copyResponse.json();
  const copiedDocId = String(copyData.id || "");
  if (!copiedDocId) {
    throw new Error("Google Docs copy response neobsahuje ID dokumentu");
  }
  let copiedParents = Array.isArray(copyData?.parents) ? (copyData.parents as string[]) : [];
  if (copiedParents.length === 0) {
    const copiedMetaResponse = await fetchWithTimeout(
      `https://www.googleapis.com/drive/v3/files/${copiedDocId}?supportsAllDrives=true&fields=id,parents`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
      },
      30000,
    );
    if (!copiedMetaResponse.ok) {
      const body = await copiedMetaResponse.text();
      throw new Error(`Google Docs copied file metadata fetch failed (${copiedMetaResponse.status}): ${body.slice(0, 220)}`);
    }
    const copiedMeta = await copiedMetaResponse.json();
    copiedParents = Array.isArray(copiedMeta?.parents) ? (copiedMeta.parents as string[]) : [];
  }

  // Ensure the copy is explicitly placed into the target folder (important for Shared Drives).
  const primaryTargetParent = targetParents[0];
  if (primaryTargetParent) {
    const removeParents = copiedParents
      .filter((parentId) => typeof parentId === "string" && parentId !== primaryTargetParent)
      .join(",");
    const updateUrl = new URL(`https://www.googleapis.com/drive/v3/files/${copiedDocId}`);
    updateUrl.searchParams.set("supportsAllDrives", "true");
    updateUrl.searchParams.set("addParents", primaryTargetParent);
    if (removeParents.length > 0) {
      updateUrl.searchParams.set("removeParents", removeParents);
    }

    const moveResponse = await fetchWithTimeout(
      updateUrl.toString(),
      {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: documentName }),
      },
      30000,
    );

    if (!moveResponse.ok) {
      const body = await moveResponse.text();
      throw new Error(`Google Docs move to output folder failed (${moveResponse.status}): ${body.slice(0, 220)}`);
    }

    const verifyResponse = await fetchWithTimeout(
      `https://www.googleapis.com/drive/v3/files/${copiedDocId}?supportsAllDrives=true&fields=id,parents,name`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
      },
      30000,
    );
    if (!verifyResponse.ok) {
      const body = await verifyResponse.text();
      throw new Error(`Google Docs moved file verification failed (${verifyResponse.status}): ${body.slice(0, 220)}`);
    }
    const verifyData = await verifyResponse.json();
    const verifyParents = Array.isArray(verifyData?.parents) ? (verifyData.parents as string[]) : [];
    if (!verifyParents.includes(primaryTargetParent)) {
      throw new Error(
        `Google Docs copy is not in configured output folder. Expected parent ${primaryTargetParent}, got ${verifyParents.join(",") || "none"}.`
      );
    }
  }

  const requests = Object.entries(replacements).map(([placeholder, value]) => ({
    replaceAllText: {
      containsText: { text: placeholder, matchCase: true },
      replaceText: value ?? "",
    },
  }));

  if (requests.length > 0) {
    const batchUpdateResponse = await fetchWithTimeout(
      `https://docs.googleapis.com/v1/documents/${copiedDocId}:batchUpdate`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ requests }),
      },
      30000,
    );

    if (!batchUpdateResponse.ok) {
      const body = await batchUpdateResponse.text();
      throw new Error(`Google Docs replace failed (${batchUpdateResponse.status}): ${body.slice(0, 220)}`);
    }
  }

  await normalizeAppendixPartyNumbering(copiedDocId, accessToken);

  const exportResponse = await fetchWithTimeout(
    `https://www.googleapis.com/drive/v3/files/${copiedDocId}/export?mimeType=application/pdf`,
    {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Accept": "application/pdf",
      },
    },
    60000,
  );

  if (!exportResponse.ok) {
    const body = await exportResponse.text();
    throw new Error(`Google Docs export failed (${exportResponse.status}): ${body.slice(0, 220)}`);
  }

  const pdf = await exportResponse.arrayBuffer();
  return {
    docId: copiedDocId,
    docUrl: `https://docs.google.com/document/d/${copiedDocId}/edit`,
    pdf,
  };
}

async function normalizeAppendixPartyNumbering(docId: string, accessToken: string): Promise<void> {
  const docResponse = await fetchWithTimeout(
    `https://docs.googleapis.com/v1/documents/${docId}`,
    {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
      },
    },
    30000,
  );

  if (!docResponse.ok) {
    const body = await docResponse.text();
    throw new Error(`Google Docs read for numbering normalization failed (${docResponse.status}): ${body.slice(0, 220)}`);
  }

  const doc = await docResponse.json();
  const content = Array.isArray(doc?.body?.content) ? doc.body.content : [];

  type ParagraphInfo = { startIndex: number; text: string };
  const paragraphs: ParagraphInfo[] = [];
  for (const item of content) {
    if (!item?.paragraph || !Array.isArray(item.paragraph.elements)) continue;
    const startIndex = Number(item.startIndex || 0);
    let text = "";
    for (const el of item.paragraph.elements) {
      if (typeof el?.textRun?.content === "string") {
        text += el.textRun.content;
      }
    }
    if (startIndex > 0 && text.trim().length > 0) {
      paragraphs.push({ startIndex, text });
    }
  }

  const companyParagraph = paragraphs.find((p) => p.text.includes("Název firmy:"));
  const socialsParagraph = paragraphs.find((p) => p.text.includes("Socials Advertising s.r.o."));
  if (!companyParagraph || !socialsParagraph) return;

  const toReplace: Array<{ startIndex: number; newPrefix: string; oldPrefixLength: number }> = [];
  const companyPrefixMatch = companyParagraph.text.match(/^\s*\d+\)\s*/);
  const socialsPrefixMatch = socialsParagraph.text.match(/^\s*\d+\)\s*/);
  if (companyPrefixMatch) {
    toReplace.push({
      startIndex: companyParagraph.startIndex,
      newPrefix: "1)\t",
      oldPrefixLength: companyPrefixMatch[0].length,
    });
  }
  if (socialsPrefixMatch) {
    toReplace.push({
      startIndex: socialsParagraph.startIndex,
      newPrefix: "2)\t",
      oldPrefixLength: socialsPrefixMatch[0].length,
    });
  }
  if (toReplace.length === 0) return;

  // Apply from bottom to top so index shifts don't affect subsequent edits.
  toReplace.sort((a, b) => b.startIndex - a.startIndex);
  const requests = toReplace.flatMap((item) => ([
    {
      deleteContentRange: {
        range: {
          startIndex: item.startIndex,
          endIndex: item.startIndex + item.oldPrefixLength,
        },
      },
    },
    {
      insertText: {
        location: {
          index: item.startIndex,
        },
        text: item.newPrefix,
      },
    },
  ]));

  const normalizeResponse = await fetchWithTimeout(
    `https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ requests }),
    },
    30000,
  );
  if (!normalizeResponse.ok) {
    const body = await normalizeResponse.text();
    throw new Error(`Google Docs numbering normalization failed (${normalizeResponse.status}): ${body.slice(0, 220)}`);
  }
}

async function fillExistingGoogleDocAndExportPdf(
  docId: string,
  replacements: Record<string, string>,
): Promise<{ docId: string; docUrl: string; pdf: ArrayBuffer }> {
  const accessToken = await getGoogleAccessToken([
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/documents",
  ]);

  const requests = Object.entries(replacements).map(([placeholder, value]) => ({
    replaceAllText: {
      containsText: { text: placeholder, matchCase: true },
      replaceText: value ?? "",
    },
  }));

  if (requests.length > 0) {
    const batchUpdateResponse = await fetchWithTimeout(
      `https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ requests }),
      },
      30000,
    );

    if (!batchUpdateResponse.ok) {
      const body = await batchUpdateResponse.text();
      const normalizedBody = body.toLowerCase();
      if (
        batchUpdateResponse.status === 400 &&
        (
          normalizedBody.includes("not supported for this document") ||
          normalizedBody.includes("failed_precondition")
        )
      ) {
        throw new Error(
          `Google Docs šablona není v nativním Google Docs formátu pro API editaci (docId: ${docId}). Otevřete ji v Google Docs a zvolte Soubor -> Uložit jako Dokument Google, poté nasdílejte nový dokument service accountu a použijte jeho URL/ID.`
        );
      }
      throw new Error(`Google Docs replace (in-place) failed (${batchUpdateResponse.status}): ${body.slice(0, 220)}`);
    }
  }

  await normalizeAppendixPartyNumbering(docId, accessToken);

  const exportResponse = await fetchWithTimeout(
    `https://www.googleapis.com/drive/v3/files/${docId}/export?mimeType=application/pdf`,
    {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Accept": "application/pdf",
      },
    },
    60000,
  );

  if (!exportResponse.ok) {
    const body = await exportResponse.text();
    throw new Error(`Google Docs export (in-place) failed (${exportResponse.status}): ${body.slice(0, 220)}`);
  }

  return {
    docId,
    docUrl: `https://docs.google.com/document/d/${docId}/edit`,
    pdf: await exportResponse.arrayBuffer(),
  };
}

async function exportGoogleDocPdf(googleDocsUrl: string): Promise<ArrayBuffer> {
  const docId = parseGoogleDocId(googleDocsUrl);
  if (!docId) throw new Error("Neplatný Google Docs odkaz pro export PDF");
  const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=pdf`;

  const response = await fetchWithTimeout(exportUrl, {
    method: "GET",
    headers: {
      "Accept": "application/pdf",
      "User-Agent": "socials-crm-contract-export/1.0",
    },
  }, 60000);

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Google Docs export failed (${response.status}). Zkontrolujte sdílení dokumentu. ${body.slice(0, 180)}`
    );
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("pdf")) {
    throw new Error("Google Docs export nevrátil PDF. Zkontrolujte odkaz a práva dokumentu.");
  }

  return response.arrayBuffer();
}

async function sendDigisignReviewEmail(params: {
  leadId: string;
  companyName: string;
  contactName: string | null;
  monthlyFee: number;
  setupFee: number;
  products: string;
  googleDocUrl: string | null;
  digisignDraftUrl: string;
}): Promise<{ sent: boolean; responseText: string }> {
  const SMTP_USER = Deno.env.get("SMTP_USER");
  const SMTP_PASS = Deno.env.get("SMTP_PASS");
  if (!SMTP_USER || !SMTP_PASS) {
    throw new Error("Missing SMTP credentials for DigiSign review notification email");
  }

  const appUrl = (Deno.env.get("APP_URL") || "https://crm.socials.cz").replace(/\/+$/, "");
  const leadUrl = `${appUrl}/leads`;
  const monthlyLabel = `${Math.round(params.monthlyFee).toLocaleString("cs-CZ")} Kč / měsíc`;
  const setupLabel = `${Math.round(params.setupFee).toLocaleString("cs-CZ")} Kč`;

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
            <td style="padding:18px 22px;background:#111827;color:#fff;">
              <div style="font-size:18px;font-weight:700;">📄 Nový DigiSign draft ke kontrole</div>
              <div style="font-size:13px;opacity:0.9;margin-top:4px;">Prosím zkontroluj a odešli smlouvu v DigiSign.</div>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 22px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;color:#111827;">
                <tr><td style="padding:6px 0;color:#71717a;width:180px;">Firma</td><td style="padding:6px 0;font-weight:600;">${escapeHtml(params.companyName)}</td></tr>
                <tr><td style="padding:6px 0;color:#71717a;">Kontakt</td><td style="padding:6px 0;">${escapeHtml(params.contactName || "—")}</td></tr>
                <tr><td style="padding:6px 0;color:#71717a;">Měsíční fee</td><td style="padding:6px 0;">${escapeHtml(monthlyLabel)}</td></tr>
                <tr><td style="padding:6px 0;color:#71717a;">Jednorázově</td><td style="padding:6px 0;">${escapeHtml(setupLabel)}</td></tr>
                <tr><td style="padding:6px 0;color:#71717a;">Produkty</td><td style="padding:6px 0;">${escapeHtml(params.products || "—")}</td></tr>
                <tr><td style="padding:6px 0;color:#71717a;">Google Docs</td><td style="padding:6px 0;">${
                  params.googleDocUrl
                    ? `<a href="${escapeHtml(params.googleDocUrl)}" style="color:#2563eb;text-decoration:none;">Otevřít dokument</a>`
                    : "—"
                }</td></tr>
              </table>

              <div style="margin-top:18px;display:flex;gap:10px;flex-wrap:wrap;">
                <a href="${escapeHtml(params.digisignDraftUrl)}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:10px 14px;border-radius:8px;font-size:13px;font-weight:600;">
                  Otevřít draft v DigiSign
                </a>
                <a href="${escapeHtml(leadUrl)}" style="display:inline-block;background:#e5e7eb;color:#111827;text-decoration:none;padding:10px 14px;border-radius:8px;font-size:13px;font-weight:600;">
                  Otevřít CRM
                </a>
              </div>

              <p style="margin-top:16px;color:#6b7280;font-size:12px;">Lead ID: ${escapeHtml(params.leadId)}</p>
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

  const info = await transporter.sendMail({
    from: `Socials CRM <${SMTP_USER}>`,
    to: "dana.bauerova@socials.cz",
    cc: "danny@socials.cz",
    subject: `Kontrola DigiSign draftu: ${params.companyName}`,
    html,
  });

  return { sent: true, responseText: info.messageId || "smtp_sent" };
}

// Format date in Czech
function formatCzechDate(date: Date): string {
  const day = date.getDate();
  const months = [
    "ledna", "února", "března", "dubna", "května", "června",
    "července", "srpna", "září", "října", "listopadu", "prosince"
  ];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day}. ${month} ${year}`;
}

function isLikelyPhoneNumber(value: string): boolean {
  const trimmed = value.trim();
  if (!/^[+\d\s().-]+$/.test(trimmed)) return false;

  const digitsOnly = trimmed.replace(/\D/g, "");
  return digitsOnly.length >= 9 && digitsOnly.length <= 15;
}

function buildTemplateVariables(contractData: ContractData): Record<string, string> {
  const primarySignatory = contractData.signatories[0];
  return {
    "{{NAZEV_FIRMY}}": contractData.company_name || "",
    "{{SIDLO_FIRMY}}": contractData.billing_address || "",
    "{{ICO}}": contractData.ico || "",
    "{{DIC}}": contractData.dic || "",
    "{{NAZEV_SOUDU}}": contractData.court_name || "",
    "{{SPISOVA_ZNACKA}}": contractData.court_file_number || "",
    "{{CISLO_ZNACKY}}": contractData.court_file_number || "",
    "{{JMENO_JEDNATELE}}": primarySignatory?.name || "",
    "{{POZICE_JEDNATELE}}": primarySignatory?.position || "jednatel",
    "{{EMAIL_JEDNATELE}}": primarySignatory?.email || "",
    "{{WEB_URL}}": contractData.website_url || "",
    "{{EMAIL_KONTAKTNI}}": contractData.additional_emails || "",
    "{{EMAILY_KOLEGU}}": contractData.additional_emails || "",
    "{{EMAIL_FAKTURACNI}}": contractData.invoice_email || "",
    "{{PAUSAL_KC}}": String(contractData.monthly_fee || 0),
    "{{JEDNORAZOVA_ODMENA_KC}}": String(contractData.setup_fee || 0),
    "{{DATUM_UZAVRENI}}": contractData.contract_date || "",
    "{{PRODUKTY}}": contractData.products || "",
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let leadId: string | null = null;
  let userId: string | null = null;

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Chybí autorizace" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Neplatná autorizace" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    userId = user.id;
    const {
      lead_id,
      google_docs_url,
      preview_only,
      force_new_draft,
    }: {
      lead_id: string;
      google_docs_url?: string | null;
      preview_only?: boolean;
      force_new_draft?: boolean;
    } = await req.json();
    leadId = lead_id;

    if (!lead_id) {
      return new Response(
        JSON.stringify({ error: "Chybí lead_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get environment variables
    const DIGISIGN_ACCESS_KEY = Deno.env.get("DIGISIGN_ACCESS_KEY");
    const DIGISIGN_SECRET_KEY = Deno.env.get("DIGISIGN_SECRET_KEY");
    const PDF_GENERATOR_URL = Deno.env.get("PDF_GENERATOR_URL") || "http://188.245.148.53:8094";
    const isPreviewOnly = preview_only === true;
    const forceNewDraft = force_new_draft === true;

    if (!isPreviewOnly && (!DIGISIGN_ACCESS_KEY || !DIGISIGN_SECRET_KEY)) {
      return new Response(
        JSON.stringify({ error: "DigiSign není nakonfigurováno (chybí DIGISIGN_ACCESS_KEY nebo DIGISIGN_SECRET_KEY)" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch lead data with all needed fields
    console.log("Fetching lead with ID:", lead_id);
    const { data: lead, error: leadError } = await supabaseAdmin
      .from("leads")
      .select(`
        id,
        contact_name,
        company_name,
        ico,
        dic,
        billing_street,
        billing_city,
        billing_zip,
        contact_email,
        contact_phone,
        billing_email,
        website,
        court_name,
        court_file_number,
        onboarding_signatories,
        onboarding_project_contacts,
        potential_services,
        digisign_id,
        google_docs_contract_url,
        google_docs_contract_saved_at,
        contract_url,
        estimated_price
      `)
      .eq("id", lead_id)
      .single();

    console.log("Lead query result:", { lead: lead ? "found" : "not found", error: leadError });

    if (leadError || !lead) {
      console.error("Lead not found. Error:", leadError, "Lead ID:", lead_id);
      return new Response(
        JSON.stringify({ error: "Lead nenalezen", details: leadError?.message, lead_id }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Helper: strip parenthetical suffixes from names, e.g. "Michaela Zářecká (glamstore.cz)" → "Michaela Zářecká"
    const cleanSignatoryName = (name: string | null | undefined): string =>
      (name || "").replace(/\s*\(.*?\)\s*/g, "").trim() || "Kontaktní osoba";

    // Enrich signatories: fill missing phone/email from lead contact info
    const signatories: Signatory[] = (lead.onboarding_signatories || []).map((s: Signatory) => ({
      ...s,
      name: cleanSignatoryName(s.name),
      phone: (s.phone && s.phone.trim()) ? s.phone.trim() : (lead.contact_phone || ''),
      email: (s.email && s.email.trim()) ? s.email.trim() : (lead.contact_email || ''),
    }));

    // If no onboarding signatories, fall back to lead contact info (always — preview or not).
    if (signatories.length === 0) {
      signatories.push({
        name: cleanSignatoryName(lead.contact_name),
        position: "jednatel",
        email: lead.contact_email || lead.billing_email || "",
        phone: lead.contact_phone || "",
      });
    }

    // Validate all signatories have email (DigiSign requires email for all recipients)
    const signatoriesWithoutEmail = signatories.filter(s => !s.email || s.email.trim() === '');
    if (!isPreviewOnly && signatoriesWithoutEmail.length > 0) {
      const missingNames = signatoriesWithoutEmail.map(s => s.name || 'Neznámé jméno').join(', ');
      return new Response(
        JSON.stringify({
          error: `Následující podpisující osoby nemají vyplněný e-mail: ${missingNames}`,
          missing_email_signatories: signatoriesWithoutEmail.map(s => s.name),
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate all signatories have names (DigiSign requires non-empty recipient name)
    const signatoriesWithoutName = signatories.filter(s => !s.name || s.name.trim() === '');
    if (!isPreviewOnly && signatoriesWithoutName.length > 0) {
      return new Response(
        JSON.stringify({
          error: "Některé podpisující osoby nemají vyplněné jméno. Doplňte jméno každého podepisujícího v onboarding formuláři.",
          missing_name_signatories_count: signatoriesWithoutName.length,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate all signatories have valid phone numbers (DigiSign requires mobile for all recipients)
    const signatoriesWithInvalidPhone = signatories.filter(s => !s.phone || !isLikelyPhoneNumber(s.phone));
    if (!isPreviewOnly && signatoriesWithInvalidPhone.length > 0) {
      const missingNames = signatoriesWithInvalidPhone.map(s => s.name).join(', ');
      return new Response(
        JSON.stringify({
          error: `Následující podpisující osoby nemají platný telefon (DigiSign vyžaduje telefon pro všechny podepisující): ${missingNames}`,
          invalid_phone_signatories: signatoriesWithInvalidPhone.map(s => s.name),
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build billing address
    const billingAddress = [lead.billing_street, lead.billing_city, lead.billing_zip]
      .filter(Boolean)
      .join(", ");

    // Prefer latest active offer snapshot pricing to keep DigiSign contract
    // aligned with what the client saw in the offer (including monthly discounts).
    const { data: latestOffer } = await supabaseAdmin
      .from("public_offers")
      .select("services, monthly_discount_percent, discount_scope, created_at")
      .eq("lead_id", lead_id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const leadServices = Array.isArray(lead.potential_services) ? lead.potential_services : [];
    const offerServices = Array.isArray(latestOffer?.services) ? latestOffer.services : [];

    const normalizedOfferServices = normalizePricingServices(offerServices);
    const normalizedLeadServices = normalizePricingServices(leadServices);
    const services = normalizedOfferServices.length > 0 ? normalizedOfferServices : normalizedLeadServices;

    // Validate services exist
    if (services.length === 0) {
      return new Response(
        JSON.stringify({ error: "Nelze vytvořit smlouvu bez služeb" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const products = services
      .map((service) => {
        const variants = Array.isArray(service.country_variants) ? service.country_variants : [];
        if (variants.length === 0) return service.name;
        const variantCodes = variants
          .map((variant) => variant.country_code)
          .filter((code) => code.length > 0);
        if (variantCodes.length === 0) return service.name;
        return `${service.name} (jazykové mutace: ${variantCodes.join(", ")})`;
      })
      .join(", ");

    const monthlyDiscountPercent = Number(latestOffer?.monthly_discount_percent ?? 0);
    const discountScope = latestOffer?.discount_scope === "all_services" ? "all_services" : "core_only";
    const { monthlyFee, setupFee } = calculateFees(services, monthlyDiscountPercent, discountScope);

    // Validate monthly fee is present (required), setup fee is optional
    if (monthlyFee <= 0) {
      return new Response(
        JSON.stringify({ error: "Smlouva musí obsahovat měsíční poplatek" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prepare contract data for PDF generation
    const projectContacts = Array.isArray(lead.onboarding_project_contacts)
      ? (lead.onboarding_project_contacts as Array<Record<string, unknown>>)
      : [];
    const projectContactEmails = projectContacts
      .map((contact) => (typeof contact.email === "string" ? contact.email.trim() : ""))
      .filter((email) => email.length > 0);
    const additionalEmails = projectContactEmails.length > 0
      ? projectContactEmails.join(", ")
      : (lead.contact_email || "");

    const contractData: ContractData = {
      company_name: lead.company_name || "",
      billing_address: billingAddress,
      ico: lead.ico || "",
      dic: lead.dic || null,
      court_name: lead.court_name || "Městským soudem v Praze",
      court_file_number: lead.court_file_number || "",
      signatories,
      website_url: lead.website || "",
      additional_emails: additionalEmails,
      invoice_email: lead.billing_email || lead.contact_email || "",
      monthly_fee: monthlyFee,
      setup_fee: setupFee,
      contract_date: formatCzechDate(new Date()),
      products,
    };
    const templateVariables = buildTemplateVariables(contractData);

    // Idempotency check - do not create duplicate envelopes.
    // Still send review notification email so manual review flow is retriggered.
    if (!isPreviewOnly && lead.digisign_id && !forceNewDraft) {
      const existingDigisignUrl = buildDigisignDraftUrl(lead.digisign_id);
      const providedGoogleDocUrlForEmail =
        typeof google_docs_url === "string" && google_docs_url.trim().length > 0
          ? google_docs_url.trim()
          : null;

      try {
        const emailResult = await sendDigisignReviewEmail({
          leadId: lead_id,
          companyName: lead.company_name || "Neznámá firma",
          contactName: lead.contact_name || null,
          monthlyFee,
          setupFee,
          products,
          googleDocUrl: providedGoogleDocUrlForEmail || lead.google_docs_contract_url || null,
          digisignDraftUrl: existingDigisignUrl,
        });

        await supabaseAdmin.from("integration_log").insert({
          service: "digisign",
          action: "notify_digisign_review_email",
          related_table: "leads",
          related_record_id: leadId,
          request_payload: {
            to: "dana.bauerova@socials.cz",
            cc: "danny@socials.cz",
            company_name: lead.company_name || null,
            contract_url: existingDigisignUrl,
            envelope_id: lead.digisign_id,
            source: "already_exists",
          },
          response_payload: { sent: true, response: emailResult.responseText.slice(0, 500) },
          response_status: 200,
          is_success: true,
          triggered_by: userId,
          duration_ms: Date.now() - startTime,
        });
      } catch (emailError) {
        console.error("Failed to send DigiSign review email for existing draft:", emailError);
        await supabaseAdmin.from("integration_log").insert({
          service: "digisign",
          action: "notify_digisign_review_email",
          related_table: "leads",
          related_record_id: leadId,
          request_payload: {
            to: "dana.bauerova@socials.cz",
            cc: "danny@socials.cz",
            company_name: lead.company_name || null,
            contract_url: existingDigisignUrl,
            envelope_id: lead.digisign_id,
            source: "already_exists",
          },
          response_payload: {
            sent: false,
            error: emailError instanceof Error ? emailError.message : String(emailError),
          },
          response_status: 500,
          is_success: false,
          triggered_by: userId,
          duration_ms: Date.now() - startTime,
        });
      }

      return new Response(
        JSON.stringify({
          success: true,
          already_exists: true,
          digisign_id: lead.digisign_id,
          digisign_url: existingDigisignUrl,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 1: Generate PDF
    // For final DigiSign draft creation, always use the exact Google Docs URL provided by user
    // (so manual edits like numbering fixes are preserved).
    // For preview, create a fresh copy from template and prefill placeholders.
    let pdfBuffer: ArrayBuffer;
    let generatedGoogleDocUrl: string | null = null;
    const configuredTemplateDocId = parseGoogleDocId(Deno.env.get("GOOGLE_CONTRACT_TEMPLATE_DOC_ID") || "");
    const templateDocId =
      configuredTemplateDocId ||
      parseGoogleDocId(google_docs_url || "");
    const hasGoogleServiceAccount = !!getGoogleServiceAccount();
    const providedGoogleDocUrl =
      typeof google_docs_url === "string" && google_docs_url.trim().length > 0
        ? google_docs_url.trim()
        : null;

    if (isPreviewOnly && !configuredTemplateDocId) {
      throw new Error("Chybí GOOGLE_CONTRACT_TEMPLATE_DOC_ID pro preview generování smlouvy.");
    }

    if (!isPreviewOnly && providedGoogleDocUrl) {
      console.log("Exporting PDF from provided Google Docs URL for DigiSign draft...");
      pdfBuffer = await exportGoogleDocPdf(providedGoogleDocUrl);
      generatedGoogleDocUrl = providedGoogleDocUrl;
    } else if (templateDocId && hasGoogleServiceAccount) {
      try {
        console.log("Creating filled Google Docs copy from template...");
        const copyDocumentName = ((contractData.company_name || "").trim() || `Lead ${lead_id}`) + " - Smlouva o propagaci";
        const filled = await createAndFillGoogleDocTemplate(
          templateDocId,
          copyDocumentName,
          templateVariables,
        );
        pdfBuffer = filled.pdf;
        generatedGoogleDocUrl = filled.docUrl;
      } catch (copyError) {
        const msg = copyError instanceof Error ? copyError.message : String(copyError);
        const serviceAccountEmail = getGoogleServiceAccount()?.client_email || "unknown-service-account";
        const impersonatedEmail = (Deno.env.get("GOOGLE_DRIVE_IMPERSONATE_EMAIL") || "").trim();
        const actingAsEmail = impersonatedEmail || serviceAccountEmail;
        const requestedDocId = parseGoogleDocId(google_docs_url || "");
        const canUseProvidedDocSafely =
          !isPreviewOnly &&
          !!requestedDocId &&
          requestedDocId !== templateDocId;

        // Safe fallback: if user provided their own Google Doc copy,
        // fill that document in-place. Never mutate the original template.
        if (canUseProvidedDocSafely) {
          console.warn("Template copy failed, using provided non-template Google Doc", {
            templateDocId,
            requestedDocId,
          });
          const filled = await fillExistingGoogleDocAndExportPdf(requestedDocId, templateVariables);
          pdfBuffer = filled.pdf;
          generatedGoogleDocUrl = filled.docUrl;
        } else {
          throw new Error(
            `Nepodařilo se vytvořit kopii Google Docs šablony. Smlouva nesmí zapisovat do originální šablony. ` +
            `Service account: ${serviceAccountEmail}. Acting as: ${actingAsEmail}. ` +
            `Vytvořte prosím ručně kopii šablony do své složky, vložte URL kopie do pole v CRM a zkuste to znovu. ` +
            `Detail: ${msg.slice(0, 320)}`
          );
        }
      }
    } else if (providedGoogleDocUrl) {
      console.log("Exporting PDF from provided Google Docs URL (no placeholder replacement)...");
      pdfBuffer = await exportGoogleDocPdf(providedGoogleDocUrl);
      generatedGoogleDocUrl = providedGoogleDocUrl;
    } else {
      console.log("Generating PDF from internal template...");
      pdfBuffer = await generateContractPdf(PDF_GENERATOR_URL, contractData);
    }
    console.log(`PDF generated, size: ${pdfBuffer.byteLength} bytes`);

    if (isPreviewOnly) {
      const previewContractUrl = generatedGoogleDocUrl || (google_docs_url || null);
      if (previewContractUrl) {
        await supabaseAdmin
          .from("leads")
          .update({
            google_docs_contract_url: previewContractUrl,
            google_docs_contract_saved_at: new Date().toISOString(),
          })
          .eq("id", lead_id);
      }

      const durationMs = Date.now() - startTime;
      await supabaseAdmin.from("integration_log").insert({
        service: "digisign",
        action: "prepare_contract_preview",
        related_table: "leads",
        related_record_id: leadId,
        request_payload: { contractData, templateVariables },
        response_payload: { google_doc_url: previewContractUrl, template_doc_id_used: configuredTemplateDocId || null },
        response_status: 200,
        is_success: true,
        triggered_by: userId,
        duration_ms: durationMs,
      });

      return new Response(
        JSON.stringify({
          success: true,
          prepared_only: true,
          google_doc_url: previewContractUrl,
          template_doc_id_used: configuredTemplateDocId || null,
          template_variables: templateVariables,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Step 2: Get DigiSign auth token
    console.log("Getting DigiSign auth token...");
    const digisignToken = await getAuthToken(DIGISIGN_ACCESS_KEY, DIGISIGN_SECRET_KEY);

// Step 3: Create envelope
  console.log("Creating envelope...");
  const contractTitle = buildContractTitle(lead.company_name);
  const envelopeName = contractTitle;
  const emailBody =
    `Dobrý den,\n\n` +
    `posílám Vám smlouvu o propagaci k podpisu.\n\n` +
    `Pokud budete potřebovat cokoliv upravit nebo vysvětlit, dejte mi prosím vědět.\n\n` +
    `Děkuji a přeji hezký den,\n` +
    `Dana Bauerová\n\n` +
    `dana.bauerova@socials.cz\n` +
    `Socials.cz`;
  const { envelopeId, selfLink } = await createEnvelope(digisignToken, envelopeName, emailBody);
  console.log(`Envelope created: ${envelopeId}`);

    // Note: We do NOT save digisign_id here to avoid race conditions.
    // If subsequent steps fail, we don't want the lead marked as having a contract.
    // The digisign_id will be saved after the envelope is fully sent.

    // Step 4: Upload PDF
    console.log("Uploading PDF...");
    const filename = `${contractTitle}.pdf`;
    const fileId = await uploadFile(digisignToken, pdfBuffer, filename);
    console.log(`File uploaded: ${fileId}`);

    // Step 5: Attach document
    console.log("Attaching document...");
    await attachDocument(digisignToken, envelopeId, fileId, contractTitle);
    console.log("Document attached");

    // Step 6: Add all recipients at once
    console.log("Adding recipients...");
    
    // Build recipients array: Socials first, then client signatories
    const recipientsData: RecipientInput[] = [
      {
        role: "signer",
        signatureType: "simple",
        name: "Daniel Bauer",
        email: "danny@socials.cz",
        mobile: "+420774536699",
        company: "Socials Advertising s.r.o.",
        identificationNumber: "08186464",
      },
      ...signatories.map((signatory) => ({
        role: "signer",
        signatureType: "simple",
        name: signatory.name,
        email: signatory.email,
        mobile: signatory.phone!.trim(),
        company: lead.company_name || undefined,
        identificationNumber: lead.ico || undefined,
      })),
    ];

    const recipientIds = await addRecipients(digisignToken, envelopeId, recipientsData);
    console.log(`Added ${recipientIds.length} recipients`);

    // Add signature tags for each recipient
    for (let i = 0; i < recipientIds.length; i++) {
      await addSignatureTag(digisignToken, envelopeId, recipientIds[i], `PODPIS${i + 1}`);
    }

    // Step 7: Keep envelope in draft state (do not send automatically)
    console.log("Envelope prepared as draft (not sent)");

    // Envelope is fully prepared as draft, save IDs/URL to database
    // DigiSign provides direct envelope URL in selfcare
    const contractUrl = buildDigisignDraftUrl(envelopeId, selfLink);

    const now = new Date().toISOString();
    const { error: updateError } = await supabaseAdmin
      .from("leads")
      .update({
        digisign_id: envelopeId,
        contract_created_at: now,
        contract_sent_at: now,
        google_docs_contract_url: generatedGoogleDocUrl || (google_docs_url || lead.google_docs_contract_url || null),
        google_docs_contract_saved_at: generatedGoogleDocUrl || google_docs_url ? now : (lead.google_docs_contract_saved_at || null),
        contract_url: contractUrl,
      })
      .eq("id", lead_id);

    if (updateError) {
      // Envelope draft was created successfully but DB update failed
      // Log this critical error - manual intervention may be needed
      console.error("CRITICAL: Envelope draft created but DB update failed:", updateError);
      console.error(`Envelope ID: ${envelopeId}, Lead ID: ${lead_id}`);
      // We still return success since the draft was created
      // The digisign_id can be manually added later
    }

    const durationMs = Date.now() - startTime;

    // Log successful integration call
    await supabaseAdmin.from("integration_log").insert({
      service: "digisign",
      action: "create_contract",
      related_table: "leads",
      related_record_id: leadId,
      request_payload: { contractData, templateVariables, signatories_count: signatories.length },
      response_payload: { envelopeId, templateVariables, google_doc_url: generatedGoogleDocUrl },
      response_status: 200,
      is_success: true,
      triggered_by: userId,
      duration_ms: durationMs,
    });

    try {
      const emailResult = await sendDigisignReviewEmail({
        leadId: lead_id,
        companyName: lead.company_name || "Neznámá firma",
        contactName: lead.contact_name || null,
        monthlyFee,
        setupFee,
        products,
        googleDocUrl: generatedGoogleDocUrl || providedGoogleDocUrl || lead.google_docs_contract_url || null,
        digisignDraftUrl: contractUrl,
      });

      await supabaseAdmin.from("integration_log").insert({
        service: "digisign",
        action: "notify_digisign_review_email",
        related_table: "leads",
        related_record_id: leadId,
        request_payload: {
          to: "dana.bauerova@socials.cz",
          company_name: lead.company_name || null,
          contract_url: contractUrl,
          envelope_id: envelopeId,
        },
        response_payload: { sent: true, response: emailResult.responseText.slice(0, 500) },
        response_status: 200,
        is_success: true,
        triggered_by: userId,
        duration_ms: Date.now() - startTime,
      });
    } catch (emailError) {
      console.error("Failed to send DigiSign review email:", emailError);
      await supabaseAdmin.from("integration_log").insert({
        service: "digisign",
        action: "notify_digisign_review_email",
        related_table: "leads",
        related_record_id: leadId,
        request_payload: {
          to: "dana.bauerova@socials.cz",
          company_name: lead.company_name || null,
          contract_url: contractUrl,
          envelope_id: envelopeId,
        },
        response_payload: {
          sent: false,
          error: emailError instanceof Error ? emailError.message : String(emailError),
        },
        response_status: 500,
        is_success: false,
        triggered_by: userId,
        duration_ms: Date.now() - startTime,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        digisign_id: envelopeId,
        digisign_url: contractUrl,
        template_variables: templateVariables,
        google_doc_url: generatedGoogleDocUrl,
      }),
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
        action: "create_contract",
        related_table: "leads",
        related_record_id: leadId,
        is_success: false,
        error_message: errorMessage,
        triggered_by: userId,
        duration_ms: durationMs,
      });
    } catch (logError) {
      console.error("Failed to log integration error:", logError);
    }

    console.error("DigiSign create contract error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
