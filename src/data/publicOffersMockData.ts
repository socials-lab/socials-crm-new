import type { PublicOffer } from '@/types/publicOffer';

const STORAGE_KEY = 'public_offers_mock';

// Testovací nabídka - vždy dostupná na /offer/test-nabidka-123
const TEST_OFFER: PublicOffer = {
  id: 'test-offer-id',
  token: 'test-nabidka-123',
  lead_id: 'test-lead',
  company_name: 'Testovací Firma s.r.o.',
  contact_name: 'Jan Novák',
  services: [
    {
      id: 'svc-1',
      service_id: 'service-smm',
      name: 'Social Media Management',
      description: 'Správa sociálních sítí',
      offer_description: 'Kompletní správa Facebook, Instagram a LinkedIn včetně:\n- Tvorba obsahu (8 postů/měsíc)\n- Community management\n- Měsíční reporting',
      price: 25000,
      currency: 'CZK',
      billing_type: 'monthly',
      selected_tier: 'pro',
    },
    {
      id: 'svc-2',
      service_id: 'service-ppc',
      name: 'PPC Kampaně',
      description: 'Správa placené reklamy',
      offer_description: 'Správa Google Ads a Meta Ads:\n- Nastavení kampaní\n- A/B testování\n- Optimalizace konverzí\n- Týdenní reporting',
      price: 15000,
      currency: 'CZK',
      billing_type: 'monthly',
      selected_tier: 'growth',
    },
    {
      id: 'svc-3',
      service_id: 'service-audit',
      name: 'Úvodní Audit',
      description: 'Analýza současného stavu',
      offer_description: 'Kompletní audit:\n- Analýza konkurence\n- Audit sociálních sítí\n- Doporučení strategie',
      price: 8000,
      currency: 'CZK',
      billing_type: 'one_off',
      selected_tier: 'growth',
    },
  ],
  portfolio_links: [
    {
      id: 'portfolio-1',
      title: 'Case Study: E-shop Fashion Brand',
      url: 'https://www.canva.com/design/example1',
      type: 'case_study',
    },
    {
      id: 'portfolio-2',
      title: 'Ukázka kampaní pro B2B klienty',
      url: 'https://www.canva.com/design/example2',
      type: 'presentation',
    },
    {
      id: 'portfolio-3',
      title: 'Reference od klientů',
      url: 'https://socials.cz/reference',
      type: 'reference',
    },
  ],
  audit_summary: 'Na základě našeho auditu jsme identifikovali následující příležitosti:\n\n1. Sociální sítě nejsou aktivně spravovány\n2. PPC kampaně mají prostor pro optimalizaci\n3. Chybí jednotná vizuální identita',
  custom_note: 'Těšíme se na spolupráci! V případě dotazů nás neváhejte kontaktovat.',
  notion_url: null,
  currency: 'CZK',
  total_price: 48000,
  offer_type: 'retainer',
  valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  created_by: 'system',
  is_active: true,
  viewed_at: null,
  view_count: 0,
};

function getStoredOffers(): PublicOffer[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveOffers(offers: PublicOffer[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(offers));
}

export function addPublicOffer(offer: PublicOffer): void {
  const offers = getStoredOffers();
  offers.push(offer);
  saveOffers(offers);
}

export function getPublicOfferByToken(token: string): PublicOffer | undefined {
  // Testovací token - vždy vrátit testovací nabídku
  if (token === 'test-nabidka-123') {
    return TEST_OFFER;
  }
  
  const offers = getStoredOffers();
  return offers.find(o => o.token === token && o.is_active);
}

export function incrementOfferView(token: string): void {
  const offers = getStoredOffers();
  const offer = offers.find(o => o.token === token);
  if (offer) {
    offer.view_count = (offer.view_count || 0) + 1;
    if (!offer.viewed_at) {
      offer.viewed_at = new Date().toISOString();
    }
    saveOffers(offers);
  }
}

export function getAllOffers(): PublicOffer[] {
  return getStoredOffers();
}
