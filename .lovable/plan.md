

## Oprava CompanyFinancials - nahrazení nefunkčního Hlídače státu

### Problem
Hlídač státu API vrací **403 error** - free API token nemá přístup k endpointu `/firmy/ico/`. Celá komponenta `CompanyFinancials` proto nefunguje a zobrazuje pouze nefunkční odkaz.

### Analýza
- Endpoint `/api/v2/firmy/ico/{ico}` vyžaduje placenou licenci
- Endpoint `/api/v2/firmy/GetDetailInfo` (obrat, zaměstnanci) rovněž vyžaduje placenou licenci
- Neexistuje žádný free veřejný API endpoint pro české firemní finanční data (obrat/tržby)
- ARES API (které už v projektu funguje) poskytuje pouze základní údaje - ne finanční

### Navrhované řešení

Přepsat edge funkci `company-financials` tak, aby **scrapovala finanční data z webu Hlídače státu** (stránka `hlidacstatu.cz/subjekt/{ico}` je veřejně přístupná bez API klíče). Alternativně stáhne data z veřejného rejstříku.

**Konkrétní kroky:**

#### 1. Přepsat edge funkci `company-financials`
- Nahradit volání Hlídač státu API přímým scrapováním stránky `https://www.hlidacstatu.cz/subjekt/{ico}` pomocí fetch
- Parsovat HTML odpověď a extrahovat dostupná finanční data (smlouvy, dotace, rizika)
- Jako zálohu volat ARES API pro základní údaje (jméno, DS, datum vzniku)
- Alternativně: volat `https://rejstrik.penize.cz/ares/08186464` kde bývají obratová data

#### 2. Upravit `useCompanyFinancials` hook
- Volat edge funkci přes `supabase.functions.invoke` místo přímého fetch (správný pattern)
- Aktualizovat typy odpovědi

#### 3. Přepsat `CompanyFinancials` komponentu
- Zobrazit data, která se reálně podaří získat (název firmy, datum vzniku, DS, rizika ze smluv)
- Zachovat odkaz na profil Hlídače státu (ten funguje, je veřejný)
- Pokud se nepodaří scraping, zobrazit alespoň data z ARES (ta už máme)

### Technické detaily

**Upravené soubory:**
- `supabase/functions/company-financials/index.ts` - scraping místo API
- `src/hooks/useCompanyFinancials.tsx` - použít `supabase.functions.invoke`
- `src/components/leads/CompanyFinancials.tsx` - zobrazit dostupná data

**Princip scrapingu:**
```text
1. Fetch HTML z https://www.hlidacstatu.cz/subjekt/{ico}
2. Regex/string parsing pro extrakci klíčových dat
3. Fallback na ARES basic endpoint pro jméno a adresu
4. Vrátit strukturovaná data
```

