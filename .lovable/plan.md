

## Redesign veřejné nabídky -- lepší rozestupy, Loom embed, nové CTA

### Co se zmeni

1. **Vice prostoru mezi sekcemi** -- zvetsit mezery (mb-6 -> mb-10/mb-12), pridaт padding do karet, vetsi line-height u textu
2. **Loom video embed** -- pridat pole `loom_url` do typu `PublicOffer` a mock dat; na strance zobrazit embedded Loom iframe (16:9 aspect ratio) v sekci auditu/doporuceni
3. **CTA zmena** -- vsechny "Zahajit spolupraci" / "Zacit spolupraci" prejmenovaт na "Vyplnit onboarding formular"; odstranit cervene/destructive CTA; sjednotit styl tlacitek
4. **Graficke vylepseni** -- vetsi hero sekce, jemnejsi stiny, vizualne cistejsi ServiceCard

### Technicke detaily

**`src/types/publicOffer.ts`**
- Pridat `loom_url?: string` do `PublicOffer` interface

**`src/data/publicOffersMockData.ts`**
- Pridat `loom_url` do testovaci nabidky (napr. `https://www.loom.com/embed/example123`)

**`src/pages/PublicOfferPage.tsx`**
- **Header CTA** (radek 562-567): zmenit text na "Vyplnit onboarding formular"
- **Loom embed**: pod sekci "Co jsme zjistili" pridat iframe s Loom videem pokud existuje `offer.loom_url` -- pouzit AspectRatio (16:9) s rounded corners
- **Spacing**: zvetsit mezery mezi hlavnimi sekcemi z `mb-6` na `mb-10` nebo `mb-12`
- **Pricing CTA** (radek 746-755): zmenit text a odstranit `bg-foreground` styl, pouzit `bg-primary`
- **Bottom CTA section** (radek 784-806): zmenit text na "Vyplnit onboarding formular", odstranit cerveny styl
- **Mobile sticky CTA** (radek 835-850): zmenit text
- **ServiceCard**: pridat vetsi padding (p-5 -> p-6), vetsi gap mezi kartami (space-y-3 -> space-y-4)

Zadne nove zavislosti -- Loom embed je standardni iframe.

