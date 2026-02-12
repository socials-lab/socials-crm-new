

## Souhrn objednávky - frontend příprava (bez Resend)

### Co se změní

Po odeslání formuláře se zavolá edge function `send-onboarding-summary`, která zatím pouze zaloguje data a vrátí success. Na frontendu se připraví kompletní payload se všemi daty pro budoucí napojení na Resend.

### 1. Edge Function: `supabase/functions/send-onboarding-summary/index.ts`

- Přijme POST s daty objednávky
- Zaloguje payload do konzole (pro debugging)
- Vrátí `{ success: true }` bez odesílání emailu
- Připravená struktura pro budoucí napojení na Resend (zakomentovaný kód)

**Payload:**
```
{
  companyName, ico, dic, website,
  billingAddress: { street, city, zip, country, email },
  services: [{ name, price, currency, billingType, proratedPrice }],
  startDate, isProrated, remainingDays, daysInMonth,
  monthlyTotal, proratedMonthlyTotal, oneOffTotal,
  signatories: [{ name, email, phone }],
  projectContacts: [{ name, email, phone }],
  recipients: {
    to: [kontakt email, owner email],
    bcc: ["danny@socials.cz", "dana.bauerova@socials.cz"]
  }
}
```

### 2. Úprava `src/pages/OnboardingForm.tsx`

V `onSubmit` po `markLeadAsConverted` (řádek 365):
- Sestavit payload ze všech form dat + order summary
- Zavolat `fetch` na edge function
- Obalit v `try/catch` -- selhání nesmí blokovat úspěch formuláře
- `console.log` payload pro debugging

### Soubory

| Soubor | Akce |
|--------|------|
| `supabase/functions/send-onboarding-summary/index.ts` | Nový |
| `src/pages/OnboardingForm.tsx` | Úprava řádků ~365-367 |

