import type { PublicOffer } from '@/types/publicOffer';

const STORAGE_KEY = 'public_offers_mock';

// Testovací nabídka - vždy dostupná na /offer/test-nabidka-123
// Testovací nabídka jen s addon službami (bez core) - /offer/test-addon-only
// Testovací nabídka s PPC Boost - /offer/test-ppc-boost
const TEST_PPC_BOOST_OFFER: PublicOffer = {
  id: 'test-ppc-boost-id',
  token: 'test-ppc-boost',
  lead_id: 'test-lead-ppc',
  company_name: 'TechShop Online s.r.o.',
  website: 'https://www.techshop-online.cz',
  contact_name: 'Martin Dvořák',
  services: [
    {
      id: 'svc-ppc-1',
      service_id: 'service-ppc',
      name: 'PPC Boost',
      description: 'Správa Google Ads a S-kliku – více zakázek a vyšší zisk',
      offer_description: 'Kompletní správa reklam na Google a Seznamu zaměřená na získávání zákazníků, kteří nakupují. Zahrnuje Shopping, PMax, Search, Display i remarketing kampaně na obou platformách.',
      price: 24900,
      currency: 'CZK',
      billing_type: 'monthly',
      selected_tier: 'growth',
      service_type: 'core',
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
      start_timeline: 'Do 5 pracovních dnů od podpisu smlouvy',
      detailed_sections: [
        {
          emoji: '📈',
          title: 'Nastavení Google Ads a S-kliku',
          items: [
            'Reklamní účet: Kontrola a optimalizace nastavení reklamních účtů, včetně platebních údajů.',
            'Google Merchant Center: Kontrola propojení účtu a synchronizace produktového feedu.',
            'Produktový feed: Analýza a úprava feedu prostřednictvím nástroje Mergado.',
            'Struktura kampaní: Návrh a vytvoření struktury kampaní (vyhledávací, display, shopping, remarketing).',
            'Sledování konverzí: Nastavení sledování konverzí prostřednictvím modulů v Shoptetu.',
            'Propojení nástrojů: Synchronizace s Google Analytics a dalšími relevantními nástroji.',
            'Cílení: Optimalizace cílení podle lokality, demografie a zájmů.',
          ],
        },
        {
          emoji: '💹',
          title: 'Kontrola nastavení analytického měření',
          items: [
            'Účet a sledování: Kontrola a optimalizace měření klíčových událostí (nákupy, přidání do košíku, registrace).',
            'Propojení s nástroji: Integrace GA4 s Google Ads, Looker Studio a dalšími systémy.',
          ],
        },
        {
          emoji: '📊',
          title: 'Tvorba dashboardu výsledků v Looker Studio',
          items: [
            'Reportovací šablona: Vytvoření přehledné šablony pro sledování výkonu kampaní.',
            'Propojení dat: Napojení Looker Studio na Google Ads, Meta Ads a Google Analytics.',
            'Vizualizace metrik: Přehledné zobrazení klíčových metrik (CPC, CTR, ROAS, konverze).',
            'Automatizace dat: Nastavení automatické aktualizace a sdílení reportů pro přístup 24/7.',
          ],
        },
        {
          emoji: '💻',
          title: 'Správa Google Ads',
          items: [
            'Google Shopping kampaně: Propagujeme vaše produkty pomocí Shopping kampaní.',
            'DSA kampaně: Dynamické reklamy cílí na relevantní vyhledávací dotazy.',
            'Performance Max kampaně: Kampaně kombinující různé reklamní formáty napříč Google ekosystémem.',
            'Kampaně ve vyhledávání: Spravujeme kampaně zaměřené na konkrétní klíčová slova.',
            'Display kampaně: Vizuální reklamy v obsahové síti budující povědomí o značce.',
            'Remarketing: Znovu oslovujeme návštěvníky vašeho e-shopu.',
            'Úprava produktového feedu: Optimalizace feedu přes Mergado.',
            'Sledování konverzí: Průběžná kontrola měření konverzí.',
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
            'Optimalizace kampaní: Průběžně sledujeme výkon a testujeme nové strategie.',
          ],
        },
        {
          emoji: '💬',
          title: 'Reporting a komunikace',
          items: [
            'Video / textový report: Měsíční souhrn fungování kampaní.',
            'Looker Studio report: Nepřetržitý přístup (24/7) k přehlednému reportu.',
            'Pravidelné konzultace: Strategické hovory k vývoji kampaní.',
          ],
        },
      ],
    },
  ],
  portfolio_links: [
    {
      id: 'portfolio-ppc-1',
      title: 'Case Study: E-shop Elektronika',
      url: 'https://www.canva.com/design/example-ppc',
      type: 'case_study',
    },
  ],
  audit_summary: null,
  recommendation_intro: 'Na základě analýzy doporučujeme PPC Boost balíček pro kompletní pokrytí Google Ads i Sklik kampaní, které přivedou zákazníky aktivně hledající vaše produkty.',
  custom_note: null,
  loom_url: null,
  currency: 'CZK',
  total_price: 24900,
  offer_type: 'retainer',
  valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  created_by: 'system',
  is_active: true,
  viewed_at: null,
  view_count: 0,
  estimated_start_date: 'Do 5 pracovních dnů od podpisu smlouvy',
  owner_name: 'Daniel Bauer',
  owner_email: 'daniel@socials.cz',
  owner_phone: '+420 123 456 789',
};

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
      description: 'Příprava reklamních kreativ – systém, jak váš produkt prodat pomocí strategické výkonnostní kreativy',
      offer_description: 'Neděláme jen hezké bannery a videa. Jdeme po tom, co přesvědčí zákazníka, aby kliknul, pochopil a nakoupil. Vy dodáte cíle, produkt a základní inputy – my dodáme prodejní myšlení, koncept a hotové výstupy.',
      price: 16000,
      currency: 'CZK',
      billing_type: 'monthly',
      selected_tier: null,
      service_type: 'addon',
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
      start_timeline: 'Ihned po zahájení spolupráce',
      detailed_sections: [
        {
          emoji: '💳',
          title: 'Jak funguje systém kreditů',
          items: [
            '1 kredit = 400 Kč (bez DPH). Každý typ výstupu má předem danou kreditovou hodnotu.',
            'Na začátku měsíce se domluvíme na orientačním nebo maximálním počtu kreditů.',
            'Na konci měsíce vyfakturujeme reálně vyčerpané kredity.',
            'Kredity fungují jako flexibilní rozpočet na kreativní výstupy.',
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
            'Úprava Meta Ads bannerů (jiný text, přelepka, výměna fotky): 1 kredit',
            'Příprava bannerů na homepage / newsletter: 2 kredity',
            'Revize bannerů: 1. kolo zdarma, další 1 kredit / revize',
          ],
        },
        {
          emoji: '🎥',
          title: 'Hodnota jednotlivých výstupů – Videa',
          items: [
            'Každá objednávka = 1 koncept + 3 hooky = 3 finální videa.',
            'Výkonnostní video – Standard: 12 kreditů / pack (1 koncept / 3 videa)',
            'Výkonnostní video – AI b-roll: 17 kreditů / pack (1 koncept / 3 videa)',
            'Další alternativní hook (+1 video): 2 kredity',
            'Menší úprava videa: 2 kredity',
            'Překlad videa (titulky / voiceover): 2 kredity',
            'Revize videí: 1. kolo zdarma, další 1 kredit / revize',
          ],
        },
        {
          emoji: '⚡',
          title: 'Expresní dodání (48 h)',
          items: [
            'Standardně dodáváme do 72 hodin od zadání.',
            'Express do 48 hodin za +50 % kreditů navíc.',
            'Příklad: bannery 4 kr. → express 6 kr., Video Standard 12 kr. → express 18 kr.',
          ],
        },
        {
          emoji: '📋',
          title: 'Pravidla využití kreditů',
          items: [
            '1 kredit = 400 Kč bez DPH, pevná hodnota.',
            'Domluvený rámec na začátku měsíce, fakturace reality na konci.',
            'Kredity jsou nepřenosné do dalšího měsíce.',
            'Požadavky zadávejte nejpozději 5 PD před koncem měsíce.',
            'Každý výstup obsahuje 1 revizní kolo zdarma.',
            'Autorská práva zůstávají agentuře dle zákona č. 121/2000 Sb.',
          ],
        },
        {
          emoji: '🎨',
          title: 'Co konkrétně Creative Boost dodá',
          items: [
            'Bannery: Výběr produktů a úhlů komunikace, prodejní texty, vizuály zaměřené na výkon, 1 kolo revizí.',
            'Videa: Koncept a struktura (hook → problém → řešení → CTA), script, voiceover, 3 finální videa, 1 kolo revizí.',
          ],
        },
      ],
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
  recommendation_intro: 'Doporučujeme Creative Boost balíček pro pravidelnou tvorbu výkonnostních kreativ – bannerů i videí, které přesvědčí zákazníka kliknout a nakoupit.',
  custom_note: null,
  loom_url: null,
  currency: 'CZK',
  total_price: 16000,
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
      description: 'Příprava reklamních kreativ – systém, jak váš produkt prodat pomocí strategické výkonnostní kreativy',
      offer_description: 'Neděláme jen hezké bannery a videa. Jdeme po tom, co přesvědčí zákazníka, aby kliknul, pochopil a nakoupil. Vy dodáte cíle, produkt a základní inputy – my dodáme prodejní myšlení, koncept a hotové výstupy.',
      price: 16000,
      currency: 'CZK',
      billing_type: 'monthly',
      selected_tier: null,
      service_type: 'addon',
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

// Demo nabídka pro Socials Advertising s.r.o. s historií verzí
const DEMO_SOCIALS_ADV_OFFER: PublicOffer = {
  id: 'demo-socials-adv-id',
  token: 'demo-socials-adv',
  lead_id: '20000000-0000-0000-0000-000000000002',
  company_name: 'Socials Advertising s.r.o.',
  website: 'https://www.socials.cz',
  contact_name: 'Daniel Bauer',
  services: [
    {
      id: 'svc-sa-1',
      service_id: 'a0000000-0000-0000-0000-000000000001',
      name: 'Socials Boost',
      description: 'Komplexní správa Meta Ads',
      offer_description: 'Kompletní správa reklam na Facebooku a Instagramu zaměřená na zvýšení tržeb.',
      price: 32000,
      original_price: 35000,
      discount_reason: 'Partnerská sleva',
      currency: 'CZK',
      billing_type: 'monthly',
      selected_tier: 'pro',
      service_type: 'core',
    },
    {
      id: 'svc-sa-2',
      service_id: '',
      name: 'Creative Boost',
      description: 'Výkonnostní kreativy',
      offer_description: 'Tvorba bannerů a videí pro kampaně.',
      price: 20000,
      currency: 'CZK',
      billing_type: 'monthly',
      selected_tier: null,
      service_type: 'addon',
    },
  ],
  portfolio_links: [],
  audit_summary: 'Analýza reklamních účtů ukázala potenciál pro výrazné zlepšení výkonu kampaní.',
  recommendation_intro: 'Doporučujeme Socials Boost Pro pro kompletní správu kampaní a Creative Boost pro pravidelné kreativy.',
  custom_note: null,
  loom_url: null,
  currency: 'CZK',
  total_price: 52000,
  offer_type: 'retainer',
  valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  created_at: '2025-02-13T10:00:00Z',
  updated_at: '2025-02-20T14:30:00Z',
  created_by: 'system',
  is_active: true,
  viewed_at: '2025-02-14T16:22:00Z',
  view_count: 5,
  monthly_discount_percent: 10,
  discount_scope: 'core_only',
  owner_name: 'Daniel Bauer',
  owner_email: 'daniel@socials.cz',
  owner_phone: '+420 123 456 789',
  history: [
    {
      timestamp: '2025-02-15T11:00:00Z',
      changed_by: 'System',
      summary: 'Původní verze nabídky – Socials Boost Pro 35 000 CZK + Creative Boost 15 000 CZK',
      snapshot: {
        id: 'demo-socials-adv-id',
        token: 'demo-socials-adv',
        lead_id: '20000000-0000-0000-0000-000000000002',
        company_name: 'Socials Advertising s.r.o.',
        website: 'https://www.socials.cz',
        contact_name: 'Daniel Bauer',
        services: [
          {
            id: 'svc-sa-1',
            service_id: 'a0000000-0000-0000-0000-000000000001',
            name: 'Socials Boost',
            description: 'Komplexní správa Meta Ads',
            offer_description: 'Kompletní správa reklam na Facebooku a Instagramu.',
            price: 35000,
            currency: 'CZK',
            billing_type: 'monthly',
            selected_tier: 'pro',
            service_type: 'core',
          },
          {
            id: 'svc-sa-2',
            service_id: '',
            name: 'Creative Boost',
            description: 'Výkonnostní kreativy',
            offer_description: 'Tvorba bannerů a videí.',
            price: 15000,
            currency: 'CZK',
            billing_type: 'monthly',
            selected_tier: null,
            service_type: 'addon',
          },
        ],
        portfolio_links: [],
        audit_summary: 'Analýza reklamních účtů ukázala potenciál pro výrazné zlepšení výkonu kampaní.',
        recommendation_intro: 'Doporučujeme Socials Boost Pro a Creative Boost.',
        custom_note: null,
        loom_url: null,
        currency: 'CZK',
        total_price: 50000,
        offer_type: 'retainer',
        valid_until: '2025-03-15T00:00:00Z',
        created_at: '2025-02-13T10:00:00Z',
        updated_at: '2025-02-13T10:00:00Z',
        created_by: 'system',
        is_active: true,
        viewed_at: null,
        view_count: 0,
        owner_name: 'Daniel Bauer',
        owner_email: 'daniel@socials.cz',
        owner_phone: '+420 123 456 789',
      },
    },
    {
      timestamp: '2025-02-20T14:30:00Z',
      changed_by: 'System',
      summary: 'Změna cen: Socials Boost snížen na 32 000 CZK (partnerská sleva), Creative Boost navýšen na 20 000 CZK (rozšíření kreditů), přidána 10% sleva na core',
      snapshot: {
        id: 'demo-socials-adv-id',
        token: 'demo-socials-adv',
        lead_id: '20000000-0000-0000-0000-000000000002',
        company_name: 'Socials Advertising s.r.o.',
        website: 'https://www.socials.cz',
        contact_name: 'Daniel Bauer',
        services: [
          {
            id: 'svc-sa-1',
            service_id: 'a0000000-0000-0000-0000-000000000001',
            name: 'Socials Boost',
            description: 'Komplexní správa Meta Ads',
            offer_description: 'Kompletní správa reklam na Facebooku a Instagramu.',
            price: 35000,
            currency: 'CZK',
            billing_type: 'monthly',
            selected_tier: 'pro',
            service_type: 'core',
          },
          {
            id: 'svc-sa-2',
            service_id: '',
            name: 'Creative Boost',
            description: 'Výkonnostní kreativy',
            offer_description: 'Tvorba bannerů a videí.',
            price: 15000,
            currency: 'CZK',
            billing_type: 'monthly',
            selected_tier: null,
            service_type: 'addon',
          },
        ],
        portfolio_links: [],
        audit_summary: 'Analýza reklamních účtů ukázala potenciál pro výrazné zlepšení výkonu kampaní.',
        recommendation_intro: 'Doporučujeme Socials Boost Pro a Creative Boost.',
        custom_note: null,
        loom_url: null,
        currency: 'CZK',
        total_price: 50000,
        offer_type: 'retainer',
        valid_until: '2025-03-15T00:00:00Z',
        created_at: '2025-02-13T10:00:00Z',
        updated_at: '2025-02-15T11:00:00Z',
        created_by: 'system',
        is_active: true,
        viewed_at: '2025-02-14T16:22:00Z',
        view_count: 2,
        owner_name: 'Daniel Bauer',
        owner_email: 'daniel@socials.cz',
        owner_phone: '+420 123 456 789',
      },
    },
  ],
};

const TEST_VIDEO_BOOST_OFFER: PublicOffer = {
  id: 'test-video-boost-id',
  lead_id: 'test-lead-vb',
  token: 'test-video-boost',
  company_name: 'Video Test s.r.o.',
  website: 'https://www.videotest.cz',
  contact_name: 'Eva Nová',
  audit_summary: null,
  recommendation_intro: 'Na základě vaší poptávky doporučujeme službu Video Boost pro tvorbu výkonnostních videí do vašich reklam.',
  custom_note: null,
  loom_url: null,
  services: [
    {
      id: 'vb-service-1',
      service_id: 'srv-10',
      name: 'Video Boost',
      description: 'Výkonnostní videa pro Meta Ads / TikTok Ads – videa, která prodávají',
      offer_description: null,
      selected_tier: null,
      price: 4900,
      currency: 'CZK',
      billing_type: 'one_off',
      service_type: 'addon',
      deliverables: [
        'Videa, která prodávají – jasná nabídka, benefit a silné CTA',
        'Rychlá produkce bez zbytečného natáčení (vaše záběry + AI voiceover, titulky, b-rolly)',
        'Více variant z jednoho zadání – 3 různé hooky pro A/B testování',
        'Formát 9:16, délka 15–30 sekund, připravené přímo do reklam',
        '1 kolo revizí v ceně každého videa',
      ],
      frequency: 'Průběžně dle objednávek',
      turnaround: 'Standardní dodání do 5 pracovních dnů',
      requirements: [
        'Záběry produktu/služby',
        'Cíle a účel videa',
        'Produkty/služby k propagaci',
      ],
      detailed_sections: [
        {
          emoji: '🎯',
          title: 'Jak služba probíhá – Účel videa a nabídka',
          items: [
            'Ujasníme, co se má komunikovat – sleva, akce, dárek, novinka, hlavní benefit produktu/služby.',
            'Definujeme účel videa – akvizice nových zákazníků, remarketing, podpora konkrétní kampaně.',
            'Domluvíme, které konkrétní produkty/služby budou ve videu.',
            'Na základě toho připravíme krátký creative brief, ze kterého vychází scénář.',
          ],
        },
        {
          emoji: '📝',
          title: 'Scénář a voiceover (3 hooky na koncept)',
          items: [
            'Kreativní úhel videa – jak produkt/službu odprezentovat co nejatraktivněji.',
            'Voiceover script: HOOK (3 varianty), MAIN část, CTA.',
            'Text schvalujete vy jako klient – teprve potom jdeme do střihu.',
          ],
        },
        {
          emoji: '🎬',
          title: 'Střih videa a AI prvky',
          items: [
            'Využijeme vaše záběry, doplníme AI voiceover a AI titulky.',
            'U varianty AI b-roll také rozšířené AI scény a b-rolly.',
            'Výstup: formát 9:16, délka 15–30 sekund, připravené do reklam.',
          ],
        },
        {
          emoji: '✅',
          title: 'Revize a finální export',
          items: [
            '1 kolo revizí v ceně. Další revize: 1 700 Kč / hod.',
            'Finální video ve formátech pro Meta Ads a TikTok Ads.',
          ],
        },
        {
          emoji: '📦',
          title: 'Varianty služby a ceny (bez DPH)',
          items: [
            '🎥 Standard: 4 900 Kč / video. Balíček 3 videí: 13 230 Kč (sleva 10 %).',
            '🎥 AI b-roll: 6 900 Kč / video. Balíček 3 videí: 18 630 Kč (sleva 10 %).',
          ],
        },
      ],
    },
  ],
  portfolio_links: [],
  total_price: 4900,
  currency: 'CZK',
  offer_type: 'one_off',
  valid_until: '2025-12-31',
  is_active: true,
  viewed_at: null,
  view_count: 0,
  created_by: null,
  created_at: '2025-01-15T10:00:00Z',
  updated_at: '2025-01-15T10:00:00Z',
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
  if (token === 'test-ppc-boost') {
    return TEST_PPC_BOOST_OFFER;
  }
  if (token === 'test-video-boost') {
    return TEST_VIDEO_BOOST_OFFER;
  }
  if (token === 'demo-socials-adv') {
    return DEMO_SOCIALS_ADV_OFFER;
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

export function getOffersByLeadId(leadId: string): PublicOffer[] {
  return getStoredOffers().filter(o => o.lead_id === leadId);
}

export function updatePublicOffer(token: string, updatedOffer: Partial<PublicOffer>, changeSummary?: string): void {
  const offers = getStoredOffers();
  const index = offers.findIndex(o => o.token === token);
  if (index === -1) return;

  const currentOffer = offers[index];
  
  // Save current state as history entry
  const { history, ...snapshot } = currentOffer;
  const historyEntry = {
    timestamp: new Date().toISOString(),
    changed_by: updatedOffer.created_by || currentOffer.created_by || null,
    summary: changeSummary || 'Úprava nabídky',
    snapshot: snapshot as any,
  };

  const existingHistory = currentOffer.history || [];

  offers[index] = {
    ...currentOffer,
    ...updatedOffer,
    updated_at: new Date().toISOString(),
    history: [...existingHistory, historyEntry],
  };
  
  saveOffers(offers);
}
