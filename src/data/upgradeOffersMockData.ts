import type { EngagementUpgradeOffer, UpgradeOfferChangeType } from '@/types/upgradeOffer';
import type { ModificationProposedChanges, AddServiceProposedChanges, UpdateServicePriceProposedChanges } from '@/types/crm';
import { format, addDays, getDaysInMonth } from 'date-fns';

const STORAGE_KEY = 'crm_upgrade_offers';

// Generate a random token for URL
function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Get all offers from localStorage
function getOffers(): EngagementUpgradeOffer[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Save offers to localStorage
function saveOffers(offers: EngagementUpgradeOffer[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(offers));
}

// Generate human-readable change summary
export function generateChangeSummary(
  changeType: UpgradeOfferChangeType, 
  proposedChanges: ModificationProposedChanges
): string {
  switch (changeType) {
    case 'add_service': {
      const c = proposedChanges as AddServiceProposedChanges;
      return `Přidání služby "${c.name}" za ${c.price.toLocaleString('cs-CZ')} ${c.currency}/měs`;
    }
    case 'update_service_price': {
      const c = proposedChanges as UpdateServicePriceProposedChanges;
      return `Změna ceny z ${c.old_price.toLocaleString('cs-CZ')} na ${c.new_price.toLocaleString('cs-CZ')} ${c.currency}/měs`;
    }
    case 'deactivate_service': {
      return 'Ukončení služby';
    }
    default:
      return 'Úprava spolupráce';
  }
}

// Calculate prorated amount for first month
export function calculateProratedAmount(
  monthlyPrice: number,
  effectiveFrom: string
): { proratedAmount: number; remainingDays: number; daysInMonth: number } | null {
  if (!effectiveFrom || monthlyPrice <= 0) return null;
  
  const date = new Date(effectiveFrom);
  const daysInMonth = getDaysInMonth(date);
  const startDay = date.getDate();
  const remainingDays = daysInMonth - startDay + 1;
  const proratedAmount = Math.round((monthlyPrice / daysInMonth) * remainingDays);
  
  return { proratedAmount, remainingDays, daysInMonth };
}

// Create a new upgrade offer
export interface CreateUpgradeOfferParams {
  modificationRequestId: string;
  engagementId: string;
  engagementName: string;
  clientName: string;
  changeType: UpgradeOfferChangeType;
  proposedChanges: ModificationProposedChanges;
  effectiveFrom: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
}

export function createUpgradeOffer(params: CreateUpgradeOfferParams): EngagementUpgradeOffer {
  const offers = getOffers();
  
  // Determine price and currency based on change type
  let newMonthlyPrice: number | undefined;
  let priceDifference: number | undefined;
  let currency = 'CZK';
  
  if (params.changeType === 'add_service') {
    const c = params.proposedChanges as AddServiceProposedChanges;
    newMonthlyPrice = c.price;
    currency = c.currency || 'CZK';
  } else if (params.changeType === 'update_service_price') {
    const c = params.proposedChanges as UpdateServicePriceProposedChanges;
    newMonthlyPrice = c.new_price;
    priceDifference = c.new_price - c.old_price;
    currency = c.currency || 'CZK';
  }
  
  // Calculate prorated first month
  const prorationInfo = newMonthlyPrice 
    ? calculateProratedAmount(newMonthlyPrice, params.effectiveFrom)
    : null;
  
  const newOffer: EngagementUpgradeOffer = {
    id: crypto.randomUUID(),
    token: generateToken(),
    modification_request_id: params.modificationRequestId,
    engagement_id: params.engagementId,
    engagement_name: params.engagementName,
    client_name: params.clientName,
    change_type: params.changeType,
    change_summary: generateChangeSummary(params.changeType, params.proposedChanges),
    proposed_changes: params.proposedChanges,
    new_monthly_price: newMonthlyPrice,
    price_difference: priceDifference,
    effective_from: params.effectiveFrom,
    prorated_first_month: prorationInfo?.proratedAmount,
    currency,
    status: 'pending',
    valid_until: format(addDays(new Date(), 14), 'yyyy-MM-dd'),
    contact_name: params.contactName,
    contact_email: params.contactEmail,
    contact_phone: params.contactPhone,
    created_at: new Date().toISOString(),
  };
  
  offers.push(newOffer);
  saveOffers(offers);
  
  return newOffer;
}

// Get offer by token (for public page)
export function getUpgradeOfferByToken(token: string): EngagementUpgradeOffer | null {
  const offers = getOffers();
  return offers.find(o => o.token === token) || null;
}

// Get offer by modification request ID
export function getUpgradeOfferByModificationId(modificationRequestId: string): EngagementUpgradeOffer | null {
  const offers = getOffers();
  return offers.find(o => o.modification_request_id === modificationRequestId) || null;
}

// Accept an upgrade offer
export function acceptUpgradeOffer(token: string, email: string): EngagementUpgradeOffer | null {
  const offers = getOffers();
  const offerIndex = offers.findIndex(o => o.token === token);
  
  if (offerIndex === -1) return null;
  
  const offer = offers[offerIndex];
  
  // Check if already accepted
  if (offer.status === 'accepted') return offer;
  
  // Check if expired
  if (new Date(offer.valid_until) < new Date()) {
    offers[offerIndex] = { ...offer, status: 'expired' };
    saveOffers(offers);
    return null;
  }
  
  // Accept the offer
  const updatedOffer: EngagementUpgradeOffer = {
    ...offer,
    status: 'accepted',
    accepted_at: new Date().toISOString(),
    accepted_by_email: email,
  };
  
  offers[offerIndex] = updatedOffer;
  saveOffers(offers);
  
  return updatedOffer;
}

// Check if offer is still valid
export function isOfferValid(offer: EngagementUpgradeOffer): boolean {
  if (offer.status === 'expired') return false;
  if (offer.status === 'accepted') return true; // Already accepted is still "valid"
  return new Date(offer.valid_until) >= new Date();
}
