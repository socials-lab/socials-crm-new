-- Create the offer_content_blocks table for editable offer page content
CREATE TABLE public.offer_content_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text UNIQUE NOT NULL,
  title text,
  subtitle text,
  content jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz DEFAULT now(),
  updated_by uuid
);

-- Enable RLS
ALTER TABLE public.offer_content_blocks ENABLE ROW LEVEL SECURITY;

-- Public read (offer page is public)
CREATE POLICY "Anyone can read offer_content_blocks"
  ON public.offer_content_blocks
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Only CRM users can manage
CREATE POLICY "CRM users can manage offer_content_blocks"
  ON public.offer_content_blocks
  FOR ALL
  TO authenticated
  USING (is_crm_user(auth.uid()));

-- Insert default content blocks
INSERT INTO public.offer_content_blocks (section_key, title, subtitle, content) VALUES
(
  'why_us',
  '💪 Proč právě my',
  'Ne sliby, ale skutečný business dopad. Podobnou agenturu na trhu nenajdete.',
  '{
    "items": [
      {"stat": "30+ mil. Kč", "label": "měsíčně ve správě", "description": "Spravujeme reklamní rozpočty přes 30 milionů Kč měsíčně. Máme zkušenosti s velkými i středními e-shopy."},
      {"stat": "AI-first", "label": "přístup ke správě", "description": "Využíváme AI ve všem — od tvorby grafik na míru, přes analýzu dat, až po optimalizaci kampaní. Díky tomu jsme rychlejší a efektivnější."},
      {"stat": "Zisk", "label": "ne jen revenue", "description": "Neřešíme jen revenue a PNO. Díky naší unikátní technologii měříme váš skutečný zisk na úrovni produktu a contribution margin (náhled níže)."},
      {"stat": "Unikátní", "label": "interní nástroje", "description": "Máme vlastní interní nástroje na správu kampaní, které jsou na trhu zcela unikátní. Nonstop monitoring, grafika na míru a efektivní škálování."},
      {"stat": "5+ let", "label": "zkušeností na specialistu", "description": "Každý náš specialista má 5+ let zkušeností. Žádní junioři. Každý ví, jak z kampaní vytěžit maximum."},
      {"stat": "7 let", "label": "na trhu", "description": "Od roku 2018 pomáháme e-shopům růst. Meta, Google, TikTok, Sklik a zlatý Shoptet partner s přímými kontakty na platformy."}
    ],
    "links": [
      {"label": "📈 Případové studie", "description": "Prohlédněte si reálné dopady na tržby klientů", "url": "https://www.socials.cz/pripadove-studie"},
      {"label": "🎙️ Socials Podcast", "description": "Otevřeně mluvíme o marketingu, výkonu a vedení agentury", "url": "https://www.socials.cz/socials-podcast"},
      {"label": "⭐ Recenze klientů", "description": "Co o nás říkají naši klienti na Shoptet Partner Portálu", "url": "https://partneri.shoptet.cz/profesionalove/socials-advertising/"}
    ]
  }'::jsonb
),
(
  'benefits',
  '🎁 Co od nás dostanete ke každé spolupráci',
  'Nejde jen o reklamu — stavíme partnerství, které vám pomůže růst',
  '{
    "items": [
      {"icon": "📞", "title": "1× měsíčně vyhodnocovací call + konzultace", "desc": "Pravidelně spolu procházíme výsledky a hledáme nové příležitosti pro růst vašeho businessu. Žádné překvapení — vždy víte, co se děje a proč."},
      {"icon": "📊", "title": "24/7 přístup k reportu výsledků", "desc": "Živý report s aktuálními daty kdykoli potřebujete. Nemusíte čekat na měsíční PDF — vidíte výkon kampaní v reálném čase."},
      {"icon": "💬", "title": "Komunikace v projektovém nástroji Freelo", "desc": "Veškerá komunikace na jednom místě, přehledně a dohledatelně. Žádné ztracené e-maily nebo zapomenuté požadavky."},
      {"icon": "👤", "title": "Komunikujete přímo se specialistou", "desc": "Žádný prostředník ani account manager — mluvíte rovnou s člověkem, který vaše kampaně denně spravuje a zná je do detailu."},
      {"icon": "🏠", "title": "Celý výkonnostní marketing pod jednou střechou", "desc": "Meta, Google, Shoptet, analytika — vše řešíme my. Ušetříte čas i nervy s koordinací více dodavatelů a máte jednoho partnera pro vše."},
      {"icon": "🧠", "title": "Strategická podpora rozvoje vašeho businessu", "desc": "Nejsme jen specialisté na reklamu — rozumíme e-commerce, maržím a obchodním modelům. Pomůžeme vám najít nové příležitosti, optimalizovat nabídku a škálovat byznys, nejen kampaně."}
    ]
  }'::jsonb
),
(
  'onboarding',
  '🚀 Jak to bude probíhat',
  'Celý proces zvládneme obvykle do 48 hodin od vašeho rozhodnutí.',
  '{
    "steps": [
      {"icon": "FileSignature", "title": "Digitální podpis smlouvy", "description": "Pošleme vám k digitálnímu podpisu smlouvu o propagaci a zpracování osobních údajů přes nástroj DigiSign.", "timeline": "Do 24 hodin"},
      {"icon": "ClipboardList", "title": "Přístupy do Freela", "description": "Pošleme vám přístupy do Freela – nástroje na projektové řízení, kde budete mít přehled o všem, co děláme.", "timeline": "Do 24 h od podpisu"},
      {"icon": "Phone", "title": "Onboardingový telefonát", "description": "Spojí se s vámi projektový manažer ohledně onboardingového telefonátu, kde si projdete všechny potřebné další kroky.", "timeline": "Do 24 hodin"},
      {"icon": "UserCheck", "title": "Navýšení přístupů", "description": "Navýšíte nám přístupy do reklamních platforem – zašleme vám přesné instrukce s potřebnými úrovněmi oprávnění.", "timeline": "Cca 24 hodin"},
      {"icon": "Rocket", "title": "Pustíme se do práce!", "description": "Začneme s optimalizací stávajících kampaní a následně spustíme vlastní strategie šité na míru vašemu byznysu.", "timeline": "Let''s go 🚀"}
    ]
  }'::jsonb
),
(
  'reporting',
  '📊 Reporting až na úroveň zisku',
  'Pro Shoptet klienty dodáváme reporting až na úroveň contribution margin. Budete přesně vědět, kolik peněz vám vydělá jaký produkt.',
  '{
    "note": "(Na implementaci dalších platforem jako Shopify a Upgates nyní pracujeme.)",
    "demo_report_url": "https://68bb7487-e1f5-44d2-a8a4-9044e8cf5438.lovableproject.com/shared-report/376158d883246f2ecfec54891d03e0a3c0ae4090e0c5dda9"
  }'::jsonb
),
(
  'creative_portfolio',
  '🎨 Grafika, která prodává',
  'Všem klientům doporučujeme nechat si kreativy tvořit u nás. Specializujeme se na grafiku pro výkonnostní reklamy — díky AI nástrojům nám stačí fotka produktu na bílém pozadí a vytvoříme kompletní bannery i videa.',
  '{}'::jsonb
),
(
  'cta',
  '🚀 Pojďme do toho',
  'Stačí vyplnit krátký formulář a můžeme začít.',
  '{
    "extended_subtitle": "Celý onboarding zvládneme do 48 hodin — smlouvu pošleme k digitálnímu podpisu, nastavíme přístupy a spustíme kampaně.",
    "button_text": "Začít spolupráci",
    "footer_note": "✅ Smlouva do 24 hodin"
  }'::jsonb
),
(
  'clients_logos',
  '❤️ Značky, které jsme pomohli posunout',
  'Pomáháme růst firmám napříč odvětvími',
  '{}'::jsonb
),
(
  'certifications',
  '🏆 Certifikace & partnerství',
  'Oficiálně certifikovaný tým s přístupem k nejnovějším nástrojům a beta funkcím',
  '{}'::jsonb
),
(
  'credibility_badges',
  NULL,
  NULL,
  '{
    "items": ["Meta Business Partner", "Google Partner", "Shoptet Zlatý Partner", "30 mil. Kč/měsíc ve správě"]
  }'::jsonb
);
