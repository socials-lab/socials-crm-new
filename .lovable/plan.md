
## Odeslání souhrnu objednávky emailem po odeslání formuláře

### Co se změní

Po úspěšném odeslání onboarding formuláře se automaticky odešle email se souhrnem objednávky na:
- **To**: hlavní kontakt klienta (email z formuláře) + prodejce (owner)
- **BCC**: danny@socials.cz, dana.bauerova@socials.cz

### Implementace

#### 1. Nová Edge Function: `send-onboarding-summary`

Vytvoří se nová Supabase Edge Function, která přijme data z formuláře a odešle email pomocí Resend API (bude potřeba přidat API klíč).

**Vstupní data:**
- Informace o firmě (název, IČO, DIČ, web)
- Fakturační adresa
- Seznam služeb s cenami (včetně poměrné fakturace za první měsíc)
- Datum zahájení
- Kontaktní osoby (signatáři + projektové kontakty)
- Email prodejce (owner)
- Email hlavního kontaktu

**Emaily se odešlou na:**
- To: hlavní kontakt, prodejce
- BCC: danny@socials.cz, dana.bauerova@socials.cz

**Obsah emailu:**
- HTML formátovaný souhrn objednávky
- Seznam služeb s cenami
- Info o poměrné fakturaci prvního měsíce (pokud platí)
- Fakturační údaje
- Kontaktní osoby
- Datum zahájení spolupráce

#### 2. Úprava `src/pages/OnboardingForm.tsx`

V `onSubmit` funkci se po úspěšném vytvoření klienta zavolá edge function pro odeslání emailu. Pokud email selže, formulář se stále odešle úspěšně (email je "best effort").

### Potřebné kroky

1. **Přidat Resend API klíč** jako secret (`RESEND_API_KEY`) -- bude potřeba ho nastavit
2. **Vytvořit** `supabase/functions/send-onboarding-summary/index.ts`
3. **Upravit** `src/pages/OnboardingForm.tsx` -- přidat volání edge function v `onSubmit`

### Technické detaily

**Edge Function (`supabase/functions/send-onboarding-summary/index.ts`):**
- Přijímá POST request s daty formuláře
- Nepotřebuje autorizaci (volá se z veřejného formuláře)
- Odesílá email přes Resend API (from: noreply@socials.cz nebo podobná doména)
- HTML šablona emailu s přehledným souhrnem

**Frontend (`src/pages/OnboardingForm.tsx`):**
- Po řádku 365 (`markLeadAsConverted`) přidat `fetch` volání na edge function
- Předat: services, pricing, kontakty, fakturační údaje, owner info
- Obalit v try/catch -- selhání emailu nesmí blokovat úspěšné odeslání formuláře

**Nová závislost:** žádná (Resend se volá přes fetch v edge function)

**Nový secret:** `RESEND_API_KEY` -- nutno nastavit v projektu
