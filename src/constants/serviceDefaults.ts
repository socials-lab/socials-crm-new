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
      'Kompletní nastavení a správa Google Ads i Sklik – od struktury účtů po průběžnou optimalizaci',
      'Nastavení přesného měření výkonu reklam (konverze, nákupy, přidání do košíku)',
      'Google Shopping, DSA, PMax, Search, Display a remarketing kampaně na Google',
      'Kampaně ve vyhledávání, obsahové síti a remarketing na S-kliku',
      'Optimalizace produktového feedu přes Mergado',
      'Denní kontrola a pravidelná optimalizace kampaní pro co nejlepší využití rozpočtu',
      'Strategické vylepšování atraktivity vaší nabídky – akce, balíčky, kontrola nákupního procesu',
      'Tvorba dashboardu v Looker Studio s propojením Google Ads, Sklik a Google Analytics',
      'Měsíční report s vyhodnocením výkonu a plánem na další období',
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
        emoji: '📈',
        title: 'Nastavení Google Ads a S-kliku',
        items: [
          'Reklamní účet: Kontrola a optimalizace nastavení reklamních účtů, včetně platebních údajů.',
          'Google Merchant Center: Kontrola propojení účtu a synchronizace produktového feedu.',
          'Produktový feed: Analýza a úprava feedu prostřednictvím nástroje Mergado (pokud bude potřeba).',
          'Struktura kampaní: Návrh a vytvoření struktury kampaní (vyhledávací, display, shopping, remarketing).',
          'Sledování konverzí: Nastavení sledování konverzí prostřednictvím předpřipravených modulů v Shoptetu.',
          'Propojení nástrojů: Synchronizace s Google Analytics a dalšími relevantními nástroji.',
          'Cílení: Optimalizace cílení podle lokality, demografie a zájmů.',
        ],
      },
      {
        emoji: '💹',
        title: 'Kontrola nastavení analytického měření',
        items: [
          'Účet a sledování: Kontrola a optimalizace měření klíčových událostí (nákupy, přidání do košíku, registrace) prostřednictvím modulů v Shoptetu, Upgates nebo Shopify.',
          'Propojení s nástroji: Integrace GA4 s Google Ads, Looker Studio a dalšími systémy pro komplexní analýzu dat.',
        ],
      },
      {
        emoji: '📊',
        title: 'Tvorba dashboardu výsledků v Looker Studio',
        items: [
          'Reportovací šablona: Vytvoření přehledné šablony pro sledování výkonu kampaní.',
          'Propojení dat: Napojení Looker Studio na Google Ads, Meta Ads a Google Analytics.',
          'Vizualizace metrik: Přehledné zobrazení klíčových metrik (CPC, CTR, ROAS, konverze) pro snadné vyhodnocení kampaní.',
          'Automatizace dat: Nastavení automatické aktualizace a sdílení reportů pro přístup 24/7.',
        ],
      },
      {
        emoji: '💻',
        title: 'Správa Google Ads',
        items: [
          'Google Shopping kampaně: Propagujeme vaše produkty pomocí Shopping kampaní s vysokým potenciálem nákupu.',
          'DSA kampaně (Dynamic Search Ads): Dynamické reklamy cílí na relevantní vyhledávací dotazy.',
          'Performance Max kampaně (PMax): Kampaně kombinující různé reklamní formáty napříč celým Google ekosystémem.',
          'Kampaně ve vyhledávání: Spravujeme kampaně zaměřené na konkrétní klíčová slova.',
          'Display kampaně: Vizuální reklamy v obsahové síti budující povědomí o značce.',
          'Remarketing: Znovu oslovujeme návštěvníky vašeho e-shopu pomocí personalizovaných reklam.',
          'Úprava produktového feedu: Optimalizace feedu přes Mergado pro Shopping a PMax kampaně.',
          'Sledování konverzí: Průběžná kontrola měření konverzí pro přesné vyhodnocení výkonu.',
        ],
      },
      {
        emoji: '🌐',
        title: 'Správa S-kliku',
        items: [
          'Kampaně ve vyhledávání: Optimalizujeme kampaně zaměřené na relevantní klíčová slova.',
          'Obsahová síť: Vizuální kampaně budující povědomí o značce a podporující remarketing.',
          'Remarketing: Oslovujeme uživatele, kteří již navštívili váš e-shop.',
          'Správa klíčových slov: Přizpůsobujeme klíčová slova českému publiku.',
          'Optimalizace kampaní: Průběžně sledujeme výkon, přizpůsobujeme rozpočty a testujeme nové strategie.',
        ],
      },
      {
        emoji: '💬',
        title: 'Reporting a komunikace',
        items: [
          'Video / textový report: Každý měsíc připravíme souhrn fungování kampaní formou videa nebo textu.',
          'Looker Studio report: Nepřetržitý přístup (24/7) k přehlednému reportu s klíčovými metrikami.',
          'Pravidelné konzultace: Strategické hovory k vývoji kampaní a dalšímu směřování.',
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

  'creative boost': {
    deliverables: [
      'Hledáme správné úhly komunikace (problém → řešení, emoce, racionalita, USP)',
      'Navrhujeme jasné prodejní texty, které umí vysvětlit hodnotu v pár vteřinách',
      'Tvoříme výkonnostní bannery a videa tak, aby dávala smysl z pohledu algoritmu',
      'Připravujeme více konceptů a hooků, které se dají reálně testovat a škálovat',
      'Flexibilní kreditový systém (1 kredit = 400 Kč bez DPH)',
      'Standardní dodání do 72 hodin, express do 48 hodin za +50 % kreditů',
    ],
    frequency: 'Průběžná tvorba dle objednávek, měsíční saldo kreditů',
    turnaround: 'Standardní dodání do 72 hodin, express do 48 hodin',
    requirements: [
      'Cíle kampaní a produkty k propagaci',
      'Vstupní materiály (fotky, videa, produktové podklady)',
      'Brandbook a vizuální identita (loga, fonty)',
      'Přístup do Freelo pro zadávání požadavků',
    ],
    detailed_sections: [
      {
        emoji: '💳',
        title: 'Jak funguje systém kreditů',
        items: [
          '1 kredit = 400 Kč (bez DPH). Každý typ výstupu (bannery, videa, úpravy, překlady) má předem danou kreditovou hodnotu.',
          'Na začátku měsíce se domluvíme na orientačním nebo maximálním počtu kreditů, podle plánované práce.',
          'Na konci měsíce vám vyfakturujeme reálně vyčerpané kredity. Pokud se např. domluvíme na 40–60 kreditech a skutečně využijete 47, fakturujeme 47 kreditů.',
          'Kredity fungují jako flexibilní rozpočet na kreativní výstupy, který se přizpůsobuje tomu, co v daný moment nejvíce pomáhá výkonu kampaní.',
        ],
      },
      {
        emoji: '🖼️',
        title: 'Hodnota jednotlivých výstupů – Bannery',
        items: [
          'Rámeček pro katalogové Meta Ads kampaně: 1 kredit',
          'Meta Ads bannery ve 2 rozměrech (1080×1080 a 1080×1920): 4 kredity / pack',
          'Překlad Meta Ads bannerů do jiného jazyka: 1 kredit',
          'Set PPC bannerů (6–10 rozměrů): 1 kredit / rozměr',
          'Překlad PPC banneru (1 rozměr): 0,5 kreditu',
          'Vytvoření produktové fotky přes AI: 2 kredity',
          'Úprava již vytvořených Meta Ads bannerů (jiný text, přelepka, výměna fotky) ve 2 rozměrech: 1 kredit',
          'Příprava bannerů na homepage webu nebo do newsletteru (z již vytvořené kreativy): 2 kredity',
          'Revize bannerů: Každý pack obsahuje 1 revizní kolo zdarma. Každé další revizní kolo: 1 kredit / revize.',
        ],
      },
      {
        emoji: '🎥',
        title: 'Hodnota jednotlivých výstupů – Videa',
        items: [
          'Každá objednávka videa = 1 koncept + 3 různé hooky = 3 finální videa připravená do kampaní.',
          'Výkonnostní video – Standard (záběry klienta + AI hooky, bez rozsáhlých AI b-rollů): 12 kreditů / pack (1 koncept / 3 videa)',
          'Výkonnostní video – AI b-roll (záběry klienta + rozšířené AI scény a b-rolly): 17 kreditů / pack (1 koncept / 3 videa)',
          'Další alternativní hook navíc (nad základní 3 – tj. +1 nové video): 2 kredity',
          'Menší úprava videa (úprava textů, vystřižení nebo vložení záběru): 2 kredity',
          'Překlad videa (titulky / voiceover): 2 kredity',
          'Revize videí: Každý video pack obsahuje 1 revizní kolo zdarma. Každé další revizní kolo: 1 kredit / revize.',
        ],
      },
      {
        emoji: '⚡',
        title: 'Expresní dodání (48 h)',
        items: [
          'Standardně dodáváme bannery i videa do 72 hodin od zadání (3 pracovní dny).',
          'Za expresní dodání do 48 hodin účtujeme +50 % kreditů navíc.',
          'Příklad: pack bannerů za 4 kredity → expresně za 6 kreditů. Video Standard za 12 kreditů → expresně za 18 kreditů.',
          'Expresní režim vždy předem odsouhlasíme, abyste měli plnou kontrolu nad rozpočtem.',
        ],
      },
      {
        emoji: '📋',
        title: 'Pravidla využití kreditů – shrnutí',
        items: [
          'Kreditní hodnota: Každý kredit má pevnou hodnotu 400 Kč bez DPH. U každého typu výstupu předem víte, kolik kreditů stojí.',
          'Domluvený rámec, fakturace reality: Na začátku měsíce se domluvíme na orientačním nebo maximálním počtu kreditů. Na konci měsíce fakturujeme skutečně vyčerpané kredity.',
          'Nepřenosnost kreditů: Kredity jsou vázané na daný měsíc a nepřevádějí se do dalšího období.',
          'Zadávání požadavků: Ideálně průběžně; nejpozději 5 pracovních dnů před koncem měsíce.',
          'Revize: Každý dodaný výstup (pack bannerů / video pack) obsahuje 1 revizní kolo zdarma. Další revizní kola: 1 kredit / revize.',
          'Rychlost zpracování: Standard do 72 hodin, express do 48 hodin za +50 % kreditů.',
          'Autorská práva: Klient může všechny dodané výstupy volně využívat, nesmí je bez souhlasu upravovat. Autorská práva zůstávají agentuře dle zákona č. 121/2000 Sb.',
        ],
      },
      {
        emoji: '🎨',
        title: 'Co konkrétně Creative Boost dodá',
        items: [
          'Tvorba výkonnostních bannerů: Výběr produktů a úhlů komunikace, prodejní texty (headline, benefity, USP, CTA), vizuály zaměřené na výkon, 1 kolo revizí.',
          'Krátká vertikální videa (Reels / Stories / Shorts): Koncept a struktura videa (hook → problém → řešení → CTA), script pro voiceover a textové přelepky, AI/reálný voiceover a titulky, 3 finální videa z jednoho konceptu, 1 kolo revizí v ceně.',
        ],
      },
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
