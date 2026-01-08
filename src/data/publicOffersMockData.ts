import type { PublicOffer } from '@/types/publicOffer';

// In-memory store for public offers (mock database)
export const publicOffersStore: PublicOffer[] = [];

export function addPublicOffer(offer: PublicOffer): void {
  publicOffersStore.push(offer);
}

export function getPublicOfferByToken(token: string): PublicOffer | undefined {
  return publicOffersStore.find(o => o.token === token && o.is_active);
}

export function incrementOfferView(token: string): void {
  const offer = publicOffersStore.find(o => o.token === token);
  if (offer) {
    offer.view_count = (offer.view_count || 0) + 1;
    if (!offer.viewed_at) {
      offer.viewed_at = new Date().toISOString();
    }
  }
}
