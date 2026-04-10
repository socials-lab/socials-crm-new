const COMPANY_SUFFIX_RE = /\b(spol\.?\s*s\.?\s*r\.?\s*o\.?|s\.?\s*r\.?\s*o\.?|a\.?\s*s\.?|llc|ltd|inc|gmbh)\b/gi;

function normalizeClientSlug(input: string): string {
  const noDiacritics = input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const withoutCompanySuffix = noDiacritics.replace(COMPANY_SUFFIX_RE, ' ');

  return withoutCompanySuffix
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-|-$/g, '');
}

export function buildSlackChannelName(clientName: string | null | undefined): string {
  const slug = normalizeClientSlug(clientName || '');
  const safeSlug = (slug || 'klient').slice(0, 60);
  return `c_${safeSlug}`;
}

function getHostFromWebsite(website: string | null | undefined): string | null {
  if (!website) return null;

  const trimmed = website.trim();
  if (!trimmed) return null;

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const host = new URL(withProtocol).hostname.toLowerCase();
    return host.replace(/^www\./, '') || null;
  } catch {
    return null;
  }
}

function toTitleCaseDomain(domain: string): string {
  if (!domain) return domain;
  return domain.charAt(0).toUpperCase() + domain.slice(1);
}

export function buildFreeloProjectName(
  website: string | null | undefined,
  fallbackClientName: string | null | undefined,
): string {
  const domain = getHostFromWebsite(website);
  if (domain) return toTitleCaseDomain(domain);
  return fallbackClientName?.trim() || 'Projekt';
}

export function buildSlackChannelNameFromWebsite(
  website: string | null | undefined,
  fallbackClientName: string | null | undefined,
): string {
  const domain = getHostFromWebsite(website);
  if (domain) {
    const rootLabel = domain.split('.')[0] || domain;
    return buildSlackChannelName(rootLabel);
  }
  return buildSlackChannelName(fallbackClientName);
}
