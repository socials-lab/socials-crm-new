

## Plán: Interaktivní sales prezentace pro úvodní call

### Co vznikne
Fullscreen webová prezentace na route `/sales-deck`, přístupná z CRM (protected route). Prezentující přepíná slidy šipkami nebo kliknutím. Obsah čerpá z existujících `DEFAULT_OFFER_CONTENT` bloků v `useOfferContent.tsx`.

### Slidy (7-8 slidů)

1. **Titulní slide** — Logo Socials, tagline "Výkonnostní marketing, který měříme až na zisk"
2. **Credibility badges** — 13 specialistů, 30 mil. Kč/měsíc, 7 let na trhu, AI-first, 5/5 hodnocení (z `credibility_badges`)
3. **Proč právě my** — 6 stat karet z `why_us` (stat + label + krátký popis)
4. **Co dostanete** — 6 benefit karet z `benefits` (ikona + název + popis)
5. **Reporting** — Slide o reportingu až na úroveň zisku, odkaz na demo report (z `reporting`)
6. **Grafika, která prodává** — Creative boost info (z `creative_portfolio`)
7. **Jak to bude probíhat** — 5 onboarding kroků jako timeline (z `onboarding`)
8. **Pojďme do toho** — CTA slide s kontaktem

### Technický návrh

**Nové soubory:**
- `src/pages/SalesDeck.tsx` — hlavní prezentační komponenta
- `src/components/sales-deck/slides/` — jednotlivé slide komponenty

**Přístup ke slidům:**
- Fixní rozlišení 1920x1080 se škálováním přes `transform: scale()` do viewportu
- Navigace: klávesy (šipky, mezerník, Escape), klik na strany, indikátor slidů dole
- Fullscreen mód přes tlačítko (Fullscreen API)
- Tmavé pozadí, moderní minimalistický design s accent barvami Socials

**Obsah:**
- Data přímo z `DEFAULT_OFFER_CONTENT` konstant — žádné API volání potřeba
- Logo ze `src/assets/socials-logo.svg`

**Route:**
- Protected route `/sales-deck` v `App.tsx`
- Bez AppLayout wrapperu (fullscreen prezentace)
- Odkaz v sidebaru nebo přes přímou URL

### Soubory ke změně
- `src/App.tsx` — přidat route
- `src/pages/SalesDeck.tsx` — nový
- `src/components/sales-deck/` — slide komponenty

