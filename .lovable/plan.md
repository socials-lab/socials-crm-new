

# Pridani vsech sluzeb jako mock data do vypisu

## Co se zmeni

Aktualne se v DB nachazi pouze `SOCIALS_BOOST` a v kodu se pridava mock `CREATIVE_BOOST`. Ostatni sluzby (`PPC_BOOST`, `PERFORMANCE_BOOST`, `GOOGLE_ADS`, `SKLIK`, `ANALYTICS`, `CONSULTING`) maji definovane detaily v `serviceDetails.ts`, ale nezobrazuji se na strance `/services`, protoze neexistuji jako `Service` objekty.

Pridame vsechny chybejici sluzby jako mock data do `useCRMData.tsx`, aby se zobrazovaly ve vypisu.

## Kroky

### 1. Pridat mock Service objekty do `src/hooks/useCRMData.tsx`

Vedle existujiciho `CREATIVE_BOOST_SERVICE` pridame dalsich 5 mock sluzeb:

| Kod | Nazev | Typ | Kategorie | Cena |
|-----|-------|-----|-----------|------|
| PPC_BOOST | PPC Boost | core | performance | 24 900 (tier) |
| PERFORMANCE_BOOST | Performance Boost | core | performance | 43 900 (tier) |
| GOOGLE_ADS | Google Ads | core | performance | 15 000 (tier) |
| SKLIK | Sklik | core | performance | 10 000 (tier) |
| ANALYTICS | Analytics | addon | analytics | 5 000 |
| CONSULTING | Consulting | addon | consulting | 3 000 |

Kazda sluzba bude mit:
- Unikatni `id` (napr. `srv-4` az `srv-9`)
- `tier_pricing` pro core sluzby (z `serviceDetails.ts` tierPricing)
- `description` z tagline v serviceDetails
- `default_deliverables` z benefits
- `is_active: true`

### 2. Upravit query logiku v `useCRMData.tsx`

Rozsirit existujici logiku, ktera pridava `CREATIVE_BOOST` pokud neni v DB, aby pridavala vsechny mock sluzby, ktere jeste nejsou v DB. Kontrola bude podle `code`, stejne jako ted u Creative Boost.

## Technicke detaily

- Zmena pouze v 1 souboru: `src/hooks/useCRMData.tsx`
- Zadne nove zavislosti
- Existujici pattern (CREATIVE_BOOST mock) se rozsiri na vsechny sluzby
- Sluzby se budou radit abecedne (existujici `.sort()`)

