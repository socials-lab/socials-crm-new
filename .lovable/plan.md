

# Aktualizace cen addon služeb

## Přehled změn

| Služba | Aktuální cena | Nová cena |
|--------|--------------|-----------|
| Creative Boost | 400 Kč/kredit | beze změny (kreditový systém) |
| Video Boost | 4 900 Kč | beze změny |
| TikTok Ads | 0 Kč | 15 000 Kč / měs. |
| Heureka a Zboží.cz | 0 Kč | 5 600 Kč / měs. |
| Glami | 0 Kč | 3 200 Kč / měs. |
| Favi | 0 Kč | 3 200 Kč / měs. |
| AI SEO | 18 000 Kč (1 800 Kč/hod) | 16 000 Kč (1 600 Kč/hod) |
| Analytické měření | neexistuje | NOVÁ služba -- 1 900 Kč/hod |

## Změny v souborech

### 1. `src/hooks/useCRMData.tsx` -- aktualizace base_price

- **TIKTOK_ADS** (srv-12): `base_price: 0` -> `base_price: 15000`
- **HEUREKA_ZBOZI** (srv-11): `base_price: 0` -> `base_price: 5600`
- **GLAMI** (srv-13): `base_price: 0` -> `base_price: 3200`
- **FAVI** (srv-14): `base_price: 0` -> `base_price: 3200`
- **AI_SEO** (srv-15): `base_price: 18000` -> `base_price: 16000`
- **Nová služba** `ANALYTICS_MEASUREMENT` (srv-16): addon/performance, base_price: 1900, popis "Nastavení a kontrola měření pomocí GTM, GA4, Meta Pixelu, konverzí"

### 2. `src/constants/serviceDetails.ts` -- AI SEO hodinová sazba

- Změnit "1 800 Kč / hod." na "1 600 Kč / hod." v sekci rozsahu a ceny
- Přidat nový záznam `ANALYTICS_MEASUREMENT` s tagline, platformami (GTM, GA4, Meta Pixel), benefity, setup a management sekcemi

### 3. `src/constants/serviceDefaults.ts` -- nová služba

- Přidat záznam `'analytics_measurement'` s deliverables, frekvencí, turnaround, požadavky a detailed sections

## Technické detaily

- Změny ve 3 souborech
- Žádné nové závislosti
- Analytické měření je hodinová služba (jako AI SEO), bez kreditového systému a bez tierů

