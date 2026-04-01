/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from '@/integrations/supabase/client';
import type { PublicOffer } from '@/types/publicOffer';

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
    .eq('is_active', true)
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

export async function updatePublicOffer(token: string, updatedOffer: Partial<PublicOffer>, changeSummary?: string): Promise<void> {
  // First get current offer for history
  const { data: current } = await supabase
    .from('public_offers' as any)
    .select('*')
    .eq('token', token)
    .maybeSingle();

  if (!current) return;

  const currentOffer = rowToOffer(current);
  
  // Build history entry from current state
  const { history, ...snapshot } = currentOffer;
  const historyEntry = {
    timestamp: new Date().toISOString(),
    changed_by: updatedOffer.created_by || currentOffer.created_by || null,
    summary: changeSummary || 'Úprava nabídky',
    snapshot: snapshot,
  };

  const existingHistory = currentOffer.history || [];

  const updateData: any = {
    ...updatedOffer,
    updated_at: new Date().toISOString(),
    history: [...existingHistory, historyEntry],
  };

  // Remove undefined values
  Object.keys(updateData).forEach(key => {
    if (updateData[key] === undefined) delete updateData[key];
  });

  const { error } = await supabase
    .from('public_offers' as any)
    .update(updateData)
    .eq('token', token);

  if (error) {
    console.error('Error updating offer:', error);
    throw error;
  }
}
