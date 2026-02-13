
## Intro screen a souhlas na konci

### 1. Pridani uvodni obrazovky (Intro screen) - novy krok 0

Pred prvnim krokem formulare se zobrazi uvodni obrazovka s:
- Logo Socials
- Nadpis "Vitej v tymu Socials!"
- Text vysvetlujici proc formular vyplnuji: "Abychom mohli pripravit smlouvu a vse potrebne pro start spoluprace, potrebujeme od tebe vyplnit kratky onboarding formular."
- Prehled co bude formular obsahovat (4 body: osobni udaje, fakturacni udaje, adresa a platba, souhrn)
- Odhadovany cas vyplneni (~3 minuty)
- Tlacitko "Zacit vyplnovat"

Tato obrazovka nebude mit progress bar v headeru - header se zobrazi az po kliknuti na "Zacit".

### 2. Checkbox souhlasu na poslednim kroku (Souhrn)

Na konci souhrnove stranky se prida:
- Checkbox s textem: "Souhlasim s odeslenim udaju a pripravou smlouvy o spolupraci na zaklade vyplnenych udaju."
- Tlacitko "Odeslat formular" bude disabled dokud checkbox neni zaskrtnuty

### Technicke detaily

**Soubor:** `src/pages/ApplicantOnboardingForm.tsx`

**Zmeny:**
- TOTAL_STEPS se zvysi z 5 na 6
- stepLabels se rozsiri o "Uvod" na zacatek
- stepIcons se rozsiri o vhodnou ikonu (napr. Sparkles nebo Rocket)
- stepFieldMap se posune - puvodni kroky 0-4 budou 1-5
- Novy stav `agreedToTerms` (boolean) pro checkbox
- Novy `case 0` v renderStep() pro intro obrazovku
- Na poslednim kroku (case 5, Souhrn) se prida Checkbox komponent
- Tlacitko submit bude disabled pri `!agreedToTerms`
- Intro screen bude mit vlastni layout bez progress baru (podminka `currentStep === 0`)
