import type { Lead } from '@/types/crm';

export function buildOfferUrlFromToken(token: string): string {
  return `${window.location.origin}/offer/${token}`;
}

export function getLeadOfferUrl(lead: Pick<Lead, 'offer_token'>): string | null {
  if (!lead.offer_token) return null;
  return buildOfferUrlFromToken(lead.offer_token);
}
