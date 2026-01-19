import type { PublicOffer } from '@/types/publicOffer';

const STORAGE_KEY = 'public_offers_mock';

// Testovací nabídka - vždy dostupná na /offer/test-nabidka-123
const TEST_OFFER: PublicOffer = {
  id: 'test-offer-id',
  token: 'test-nabidka-123',
  lead_id: 'test-lead',
  company_name: 'Testovací Firma s.r.o.',
  website: 'https://www.example-eshop.cz',
  contact_name: 'Jan Novák',
  services: [
    {
      id: 'svc-1',
      service_id: 'service-smm',
      name: 'Social Media Management',
      description: 'Správa sociálních sítí',
      offer_description: 'Kompletní správa Facebook, Instagram a LinkedIn včetně tvorby obsahu, community managementu a měsíčního reportingu.',
      price: 25000,
      currency: 'CZK',
      billing_type: 'monthly',
      selected_tier: 'pro',
      service_type: 'core',
      deliverables: [
        '8 postů měsíčně (FB, IG, LinkedIn)',
        'Grafické návrhy v brand identity',
        'Community management (odpovědi do 24h)',
        'Měsíční report s analytics a doporučeními',
        'Obsahový kalendář na měsíc dopředu',
      ],
      frequency: '2 posty týdně + stories dle potřeby',
      turnaround: 'Obsahový plán do 5 dnů od startu',
      requirements: [
        'Přístupy k sociálním sítím (FB, IG, LinkedIn)',
        'Brand manual nebo grafické podklady',
        'Schválení obsahového plánu (1x měsíčně)',
      ],
      start_timeline: 'Do 5 pracovních dnů od podpisu',
    },
    {
      id: 'svc-2',
      service_id: 'service-ppc',
      name: 'PPC Kampaně',
      description: 'Správa placené reklamy',
      offer_description: 'Správa Google Ads a Meta Ads s A/B testováním, optimalizací konverzí a týdenním reportingem.',
      price: 15000,
      currency: 'CZK',
      billing_type: 'monthly',
      selected_tier: 'growth',
      service_type: 'core',
      deliverables: [
        'Kompletní správa reklamních účtů',
        'Nastavení a optimalizace kampaní',
        'A/B testování kreativ a cílení',
        'Týdenní performance reporting',
        'Doporučení pro zlepšení konverzního poměru',
      ],
      frequency: 'Průběžná správa + týdenní report',
      turnaround: 'Nové kampaně do 5 pracovních dnů',
      requirements: [
        'Přístupy do Google Ads a Meta Ads',
        'Přístup k Google Analytics / GTM',
        'Reklamní rozpočet (min. 20 000 Kč/měsíc)',
      ],
      start_timeline: 'Do 7 pracovních dnů od podpisu',
    },
    {
      id: 'svc-3',
      service_id: 'service-audit',
      name: 'Úvodní Audit',
      description: 'Analýza současného stavu',
      offer_description: 'Kompletní audit vašich digitálních aktivit s analýzou konkurence a doporučením strategie.',
      price: 8000,
      currency: 'CZK',
      billing_type: 'one_off',
      selected_tier: null,
      service_type: 'addon',
      deliverables: [
        'Analýza současného stavu sociálních sítí',
        'Audit PPC kampaní a výkonnosti',
        'Analýza konkurence (3 hlavní konkurenti)',
        'Strategická doporučení (PDF report)',
        '60min konzultace k výsledkům',
      ],
      frequency: 'Jednorázově',
      turnaround: 'Do 10 pracovních dnů',
      requirements: [
        'Přístupy k analytice (viewer)',
        'Seznam hlavních konkurentů',
      ],
      start_timeline: 'Ihned po podpisu smlouvy',
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
      title: 'Ukázky kampaní pro B2B',
      url: 'https://www.canva.com/design/example2',
      type: 'presentation',
    },
  ],
  audit_summary: 'Sociální sítě nejsou aktivně spravovány – příspěvky nepravidelně, nízký engagement.\n\nPPC kampaně mají prostor pro optimalizaci – vysoké CPC, chybí remarketing.\n\nChybí jednotná vizuální identita napříč kanály.',
  recommendation_intro: 'Proto navrhujeme zaměřit se na systematickou správu sociálních sítí s pravidelným obsahem a paralelně optimalizovat PPC kampaně pro lepší návratnost investic.',
  custom_note: null,
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
  estimated_start_date: 'Do 5 pracovních dnů od podpisu smlouvy',
  // Contact person info
  owner_name: 'Jan Novák',
  owner_email: 'jan.novak@socials.cz',
  owner_phone: '+420 123 456 789',
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
