

## Plan: Notifikace po vyplnění onboarding formuláře kandidátem

### Co se stane
Když kandidát vyplní onboardingový formulář, systém automaticky odešle CRM notifikaci všem adminům s přehledem klíčových údajů pro vytvoření smlouvy.

### Notifikace bude obsahovat
- Jméno kandidáta, pozice, email, telefon
- IČO, název firmy, DIČ
- Fakturační adresa
- Hodinová sazba, bankovní účet
- Datum narození

### Technické kroky

**1. Rozšířit edge function `applicant-onboarding`**
- Po úspěšném uložení onboarding dat (POST handler, po `update`) načíst plná data kandidáta
- Zavolat `notifyAdmins` — ale protože jsme v edge function (ne v klientu), vložíme notifikace přímo do tabulky `notifications` přes service role klient
- Notifikace bude typu `applicant_onboarding_completed`
- Metadata budou obsahovat shrnutí pro smlouvu (jméno, pozice, IČO, sazba, adresa...)
- Link na `/recruitment` pro rychlý přístup

**2. Přidat trigger funkci v `notificationTriggers.ts`**
- Nová funkce `notifyApplicantOnboardingCompleted(applicantId, applicantName, position, contractSummary)`
- Volá `notifyAdmins` se strukturovaným shrnutím pro smlouvu
- Message bude: `"{jméno} vyplnil onboarding formulář. Připravte smlouvu – pozice: {pozice}, sazba: {sazba} Kč/h"`

**3. Zavolat notifikaci z edge function**
- V POST handleru `applicant-onboarding`, po úspěšném update, vložit přímo INSERT do `notifications` tabulky pro všechny adminy (přes service role — edge function má přístup)
- Metadata: `{ full_name, position, email, phone, ico, company_name, dic, hourly_rate, billing_address, bank_account, birthday }`

**4. Volitelně: zavolat notifikaci i z klienta**
- V `ApplicantOnboardingForm.tsx` po úspěšném uložení zavolat trigger — ale protože formulář je veřejný (bez auth), lepší je to řešit v edge function

### Rozhodnutí
- Notifikace se vytvoří v edge function (server-side), ne z klienta — protože onboarding formulář je veřejný a nemá auth context
- Nepotřebujeme nový typ notifikace v DB — stačí textový typ `applicant_onboarding_completed`

