// Detailed service descriptions with benefits, setup, management, and tier comparison

export interface SetupItem {
  title: string;
  items: string[];
}

export interface TierFeature {
  feature: string;
  growth: string | boolean;
  pro: string | boolean;
  elite: string | boolean;
}

export interface ServiceDetail {
  code: string;
  tagline: string;
  platforms: string[];
  targetAudience: string;
  benefits: string[];
  setup: SetupItem[];
  management: SetupItem[];
  tierComparison: TierFeature[];
  tierPricing?: {
    growth: { price: number; spend: string };
    pro: { price: number; spend: string };
    elite: { price: number; spend: string };
  };
  // For credit-based services like Creative Boost
  creditPricing?: {
    basePrice: number;
    currency: string;
    expressMultiplier: number;
    outputTypes: {
      name: string;
      credits: number;
      description: string;
    }[];
  };
}

export const SERVICE_DETAILS: Record<string, ServiceDetail> = {
  SOCIALS_BOOST: {
    code: 'SOCIALS_BOOST',
    tagline: 'Reklama na Facebooku a Instagramu pro e-shopy a služby',
    platforms: ['Meta Ads (Facebook, Instagram, Messenger)'],
    targetAudience: 'E-shopy a služby, které chtějí získat více zákazníků z Facebooku a Instagramu',
    benefits: [
      'Více zakázek a vyšší zisk – reklamy nastavíme tak, aby vám přinášely zákazníky, kteří nakupují.',
      'Méně starostí, více času na podnikání – postaráme se o celou správu výkonnostní reklamy.',
      'Partnera, který řeší výkon, ne jen reklamy – přemýšlíme nad vaším byznysem.',
      'Kompletní správu Meta Ads - Od nastavení účtů po průběžnou optimalizaci.',
    ],
    setup: [
      {
        title: 'Nastavení Meta Business Suite',
        items: [
          'Meta Pixel: Kontrola a nastavení pro přesné měření klíčových událostí na webu, případně implementace Conversion API (CAPI).',
          'Katalog produktů: Kontrola propojení a konfigurace katalogu produktů pro dynamické reklamy (DPA).',
          'Reklamní účet: Ověření správnosti nastavení reklamního účtu, včetně platebních údajů a propojení s dalšími nástroji.',
          'Meta Business Suite: Detailní kontrola propojení všech nástrojů v rámci Business Suite.',
          'Struktura kampaní: Vytvoření základní struktury kampaní zaměřených na akvizici nových zákazníků a remarketing.',
          'Textace reklam: Tvorba poutavých textů přizpůsobených cílové skupině a obchodním cílům.',
        ],
      },
      {
        title: 'Kontrola analytického měření',
        items: [
          'Účet a sledování: Kontrola a optimalizace měření klíčových událostí (nákupy, přidání do košíku, registrace) prostřednictvím modulů v Shoptetu, Upgates nebo Shopify.',
        ],
      },
      {
        title: 'Tvorba dashboardu v Looker Studio',
        items: [
          'Reportovací šablona: Vytvoření přehledné šablony pro sledování výkonu kampaní.',
          'Propojení dat: Napojení Looker Studio na Google Ads, Meta Ads a Google Analytics.',
          'Vizualizace metrik: Přehledné zobrazení klíčových metrik (CPC, CTR, ROAS, konverze).',
          'Automatizace dat: Nastavení automatické aktualizace a sdílení reportů pro přístup 24/7.',
        ],
      },
      {
        title: 'Vylepšení nabídky',
        items: [
          'Návrh produktových balíčků (bundles) – kombinace produktů, které zvýší hodnotu objednávky.',
          'Doporučení slevových a akčních nabídek – strategické slevy, dárky k nákupu nebo limitované akce.',
          'Zvýraznění unikátní hodnoty nabídky – jasná komunikace, proč si zákazník má vybrat právě vás.',
          'Kontrola webu – identifikace bariér v nákupním procesu a doporučení úprav.',
        ],
      },
    ],
    management: [
      {
        title: 'Správa Meta Ads',
        items: [
          'Analýza výkonu: Pravidelné sledování výsledků kampaní a identifikace, které reklamy neplní cíle.',
          'Tvorba nových kampaní a reklam: Vytváříme nové kampaně na základě analýzy dat a aktuálních potřeb.',
          'Škálování úspěšných kampaní: Kampaně s dobrými výsledky postupně navyšujeme.',
          'Spolupráce s grafiky: Pokud jsou potřeba nové vizuály, připravíme zadání pro grafiky.',
          'Monitoring měření (Pixel/CAPI): Průběžná kontrola správného měření klíčových událostí.',
        ],
      },
      {
        title: 'Reporting a komunikace',
        items: [
          'Video / textový report: Každý měsíc přehled fungování kampaní.',
          'Looker Studio report: Nepřetržitý přístup (24/7) k přehlednému reportu.',
          'Pravidelné konzultace: Strategické hovory o vývoji kampaní a dalším směřování.',
        ],
      },
    ],
    tierComparison: [
      { feature: 'Základní setup (Pixel, kampaně, textace)', growth: true, pro: true, elite: true },
      { feature: 'Analytické měření a Looker Studio', growth: true, pro: true, elite: true },
      { feature: 'Vylepšování atraktivity nabídky', growth: true, pro: true, elite: true },
      { feature: 'Zadávání reklamních kreativ', growth: true, pro: true, elite: true },
      { feature: 'Tvorba nových reklam', growth: '1-2x týdně', pro: '2-3x týdně', elite: '2-3x týdně' },
      { feature: 'Denní kontrola kampaní', growth: true, pro: true, elite: true },
      { feature: 'Optimalizace kampaní', growth: '1-2x týdně', pro: '2-3x týdně', elite: '3-4x týdně' },
      { feature: 'Psaní nových textů do reklam', growth: true, pro: true, elite: true },
      { feature: 'Komunikace přes Freelo', growth: true, pro: true, elite: true },
      { feature: '24/7 Looker Studio report', growth: true, pro: true, elite: true },
      { feature: 'Měsíční reporting', growth: 'Video/text/call', pro: 'Video/text/call', elite: 'Video/text/call' },
    ],
    tierPricing: {
      growth: { price: 15000, spend: 'do 400 000 Kč' },
      pro: { price: 25000, spend: '400 000 - 800 000 Kč' },
      elite: { price: 40000, spend: 'nad 800 000 Kč' },
    },
  },

  GOOGLE_ADS: {
    code: 'GOOGLE_ADS',
    tagline: 'Vyhledávací a nákupní reklamy pro e-shopy a služby',
    platforms: ['Google Ads (Search, Shopping, Display, YouTube)'],
    targetAudience: 'E-shopy a služby, které chtějí být vidět ve vyhledávání Google',
    benefits: [
      'Získejte zákazníky ve chvíli, kdy aktivně hledají vaše produkty nebo služby.',
      'Efektivní PMax a Shopping kampaně pro e-shopy s vysokým ROAS.',
      'Remarketing a display reklamy pro udržení povědomí o značce.',
      'Kompletní správa Google Ads od nastavení po optimalizaci.',
    ],
    setup: [
      {
        title: 'Nastavení Google Ads účtu',
        items: [
          'Struktura účtu: Vytvoření optimální struktury kampaní pro vaše cíle.',
          'Konverzní měření: Nastavení sledování klíčových konverzí.',
          'Merchant Center: Propojení a optimalizace produktového feedu.',
          'Remarketing publikum: Nastavení publik pro remarketing kampaně.',
        ],
      },
      {
        title: 'Tvorba kampaní',
        items: [
          'Search kampaně: Vyhledávací kampaně s relevantními klíčovými slovy.',
          'Shopping/PMax kampaně: Produktové kampaně s optimalizovaným feedem.',
          'Display a YouTube: Bannerové a video kampaně pro budování značky.',
        ],
      },
    ],
    management: [
      {
        title: 'Správa Google Ads',
        items: [
          'Optimalizace klíčových slov: Pravidelná aktualizace a vyloučení nerelevantních dotazů.',
          'A/B testování reklam: Testování různých variant reklam pro lepší CTR.',
          'Správa nabídek: Optimalizace CPC a cílových ROAS.',
          'Reporting: Měsíční reporty s přehledem výkonu.',
        ],
      },
    ],
    tierComparison: [
      { feature: 'Základní setup a struktura účtu', growth: true, pro: true, elite: true },
      { feature: 'Konverzní měření', growth: true, pro: true, elite: true },
      { feature: 'Search kampaně', growth: true, pro: true, elite: true },
      { feature: 'Shopping/PMax kampaně', growth: true, pro: true, elite: true },
      { feature: 'Optimalizace', growth: '1-2x týdně', pro: '2-3x týdně', elite: '3-4x týdně' },
      { feature: 'Reporting', growth: 'Měsíční', pro: 'Měsíční', elite: 'Měsíční' },
    ],
    tierPricing: {
      growth: { price: 15000, spend: 'do 400 000 Kč' },
      pro: { price: 25000, spend: '400 000 - 800 000 Kč' },
      elite: { price: 40000, spend: 'nad 800 000 Kč' },
    },
  },

  CREATIVE_BOOST: {
    code: 'CREATIVE_BOOST',
    tagline: 'Kreditový systém pro tvorbu reklamních kreativ',
    platforms: ['Bannery', 'Videa', 'AI foto'],
    targetAudience: 'Klienti, kteří potřebují pravidelnou tvorbu reklamních kreativ',
    benefits: [
      'Flexibilní kreditový systém – platíte jen za to, co skutečně potřebujete.',
      'Rychlé dodání – standardní nebo express delivery do 24 hodin.',
      'Profesionální kvalita – bannery, videa i AI generované fotografie.',
      'Transparentní ceník – jasně víte, kolik kredity stojí.',
    ],
    setup: [
      {
        title: 'Nastavení spolupráce',
        items: [
          'Definice měsíčního balíčku kreditů dle potřeb.',
          'Nastavení komunikačních kanálů (Freelo, Slack).',
          'Brief šablona pro zadávání kreativ.',
        ],
      },
    ],
    management: [
      {
        title: 'Průběžná tvorba',
        items: [
          'Zadání kreativy přes Freelo nebo Slack.',
          'Dodání v dohodnutém termínu.',
          'Revize dle potřeby (první revize zdarma).',
        ],
      },
    ],
    tierComparison: [],
    creditPricing: {
      basePrice: 400,
      currency: 'CZK',
      expressMultiplier: 1.5,
      outputTypes: [
        { name: 'Statický banner', credits: 1, description: '1 kredit za banner' },
        { name: 'Překlad banneru', credits: 0.5, description: '0.5 kreditu za překlad' },
        { name: 'Revize banneru', credits: 0.25, description: '0.25 kreditu za revizi' },
        { name: 'AI foto', credits: 2, description: '2 kredity za AI foto' },
        { name: 'Video (do 15s)', credits: 4, description: '4 kredity za krátké video' },
        { name: 'Video (15-30s)', credits: 6, description: '6 kreditů za video' },
        { name: 'Překlad videa', credits: 2, description: '2 kredity za překlad' },
        { name: 'Revize videa', credits: 1, description: '1 kredit za revizi' },
      ],
    },
  },

  SKLIK: {
    code: 'SKLIK',
    tagline: 'Reklama na Seznam.cz pro český trh',
    platforms: ['Sklik (Seznam.cz)'],
    targetAudience: 'Firmy cílící primárně na český trh',
    benefits: [
      'Dosah na české publikum, které používá Seznam jako vyhledávač.',
      'Nižší konkurence a CPC než u Google Ads.',
      'Kompletní správa Sklik kampaní.',
    ],
    setup: [
      {
        title: 'Nastavení Sklik účtu',
        items: [
          'Vytvoření struktury kampaní.',
          'Nastavení konverzního měření.',
          'Propojení s produktovým feedem pro Shopping kampaně.',
        ],
      },
    ],
    management: [
      {
        title: 'Správa Sklik',
        items: [
          'Pravidelná optimalizace klíčových slov.',
          'Testování reklam.',
          'Měsíční reporting.',
        ],
      },
    ],
    tierComparison: [
      { feature: 'Základní setup', growth: true, pro: true, elite: true },
      { feature: 'Search kampaně', growth: true, pro: true, elite: true },
      { feature: 'Shopping kampaně', growth: true, pro: true, elite: true },
      { feature: 'Optimalizace', growth: '1-2x týdně', pro: '2-3x týdně', elite: '3-4x týdně' },
    ],
    tierPricing: {
      growth: { price: 10000, spend: 'do 100 000 Kč' },
      pro: { price: 15000, spend: '100 000 - 300 000 Kč' },
      elite: { price: 25000, spend: 'nad 300 000 Kč' },
    },
  },

  ANALYTICS: {
    code: 'ANALYTICS',
    tagline: 'Měření a analýza výkonu vašeho webu a kampaní',
    platforms: ['Google Analytics 4', 'Google Tag Manager', 'Looker Studio'],
    targetAudience: 'Firmy, které chtějí lépe rozumět svým datům',
    benefits: [
      'Přesné měření konverzí a atribuce.',
      'Přehledné dashboardy s klíčovými metrikami.',
      'Datově podložená rozhodnutí.',
    ],
    setup: [
      {
        title: 'Implementace měření',
        items: [
          'Google Analytics 4: Nastavení měření událostí a konverzí.',
          'Google Tag Manager: Implementace tagů bez zásahu do kódu.',
          'Enhanced Ecommerce: Měření nákupního procesu.',
        ],
      },
    ],
    management: [
      {
        title: 'Průběžná analytika',
        items: [
          'Kontrola správnosti měření.',
          'Tvorba a aktualizace reportů.',
          'Analytické konzultace.',
        ],
      },
    ],
    tierComparison: [],
  },

  CONSULTING: {
    code: 'CONSULTING',
    tagline: 'Strategické poradenství pro váš online marketing',
    platforms: ['Všechny platformy'],
    targetAudience: 'Firmy, které potřebují strategický pohled na svůj marketing',
    benefits: [
      'Nezávislý pohled na vaši marketingovou strategii.',
      'Doporučení pro optimalizaci rozpočtu a kanálů.',
      'Pomoc s výběrem dodavatelů a nástrojů.',
    ],
    setup: [],
    management: [
      {
        title: 'Konzultační služby',
        items: [
          'Úvodní audit současného stavu.',
          'Strategická doporučení.',
          'Pravidelné konzultace dle potřeby.',
        ],
      },
    ],
    tierComparison: [],
  },
};

// Helper function to get service detail by code
export const getServiceDetail = (code: string): ServiceDetail | undefined => {
  return SERVICE_DETAILS[code];
};
