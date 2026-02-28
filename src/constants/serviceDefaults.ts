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

// Keyword-based defaults - matched by service name (exact or includes)
const SERVICE_DEFAULTS: Record<string, ServiceDefaultConfig> = {
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
      { emoji: '📐', title: 'Úvodní nastavení projektu', items: ['Nastavení Meta Business Suite: Kontrola a nastavení Meta Pixel pro přesné měření klíčových událostí na webu, případně implementace Conversion API (CAPI).', 'Katalog produktů: Kontrola propojení a konfigurace katalogu produktů pro dynamické reklamy (DPA).', 'Reklamní účet: Ověření správnosti nastavení reklamního účtu.', 'Struktura kampaní: Vytvoření základní struktury kampaní zaměřených na akvizici a remarketing.', 'Textace reklam: Tvorba poutavých textů přizpůsobených cílové skupině.'] },
      { emoji: '📊', title: 'Kontrola analytického měření', items: ['Kontrola a optimalizace měření klíčových událostí (nákupy, přidání do košíku, registrace) prostřednictvím modulů ve Shoptetu, Upgates nebo Shopify.'] },
      { emoji: '📈', title: 'Tvorba dashboardu v Looker Studio', items: ['Reportovací šablona pro sledování výkonu kampaní.', 'Propojení dat: Napojení Looker Studio na Google Ads, Meta Ads a Google Analytics.', 'Vizualizace metrik: CPC, CTR, ROAS, konverze.', 'Automatizace dat: Nastavení automatické aktualizace a sdílení reportů pro přístup 24/7.'] },
      { emoji: '🎯', title: 'Vylepšení nabídky', items: ['Návrh produktových balíčků (bundles).', 'Doporučení slevových a akčních nabídek.', 'Zvýraznění unikátní hodnoty nabídky.', 'Kontrola webu – identifikace bariér v nákupním procesu.'] },
      { emoji: '🔄', title: 'Průběžná správa', items: ['Denní kontrola výkonu kampaní a rozpočtů.', 'Průběžná optimalizace cílení, bidding strategie a kreativ.', 'Škálování úspěšných kampaní.', 'Testování nových formátů (A/B testy).', 'Měsíční reporting s vyhodnocením klíčových metrik.'] },
    ],
  },
  'ppc boost': {
    deliverables: [
      'Kompletní nastavení a správa Google Ads i Sklik',
      'Nastavení přesného měření výkonu reklam',
      'Google Shopping, DSA, PMax, Search, Display a remarketing kampaně na Google',
      'Kampaně ve vyhledávání, obsahové síti a remarketing na S-kliku',
      'Optimalizace produktového feedu přes Mergado',
      'Tvorba dashboardu v Looker Studio',
      'Měsíční report s vyhodnocením výkonu',
    ],
    frequency: 'Průběžná správa, denní kontrola, měsíční reporting',
    turnaround: 'Nasazení do 5 pracovních dnů od startu',
    requirements: ['Přístupy do Google Ads účtu', 'Přístupy do Sklik účtu', 'Přístup do Google Merchant Center', 'Přístup do Google Analytics', 'Správně nastavený produktový feed'],
    detailed_sections: [
      { emoji: '📈', title: 'Nastavení Google Ads a S-kliku', items: ['Reklamní účet: Kontrola a optimalizace nastavení.', 'Google Merchant Center: Kontrola propojení a synchronizace produktového feedu.', 'Struktura kampaní: Návrh a vytvoření struktury kampaní.', 'Sledování konverzí: Nastavení prostřednictvím modulů v Shoptetu.'] },
      { emoji: '💹', title: 'Kontrola analytického měření', items: ['Kontrola měření klíčových událostí.', 'Integrace GA4 s Google Ads, Looker Studio.'] },
      { emoji: '💻', title: 'Správa Google Ads', items: ['Google Shopping kampaně.', 'DSA a PMax kampaně.', 'Kampaně ve vyhledávání.', 'Display a remarketing.', 'Úprava produktového feedu přes Mergado.'] },
      { emoji: '🌐', title: 'Správa S-kliku', items: ['Kampaně ve vyhledávání.', 'Obsahová síť a remarketing.', 'Správa klíčových slov.', 'Optimalizace kampaní.'] },
      { emoji: '💬', title: 'Reporting a komunikace', items: ['Video / textový report měsíčně.', 'Looker Studio report 24/7.', 'Pravidelné konzultace.'] },
    ],
  },
  'performance boost': {
    deliverables: [
      'Kompletní správa Meta Ads – Pixel/CAPI, kampaně, remarketing, kreativy',
      'Kompletní správa Google Ads – Search, Shopping/PMax, remarketing',
      'Kompletní správa Sklik – kampaně, produktový feed, konverze',
      'Jednotný dashboard v Looker Studio',
      'Cross-platform optimalizace rozpočtu',
      'Měsíční reporting s analýzou výkonu napříč kanály',
    ],
    frequency: 'Průběžná správa, denní kontrola, měsíční reporting',
    turnaround: 'Nasazení do 5 pracovních dnů od startu',
    requirements: ['Přístupy do Meta Business Suite', 'Přístupy do Google Ads a Merchant Center', 'Přístupy do Sklik účtu', 'Přístup do Google Analytics', 'Podklady ke značce'],
    detailed_sections: [
      { emoji: '📐', title: 'Úvodní nastavení projektu', items: ['Meta: Nastavení Pixel/CAPI, propojení katalogu.', 'Google Ads: Nastavení účtu, Merchant Center.', 'Sklik: Nastavení účtu, produktového feedu.', 'Struktura kampaní na všech platformách.'] },
      { emoji: '📊', title: 'Jednotný dashboard a analytika', items: ['Dashboard v Looker Studio propojující data ze všech platforem.', 'Cross-platform porovnání výkonu.'] },
      { emoji: '🔄', title: 'Průběžná správa', items: ['Denní kontrola na Meta, Google a Sklik.', 'Cross-platform optimalizace rozpočtu.', 'Měsíční reporting s komplexní analýzou.'] },
    ],
  },
  'creative boost': {
    deliverables: [
      'Hledáme správné úhly komunikace (problém → řešení, emoce, racionalita, USP)',
      'Navrhujeme jasné prodejní texty',
      'Tvoříme výkonnostní bannery a videa',
      'Flexibilní kreditový systém (1 kredit = 400 Kč bez DPH)',
      'Standardní dodání do 72 hodin, express do 48 hodin za +50 % kreditů',
    ],
    frequency: 'Průběžná tvorba dle objednávek, měsíční saldo kreditů',
    turnaround: 'Standardní dodání do 72 hodin, express do 48 hodin',
    requirements: ['Cíle kampaní a produkty k propagaci', 'Vstupní materiály (fotky, videa)', 'Brandbook a vizuální identita', 'Přístup do Freelo pro zadávání požadavků'],
    detailed_sections: [
      { emoji: '💳', title: 'Jak funguje systém kreditů', items: ['1 kredit = 400 Kč (bez DPH).', 'Na začátku měsíce domluva na orientačním počtu kreditů.', 'Na konci měsíce fakturujeme reálně vyčerpané kredity.'] },
      { emoji: '🖼️', title: 'Hodnota výstupů – Bannery', items: ['Rámeček pro katalogové Meta Ads: 1 kredit', 'Meta Ads bannery 2 rozměry: 4 kredity / pack', 'Set PPC bannerů: 1 kredit / rozměr', 'Revize: 1 revizní kolo zdarma, další 1 kredit.'] },
      { emoji: '🎥', title: 'Hodnota výstupů – Videa', items: ['Video Standard: 12 kreditů / pack (3 videa)', 'Video AI b-roll: 17 kreditů / pack', 'Překlad videa: 2 kredity.', 'Revize: 1 kolo zdarma, další 1 kredit.'] },
      { emoji: '⚡', title: 'Expresní dodání (48 h)', items: ['Standardně do 72 hodin.', 'Express do 48 hodin za +50 % kreditů.'] },
    ],
  },
  'video boost': {
    deliverables: [
      'Videa, která prodávají – jasná nabídka, benefit a silné CTA',
      'Rychlá produkce (vaše záběry + AI voiceover, titulky, b-rolly)',
      '3 různé hooky pro A/B testování',
      'Formát 9:16, 15–30 sekund, připravené do reklam',
      '1 kolo revizí v ceně',
    ],
    frequency: 'Průběžně dle objednávek',
    turnaround: 'Standardní dodání do 5 pracovních dnů',
    requirements: ['Záběry produktu/služby', 'Cíle a účel videa', 'Produkty/služby k propagaci'],
    detailed_sections: [
      { emoji: '🎯', title: 'Účel videa a nabídka', items: ['Co se má komunikovat – sleva, akce, dárek, benefit.', 'Účel videa – akvizice, remarketing, podpora kampaně.'] },
      { emoji: '📝', title: 'Scénář a voiceover', items: ['Kreativní úhel videa.', 'Voiceover script: HOOK (3 varianty), MAIN, CTA.', 'Schválení textu před střihem.'] },
      { emoji: '🎬', title: 'Střih videa a AI prvky', items: ['Využití vašich záběrů.', 'AI voiceover a titulky.', 'Výstup 9:16, 15–30 sekund.'] },
      { emoji: '📦', title: 'Varianty a ceny', items: ['Standard: 4 900 Kč / video. Balíček 3 videí: 13 230 Kč.', 'AI b-roll: 6 900 Kč / video. Balíček 3 videí: 18 630 Kč.'] },
    ],
  },
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
    detailed_sections: [],
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
    detailed_sections: [],
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
    detailed_sections: [],
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
    detailed_sections: [],
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
    detailed_sections: [],
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
    detailed_sections: [],
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
 * Matches exact or partial keywords (case-insensitive). Longer/more specific keys first.
 */
export function getServiceDefaults(serviceName: string): ServiceDefaultConfig {
  const nameLower = serviceName.toLowerCase();
  const entries = Object.entries(SERVICE_DEFAULTS);
  // Prefer exact match, then longer keyword matches
  const sorted = [...entries].sort((a, b) => b[0].length - a[0].length);
  for (const [keyword, config] of sorted) {
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
