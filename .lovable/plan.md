

# Pridani addon sluzby "Sprava Heureky a Zbozi.cz"

## Co se zmeni

Pridame novou addon sluzbu `HEUREKA_ZBOZI` do 3 souboru podle existujiciho patternu (stejne jako Video Boost, Analytics, Consulting).

## Zmeny v souborech

### 1. `src/constants/serviceDetails.ts` -- pridat HEUREKA_ZBOZI

Novy zaznam s:

- **tagline**: "Sprava Heureky a Zbozi.cz -- optimalizace feedu, bidding a maximalni ziskovost"
- **platforms**: Heureka, Zbozi.cz, Mergado
- **targetAudience**: E-shopy, ktere chteji maximalizovat vykon na srovnavacich zbozi
- **benefits**: 5 bodu (import a validace feedu, optimalizace nazvu a sparovani, bidding pro max. ziskovost, podpora recenzi a duveryhodnosti, pravidelny reporting a analyza)
- **setup**: 1 sekce -- Uvodni nastaveni (import XML feedu do Mergada, premapovani kategorii, doplneni EAN, testovani vystupu)
- **management**: 4 sekce:
  - Optimalizace XML feedu (validace, nazvy, sparovani, EAN kody)
  - Bidding -- rizeni CPC (segmentace, automatizovany bidding, manualni CPC, vyhodnoceni PNO/ROI)
  - Recenze a duveryhodnost (Overeno zakazniky, hodnoceni produktu)
  - Analyza a reporting (sledovani vykonu, pravidelny reporting)
- **tierComparison**: prazdne pole (nema tiery)
- **tierPricing**: zadne (addon sluzba bez tieru)

### 2. `src/constants/serviceDefaults.ts` -- pridat 'heureka'

Novy zaznam `'heureka'` s:

- **deliverables**: 5 hlavnich bodu
- **frequency**: Prubezna sprava a mesicni optimalizace
- **turnaround**: Uvodni nastaveni do 5 pracovnich dnu
- **requirements**: Pristup k e-shopu, XML feed, pristup do Mergada, pristup do Heureka/Zbozi.cz adminu
- **detailed_sections**: 5 sekci:
  1. Uvodni nastaveni (import, premapovani, testovani)
  2. Optimalizace XML feedu (validace, nazvy, sparovani, EAN)
  3. Bidding -- rizeni CPC (segmentace, automatizace, manualni upravy, PNO/ROI)
  4. Recenze a duveryhodnost (Overeno zakazniky, hodnoceni)
  5. Analyza a reporting (sledovani vykonu, pravidelny reporting)

### 3. `src/hooks/useCRMData.tsx` -- pridat mock service

Pridat `HEUREKA_ZBOZI` do pole `MOCK_SERVICES`:
- **id**: `srv-11`
- **code**: `HEUREKA_ZBOZI`
- **name**: `Správa Heuréky a Zboží.cz`
- **service_type**: `addon`
- **category**: `performance`
- **base_price**: null (individualni)
- **tier_pricing**: null
- **default_deliverables**: 5 bodu z benefitu

## Technicke detaily

- Zmeny ve 3 souborech: `serviceDetails.ts`, `serviceDefaults.ts`, `useCRMData.tsx`
- Zadne nove zavislosti
- Addon sluzba bez tieru a bez kreditoveho systemu
- Nasleduje identicky pattern jako Video Boost, Analytics, Consulting
