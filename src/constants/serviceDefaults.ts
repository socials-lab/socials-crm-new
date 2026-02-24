/**
 * Default deliverables and requirements for services
 * Used as fallback when service doesn't have custom defaults in database
 */

interface ServiceDefaultConfig {
  deliverables: string[];
  frequency: string;
  turnaround: string;
  requirements: string[];
}

// Keyword-based defaults - matched by service name
const SERVICE_DEFAULTS: Record<string, ServiceDefaultConfig> = {
  // ─── Socials Boost (Meta Ads) ───
  'socials boost': {
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
  },

  // ─── PPC Boost (Google Ads + Sklik) ───
  'ppc boost': {
    deliverables: [
      'Kompletní nastavení Google Ads i Sklik – struktura účtů, konverzní měření, Merchant Center',
      'Search kampaně s relevantními klíčovými slovy na Google i Seznamu',
      'Shopping/PMax kampaně s optimalizovaným produktovým feedem',
      'Remarketing kampaně pro opětovné oslovení návštěvníků',
      'Tvorba dashboardu v Looker Studio s propojením Google Ads, Sklik a Google Analytics',
      'Pravidelná optimalizace klíčových slov, bidding strategie a CPC',
      'A/B testování reklam pro zlepšení CTR a konverzního poměru',
      'Synergická správa obou platforem pro maximální efektivitu',
      'Měsíční reporting s přehledem výkonu a strategickými doporučeními',
    ],
    frequency: 'Průběžná správa, denní kontrola, měsíční reporting',
    turnaround: 'Nasazení do 5 pracovních dnů od startu',
    requirements: [
      'Přístupy do Google Ads účtu',
      'Přístupy do Sklik účtu',
      'Přístup do Google Merchant Center',
      'Přístup do Google Analytics',
      'Správně nastavený produktový feed',
    ],
  },

  // ─── Performance Boost (Meta + Google + Sklik) ───
  'performance boost': {
    deliverables: [
      'Kompletní správa Meta Ads – Pixel/CAPI, kampaně, remarketing, kreativy',
      'Kompletní správa Google Ads – Search, Shopping/PMax, remarketing',
      'Kompletní správa Sklik – kampaně, produktový feed, konverze',
      'Jednotný dashboard v Looker Studio pro všechny platformy',
      'Cross-platform optimalizace rozpočtu – alokace spendu tam, kde přináší nejlepší výsledky',
      'Koordinovaná strategie napříč Meta, Google a Seznam pro maximální dosah',
      'Strategické vylepšování atraktivity nabídky a kontrola webu',
      'Denní kontrola a průběžná optimalizace všech platforem',
      'Spolupráce s grafiky na reklamních kreativách',
      'Měsíční reporting s analýzou výkonu napříč všemi kanály',
      'Zvýhodněná cena oproti samostatným balíčkům Socials Boost + PPC Boost',
    ],
    frequency: 'Průběžná správa, denní kontrola, měsíční reporting',
    turnaround: 'Nasazení do 5 pracovních dnů od startu',
    requirements: [
      'Přístupy do Meta Business Suite / Business Manager',
      'Přístupy do Google Ads a Google Merchant Center',
      'Přístupy do Sklik účtu',
      'Přístup do Google Analytics',
      'Podklady ke značce (loga, fonty, brandbook)',
    ],
  },

  // ─── Fallback keyword matches ───
  'meta': {
    deliverables: [
      'Správa reklamních kampaní na Meta platformách (Facebook & Instagram)',
      'Pravidelná optimalizace kampaní a cílení',
      'A/B testování reklamních kreativ',
      'Měsíční reporting s klíčovými metrikami',
      'Strategická doporučení pro zlepšení výkonu',
    ],
    frequency: 'Průběžná správa, měsíční reporting',
    turnaround: 'Nasazení do 5 pracovních dnů od startu',
    requirements: [
      'Přístupy do Meta Business Suite / Business Manager',
      'Přístup do reklamního účtu',
      'Podklady ke značce (loga, fonty, brandbook)',
    ],
  },

  'google': {
    deliverables: [
      'Správa kampaní v Google Ads (Search, Display, Performance Max)',
      'Pravidelná optimalizace klíčových slov a bidding strategie',
      'Správa rozšíření reklam a cílení',
      'Měsíční reporting s analýzou výkonu',
      'Doporučení pro zlepšení konverzního poměru',
    ],
    frequency: 'Průběžná správa, měsíční reporting',
    turnaround: 'Nasazení do 5 pracovních dnů od startu',
    requirements: [
      'Přístupy do Google Ads účtu',
      'Přístup do Google Analytics',
      'Správně nastavené konverzní sledování',
    ],
  },

  'sklik': {
    deliverables: [
      'Správa kampaní na Skliku',
      'Optimalizace klíčových slov a CPC',
      'Měsíční reporting',
    ],
    frequency: 'Průběžná správa, měsíční reporting',
    turnaround: 'Nasazení do 5 pracovních dnů od startu',
    requirements: [
      'Přístupy do Sklik účtu',
      'Přístup do Google Analytics nebo jiného měřicího nástroje',
    ],
  },

  'creative': {
    deliverables: [
      'Kreativní koncepty pro reklamní kampaně',
      'Grafické podklady pro reklamy (statické i animované)',
      'Adaptace pro různé formáty a platformy',
    ],
    frequency: 'Dle dohodnutého objemu',
    turnaround: 'Do 7 pracovních dnů od zadání',
    requirements: [
      'Brandbook a vizuální identita',
      'Loga v potřebných formátech',
      'Reference a inspirace (volitelné)',
    ],
  },

  'social': {
    deliverables: [
      'Správa sociálních sítí dle zvoleného balíčku',
      'Tvorba obsahu (posty, stories, reels)',
      'Community management a odpovídání na komentáře',
      'Měsíční reporting engagement metriky',
    ],
    frequency: '8 příspěvků měsíčně (dle balíčku)',
    turnaround: 'Obsahový plán předem na měsíc',
    requirements: [
      'Přístupy k sociálním sítím',
      'Foto/video materiály nebo možnost focení',
      'Schvalovací proces pro obsah',
    ],
  },

  'analytics': {
    deliverables: [
      'Nastavení nebo audit měřicího systému',
      'Konfigurace konverzních událostí',
      'Dashboardy s klíčovými KPIs',
      'Pravidelné analytické reporty',
    ],
    frequency: 'Měsíční reporting',
    turnaround: 'Prvotní nastavení do 10 pracovních dnů',
    requirements: [
      'Přístupy do Google Analytics / GA4',
      'Přístup do Google Tag Manageru',
      'Seznam klíčových konverzí k měření',
    ],
  },

  'consult': {
    deliverables: [
      'Strategické konzultace a poradenství',
      'Analýza a doporučení',
      'Akční plán s prioritami',
    ],
    frequency: 'Dle dohody',
    turnaround: 'Flexibilní dle rozsahu',
    requirements: [
      'Podklady k současnému stavu',
      'Definované cíle a KPIs',
    ],
  },

  'audit': {
    deliverables: [
      'Hloubková analýza reklamních účtů',
      'Identifikace problémů a příležitostí',
      'Konkrétní doporučení ke zlepšení',
      'Prioritizovaný akční plán',
    ],
    frequency: 'Jednorázově',
    turnaround: 'Do 10 pracovních dnů',
    requirements: [
      'Přístupy do všech analyzovaných účtů',
      'Historická data min. za 3 měsíce',
    ],
  },
};

// Generic fallback for services that don't match any keyword
const GENERIC_DEFAULTS: ServiceDefaultConfig = {
  deliverables: [
    'Realizace služby dle specifikace',
    'Pravidelná komunikace o průběhu',
    'Reporting a vyhodnocení',
  ],
  frequency: 'Dle dohody',
  turnaround: 'Dle rozsahu projektu',
  requirements: [
    'Potřebné přístupy a podklady',
    'Kontaktní osoba pro komunikaci',
  ],
};

/**
 * Get default values for a service based on its name
 * Matches keywords in the service name (case-insensitive)
 */
export function getServiceDefaults(serviceName: string): ServiceDefaultConfig {
  const nameLower = serviceName.toLowerCase();
  
  // First try exact match on full name (for specific bundles like "Socials Boost")
  for (const [keyword, config] of Object.entries(SERVICE_DEFAULTS)) {
    if (nameLower === keyword || nameLower.includes(keyword)) {
      return config;
    }
  }
  
  return GENERIC_DEFAULTS;
}

/**
 * Merge service defaults with any custom values from the service definition
 * Custom values take precedence over defaults
 */
export function mergeWithDefaults(
  serviceName: string,
  customDeliverables?: string[] | null,
  customFrequency?: string | null,
  customTurnaround?: string | null,
  customRequirements?: string[] | null,
): ServiceDefaultConfig {
  const defaults = getServiceDefaults(serviceName);
  
  return {
    deliverables: customDeliverables?.length ? customDeliverables : defaults.deliverables,
    frequency: customFrequency?.trim() || defaults.frequency,
    turnaround: customTurnaround?.trim() || defaults.turnaround,
    requirements: customRequirements?.length ? customRequirements : defaults.requirements,
  };
}
