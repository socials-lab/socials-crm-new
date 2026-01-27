
# Plan: Rozšíření osobních údajů kolegů (frontend only)

## Shrnutí
Přidám nové osobní a fakturační údaje ke kolegům pouze na úrovni frontendu:
- Datum narození (birthday) - již existuje v typu
- Telefonní číslo (phone) - již existuje
- Soukromý email (personal_email) - nové
- IČO, DIČ, název firmy - nové
- Kompletní fakturační adresa - nové
- Číslo bankovního účtu - nové

Všechny údaje budou sbírány v onboarding formuláři a uloženy v lokálním stavu (mock data).

---

## 1. Aktualizace TypeScript typu Colleague

**Soubor:** `src/types/crm.ts`

Rozšířím interface `Colleague` o nová pole:
```typescript
export interface Colleague {
  // ... existující pole ...
  personal_email: string | null;  // Soukromý email
  ico: string | null;             // IČO
  dic: string | null;             // DIČ
  company_name: string | null;    // Název firmy/OSVČ
  billing_street: string | null;  // Ulice a číslo
  billing_city: string | null;    // Město
  billing_zip: string | null;     // PSČ
  bank_account: string | null;    // Číslo účtu
}
```

---

## 2. Aktualizace mock dat v useCRMData

**Soubor:** `src/hooks/useCRMData.tsx`

Přidám výchozí hodnoty `null` pro nová pole v mock datech kolegů.

---

## 3. Applicant Onboarding Form - přidání nových polí

**Soubor:** `src/pages/ApplicantOnboardingForm.tsx`

### Změny ve validačním schématu:
- Přidám pole `birthday` (datum narození) - povinné
- Přidám pole `personal_email` (soukromý email) - volitelné

### Nová sekce "Osobní údaje":
Formulář bude rozdělen do sekcí:
1. **Základní údaje** (jméno, pracovní email, telefon, pozice)
2. **Osobní údaje** (datum narození, soukromý email) - NOVÁ SEKCE
3. **Fakturační údaje** (IČO, firma, DIČ, adresa)
4. **Platební údaje** (hodinová sazba, číslo účtu)

---

## 4. ColleagueForm - přidání nových polí

**Soubor:** `src/components/forms/ColleagueForm.tsx`

Přidám novou sekci "Osobní a fakturační údaje" s poli:
- Soukromý email
- Datum narození (datepicker)
- IČO s ARES validací (tlačítko pro načtení dat)
- Název firmy
- DIČ
- Fakturační adresa (ulice, město, PSČ)
- Číslo účtu

Tato sekce bude viditelná pouze pro adminy/uživatele s finančními právy.

---

## 5. Colleagues page - zobrazení osobních údajů

**Soubor:** `src/pages/Colleagues.tsx`

V rozbalené kartě kolegy přidám novou sekci "Fakturační údaje" (viditelnou pouze pro adminy):

Zobrazené informace:
- Datum narození s ikonou dortu
- Soukromý email
- IČO a DIČ
- Název firmy
- Fakturační adresa
- Číslo bankovního účtu

---

## 6. Aktualizace konverze uchazeče na kolegu

**Soubory:** 
- `src/components/recruitment/ConvertApplicantDialog.tsx`
- `src/hooks/useApplicantsData.tsx`

Při konverzi uchazeče na kolegu zajistím přenos všech nových údajů do záznamu kolegy.

---

## Přehled souborů k úpravě

| Soubor | Změny |
|--------|-------|
| `src/types/crm.ts` | Rozšíření Colleague interface o 8 nových polí |
| `src/hooks/useCRMData.tsx` | Přidání výchozích null hodnot do mock dat |
| `src/pages/ApplicantOnboardingForm.tsx` | Přidání birthday a personal_email do formuláře |
| `src/components/forms/ColleagueForm.tsx` | Přidání sekce s osobními a fakturačními údaji |
| `src/pages/Colleagues.tsx` | Zobrazení nových údajů v rozbalené kartě |
| `src/components/recruitment/ConvertApplicantDialog.tsx` | Přidání personal_email a birthday polí |
| `src/hooks/useApplicantsData.tsx` | Aktualizace OnboardingData a completeOnboarding |

---

## Vizuální náhled

### Onboarding formulář - nová sekce "Osobní údaje":
```text
┌─────────────────────────────────────────────┐
│ 👤 Osobní údaje                             │
├─────────────────────────────────────────────┤
│ Datum narození *        Soukromý email      │
│ [📅 Vyberte datum  ]    [jan@gmail.com   ]  │
│                                             │
│ Pro sledování           Pro interní         │
│ narozenin v týmu        komunikaci          │
└─────────────────────────────────────────────┘
```

### Karta kolegy - nová sekce (pro adminy):
```text
┌─────────────────────────────────────────────┐
│ 🏢 Fakturační údaje                         │
├─────────────────────────────────────────────┤
│ 🎂 Narozeniny: 15. března                   │
│ ✉️  Osobní email: jan.novak@gmail.com       │
│ 🆔 IČO: 12345678 · DIČ: CZ12345678          │
│ 🏢 Firma: Jan Novák OSVČ                    │
│ 🏠 Adresa: Příkladná 123, Praha, 110 00     │
│ 💳 Účet: 123456789/0100                     │
└─────────────────────────────────────────────┘
```
