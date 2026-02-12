

## Implementace automatického získávání finančních údajů z Hlídače státu

### Přehled
Napojení na API Hlídače státu (`/api/v2/firmy/ico/{ico}`) pro automatické zobrazení obratu, zisku a dalších finančních údajů přímo v detailu leadu. Nahradí stávající odkaz na Justice.cz.

### Kroky implementace

#### 1. Uložení API klíče
Uložení tokenu `311be6aa861040cbaa6ae0813f727bc1` jako Supabase secret `HLIDAC_STATU_API_KEY`.

#### 2. Edge funkce `company-financials`
Nová Supabase edge funkce v `supabase/functions/company-financials/index.ts`:
- Přijímá parametr `ico`
- Volá `https://api.hlidacstatu.cz/api/v2/firmy/ico/{ico}` s hlavičkou `Authorization: Token {key}`
- Vrací zpracovaná finanční data (obrat, zisk, počet zaměstnanců, roky)
- CORS headers pro volání z webové aplikace
- Registrace v `supabase/config.toml` s `verify_jwt = false`

#### 3. React hook `useCompanyFinancials`
Nový hook v `src/hooks/useCompanyFinancials.tsx`:
- Přijímá IČO jako parametr
- Volá edge funkci přes Supabase client (`supabase.functions.invoke`)
- Cachuje výsledky pomocí React Query
- Stavy: loading, error, data

#### 4. UI komponenta `CompanyFinancials`
Nová komponenta v `src/components/leads/CompanyFinancials.tsx`:
- Zobrazí karty s posledním dostupným obratem a ziskem
- Zobrazí trend (meziroční změna)
- Kompaktní design do stávajícího collapsible "Firemní údaje"
- Nahradí stávající odkaz "hledat na Justice.cz" (řádky 491-504 v LeadDetailDialog)
- Loading skeleton + error state

#### 5. Úprava LeadDetailDialog
- Nahrazení statického odkazu na Justice.cz komponentou `CompanyFinancials`
- Komponenta se zobrazí pouze pokud lead má vyplněné IČO

---

### Technické detaily

**API endpoint:** `GET /api/v2/firmy/ico/{ico}`

**Hlavička:** `Authorization: Token 311be6aa861040cbaa6ae0813f727bc1`

**Očekávaná struktura odpovědi** (na základě Swagger dokumentace):
- Firma obsahuje finanční údaje z účetních závěrek
- Obrat, zisk, počet zaměstnanců za jednotlivé roky

**Soubory k vytvoření:**
- `supabase/functions/company-financials/index.ts`
- `src/hooks/useCompanyFinancials.tsx`
- `src/components/leads/CompanyFinancials.tsx`

**Soubory k úpravě:**
- `supabase/config.toml` -- přidání `[functions.company-financials]`
- `src/components/leads/LeadDetailDialog.tsx` -- nahrazení odkazu na Justice.cz komponentou

