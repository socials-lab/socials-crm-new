
## Automatické vyhledávání z ARES + odstranění sekce Nabídka

### Co se změní

**1. Automatické vyhledávání při zadání IČO**
- Odstranění tlačítek "Lupa" a "ARES" 
- Debounced automatické vyhledávání po zadání 8 číslic do pole IČO (500ms debounce)
- Nahrazení mock dat za reálné ARES API (`https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/{ico}`)
- Vizuální indikátor načítání přímo v inputu (spinner)
- Po úspěšném načtení se automaticky vyplní: název firmy, DIČ, sídlo (ulice, město, PSČ, země), právní forma

**2. Nová data z ARES**
- **Jednatelé / statutární orgán** - z VR endpointu (`/ekonomicke-subjekty-vr/{ico}`), zobrazení jmen jednatelů
- **Sídlo firmy** - celá adresa ze `sidlo.textovaAdresa`
- **Právní forma** - kód + název (s.r.o., a.s., OSVČ apod.)
- **Datum vzniku** - `datumVzniku`
- **CZ-NACE** - obor podnikání (první položka z `czNace`)
- **Odkaz na ARES** - automaticky generovaný odkaz `https://ares.gov.cz/ekonomicke-subjekty/res/{ico}`
- **Obrat firmy** - ARES tuto informaci bohužel neposkytuje (není ve veřejném API). Bude zobrazena poznámka s odkazem na Justice.cz kde lze sbírku listin najít

**3. Odstranění sekce Nabídka z formuláře**
- Celá sekce "Nabídka" (řádky 708-810) bude odstraněna z `AddLeadDialog`
- Pole `potential_service`, `offer_type`, `estimated_price`, `currency`, `offer_url` nebudou povinná při vytváření leadu
- Validační schéma bude upraveno - tyto položky budou mít výchozí hodnoty
- Nabídka se bude zadávat až po vytvoření leadu v detailu (tab Nabídka v LeadDetailDialog)

**4. Zobrazení ARES dat v detailu leadu (LeadDetailDialog)**
- V tabu "Přehled" přidání sekce s daty z ARES: jednatelé, právní forma, datum vzniku, odkaz na ARES
- Readonly informační panel s daty načtenými při vytváření

### Technické změny

**Soubory k úpravě:**

1. **`src/components/leads/AddLeadDialog.tsx`**
   - Nahrazení `handleAresLookup` za debounced auto-lookup na onChange IČO pole
   - Reálné ARES API volání (2 endpointy: základní + VR pro jednatele)
   - Odstranění mock dat (`MOCK_ARES_DATA`)
   - Odstranění tlačítek Search/ARES
   - Přidání zobrazení jednatelů (read-only badge list)
   - Přidání odkazu na ARES profil
   - Odstranění celé sekce "Nabídka" (service, offer_type, price, currency, offer_url)
   - Úprava zod schématu - `potential_service`, `estimated_price` nepovinné s defaulty
   - Přidání nových polí do stavu: `aresDirectors`, `aresLegalForm`, `aresFounded`

2. **`src/components/leads/LeadDetailDialog.tsx`**
   - V tabu Přehled přidání odkazu na ARES (již tam je, jen ověření)
   - Zobrazení jednatelů pokud jsou uloženi v lead datech

3. **`src/types/crm.ts`**
   - Přidání volitelných polí do Lead typu: `legal_form`, `founded_date`, `directors`, `ares_nace`

**Poznámka k obratu:** ARES API neposkytuje finanční údaje (obrat, zisk). Tyto informace jsou dostupné pouze ve sbírkách listin na Justice.cz. Do UI přidáme odkaz na `https://or.justice.cz/ias/ui/rejstrik-$firma?ico={ico}` kde si uživatel může tyto údaje dohledat ručně.
