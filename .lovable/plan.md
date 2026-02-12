

## Thank You screen s confetti celebration

### Co se změní

Celá sekce `isSubmitted` (řádky 484-560) se přepracuje na slavnostnější "thank you" obrazovku s confetti animací a upraveným obsahem dle zadání.

### Confetti efekt

- Přidám CSS-only confetti animaci (žádná nová závislost) -- barevné čtverečky padající z vrchu obrazovky pomocí `@keyframes`
- Alternativně použiji canvas-confetti knihovnu pro realističtější efekt -- ale protože chceme minimalizovat závislosti, půjdu cestou CSS animace s ~20 barevnými částicemi

### Nový obsah kroků

1. **Do 24 hodin vám pošleme smlouvu** k podpisu přes DigiSign
2. **Po podpisu vytvoříme projekt ve Freelu** a přidáme vám tam přístup
3. **Spojí se s vámi specialista**, který vás bude mít na starosti a domluví onboarding telefonát
4. **Pustíme se do práce!**

Zakončeno textem: **"Těšíme se na spolupráci!"**

### Technické detaily

**Soubor: `src/pages/OnboardingForm.tsx`** (řádky 484-560)

- Přidat CSS confetti animaci přímo v komponentě pomocí inline `<style>` tagu nebo přes Tailwind keyframes
- Confetti se spustí automaticky po zobrazení thank you screenu
- 30-40 barevných částic padajících z vrchu s různou rychlostí a rotací
- Animace trvá ~4 sekundy a pak zmizí
- Přepsat obsah 4 kroků dle zadání
- Odstranit opakující se "Dotazy?" u každého kroku -- kontakt bude pouze dole
- Přidat větší nadpis "Těšíme se na spolupráci!" na konec
- Zachovat kontakt na obchodníka ve footeru
