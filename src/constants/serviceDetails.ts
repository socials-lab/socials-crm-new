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

export interface TierPriceEntry {
  price: number | null; // null = "Individuální kalkulace"
  spend: string;
  originalPrice?: number; // for showing crossed-out price (bundles)
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
    growth: TierPriceEntry;
    pro: TierPriceEntry;
    elite: TierPriceEntry;
  };
  // For credit-based services like Creative Boost
  creditPricing?: {
    basePrice: number;
    currency: string;
    expressMultiplier: number;
    bannerRewardPerCredit: number;
    videoRewardPerCredit: number;
  };
}

export const SERVICE_DETAILS: Record<string, ServiceDetail> = {
  SOCIALS_BOOST: {
    code: 'SOCIALS_BOOST',
    tagline: 'Komplexní správa Meta Ads pro e-shopy – více objednávek z Facebooku a Instagramu',
    platforms: ['Meta Ads (Facebook, Instagram, Messenger)'],
    targetAudience: 'E-shopy, které chtějí zvýšit tržby pomocí reklam na Facebooku a Instagramu',
    benefits: [
      'Více objednávek a vyšší tržby – reklamy nastavíme tak, aby přiváděly zákazníky, kteří nakupují.',
      'Méně starostí, více času na podnikání – postaráme se o celou správu výkonnostní reklamy, abyste se mohli věnovat růstu e-shopu.',
      'Partnera, který řeší výkon, ne jen reklamy – přemýšlíme nad vaším e-shopem, ne jen nad reklamními účty.',
      'Kompletní správu Meta Ads – od nastavení účtů a katalogu produktů po průběžnou optimalizaci a reporting.',
    ],
    setup: [
      {
        title: '📢 Nastavení Meta Business Suite',
        items: [
          'Meta Pixel: Kontrola a nastavení pro přesné měření klíčových událostí na webu, případně implementace Conversion API (CAPI).',
          'Katalog produktů: Kontrola propojení a konfigurace katalogu produktů pro dynamické reklamy (DPA).',
          'Reklamní účet: Ověření správnosti nastavení reklamního účtu, včetně platebních údajů a propojení s dalšími nástroji.',
          'Meta Business Suite: Detailní kontrola propojení všech nástrojů (reklamní účet, pixel, katalog, stránky) v rámci Business Suite.',
          'Struktura kampaní: Vytvoření základní struktury kampaní zaměřených na akvizici nových zákazníků a remarketing.',
          'Textace reklam: Tvorba poutavých textů přizpůsobených cílové skupině a obchodním cílům.',
        ],
      },
      {
        title: '💹 Kontrola analytického měření',
        items: [
          'Kontrola a optimalizace měření klíčových událostí (nákupy, přidání do košíku, registrace) prostřednictvím modulů v Shoptetu, Upgates nebo Shopify.',
        ],
      },
      {
        title: '📊 Tvorba dashboardu výsledků v Looker Studio',
        items: [
          'Reportovací šablona: Vytvoření přehledné šablony pro sledování výkonu kampaní.',
          'Propojení dat: Napojení Looker Studio na Google Ads, Meta Ads a Google Analytics.',
          'Vizualizace metrik: Přehledné zobrazení klíčových metrik (CPC, CTR, ROAS, konverze) pro snadné vyhodnocení kampaní.',
          'Automatizace dat: Nastavení automatické aktualizace a sdílení reportů pro přístup 24/7.',
        ],
      },
      {
        title: '🎯 Vylepšení nabídky',
        items: [
          'Návrh produktových balíčků (bundles) – kombinace produktů, které zvýší hodnotu objednávky a motivují zákazníky ke koupi.',
          'Doporučení slevových a akčních nabídek – strategické slevy, dárky k nákupu nebo limitované akce, které podpoří rychlejší rozhodnutí zákazníků.',
          'Zvýraznění unikátní hodnoty nabídky – jasně komunikujeme, proč si zákazník má vybrat právě vás (doprava zdarma, garance spokojenosti, prémiová kvalita apod.).',
          'Kontrola webu – identifikujeme bariéry v nákupním procesu (např. složitý checkout, nejasné informace) a doporučíme úpravy pro vyšší míru dokončení nákupů.',
        ],
      },
    ],
    management: [
      {
        title: '📢 Správa Meta Ads',
        items: [
          'Analýza výkonu: Pravidelně sledujeme výsledky kampaní a identifikujeme, které reklamy, sestavy nebo kampaně neplní cíle – ty pak upravujeme nebo vypínáme.',
          'Tvorba nových kampaní a reklam: Vytváříme nové kampaně, sestavy a reklamy na základě analýzy dat a aktuálních potřeb.',
          'Škálování úspěšných kampaní: Kampaně, které přinášejí dobré výsledky, postupně navyšujeme, abychom maximalizovali jejich přínos.',
          'Spolupráce s grafiky: Pokud jsou potřeba nové vizuály, připravíme zadání pro grafiky nebo editory.',
          'Monitoring měření (Pixel/CAPI): Průběžně kontrolujeme, zda Pixel nebo Conversion API správně měří klíčové události na vašem webu.',
        ],
      },
      {
        title: '💬 Reporting a komunikace',
        items: [
          'Video / textový report: Každý měsíc připravíme video nebo text s přehledem fungování kampaní.',
          'Looker Studio report: Nepřetržitý přístup (24/7) k přehlednému reportu, kde můžete sledovat klíčové metriky kampaní.',
          'Pravidelné konzultace: Pokud je potřeba, nabízíme strategické hovory, kde s vámi diskutujeme vývoj kampaní a jejich další směřování.',
        ],
      },
    ],
    tierComparison: [
      { feature: 'Základní setup (Pixel, kampaně, textace)', growth: true, pro: true, elite: true },
      { feature: 'Kontrola analytického měření', growth: true, pro: true, elite: true },
      { feature: 'Napojení dat do Looker Studio', growth: true, pro: true, elite: true },
      { feature: 'Optimalizace stávajících kampaní', growth: true, pro: true, elite: true },
      { feature: 'Vytvoření nové struktury kampaní', growth: true, pro: true, elite: true },
      { feature: 'Strategické vylepšování atraktivity nabídky', growth: true, pro: true, elite: true },
      { feature: 'Zadávání reklamních kreativ', growth: true, pro: true, elite: true },
      { feature: 'Tvorba nových reklam', growth: '1–2x týdně', pro: '2–3x týdně', elite: '2–3x týdně' },
      { feature: 'Denní kontrola kampaní', growth: true, pro: true, elite: true },
      { feature: 'Optimalizace kampaní pro maximální efektivitu rozpočtu', growth: '1–2x týdně', pro: '2–3x týdně', elite: '3–4x týdně' },
      { feature: 'Psaní nových textů do reklam', growth: true, pro: true, elite: true },
      { feature: 'Komunikace přes Freelo', growth: true, pro: true, elite: true },
      { feature: '24/7 Looker Studio report', growth: true, pro: true, elite: true },
      { feature: 'Měsíční reporting', growth: 'Video / text / call', pro: 'Video / text / call', elite: 'Video / text / call' },
    ],
    tierPricing: {
      growth: { price: 29900, spend: 'do 400 000 Kč' },
      pro: { price: 39900, spend: '400 000 – 800 000 Kč' },
      elite: { price: null, spend: 'nad 800 000 Kč' },
    },
  },

  PPC_BOOST: {
    code: 'PPC_BOOST',
    tagline: 'Správa Google Ads a S-kliku – více zakázek a vyšší zisk',
    platforms: ['Google Ads (Search, Shopping, Display, PMax, DSA)', 'Sklik (Seznam.cz)'],
    targetAudience: 'E-shopy a firmy, které chtějí více zakázek z Google a Seznamu',
    benefits: [
      'Více zakázek a vyšší zisk – reklamy nastavíme tak, aby vám přinášely zákazníky, kteří nakupují.',
      'Silnější nabídku, která prodává – pomůžeme vám vytvořit akce, balíčky a strategii, která osloví více potenciálních zákazníků.',
      'Méně starostí, více času na podnikání – postaráme se o celou správu výkonnostní reklamy, abyste se mohli věnovat růstu firmy.',
      'Partnera, který řeší výkon, ne jen reklamy – přemýšlíme nad vaším byznysem, ne jen nad reklamními účty.',
    ],
    setup: [
      {
        title: '📈 Nastavení Google Ads a S-kliku',
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
        title: '💹 Kontrola nastavení analytického měření',
        items: [
          'Účet a sledování: Kontrola a optimalizace měření klíčových událostí (nákupy, přidání do košíku, registrace) prostřednictvím modulů v Shoptetu, Upgates nebo Shopify.',
          'Propojení s nástroji: Integrace GA4 s Google Ads, Looker Studio a dalšími systémy pro komplexní analýzu dat.',
        ],
      },
      {
        title: '📊 Tvorba dashboardu výsledků v Looker Studio',
        items: [
          'Reportovací šablona: Vytvoření přehledné šablony pro sledování výkonu kampaní.',
          'Propojení dat: Napojení Looker Studio na Google Ads, Meta Ads a Google Analytics.',
          'Vizualizace metrik: Přehledné zobrazení klíčových metrik, jako je CPC, CTR, ROAS, konverze, pro snadné vyhodnocení kampaní.',
          'Automatizace dat: Nastavení automatické aktualizace a sdílení reportů pro přístup 24/7.',
        ],
      },
    ],
    management: [
      {
        title: '💻 Správa Google Ads',
        items: [
          'Google Shopping kampaně: Propagujeme vaše produkty pomocí Shopping kampaní, které oslovují zákazníky s vysokým potenciálem nákupu.',
          'DSA kampaně (Dynamic Search Ads): Dynamické reklamy cílí na relevantní vyhledávací dotazy, čímž zajišťují široký dosah a efektivitu.',
          'Performance Max kampaně (PMax): Optimalizujeme kampaně, které kombinují různé reklamní formáty a oslovují zákazníky napříč celým Google ekosystémem.',
          'Kampaně ve vyhledávání: Spravujeme kampaně zaměřené na konkrétní klíčová slova, aby vaše reklamy byly na předních pozicích.',
          'Display kampaně: Využíváme vizuální reklamy v obsahové síti, které budují povědomí o značce.',
          'Remarketing: Znovu oslovujeme návštěvníky vašeho e-shopu pomocí personalizovaných reklam.',
          'Úprava produktového feedu: Optimalizujeme váš produktový feed pomocí nástroje Mergado pro Shopping a PMax kampaně.',
          'Sledování konverzí: Nastavujeme a průběžně kontrolujeme měření konverzí pro přesné vyhodnocení výkonu kampaní.',
        ],
      },
      {
        title: '🌐 Správa S-kliku',
        items: [
          'Kampaně ve vyhledávání: Optimalizujeme kampaně zaměřené na vyhledávání relevantních klíčových slov.',
          'Obsahová síť: Nastavujeme vizuální kampaně, které budují povědomí o značce a podporují remarketing.',
          'Remarketing: Oslovujeme uživatele, kteří již navštívili váš e-shop, a motivujeme je k dokončení nákupu.',
          'Správa klíčových slov: Přizpůsobujeme klíčová slova českému publiku a optimalizujeme je na základě výkonu.',
          'Optimalizace kampaní: Průběžně sledujeme výkon, přizpůsobujeme rozpočty a testujeme nové strategie.',
        ],
      },
      {
        title: '💬 Reporting a komunikace',
        items: [
          'Video / textový report: Každý měsíc připravíme souhrn fungování kampaní formou videa nebo textu.',
          'Looker Studio report: Nepřetržitý přístup (24/7) k přehlednému reportu, kde můžete sledovat klíčové metriky kampaní.',
          'Pravidelné konzultace: Pokud je potřeba, nabízíme strategické hovory, kde s vámi diskutujeme vývoj kampaní a jejich další směřování.',
        ],
      },
    ],
    tierComparison: [
      { feature: 'Základní setup (účty, kampaně, textace)', growth: true, pro: true, elite: true },
      { feature: 'Kontrola analytického měření', growth: true, pro: true, elite: true },
      { feature: 'Napojení dat do Looker Studio', growth: true, pro: true, elite: true },
      { feature: 'Optimalizace stávajících kampaní', growth: true, pro: true, elite: true },
      { feature: 'Vytvoření nové struktury kampaní', growth: true, pro: true, elite: true },
      { feature: 'Tvorba textů do reklam', growth: true, pro: true, elite: true },
      { feature: 'Denní kontrola kampaní', growth: true, pro: true, elite: true },
      { feature: 'Optimalizace kampaní', growth: '1–2x týdně', pro: '2–3x týdně', elite: '3–4x týdně' },
      { feature: 'Tvorba nových reklam', growth: true, pro: true, elite: true },
      { feature: 'Zadávání reklamních kreativ', growth: true, pro: true, elite: true },
      { feature: 'Psaní nových textů do reklam', growth: true, pro: true, elite: true },
      { feature: 'Úprava XML feedů přes Mergado', growth: true, pro: true, elite: true },
      { feature: 'Strategické vylepšování atraktivity nabídky', growth: true, pro: true, elite: true },
      { feature: 'Komunikace přes Freelo (reakční doba do 48h)', growth: true, pro: true, elite: true },
      { feature: '24/7 Looker Studio report', growth: true, pro: true, elite: true },
      { feature: 'Měsíční reporting', growth: 'Video / text / telefonát', pro: 'Video / text / telefonát', elite: 'Video / text / telefonát' },
    ],
    tierPricing: {
      growth: { price: 24900, spend: 'do 400 000 Kč' },
      pro: { price: 34900, spend: '400 000 – 800 000 Kč' },
      elite: { price: null, spend: 'nad 800 000 Kč' },
    },
  },

  PERFORMANCE_BOOST: {
    code: 'PERFORMANCE_BOOST',
    tagline: 'Kombinace Meta Ads + Google Ads + Sklik pro maximální dosah',
    platforms: ['Meta Ads (Facebook, Instagram)', 'Google Ads', 'Sklik (Seznam.cz)'],
    targetAudience: 'E-shopy a služby, které chtějí komplexní pokrytí všech klíčových reklamních platforem',
    benefits: [
      'Kompletní pokrytí všech hlavních reklamních platforem.',
      'Zvýhodněná cena oproti samostatným balíčkům.',
      'Jednotná strategie a optimalizace napříč platformami.',
      'Synergický efekt – lepší výsledky díky koordinované správě.',
    ],
    setup: [
      {
        title: 'Nastavení všech platforem',
        items: [
          'Meta Business Suite: Pixel, katalog, struktura kampaní.',
          'Google Ads: Search, Shopping/PMax, remarketing.',
          'Sklik: Kampaně, produktový feed, konverze.',
          'Looker Studio: Jednotný dashboard pro všechny platformy.',
        ],
      },
    ],
    management: [
      {
        title: 'Správa Meta Ads + Google Ads + Sklik',
        items: [
          'Koordinovaná správa všech platforem.',
          'Cross-platform optimalizace rozpočtu.',
          'Jednotný měsíční reporting.',
          'Strategické konzultace.',
        ],
      },
    ],
    tierComparison: [
      { feature: 'Meta Ads správa', growth: true, pro: true, elite: true },
      { feature: 'Google Ads správa', growth: true, pro: true, elite: true },
      { feature: 'Sklik správa', growth: true, pro: true, elite: true },
      { feature: 'Cross-platform optimalizace', growth: true, pro: true, elite: true },
      { feature: 'Optimalizace', growth: '2-3x týdně', pro: '3-4x týdně', elite: '4-5x týdně' },
      { feature: 'Reporting', growth: 'Měsíční', pro: 'Měsíční', elite: 'Měsíční' },
    ],
    tierPricing: {
      growth: { price: 43900, spend: 'do 400 000 Kč', originalPrice: 54800 },
      pro: { price: 59900, spend: '400 000 - 800 000 Kč', originalPrice: 74800 },
      elite: { price: null, spend: 'nad 800 000 Kč' },
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
      elite: { price: null, spend: 'nad 800 000 Kč' },
    },
  },

  CREATIVE_BOOST: {
    code: 'CREATIVE_BOOST',
    tagline: 'Příprava reklamních kreativ – systém, jak váš produkt prodat pomocí strategické výkonnostní kreativy',
    platforms: ['Meta Ads kreativy', 'PPC bannery', 'Výkonnostní videa (Reels/Stories/Shorts)', 'AI foto'],
    targetAudience: 'Klienti s výkonnostními kampaněmi, kteří potřebují pravidelnou tvorbu bannerů a videí',
    benefits: [
      'Hledáme správné úhly komunikace (problém → řešení, emoce, racionalita, USP).',
      'Navrhujeme jasné prodejní texty, které umí vysvětlit hodnotu v pár vteřinách.',
      'Tvoříme výkonnostní bannery a videa tak, aby dávala smysl z pohledu algoritmu.',
      'Připravujeme více konceptů a hooků, které se dají reálně testovat a škálovat.',
    ],
    setup: [
      {
        title: 'Nastavení spolupráce',
        items: [
          'Definice měsíčního balíčku kreditů (orientační nebo maximální počet) dle potřeb a plánované práce.',
          'Nastavení brief šablony pro zadávání kreativ.',
          'Nastavení komunikačních kanálů (Freelo, Slack).',
        ],
      },
    ],
    management: [
      {
        title: 'Tvorba výkonnostních bannerů pro Meta Ads a PPC',
        items: [
          'Pomůžeme vám vybrat produkty, úhly komunikace a messaging, které dávají výkonově smysl.',
          'Připravíme prodejní texty – headline, benefity, USP, výzvy k akci.',
          'Vytvoříme vizuály odpovídající značce, ale primárně zaměřené na výkon.',
          'Součástí je 1 kolo revizí, kde doladíme texty, barvy a detaily podle vašich připomínek.',
        ],
      },
      {
        title: 'Krátká vertikální videa (Reels / Stories / Shorts)',
        items: [
          'Navrhneme koncept a strukturu videa (hook → problém → řešení → CTA).',
          'Připravíme script pro voiceover a textové přelepky.',
          'Zajistíme AI nebo reálný voiceover, titulky, střih a b-rolly podle zvolené varianty (Standard / AI b-roll).',
          'Dodáme 3 finální videa z jednoho konceptu (3 různé hooky pro A/B testování).',
          'Každý video pack obsahuje 1 kolo revizí, další revize jsou možné za 1 kredit / revize.',
        ],
      },
    ],
    tierComparison: [],
    creditPricing: {
      basePrice: 400,
      currency: 'CZK',
      expressMultiplier: 1.5,
      bannerRewardPerCredit: 80,
      videoRewardPerCredit: 80,
    },
  },

  VIDEO_BOOST: {
    code: 'VIDEO_BOOST',
    tagline: 'Výkonnostní videa pro Meta Ads / TikTok Ads',
    platforms: ['Meta Ads (Reels, Stories)', 'TikTok Ads (Shorts)'],
    targetAudience: 'Firmy a e-shopy, které chtějí výkonnostní videa pro reklamy na sociálních sítích',
    benefits: [
      'Videa, která prodávají – zaměřujeme se na jasnou nabídku, benefit a silné CTA.',
      'Rychlá produkce bez zbytečného natáčení – pracujeme primárně s vašimi záběry a doplňujeme AI voiceoverem, titulky a AI b-rolly.',
      'Více variant z jednoho zadání – ke každému videu připravíme 3 různé hooky pro A/B testování.',
    ],
    setup: [
      {
        title: 'Účel videa a nabídka',
        items: [
          'Co se má komunikovat – sleva, akce, dárek, novinka, hlavní benefit produktu/služby.',
          'Účel videa – akvizice nových zákazníků, remarketing, podpora konkrétní kampaně / landing page.',
          'Produkty – domluvíme, které konkrétní produkty/služby budou ve videu.',
          'Na základě toho připravíme krátký creative brief, ze kterého vychází scénář.',
        ],
      },
    ],
    management: [
      {
        title: 'Scénář a voiceover (3 hooky na koncept)',
        items: [
          'Kreativní úhel videa – jak produkt/službu odprezentovat, aby byl pro cílovou skupinu co nejatraktivnější.',
          'Voiceover script – kompletní text k videu: HOOK (3 varianty), MAIN část (vysvětlení benefitu/nabídky), CTA (jasná výzva k akci).',
          'Text následně schvalujete vy jako klient – teprve potom jdeme do střihu.',
        ],
      },
      {
        title: 'Střih videa a AI prvky',
        items: [
          'Využijeme záběry, které dodáte (produkty, použití, sklad, tým, UGC…).',
          'Doplníme AI voiceover – přirozeně působící hlas podle schváleného textu.',
          'Přidáme AI titulky – dynamické, dobře čitelné i bez zvuku.',
          'U rozšířené varianty také AI b-rolly a AI scény, které doplní prostředí a kontext.',
          'Výstupem je video ve formátu 9:16, délka 15–30 sekund, připravené rovnou do reklam.',
        ],
      },
      {
        title: 'Revize a finální export',
        items: [
          'V ceně každého videa je 1 kolo revizí (úprava textů, drobné změny střihu, záběrů, barev).',
          'Každé další kolo revizí účtujeme dle času – 1 700 Kč / hod.',
          'Finální video dodáváme ve formátech vhodných pro Meta Ads a TikTok Ads.',
        ],
      },
    ],
    tierComparison: [
      { feature: '1 koncept videa', growth: true, pro: true, elite: false },
      { feature: '3 různé hooky (3 finální videa)', growth: true, pro: true, elite: false },
      { feature: 'AI voiceover + AI titulky', growth: true, pro: true, elite: false },
      { feature: 'AI b-rolly a AI scény', growth: false, pro: true, elite: false },
      { feature: 'Cena za 1 video', growth: '4 900 Kč', pro: '6 900 Kč', elite: '' },
      { feature: 'Balíček 3 videí (sleva 10 %)', growth: '13 230 Kč', pro: '18 630 Kč', elite: '' },
    ],
    tierPricing: {
      growth: { price: 4900, spend: 'Standard' },
      pro: { price: 6900, spend: 'AI b-roll' },
      elite: { price: null, spend: '' },
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
      elite: { price: null, spend: 'nad 300 000 Kč' },
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

  HEUREKA_ZBOZI: {
    code: 'HEUREKA_ZBOZI',
    tagline: 'Správa Heuréky a Zboží.cz – optimalizace feedu, bidding a maximální ziskovost',
    platforms: ['Heureka', 'Zboží.cz', 'Mergado'],
    targetAudience: 'E-shopy, které chtějí maximalizovat výkon na srovnávačích zboží',
    benefits: [
      'Import a validace XML feedu – kontrola dat, přemapování kategorií, doplnění EAN kódů',
      'Optimalizace názvů a párování produktů – klíčová slova, ruční úpravy nespárovaných položek',
      'Bidding a řízení CPC pro maximální ziskovost – segmentace, automatizovaný i manuální bidding',
      'Podpora recenzí a důvěryhodnosti – Ověřeno zákazníky, hodnocení produktů',
      'Pravidelný reporting a analýza – sledování PNO, ROI, CTR, konverzí',
    ],
    setup: [
      {
        title: 'Úvodní nastavení',
        items: [
          'Import XML feedu do Mergada – kontrola a validace dat.',
          'Úpravy v Mergadu – přemapování kategorií, úprava názvů, doplnění chybějících EAN kódů a parametrů.',
          'Testování výstupu – ověření správného zpracování feedu v Heureka/Zboží.cz.',
        ],
      },
    ],
    management: [
      {
        title: 'Optimalizace XML feedu',
        items: [
          'Validace feedu – ověřit správnost kategorií, názvů, obrázků, cen a dostupnosti.',
          'Optimalizace názvů produktů – použití klíčových slov a přesného pojmenování pro správné spárování.',
          'Správné párování produktů – ruční úpravy u nespárovaných položek.',
          'EAN kódy a parametry – důležité pro spárování a lepší viditelnost ve filtrech.',
        ],
      },
      {
        title: 'Bidding – řízení CPC pro maximální ziskovost',
        items: [
          'Segmentace produktů – prioritizovat výkonné produkty s vysokou marží.',
          'Automatizovaný bidding – možné použití nástrojů (Bidding Fox, Beed) pro udržení PNO pod kontrolou.',
          'Manuální úprava CPC – zvýšení CPC pro klíčové produkty, omezení u těch se slabou návratností.',
          'Pravidelné vyhodnocení PNO/ROI – zamezit plýtvání rozpočtu na neefektivní produkty.',
        ],
      },
      {
        title: 'Recenze a důvěryhodnost',
        items: [
          'Podpora „Ověřeno zákazníky" – aktivně sbírat recenze, odpovídat na negativní.',
          'Hodnocení produktů – více recenzí = vyšší konverze.',
        ],
      },
      {
        title: 'Analýza a reporting',
        items: [
          'Sledování výkonu kampaní (PNO, ROI, CTR, konverze) – optimalizace na základě reálných dat.',
          'Pravidelný reporting – vyhodnocení výsledků a iterativní zlepšování strategií.',
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
