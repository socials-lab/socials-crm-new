/**
 * Default deliverables, requirements, and detailed sections for services
 * Used as fallback when service doesn't have custom defaults in database
 */

import type { ServiceDetailSection } from '@/types/publicOffer';

interface ServiceDefaultConfig {
  deliverables: string[];
  frequency: string;
  turnaround: string;
  requirements: string[];
  detailed_sections: ServiceDetailSection[];
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
    detailed_sections: [
      {
        emoji: '📐',
        title: 'Úvodní nastavení projektu',
        items: [
          'Nastavení Meta Business Suite: Kontrola a nastavení Meta Pixel pro přesné měření klíčových událostí na webu, případně implementace Conversion API (CAPI).',
          'Katalog produktů: Kontrola propojení a konfigurace katalogu produktů pro dynamické reklamy (DPA).',
          'Reklamní účet: Ověření správnosti nastavení reklamního účtu, včetně platebních údajů a propojení s dalšími nástroji.',
          'Meta Business Suite: Detailní kontrola propojení všech nástrojů (reklamní účet, pixel, katalog, stránky) v rámci Business Suite.',
          'Struktura kampaní: Vytvoření základní struktury kampaní zaměřených na akvizici nových zákazníků a remarketing.',
          'Textace reklam: Tvorba poutavých textů přizpůsobených cílové skupině a obchodním cílům.',
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
          'Doporučení slevových a akčních nabídek – strategické slevy, dárky k nákupu nebo limitované akce, které podpoří rychlejší rozhodnutí zákazníků.',
          'Zvýraznění unikátní hodnoty nabídky – jasně komunikujeme, proč si zákazník má vybrat právě vás (doprava zdarma, garance spokojenosti, prémiová kvalita apod.).',
          'Kontrola webu – identifikujeme bariéry v nákupním procesu (např. složitý checkout, nejasné informace) a doporučíme úpravy pro vyšší míru dokončení nákupů.',
        ],
      },
      {
        emoji: '🔄',
        title: 'Průběžná správa',
        items: [
          'Denní kontrola výkonu kampaní a rozpočtů – zajištění optimálního využití reklamního spendu.',
          'Průběžná optimalizace cílení, bidding strategie a kreativ na základě aktuálních dat.',
          'Škálování úspěšných kampaní – navyšování rozpočtu u kampaní s nejlepším výkonem.',
          'Testování nových formátů a přístupů (A/B testy, nové audience segmenty).',
          'Pravidelná aktualizace produktového katalogu a dynamických reklam.',
          'Koordinace se členy týmu při tvorbě nových reklamních materiálů.',
          'Měsíční reporting s vyhodnocením klíčových metrik a plánem na další období.',
        ],
      },
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
    detailed_sections: [
      {
        emoji: '📐',
        title: 'Úvodní nastavení projektu',
        items: [
          'Google Ads: Nastavení struktury účtu, konverzního měření a propojení s Merchant Center.',
          'Sklik: Nastavení účtu, konverzí a propojení s produktovým feedem.',
          'Produktový feed: Kontrola a optimalizace feedu pro Shopping kampaně na obou platformách.',
          'Konverzní měření: Ověření správného sledování nákupů, přidání do košíku a dalších klíčových událostí.',
          'Struktura kampaní: Vytvoření Search, Shopping/PMax a remarketing kampaní.',
        ],
      },
      {
        emoji: '📊',
        title: 'Tvorba dashboardu v Looker Studio',
        items: [
          'Propojení dat z Google Ads, Sklik a Google Analytics do jednoho přehledného dashboardu.',
          'Vizualizace klíčových metrik: CPC, CTR, ROAS, konverze, náklady na konverzi.',
          'Porovnání výkonu Google Ads vs. Sklik pro optimální alokaci rozpočtu.',
          'Automatizace dat a sdílení reportů pro přístup 24/7.',
        ],
      },
      {
        emoji: '🔄',
        title: 'Průběžná správa',
        items: [
          'Denní kontrola výkonu kampaní na obou platformách.',
          'Optimalizace klíčových slov – přidávání relevantních, vylučování neefektivních.',
          'Průběžné úpravy bidding strategie pro maximalizaci ROAS.',
          'A/B testování reklamních textů a rozšíření reklam.',
          'Škálování úspěšných kampaní a přerozdělovánú rozpočtu.',
          'Měsíční reporting s analýzou výkonu a strategickými doporučeními.',
        ],
      },
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
    detailed_sections: [
      {
        emoji: '📐',
        title: 'Úvodní nastavení projektu',
        items: [
          'Meta: Nastavení Pixel/CAPI, propojení katalogu produktů, nastavení Business Suite.',
          'Google Ads: Nastavení účtu, Merchant Center, konverzního měření.',
          'Sklik: Nastavení účtu, produktového feedu a konverzí.',
          'Struktura kampaní: Vytvoření kampaní na všech platformách (akvizice, remarketing, Shopping).',
          'Textace a kreativy: Tvorba reklamních textů optimalizovaných pro každou platformu.',
        ],
      },
      {
        emoji: '📊',
        title: 'Jednotný dashboard a analytika',
        items: [
          'Vytvoření dashboardu v Looker Studio propojujícího data ze všech platforem.',
          'Cross-platform porovnání výkonu pro optimální rozhodování o rozpočtu.',
          'Kontrola analytického měření na webu (GA4, konverzní události).',
          'Automatizace reportů pro přístup 24/7.',
        ],
      },
      {
        emoji: '🎯',
        title: 'Vylepšení nabídky a webu',
        items: [
          'Návrh produktových balíčků a akčních nabídek pro zvýšení hodnoty objednávky.',
          'Kontrola nákupního procesu – identifikace bariér a doporučení úprav.',
          'Zvýraznění unikátní hodnoty vaší značky v reklamních materiálech.',
        ],
      },
      {
        emoji: '🔄',
        title: 'Průběžná správa',
        items: [
          'Denní kontrola výkonu kampaní na Meta, Google a Sklik.',
          'Cross-platform optimalizace – přesouvání rozpočtu na nejefektivnější kanály.',
          'Průběžná optimalizace cílení, bidding strategie a kreativ.',
          'Koordinovaná strategie napříč platformami pro maximální synergie.',
          'Škálování úspěšných kampaní a testování nových přístupů.',
          'Měsíční reporting s komplexní analýzou výkonu všech kanálů.',
        ],
      },
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
    detailed_sections: [],
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
    detailed_sections: [],
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
    detailed_sections: [],
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
    detailed_sections: [],
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
    detailed_sections: [],
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
    detailed_sections: [],
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
    detailed_sections: [],
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
    detailed_sections: [],
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
  detailed_sections: [],
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
  customDetailedSections?: ServiceDetailSection[] | null,
): ServiceDefaultConfig {
  const defaults = getServiceDefaults(serviceName);
  
  return {
    deliverables: customDeliverables?.length ? customDeliverables : defaults.deliverables,
    frequency: customFrequency?.trim() || defaults.frequency,
    turnaround: customTurnaround?.trim() || defaults.turnaround,
    requirements: customRequirements?.length ? customRequirements : defaults.requirements,
    detailed_sections: customDetailedSections?.length ? customDetailedSections : defaults.detailed_sections,
  };
}
