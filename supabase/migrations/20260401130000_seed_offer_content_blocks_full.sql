-- Seed richer default content for /offer-management editor sections.

INSERT INTO public.offer_content_blocks (section_key, title, subtitle, content)
VALUES
(
  'why_us',
  '💪 Proč právě my',
  'Ne sliby, ale skutečný business dopad. Podobnou agenturu na trhu nenajdete.',
  '{
    "items": [
      {"stat": "30+ mil. Kč", "label": "měsíčně ve správě", "description": "Spravujeme reklamní rozpočty přes 30 milionů Kč měsíčně. Máme zkušenosti s velkými i středními e-shopy."},
      {"stat": "AI-first", "label": "přístup ke správě", "description": "Využíváme AI ve všem - od tvorby grafik na míru, přes analýzu dat, až po optimalizaci kampaní. Díky tomu jsme rychlejší a efektivnější."},
      {"stat": "Zisk", "label": "ne jen revenue", "description": "Neřešíme jen revenue a PNO. Díky naší unikátní technologii měříme váš skutečný zisk na úrovni produktu a contribution margin."},
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
  'Nejde jen o reklamu - stavíme partnerství, které vám pomůže růst',
  '{
    "items": [
      {"icon": "📞", "title": "1x měsíčně vyhodnocovací call + konzultace", "desc": "Pravidelně spolu procházíme výsledky a hledáme nové příležitosti pro růst vašeho businessu."},
      {"icon": "📊", "title": "24/7 přístup k reportu výsledků", "desc": "Živý report s aktuálními daty kdykoli potřebujete."},
      {"icon": "💬", "title": "Komunikace v projektovém nástroji Freelo", "desc": "Veškerá komunikace na jednom místě, přehledně a dohledatelně."},
      {"icon": "👤", "title": "Komunikujete přímo se specialistou", "desc": "Žádný prostředník ani account manager - mluvíte rovnou s člověkem, který vaše kampaně denně spravuje."},
      {"icon": "🏠", "title": "Celý výkonnostní marketing pod jednou střechou", "desc": "Meta, Google, Shoptet, analytika - vše řešíme my."},
      {"icon": "🧠", "title": "Strategická podpora rozvoje vašeho businessu", "desc": "Pomůžeme vám najít nové příležitosti, optimalizovat nabídku a škálovat byznys."}
    ]
  }'::jsonb
),
(
  'onboarding',
  '🚀 Jak to bude probíhat',
  'Celý proces zvládneme obvykle do 48 hodin od vašeho rozhodnutí.',
  '{
    "steps": [
      {"icon": "FileSignature", "title": "Digitální podpis smlouvy", "description": "Pošleme vám k digitálnímu podpisu smlouvu o propagaci a zpracování osobních údajů přes DigiSign.", "timeline": "Do 24 hodin"},
      {"icon": "ClipboardList", "title": "Přístupy do Freela", "description": "Pošleme vám přístupy do Freela - nástroje na projektové řízení.", "timeline": "Do 24 h od podpisu"},
      {"icon": "Phone", "title": "Onboardingový telefonát", "description": "Spojí se s vámi projektový manažer a projde další kroky.", "timeline": "Do 24 hodin"},
      {"icon": "UserCheck", "title": "Navýšení přístupů", "description": "Navýšíte nám přístupy do reklamních platforem podle instrukcí.", "timeline": "Cca 24 hodin"},
      {"icon": "Rocket", "title": "Pustíme se do práce", "description": "Začneme optimalizovat kampaně a nasazovat strategii šitou na míru.", "timeline": "Let''s go 🚀"}
    ]
  }'::jsonb
),
(
  'reporting',
  '📊 Reporting až na úroveň zisku',
  'Pro Shoptet klienty dodáváme reporting až na úroveň contribution margin.',
  '{
    "note": "(Na implementaci dalších platforem jako Shopify a Upgates nyní pracujeme.)",
    "demo_report_url": "https://adfactory.socials.cz/shared-report/376158d883246f2ecfec54891d03e0a3c0ae4090e0c5dda9"
  }'::jsonb
),
(
  'creative_portfolio',
  '🎨 Grafika, která prodává',
  'Všem klientům doporučujeme nechat si kreativy tvořit u nás. Specializujeme se na grafiku pro výkonnostní reklamy.',
  '{}'::jsonb
),
(
  'cta',
  '🚀 Pojďme do toho',
  'Stačí vyplnit krátký formulář a můžeme začít.',
  '{
    "extended_subtitle": "Celý onboarding zvládneme do 48 hodin - smlouvu pošleme k digitálnímu podpisu, nastavíme přístupy a spustíme kampaně.",
    "button_text": "Začít spolupráci",
    "footer_note": "✅ Smlouva do 24 hodin"
  }'::jsonb
),
(
  'clients_logos',
  '❤️ Značky, které jsme pomohli posunout',
  'Pomáháme růst firmám napříč odvětvími',
  '{"images":[]}'::jsonb
),
(
  'certifications',
  '🏆 Certifikace & partnerství',
  'Oficiálně certifikovaný tým s přístupem k nejnovějším nástrojům a beta funkcím',
  '{"images":[]}'::jsonb
),
(
  'credibility_badges',
  null,
  null,
  '{"items":["✅ 13 seniorních specialistů","🤖 Enhanced by AI","📈 30 mil. Kč/měsíc v reklamách","⭐ 5/5 hodnocení","🚀 7 let na trhu"]}'::jsonb
)
ON CONFLICT (section_key)
DO UPDATE SET
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle,
  content = EXCLUDED.content,
  updated_at = now();
