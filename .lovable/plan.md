

## Typeform-style step-by-step onboarding formulář

### Co se změní

Celý formulář se přepracuje z jedné dlouhé stránky na **plynulý krokový průvodce** (typeform style), kde se zobrazuje vždy jen jedna sekce. Uživatel se posouvá tlačítkem "Pokračovat" nebo klávesou Enter.

### Kroky formuláře

1. **Firemní údaje** -- IČO, DIČ, název, web, obor (s ARES lookup)
2. **Fakturační adresa** -- ulice, město, PSČ, země, fakturační email
3. **Osoby pro podpis smlouvy** -- signatáři (dynamický seznam)
4. **Kontaktní osoby pro projekt** -- checkbox "použít signatáře" + další kontakty
5. **Datum zahájení** -- kalendář s výběrem data
6. **Souhrn a potvrzení** -- přehled objednávky, potvrzovací checkbox, odeslání

### Odstraněno

- Sekce "Jak to bude probíhat?" (3 kroky) -- již je v nabídce

### UX detaily

- Progress bar nahoře ukazující aktuální krok (1/6, 2/6...)
- Každý krok zabírá celou obrazovku (vertikálně centrovaný)
- Tlačítko "Pokračovat" validuje aktuální krok před posunem
- Tlačítko "Zpět" pro návrat na předchozí krok
- Plynulá animace přechodu mezi kroky (fade/slide)
- Na posledním kroku tlačítko "Odeslat údaje"
- Header s logem zůstává viditelný po celou dobu

### Technické detaily

**Soubor: `src/pages/OnboardingForm.tsx`**

- Přidat state `currentStep` (0-5) pro řízení aktuálního kroku
- Přidat `Progress` komponentu nahoře pro vizuální indikaci postupu
- Rozdělit obsah `<form>` do 6 bloků, zobrazovat vždy jen `currentStep`
- Přidat funkci `validateCurrentStep()` která před posunem ověří povinná pole aktuálního kroku pomocí `form.trigger()`
- Odstranit celou Card s "Jak to bude probíhat?" (řádky 517-547)
- Navigační tlačítka "Zpět" / "Pokračovat" dole u každého kroku
- CSS transition pro plynulý přechod (opacity + translateY)
- Na mobilech plná šířka, na desktopu max-w-2xl jako dosud

Žádné nové závislosti -- využije se existující `Progress` komponenta a React state.

