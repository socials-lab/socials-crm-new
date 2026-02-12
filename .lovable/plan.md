

## Propojení ceníku kreditů se všemi zakázkami

### Současný stav

Existují dvě nezávislé kopie typů výstupů:
1. **Service Details** (`serviceDetails.ts`) -- zjednodušený ceník (název, kredity, popis) zobrazený v detailu služby
2. **Creative Boost Mock Data** (`creativeBoostMockData.ts`) -- plný ceník (id, název, kategorie, baseCredits) používaný všude jinde v aplikaci

Editace v detailu služby mění jen první kopii a nikam se nepropisuje.

### Řešení -- jeden zdroj pravdy

Odstraníme duplicitu: ceník v `serviceDetails.ts` zrušíme a detail služby bude číst a zapisovat přímo do `creativeBoostMockData.ts` přes `useCreativeBoostData` hook.

### Technické detaily

**1. `src/pages/Services.tsx`**
- Callback `onCreditPricingUpdate` bude volat `updateOutputType` z `useCreativeBoostData` pro každý změněný řádek
- Při přidání nového řádku zavolá `addOutputType`
- Při smazání řádku zavolá existující nebo novou funkci pro deaktivaci/smazání výstupu
- Data pro `ServiceDetailView` se namapují z `outputTypes` hooku místo z `serviceDetails.ts`

**2. `src/components/services/ServiceDetailView.tsx`**
- Žádná změna struktury -- stále přijímá `credit_pricing` prop s `outputTypes`
- Inline editace funguje stejně, jen data teď pocházejí z jiného zdroje

**3. `src/constants/serviceDetails.ts`**
- Ze sekce `CREATIVE_BOOST.creditPricing` odstraníme pole `outputTypes` (zůstane jen `basePrice`, `currency`, `expressMultiplier`)
- Typy výstupů se budou načítat dynamicky z mock dat

**4. `src/hooks/useCreativeBoostData.tsx`**
- Přidáme funkci `removeOutputType(id)` pro smazání typu výstupu (nebo deaktivaci přes `isActive: false`)

### Výsledek

Jakákoliv úprava ceníku v detailu služby se okamžitě projeví ve všech zakázkách, v Creative Boost přehledu, ve fakturaci i v odměnách -- protože všechny čtou ze stejného zdroje dat.
