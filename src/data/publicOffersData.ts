/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from '@/integrations/supabase/client';
import type { PublicOffer } from '@/types/publicOffer';

type OfferHistoryChange = {
  field: string;
  from: string;
  to: string;
};

function normalizeText(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value.trim();
  return String(value);
}

function formatChangeValue(value: unknown): string {
  const text = normalizeText(value);
  if (text.length === 0) return '—';
  return text.length > 140 ? `${text.slice(0, 137)}...` : text;
}

function removeImagesFromHtml(html: unknown): string | null {
  if (typeof html !== 'string') return null;
  const trimmed = html.trim();
  if (!trimmed) return null;
  const withoutImages = trimmed.replace(/<img\b[^>]*>/gi, '').trim();
  return withoutImages.length > 0 ? withoutImages : null;
}

function buildServiceKey(service: any): string {
  return String(service?.id || service?.service_id || service?.name || crypto.randomUUID());
}

function buildServiceLabel(service: any): string {
  const tier = service?.selected_tier ? ` (${service.selected_tier})` : '';
  return `${service?.name || 'Služba'}${tier}`;
}

function pushChange(changes: OfferHistoryChange[], field: string, before: unknown, after: unknown) {
  const from = formatChangeValue(before);
  const to = formatChangeValue(after);
  if (from === to) return;
  changes.push({ field, from, to });
}

function buildOfferChanges(currentOffer: PublicOffer, nextOffer: PublicOffer): OfferHistoryChange[] {
  const changes: OfferHistoryChange[] = [];

  pushChange(changes, 'Audit (plain text)', currentOffer.audit_summary, nextOffer.audit_summary);
  pushChange(changes, 'Doporučení', currentOffer.recommendation_intro, nextOffer.recommendation_intro);
  pushChange(changes, 'Poznámka', currentOffer.custom_note, nextOffer.custom_note);
  pushChange(changes, 'Loom URL', currentOffer.loom_url, nextOffer.loom_url);
  pushChange(changes, 'Platnost do', currentOffer.valid_until, nextOffer.valid_until);
  pushChange(changes, 'Celková cena', currentOffer.total_price, nextOffer.total_price);
  pushChange(changes, 'Měsíční sleva %', currentOffer.monthly_discount_percent, nextOffer.monthly_discount_percent);
  pushChange(changes, 'Rozsah slevy', currentOffer.discount_scope, nextOffer.discount_scope);
  pushChange(changes, 'Úvodní sleva %', currentOffer.intro_discount_percent, nextOffer.intro_discount_percent);
  pushChange(changes, 'Úvodní sleva (měsíce)', currentOffer.intro_discount_months, nextOffer.intro_discount_months);

  const currentServices = currentOffer.services || [];
  const nextServices = nextOffer.services || [];
  const currentByKey = new Map(currentServices.map((service) => [buildServiceKey(service), service]));
  const nextByKey = new Map(nextServices.map((service) => [buildServiceKey(service), service]));

  const addedServices = nextServices.filter((service) => !currentByKey.has(buildServiceKey(service)));
  const removedServices = currentServices.filter((service) => !nextByKey.has(buildServiceKey(service)));

  if (addedServices.length > 0) {
    changes.push({
      field: 'Služby přidány',
      from: '—',
      to: addedServices.map(buildServiceLabel).join(', '),
    });
  }

  if (removedServices.length > 0) {
    changes.push({
      field: 'Služby odebrány',
      from: removedServices.map(buildServiceLabel).join(', '),
      to: '—',
    });
  }

  currentServices.forEach((currentService) => {
    const key = buildServiceKey(currentService);
    const nextService = nextByKey.get(key);
    if (!nextService) return;
    const label = buildServiceLabel(nextService);
    pushChange(changes, `${label} – cena`, currentService.price, nextService.price);
    pushChange(changes, `${label} – typ fakturace`, currentService.billing_type, nextService.billing_type);
    pushChange(changes, `${label} – tier`, currentService.selected_tier, nextService.selected_tier);
    pushChange(changes, `${label} – offer text`, currentService.offer_description, nextService.offer_description);
    pushChange(
      changes,
      `${label} – varianty zemí`,
      JSON.stringify(currentService.country_variants || []),
      JSON.stringify(nextService.country_variants || []),
    );
  });

  return changes;
}

// Convert DB row to PublicOffer type
function rowToOffer(row: any): PublicOffer {
  return {
    id: row.id,
    lead_id: row.lead_id,
    token: row.token,
    company_name: row.company_name,
    website: row.website,
    contact_name: row.contact_name,
    audit_summary: row.audit_summary,
    audit_html: row.audit_html || null,
    recommendation_intro: row.recommendation_intro,
    custom_note: row.custom_note,
    loom_url: row.loom_url,
    services: row.services || [],
    portfolio_links: row.portfolio_links || [],
    total_price: Number(row.total_price),
    currency: row.currency,
    offer_type: row.offer_type,
    valid_until: row.valid_until,
    is_active: row.is_active,
    viewed_at: row.viewed_at,
    view_count: row.view_count || 0,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
    estimated_start_date: row.estimated_start_date,
    monthly_discount_percent: row.monthly_discount_percent ? Number(row.monthly_discount_percent) : undefined,
    discount_scope: row.discount_scope,
    intro_discount_percent: row.intro_discount_percent ? Number(row.intro_discount_percent) : undefined,
    intro_discount_months: row.intro_discount_months,
    owner_name: row.owner_name,
    owner_email: row.owner_email,
    owner_phone: row.owner_phone,
    history: row.history || [],
    content_blocks_snapshot: row.content_blocks_snapshot,
  };
}

export async function addPublicOffer(offer: PublicOffer): Promise<void> {
  const { error } = await supabase
    .from('public_offers' as any)
    .insert({
      id: offer.id,
      lead_id: offer.lead_id,
      token: offer.token,
      company_name: offer.company_name,
      website: offer.website,
      contact_name: offer.contact_name,
      audit_summary: offer.audit_summary,
      audit_html: offer.audit_html || null,
      recommendation_intro: offer.recommendation_intro,
      custom_note: offer.custom_note,
      loom_url: offer.loom_url,
      services: offer.services,
      portfolio_links: offer.portfolio_links,
      total_price: offer.total_price,
      currency: offer.currency,
      offer_type: offer.offer_type,
      valid_until: offer.valid_until,
      is_active: offer.is_active,
      viewed_at: offer.viewed_at,
      view_count: offer.view_count,
      created_by: offer.created_by,
      estimated_start_date: offer.estimated_start_date,
      monthly_discount_percent: offer.monthly_discount_percent,
      discount_scope: offer.discount_scope,
      intro_discount_percent: offer.intro_discount_percent,
      intro_discount_months: offer.intro_discount_months,
      owner_name: offer.owner_name,
      owner_email: offer.owner_email,
      owner_phone: offer.owner_phone,
      history: offer.history || [],
      content_blocks_snapshot: offer.content_blocks_snapshot,
    } as any);

  if (error) {
    console.error('Error adding public offer:', error);
    throw error;
  }
}

export async function getPublicOfferByToken(token: string): Promise<PublicOffer | undefined> {
  const { data, error } = await supabase
    .from('public_offers' as any)
    .select('*')
    .eq('token', token)
    .or('is_active.eq.true,is_active.is.null')
    .maybeSingle();

  if (error) {
    console.error('Error fetching offer by token:', error);
    return undefined;
  }

  return data ? rowToOffer(data) : undefined;
}

export async function incrementOfferView(token: string): Promise<void> {
  const { error } = await supabase.rpc('increment_public_offer_view' as any, { p_token: token } as any);
  if (error) {
    throw error;
  }
}

export async function getAllOffers(): Promise<PublicOffer[]> {
  const { data, error } = await supabase
    .from('public_offers' as any)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all offers:', error);
    return [];
  }

  return (data as any[] || []).map(rowToOffer);
}

export async function getOffersByLeadId(leadId: string): Promise<PublicOffer[]> {
  const { data, error } = await supabase
    .from('public_offers' as any)
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching offers by lead:', error);
    return [];
  }

  return (data as any[] || []).map(rowToOffer);
}

export async function updatePublicOffer(
  token: string,
  updatedOffer: Partial<PublicOffer>,
  changeSummary?: string,
  options?: { changedBy?: string | null },
): Promise<void> {
  // First get current offer for history
  const { data: current } = await supabase
    .from('public_offers' as any)
    .select('*')
    .eq('token', token)
    .maybeSingle();

  if (!current) return;

  const currentOffer = rowToOffer(current);
  
  const sanitizedUpdatedOffer: Record<string, unknown> = { ...updatedOffer };
  Object.keys(sanitizedUpdatedOffer).forEach(key => {
    if (sanitizedUpdatedOffer[key] === undefined) delete sanitizedUpdatedOffer[key];
  });

  const nextOffer = {
    ...currentOffer,
    ...sanitizedUpdatedOffer,
  } as PublicOffer;
  const changeDetails = buildOfferChanges(currentOffer, nextOffer);
  const autoSummary = changeDetails.length > 0
    ? `Změna: ${changeDetails.slice(0, 4).map((c) => c.field).join(', ')}`
    : 'Úprava nabídky (bez změny hodnot)';

  // Build history entry from current state
  const { history, ...snapshot } = currentOffer;
  const snapshotForHistory = {
    ...snapshot,
    // Keep audit text history but drop embedded image payloads.
    audit_html: removeImagesFromHtml(snapshot.audit_html),
    content_blocks_snapshot: undefined,
  };
  const historyEntry = {
    timestamp: new Date().toISOString(),
    changed_by: options?.changedBy ?? currentOffer.created_by ?? null,
    summary: changeSummary || autoSummary,
    changes: changeDetails,
    snapshot: snapshotForHistory,
  };

  const existingHistory = currentOffer.history || [];

  const updateData: any = {
    ...sanitizedUpdatedOffer,
    updated_at: new Date().toISOString(),
    history: [...existingHistory, historyEntry],
  };

  const { error } = await supabase
    .from('public_offers' as any)
    .update(updateData)
    .eq('token', token);

  if (error) {
    console.error('Error updating offer:', error);
    throw error;
  }
}
