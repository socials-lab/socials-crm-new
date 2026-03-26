

## Kompletní redesign veřejné nabídky — moderní layout inspirovaný socials.cz

### Aktuální pořadí sekcí
1. Hero (název firmy, kontakt)
2. Audit & Loom video
3. Služby + ceník
4. Onboarding timeline
5. Proč s námi
6. Portfolio (bannery + videa)
7. Reporting
8. Loom video (duplikát)
9. Kontakt
10. CTA
11. Footer

### Nové pořadí sekcí (logičtější sales flow)

```text
1. Hero (větší, modernější, lime akcenty)
2. Loom video / Audit (osobní zpráva — hned po hero)
3. Proč s námi (social proof nahoru — buduje důvěru PŘED cenou)
4. Portfolio (grafika + videa — vizuální wow efekt)
5. Služby + cenový přehled (teprve teď ukazujeme co a za kolik)
6. Reporting (bonus — added value)
7. Onboarding timeline (jak to bude probíhat — odpovídá na "co dál?")
8. Kontakt + CTA (finální call to action)
9. Footer
```

Odstranění duplikátního Loom videa (sekce na řádku 1134 duplicitní k řádku 964).

### Vizuální redesign inspirovaný socials.cz

**Hero sekce:**
- Větší typografie, uppercase nadpis ve stylu webu
- Lime/zelený gradient na klíčovém slově (název firmy)
- Credibility badges přímo pod hero (Meta Partner, Google Partner, Shoptet Zlatý Partner)
- Subtilní gradient pozadí místo plochého

**Sekce karty:**
- Odstranit `rounded-2xl border bg-card/50 backdrop-blur-sm` wrapper ze všech sekcí
- Nahradit plnějším tmavým stylem — sekce oddělené větším spacingem a subtilními divider liniemi
- Nadpisy sekcí: uppercase, menší tracking, lime accent na klíčovém slově
- Karty s jemným `border border-white/5` a `bg-white/[0.02]` hover efektem

**Typografie:**
- Nadpisy sekcí větší a tučnější
- Odstranit emoji z nadpisů sekcí — nahradit čistšími ikonami nebo jen textem
- Víc kontrastu mezi nadpisem a popiskem

**CTA sekce:**
- Lime zelené tlačítko (bg-[#C8FF00] text-black) ve stylu webu
- Větší, výraznější

**Sticky header:**
- Tmavší, tenčí, s lime CTA buttonem

**Footer:**
- Certifikační loga jako řada ikon
- Minimalistický, méně odkazů

### Soubory k úpravě
- `src/pages/PublicOfferPage.tsx` — kompletní restrukturalizace pořadí sekcí, vizuální update všech komponent, odstranění duplikátního Loom, nový design hero/CTA/headeru

### Technické detaily
- Přeuspořádání volání komponent v hlavním `return` (řádky 879–1249)
- Vizuální update každé sub-komponenty (`OnboardingProcessSection`, `WhyUsSection`, `CreativePortfolioSection`, `ReportingSection`, `ContactSection`, `ServiceCard`)
- Nové CSS utility třídy pro lime gradient: `bg-gradient-to-r from-[#C8FF00] to-[#A8E600]`
- Lime text accent: `text-[#C8FF00]` místo `text-primary` na klíčových místech v offer-dark kontextu

