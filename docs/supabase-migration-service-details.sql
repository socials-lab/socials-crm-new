-- Migration: Add service details columns for editable service information
-- This allows storing detailed service descriptions, benefits, setup steps, etc. in the database

-- Add new columns to services table
ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS tagline TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS platforms TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS target_audience TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS benefits TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS setup_items JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS management_items JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS tier_comparison JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS tier_prices JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS credit_pricing JSONB DEFAULT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.services.tagline IS 'Short marketing tagline for the service';
COMMENT ON COLUMN public.services.platforms IS 'Array of platforms this service covers (e.g., Meta Ads, Google Ads)';
COMMENT ON COLUMN public.services.target_audience IS 'Description of target audience for this service';
COMMENT ON COLUMN public.services.benefits IS 'Array of key benefits/value propositions';
COMMENT ON COLUMN public.services.setup_items IS 'JSON array of setup sections: [{title: string, items: string[]}]';
COMMENT ON COLUMN public.services.management_items IS 'JSON array of management sections: [{title: string, items: string[]}]';
COMMENT ON COLUMN public.services.tier_comparison IS 'JSON array of feature comparisons: [{feature: string, growth: string|boolean, pro: string|boolean, elite: string|boolean}]';
COMMENT ON COLUMN public.services.tier_prices IS 'JSON object with tier pricing: {growth: {price: number, spend: string}, pro: {...}, elite: {...}}';
COMMENT ON COLUMN public.services.credit_pricing IS 'JSON object for credit-based services: {basePrice: number, currency: string, expressMultiplier: number, outputTypes: [...]}';

-- Populate initial data for SOCIALS_BOOST
UPDATE public.services
SET 
  tagline = 'Reklama na Facebooku a Instagramu pro e-shopy a služby',
  platforms = ARRAY['Meta Ads (Facebook, Instagram, Messenger)'],
  target_audience = 'E-shopy a služby, které chtějí získat více zákazníků z Facebooku a Instagramu',
  benefits = ARRAY[
    'Více zakázek a vyšší zisk – reklamy nastavíme tak, aby vám přinášely zákazníky, kteří nakupují.',
    'Méně starostí, více času na podnikání – postaráme se o celou správu výkonnostní reklamy.',
    'Partnera, který řeší výkon, ne jen reklamy – přemýšlíme nad vaším byznysem.',
    'Kompletní správu Meta Ads - Od nastavení účtů po průběžnou optimalizaci.'
  ],
  setup_items = '[
    {"title": "Nastavení Meta Business Suite", "items": [
      "Meta Pixel: Kontrola a nastavení pro přesné měření klíčových událostí na webu, případně implementace Conversion API (CAPI).",
      "Katalog produktů: Kontrola propojení a konfigurace katalogu produktů pro dynamické reklamy (DPA).",
      "Reklamní účet: Ověření správnosti nastavení reklamního účtu, včetně platebních údajů a propojení s dalšími nástroji.",
      "Meta Business Suite: Detailní kontrola propojení všech nástrojů v rámci Business Suite.",
      "Struktura kampaní: Vytvoření základní struktury kampaní zaměřených na akvizici nových zákazníků a remarketing.",
      "Textace reklam: Tvorba poutavých textů přizpůsobených cílové skupině a obchodním cílům."
    ]},
    {"title": "Kontrola analytického měření", "items": [
      "Účet a sledování: Kontrola a optimalizace měření klíčových událostí (nákupy, přidání do košíku, registrace) prostřednictvím modulů v Shoptetu, Upgates nebo Shopify."
    ]},
    {"title": "Tvorba dashboardu v Looker Studio", "items": [
      "Reportovací šablona: Vytvoření přehledné šablony pro sledování výkonu kampaní.",
      "Propojení dat: Napojení Looker Studio na Google Ads, Meta Ads a Google Analytics.",
      "Vizualizace metrik: Přehledné zobrazení klíčových metrik (CPC, CTR, ROAS, konverze).",
      "Automatizace dat: Nastavení automatické aktualizace a sdílení reportů pro přístup 24/7."
    ]},
    {"title": "Vylepšení nabídky", "items": [
      "Návrh produktových balíčků (bundles) – kombinace produktů, které zvýší hodnotu objednávky.",
      "Doporučení slevových a akčních nabídek – strategické slevy, dárky k nákupu nebo limitované akce.",
      "Zvýraznění unikátní hodnoty nabídky – jasná komunikace, proč si zákazník má vybrat právě vás.",
      "Kontrola webu – identifikace bariér v nákupním procesu a doporučení úprav."
    ]}
  ]'::jsonb,
  management_items = '[
    {"title": "Správa Meta Ads", "items": [
      "Analýza výkonu: Pravidelné sledování výsledků kampaní a identifikace, které reklamy neplní cíle.",
      "Tvorba nových kampaní a reklam: Vytváříme nové kampaně na základě analýzy dat a aktuálních potřeb.",
      "Škálování úspěšných kampaní: Kampaně s dobrými výsledky postupně navyšujeme.",
      "Spolupráce s grafiky: Pokud jsou potřeba nové vizuály, připravíme zadání pro grafiky.",
      "Monitoring měření (Pixel/CAPI): Průběžná kontrola správného měření klíčových událostí."
    ]},
    {"title": "Reporting a komunikace", "items": [
      "Video / textový report: Každý měsíc přehled fungování kampaní.",
      "Looker Studio report: Nepřetržitý přístup (24/7) k přehlednému reportu.",
      "Pravidelné konzultace: Strategické hovory o vývoji kampaní a dalším směřování."
    ]}
  ]'::jsonb,
  tier_comparison = '[
    {"feature": "Základní setup (Pixel, kampaně, textace)", "growth": true, "pro": true, "elite": true},
    {"feature": "Analytické měření a Looker Studio", "growth": true, "pro": true, "elite": true},
    {"feature": "Vylepšování atraktivity nabídky", "growth": true, "pro": true, "elite": true},
    {"feature": "Zadávání reklamních kreativ", "growth": true, "pro": true, "elite": true},
    {"feature": "Tvorba nových reklam", "growth": "1-2x týdně", "pro": "2-3x týdně", "elite": "2-3x týdně"},
    {"feature": "Denní kontrola kampaní", "growth": true, "pro": true, "elite": true},
    {"feature": "Optimalizace kampaní", "growth": "1-2x týdně", "pro": "2-3x týdně", "elite": "3-4x týdně"},
    {"feature": "Psaní nových textů do reklam", "growth": true, "pro": true, "elite": true},
    {"feature": "Komunikace přes Freelo", "growth": true, "pro": true, "elite": true},
    {"feature": "24/7 Looker Studio report", "growth": true, "pro": true, "elite": true},
    {"feature": "Měsíční reporting", "growth": "Video/text/call", "pro": "Video/text/call", "elite": "Video/text/call"}
  ]'::jsonb,
  tier_prices = '{"growth": {"price": 15000, "spend": "do 400 000 Kč"}, "pro": {"price": 25000, "spend": "400 000 - 800 000 Kč"}, "elite": {"price": 40000, "spend": "nad 800 000 Kč"}}'::jsonb
WHERE code = 'SOCIALS_BOOST';
