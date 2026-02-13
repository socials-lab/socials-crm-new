

## Redesign Applicant Onboarding Form -- Typeform-style wizard

### Co se zmeni

Aktualni formular (`/applicant-onboarding/:id`) je jeden dlouhy formular na jedne strance. Prepiseme ho do krokoveho wizardu ve stejnem stylu jako klientsky onboarding (`/onboarding/:leadId`) -- sticky header s progress barem, kroky s navigaci Zpet/Pokracovat, a thank-you page s confetti.

### Kroky formulare (5 kroku)

1. **O tobe** -- jmeno, email, telefon, pozice (predvyplnene z prihlasky, editovatelne)
2. **Osobni udaje** -- profilova fotka (avatar), datum narozeni, soukromy email
3. **Fakturacni udaje** -- ICO + ARES tlacitko, nazev firmy, DIC
4. **Fakturacni adresa a platba** -- ulice, mesto, PSC, hodinova sazba, cislo uctu
5. **Souhrn** -- prehled vsech vyplnenych udaju, tlacitko "Odeslat"

### Thank-you page

Po odeslani se zobrazi success screen s confetti (stejny styl jako klientsky onboarding):
- Zelena ikona + "Dekujeme!"
- 2 nasledujici kroky:
  1. "Poslem ti smlouvu k podpisu" 
  2. "Ozveme se s dalsim postupem spoluprace"
- Paticka "Tesime se na spolupraci!"

### Styl textu

- Vsude tykani (ty/tvuj misto Vas/Vase)
- Neformalni, pratelsky ton

### Technicke detaily

**Soubor k uprave:** `src/pages/ApplicantOnboardingForm.tsx` -- kompletni prepis

Hlavni zmeny:
- Pridat `currentStep` state a navigaci `goNext`/`goBack` s per-step validaci
- Sticky header s logem, progress barem a cislem kroku (vzor z OnboardingForm.tsx)
- 5 kroku s animovanymi prechody
- Kazdy krok ve vlastni Card s ikonou a titulkem
- Thank-you page s CSS confetti animaci a roadmap kroky
- Zachovat stavajici ARES validaci, schema i submit logiku
- Tykaci texty ve vsech labelech a popisech

