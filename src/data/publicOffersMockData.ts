import type { PublicOffer } from '@/types/publicOffer';

const STORAGE_KEY = 'public_offers_mock';

// Testovací nabídka - vždy dostupná na /offer/test-nabidka-123
// Testovací nabídka jen s addon službami (bez core) - /offer/test-addon-only
const TEST_ADDON_ONLY_OFFER: PublicOffer = {
  id: 'test-addon-offer-id',
  token: 'test-addon-only',
  lead_id: 'test-lead-addon',
  company_name: 'Startup Kreativa s.r.o.',
  website: 'https://www.startup-kreativa.cz',
  contact_name: 'Petra Svobodová',
  services: [
    {
      id: 'svc-addon-1',
      service_id: 'service-cb',
      name: 'Creative Boost',
      description: 'Kreditový systém pro tvorbu reklamních kreativ',
      offer_description: 'Flexibilní tvorba reklamních kreativ na kreditovém systému – bannery, videa i AI fotografie. Platíte jen za to, co skutečně potřebujete.',
      price: 8000,
      currency: 'CZK',
      billing_type: 'monthly',
      selected_tier: null,
      service_type: 'addon',
      deliverables: [
        '20 kreditů měsíčně pro tvorbu reklamních materiálů',
        'Statické bannery pro sociální sítě a web',
        'Krátká reklamní videa a animace',
        'AI generované produktové fotografie',
        'Zadání přes Freelo nebo Slack',
        'Standardní dodání do 3 pracovních dnů',
        'První revize zdarma u každého výstupu',
      ],
      frequency: 'Průběžně dle potřeby v rámci měsíčního balíčku',
      turnaround: 'Standardní 3 dny, express 24 hodin',
      requirements: [
        'Brandbook a vizuální identita',
        'Loga v potřebných formátech (PNG, SVG)',
      ],
      start_timeline: 'Ihned po zahájení spolupráce',
    },
  ],
  portfolio_links: [
    {
      id: 'portfolio-addon-1',
      title: 'Ukázky kreativ pro e-shopy',
      url: 'https://www.canva.com/design/example-addon',
      type: 'presentation',
    },
  ],
  audit_summary: null,
  recommendation_intro: 'Doporučujeme Creative Boost balíček pro pravidelnou tvorbu kvalitních vizuálů pro vaše marketingové kanály.',
  custom_note: null,
  loom_url: null,
  currency: 'CZK',
  total_price: 8000,
  offer_type: 'retainer',
  valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  created_by: 'system',
  is_active: true,
  viewed_at: null,
  view_count: 0,
  estimated_start_date: 'Ihned po podpisu smlouvy',
  owner_name: 'Daniel Bauer',
  owner_email: 'daniel@socials.cz',
  owner_phone: '+420 123 456 789',
};

const TEST_OFFER: PublicOffer = {
  id: 'test-offer-id',
  token: 'test-nabidka-123',
  lead_id: 'test-lead',
  company_name: 'Testovací E-shop s.r.o.',
  website: 'https://www.example-eshop.cz',
  contact_name: 'Jan Novák',
  services: [
    {
      id: 'svc-1',
      service_id: 'service-socials',
      name: 'Socials Boost',
      description: 'Komplexní správa Meta Ads pro e-shopy',
      offer_description: 'Kompletní správa reklam na Facebooku a Instagramu zaměřená na zvýšení tržeb vašeho e-shopu. Zahrnuje nastavení měření, tvorbu kampaní, denní optimalizaci i měsíční reporting.',
      price: 29900,
      currency: 'CZK',
      billing_type: 'monthly',
      selected_tier: 'growth',
      service_type: 'core',
      deliverables: [
        'Nastavení a správa reklamního účtu na Facebooku a Instagramu (Meta Ads)',
        'Nastavení přesného měření výkonu reklam na vašem e-shopu (Meta Pixel / Conversion API)',
        'Propojení katalogu produktů pro dynamické reklamy zobrazující vaše zboží',
        'Vytvoření kampaní na získávání nových zákazníků i oslovení těch, kteří váš e-shop už navštívili (remarketing)',
        'Tvorba reklamních textů přizpůsobených vašim produktům a cílové skupině',
        'Denní kontrola a pravidelná optimalizace kampaní pro co nejlepší využití rozpočtu',
        'Průběžné škálování kampaní, které přinášejí nejlepší výsledky',
        'Návrhy na vylepšení nabídky e-shopu – produktové balíčky, akce, kontrola nákupního procesu',
        'Zadávání grafických podkladů pro reklamy (bannery, videa) ve spolupráci s grafiky',
        'Online dashboard s výsledky kampaní dostupný 24/7 (Looker Studio)',
        'Měsíční report s vyhodnocením výkonu a plánem na další období',
      ],
      frequency: 'Průběžná správa, denní kontrola, měsíční reporting',
      turnaround: 'Nasazení do 5 pracovních dnů od startu',
      requirements: [
        'Přístupy do Meta Business Suite / Business Manager',
        'Přístup do reklamního účtu a stránek',
        'Podklady ke značce (loga, fonty, brandbook)',
        'Přístup do Google Analytics (pro propojení s Looker Studio)',
      ],
      start_timeline: 'Do 5 pracovních dnů od podpisu smlouvy',
      detailed_sections: [
        {
          emoji: '📐',
          title: 'Nastavení Meta Business Suite',
          items: [
            'Meta Pixel: Kontrola a nastavení pro přesné měření klíčových událostí na webu, případně implementace Conversion API (CAPI).',
            'Katalog produktů: Kontrola propojení a konfigurace katalogu produktů pro dynamické reklamy (DPA).',
            'Reklamní účet: Ověření správnosti nastavení reklamního účtu, včetně platebních údajů a propojení s dalšími nástroji.',
            'Meta Business Suite: Detailní kontrola propojení všech nástrojů (reklamní účet, pixel, katalog, stránky) v rámci Business Suite.',
          ],
        },
        {
          emoji: '🏗️',
          title: 'Struktura kampaní',
          items: [
            'Vytvoření základní struktury kampaní zaměřených na akvizici nových zákazníků a remarketing.',
            'Tvorba poutavých textů přizpůsobených cílové skupině a obchodním cílům.',
          ],
        },
        {
          emoji: '📊',
          title: 'Kontrola analytického měření',
          items: [
            'Kontrola a optimalizace měření klíčových událostí (nákupy, přidání do košíku, registrace) prostřednictvím modulů ve Shoptetu, Upgates nebo Shopify.',
          ],
        },
        {
          emoji: '📈',
          title: 'Tvorba dashboardu výsledků v Looker Studio',
          items: [
            'Reportovací šablona: Vytvoření přehledné šablony pro sledování výkonu kampaní.',
            'Propojení dat: Napojení Looker Studio na Google Ads, Meta Ads a Google Analytics.',
            'Vizualizace metrik: Přehledné zobrazení klíčových metrik (CPC, CTR, ROAS, konverze) pro snadné vyhodnocení kampaní.',
            'Automatizace dat: Nastavení automatické aktualizace a sdílení reportů pro přístup 24/7.',
          ],
        },
        {
          emoji: '🎯',
          title: 'Vylepšení nabídky',
          items: [
            'Návrh produktových balíčků (bundles) – kombinace produktů, které zvýší hodnotu objednávky a motivují zákazníky ke koupi.',
            'Doporučení slevových a akčních nabídek – strategické slevy, dárky k nákupu nebo limitované akce.',
            'Zvýraznění unikátní hodnoty nabídky – jasně komunikujeme, proč si zákazník má vybrat právě vás.',
            'Kontrola webu – identifikujeme bariéry v nákupním procesu a doporučíme úpravy pro vyšší míru dokončení nákupů.',
          ],
        },
      ],
    },
    {
      id: 'svc-2',
      service_id: 'service-cb',
      name: 'Creative Boost',
      description: 'Kreditový systém pro tvorbu reklamních kreativ',
      offer_description: 'Flexibilní tvorba reklamních kreativ na kreditovém systému – bannery, videa i AI fotografie. Platíte jen za to, co skutečně potřebujete.',
      price: 4000,
      currency: 'CZK',
      billing_type: 'monthly',
      selected_tier: null,
      service_type: 'addon',
      deliverables: [
        '10 kreditů měsíčně pro tvorbu reklamních materiálů',
        'Statické bannery pro Facebook a Instagram reklamy',
        'Krátká reklamní videa a animace',
        'AI generované produktové fotografie',
        'Zadání přes Freelo nebo Slack',
        'Standardní dodání do 3 pracovních dnů, express do 24 hodin',
        'První revize zdarma u každého výstupu',
      ],
      frequency: 'Průběžně dle potřeby v rámci měsíčního balíčku',
      turnaround: 'Standardní 3 dny, express 24 hodin',
      requirements: [
        'Brandbook a vizuální identita',
        'Loga v potřebných formátech (PNG, SVG)',
      ],
      start_timeline: 'Ihned po zahájení spolupráce',
    },
    {
      id: 'svc-3',
      service_id: 'service-audit',
      name: 'Úvodní audit reklamních účtů',
      description: 'Analýza současného stavu reklam',
      offer_description: 'Kompletní audit vašich reklamních účtů na Meta platformách s identifikací problémů, příležitostí a konkrétními doporučeními pro zlepšení výkonu.',
      price: 8000,
      currency: 'CZK',
      billing_type: 'one_off',
      selected_tier: null,
      service_type: 'addon',
      deliverables: [
        'Hloubková analýza struktury a nastavení reklamních účtů',
        'Kontrola správnosti měření konverzí (Pixel, CAPI)',
        'Analýza výkonu kampaní za posledních 6 měsíců',
        'Identifikace problémů a nevyužitých příležitostí',
        'Analýza konkurence (3 hlavní konkurenti)',
        'Konkrétní doporučení ke zlepšení (PDF report)',
        '60min konzultace k výsledkům auditu',
      ],
      frequency: 'Jednorázově',
      turnaround: 'Do 10 pracovních dnů',
      requirements: [
        'Přístupy do reklamních účtů (viewer)',
        'Přístup do Google Analytics',
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
      title: 'Ukázky kampaní pro e-shopy',
      url: 'https://www.canva.com/design/example2',
      type: 'presentation',
    },
  ],
  audit_summary: 'Reklamní účty na Meta platformách mají prostor pro výrazné zlepšení:\n\n• Chybí správné nastavení Pixelu a konverzního měření – nemůžete přesně vyhodnotit, co reklamy přinášejí.\n• Kampaně nemají optimální strukturu – chybí oddělení akvizice a remarketingu.\n• Katalog produktů není propojen – nevyužíváte dynamické reklamy, které zobrazují zákazníkům přesně to, co je zajímá.',
  recommendation_intro: 'Na základě auditu doporučujeme začít kompletním nastavením měření a struktury kampaní (Socials Boost) a paralelně zajistit pravidelnou tvorbu reklamních kreativ (Creative Boost), aby kampaně měly vždy čerstvé a relevantní vizuály.',
  custom_note: null,
  loom_url: null,
  currency: 'CZK',
  total_price: 41900,
  offer_type: 'retainer',
  valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  created_by: 'system',
  is_active: true,
  viewed_at: null,
  view_count: 0,
  estimated_start_date: 'Do 5 pracovních dnů od podpisu smlouvy',
  monthly_discount_percent: 10,
  discount_scope: 'core_only',
  // Contact person info
  owner_name: 'Daniel Bauer',
  owner_email: 'daniel@socials.cz',
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
  // Testovací tokeny - vždy vrátit testovací nabídku
  if (token === 'test-nabidka-123') {
    return TEST_OFFER;
  }
  if (token === 'test-addon-only') {
    return TEST_ADDON_ONLY_OFFER;
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
