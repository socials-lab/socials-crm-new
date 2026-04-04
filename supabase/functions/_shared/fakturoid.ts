// Shared Fakturoid API utilities with token caching

interface FakturoidTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface FakturoidSubject {
  id: number;
  name: string;
  registration_no?: string;
  vat_no?: string;
  street?: string;
  city?: string;
  zip?: string;
  country?: string;
  email?: string;
  phone?: string;
  web?: string;
  html_url?: string;
  updated_at?: string;
}

export interface FakturoidInvoice {
  id: number;
  number: string;
  html_url?: string;
  public_html_url?: string;
}

// Token cache (persists for the lifetime of the edge function instance)
let cachedToken: { token: string; expiresAt: number } | null = null;

const USER_AGENT = "SocialsCRM (hello@socials.cz)";
const MAX_RETRIES = 3;
const DEFAULT_RATE_LIMIT_WAIT_MS = 60000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseRateLimitResetTime(header: string | null): number | null {
  // Parse X-RateLimit header: "default;r=398;t=55"
  // t= is seconds until reset
  if (!header) return null;
  const match = header.match(/t=(\d+)/);
  if (match) {
    return parseInt(match[1], 10) * 1000; // Convert to ms
  }
  return null;
}

async function fakturoidFetch(
  url: string,
  options: RequestInit,
  retries = MAX_RETRIES
): Promise<Response> {
  const response = await fetch(url, options);

  if (response.status === 429 && retries > 0) {
    const rateLimitHeader = response.headers.get("X-RateLimit");
    const waitTime = parseRateLimitResetTime(rateLimitHeader) || DEFAULT_RATE_LIMIT_WAIT_MS;
    console.log(`Rate limited. Waiting ${waitTime}ms before retry...`);
    await sleep(waitTime);
    return fakturoidFetch(url, options, retries - 1);
  }

  return response;
}

export async function getFakturoidAccessToken(): Promise<string> {
  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const clientId = Deno.env.get("FAKTUROID_CLIENT_ID");
  const clientSecret = Deno.env.get("FAKTUROID_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    throw new Error("Fakturoid OAuth credentials not configured");
  }

  const basicAuth = btoa(`${clientId}:${clientSecret}`);
  const response = await fetch("https://app.fakturoid.cz/api/v3/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept": "application/json",
      "Authorization": `Basic ${basicAuth}`,
      "User-Agent": USER_AGENT,
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Fakturoid auth failed: ${errorText}`);
  }

  const data: FakturoidTokenResponse = await response.json();

  // Cache token with 60s buffer before expiry
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };

  return data.access_token;
}

export function getAccountSlug(): string {
  const slug = Deno.env.get("FAKTUROID_ACCOUNT_SLUG");
  if (!slug) {
    throw new Error("FAKTUROID_ACCOUNT_SLUG not configured");
  }
  return slug;
}

export async function searchSubjectByIco(
  accessToken: string,
  accountSlug: string,
  ico: string
): Promise<FakturoidSubject | null> {
  try {
    const subjects = await searchSubjects(accessToken, accountSlug, ico);
    const normalizedIco = ico.replace(/\D/g, "");
    const match = subjects.find((subject) => (subject.registration_no || "").replace(/\D/g, "") === normalizedIco);
    return match || null;
  } catch {
    return null;
  }
}

export async function searchSubjects(
  accessToken: string,
  accountSlug: string,
  query: string
): Promise<FakturoidSubject[]> {
  const url = `https://app.fakturoid.cz/api/v3/accounts/${accountSlug}/subjects/search.json?query=${encodeURIComponent(query)}`;

  const response = await fakturoidFetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Accept": "application/json",
      "User-Agent": USER_AGENT,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Fakturoid search subjects failed: ${errorText}`);
  }

  const subjects: FakturoidSubject[] = await response.json();
  return subjects;
}

export async function createSubject(
  accessToken: string,
  accountSlug: string,
  subjectData: Record<string, unknown>
): Promise<FakturoidSubject> {
  const url = `https://app.fakturoid.cz/api/v3/accounts/${accountSlug}/subjects.json`;

  const response = await fakturoidFetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
      "User-Agent": USER_AGENT,
    },
    body: JSON.stringify(subjectData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Fakturoid create subject failed: ${errorText}`);
  }

  return await response.json();
}

export async function updateSubject(
  accessToken: string,
  accountSlug: string,
  subjectId: number,
  subjectData: Record<string, unknown>
): Promise<FakturoidSubject> {
  const url = `https://app.fakturoid.cz/api/v3/accounts/${accountSlug}/subjects/${subjectId}.json`;

  const response = await fakturoidFetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
      "User-Agent": USER_AGENT,
    },
    body: JSON.stringify(subjectData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Fakturoid update subject failed: ${errorText}`);
  }

  return await response.json();
}

export async function getSubjectById(
  accessToken: string,
  accountSlug: string,
  subjectId: number
): Promise<FakturoidSubject> {
  const url = `https://app.fakturoid.cz/api/v3/accounts/${accountSlug}/subjects/${subjectId}.json`;

  const response = await fakturoidFetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Accept": "application/json",
      "User-Agent": USER_AGENT,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Fakturoid get subject failed: ${errorText}`);
  }

  return await response.json();
}

export async function createInvoice(
  accessToken: string,
  accountSlug: string,
  invoiceData: Record<string, unknown>
): Promise<FakturoidInvoice> {
  const url = `https://app.fakturoid.cz/api/v3/accounts/${accountSlug}/invoices.json`;

  const response = await fakturoidFetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
      "User-Agent": USER_AGENT,
    },
    body: JSON.stringify(invoiceData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Fakturoid create invoice failed: ${errorText}`);
  }

  return await response.json();
}

export async function getInvoiceById(
  accessToken: string,
  accountSlug: string,
  invoiceId: number
): Promise<FakturoidInvoice> {
  const url = `https://app.fakturoid.cz/api/v3/accounts/${accountSlug}/invoices/${invoiceId}.json`;

  const response = await fakturoidFetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Accept": "application/json",
      "User-Agent": USER_AGENT,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Fakturoid get invoice failed: ${errorText}`);
  }

  return await response.json();
}

// Country name to ISO code mapping
export const COUNTRY_CODE_MAP: Record<string, string> = {
  "Czech Republic": "CZ",
  "Česká republika": "CZ",
  "Czechia": "CZ",
  "Slovakia": "SK",
  "Slovensko": "SK",
  "Germany": "DE",
  "Německo": "DE",
  "Austria": "AT",
  "Rakousko": "AT",
  "Poland": "PL",
  "Polsko": "PL",
  "Gibraltar": "GI",
};

export function getCountryCode(country: string): string {
  return COUNTRY_CODE_MAP[country] || country;
}
