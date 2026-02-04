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
  // Performance Marketing - Meta
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
  
  // Performance Marketing - Google
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
  
  // Performance Marketing - Sklik
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
  
  // Creative services
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
  
  // Social media management
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
  
  // Analytics
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
  
  // Consulting
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
  
  // Audit
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
  
  // Check each keyword set
  for (const [keyword, config] of Object.entries(SERVICE_DEFAULTS)) {
    if (nameLower.includes(keyword)) {
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
