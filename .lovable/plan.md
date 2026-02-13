

## Testovaci flow pro Applicant Onboarding

### Soucasny stav
Formular `/applicant-onboarding/:applicantId` aktualne rozpoznava pouze `mock-applicant-1` v hardcoded MOCK_APPLICANT_DATA. Neexistuje univerzalni testovaci identifikator jako `test-lead` u klientskeho onboardingu.

### Co se zmeni

**1. Pridani `test-applicant` identifikatoru** (`src/pages/ApplicantOnboardingForm.tsx`)
- Pridani konstanty `TEST_APPLICANT` s realistickymi predvyplnenymi daty (jmeno, email, telefon, pozice)
- Uprava logiky nacitani dat tak, aby `test-applicant` fungoval jako platny identifikator
- Testovaci URL: `/applicant-onboarding/test-applicant`

**2. Uprava mock dat v `useApplicantsData.tsx`**
- Pridani `test-applicant` do INITIAL_MOCK_APPLICANTS se stage `hired`, aby bylo mozne testovat odeslani onboardingu z detailu uchazeceP

**3. Uprava `SendApplicantOnboardingDialog.tsx`**
- URL pro onboarding se jiz generuje spravne z `applicant.id`, takze pro `test-applicant` bude automaticky smerovat na `/applicant-onboarding/test-applicant`

### Technicke detaily

**Soubory k uprave:**
- `src/pages/ApplicantOnboardingForm.tsx` -- pridani TEST_APPLICANT konstanty a logiky pro jeji rozpoznani
- `src/hooks/useApplicantsData.tsx` -- pridani test-applicant do mock dat

**TEST_APPLICANT data:**
```ts
const TEST_APPLICANT = {
  full_name: 'Tereza Testovací',
  email: 'tereza@test.cz',
  phone: '+420 600 123 456',
  position: 'Social Media Specialist',
};
```

**Testovaci postup:**
1. Otevrit `/applicant-onboarding/test-applicant`
2. Formular bude predvyplneny testovacimi daty
3. Moznost projit vsemi kroky az po odeslani
