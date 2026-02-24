

# Aktualizace sluzby Creative Boost na zaklade kompletnich informaci

## Co se zmeni

Creative Boost ma aktualne v systemu velmi strucne popisy (jak v `serviceDetails.ts`, tak chybi dedicatedny zaznam v `serviceDefaults.ts`). Aktualizujeme obe mista na plny rozsah informaci vcetne:
- Noveho tagline a benefitu zamereneho na vykonnostni kreativu
- Kompletniho ceniku kreditu (bannery + videa) vcetne novych polozek (AI foto, Standard vs AI b-roll videa)
- Detailnich sekci pro nabidky (co dodame, pravidla kreditu, express rezim, revize, autorska prava)
- Aktualizovanych output typů v mock datech

## Zmeny v souborech

### 1. `src/constants/serviceDetails.ts` -- CREATIVE_BOOST

Prepsat existujici strucny zaznam (radky 340-379):

- **tagline**: "Priprava reklamnich kreativ -- system, jak vas produkt prodat pomoci strategicke vykonnostni kreativy"
- **platforms**: Meta Ads kreativy, PPC bannery, Vykonnostni videa (Reels/Stories/Shorts), AI foto
- **targetAudience**: Klienti s vykonnostnimi kampanemi, kteri potrebuji pravidelnou tvorbu banneru a videi
- **benefits**: 4 body z "Co ziskate" (hledame spravne uhly komunikace, navrhujeme prodejni texty, tvorime vykonnostni bannery a videa, pripravujeme vice konceptu a hooku)
- **setup**: 1 sekce -- nastaveni spoluprace (definice balicku, brief sablona, komunikacni kanaly)
- **management**: 2 sekce:
  - Tvorba vykonnostnich banneru (4 body -- produkty/uhly, texty, vizualy, revize)
  - Kratka vertikalni videa (5 bodu -- koncept, script, voiceover, 3 finalni videa, revize)
- **creditPricing**: Zachovat stavajici (basePrice 400, expressMultiplier 1.5, rewards 80/80)

### 2. `src/constants/serviceDefaults.ts` -- pridat 'creative boost'

Pridat novy zaznam `'creative boost'` (pred stavajici `'creative'` fallback), aby se spravne matchoval:

- **deliverables**: 6 hlavnich bodu:
  - Hledame spravne uhly komunikace
  - Navrhujeme jasne prodejni texty
  - Tvorime vykonnostni bannery a videa
  - Pripravujeme vice konceptu a hooku pro testovani
  - Flexibilni kreditovy system (1 kredit = 400 Kc)
  - Standardni dodani do 72h, express do 48h za +50% kreditu
- **frequency**: Prubezna tvorba dle objednavek, mesicni saldo kreditu
- **turnaround**: Standardni dodani do 72 hodin, express do 48 hodin
- **requirements**: Cile a produkty, vstupni materialy (fotky, videa), brandbook, pristup k Freelo
- **detailed_sections**: 6 sekci:
  1. Jak funguje system kreditu (4 body -- 1 kredit = 400 Kc, kreditova hodnota, domluveny ramec, fakturace reality)
  2. Hodnota jednotlivych vystupu -- Bannery (9 polozek vcetne AI foto za 2 kredity, ramecek 1kr, Meta 2 rozmery 4kr, preklady, PPC 1kr/rozmer, upravy 1kr, homepage 2kr, revize 1kr)
  3. Hodnota jednotlivych vystupu -- Videa (Vykonnostni video Standard 12kr = 1 koncept/3 videa, Vykonnostni video AI b-roll 17kr = 1 koncept/3 videa, dalsi hook +2kr, uprava 2kr, preklad 2kr, revize 1kr)
  4. Expresni dodani (standardne 72h, express 48h za +50% kreditu, priklady)
  5. Pravidla vyuziti kreditu (kreditni hodnota, domluveny ramec, neprenosnost, zadavani 5 PD pred koncem mesice, revize, rychlost, autorska prava)
  6. Co konkretne Creative Boost doda (tvorba banneru 4 body, kratka videa 5 bodu)

### 3. `src/data/creativeBoostMockData.ts` -- aktualizace output types

Aktualizovat existujici output types aby odpovidaly novemu ceniku:
- Pridat `ai_product_photo` (AI produktova fotka, 2 kredity)
- Zmenit `video_s` na `video_standard` (Vykonnostni video Standard, 12 kreditu -- 1 koncept / 3 videa)
- Zmenit `video_m` a `video_l` na `video_ai_broll` (Vykonnostni video AI b-roll, 17 kreditu)
- Pridat `banner_revision` typ (Revize banneru, 1 kredit)
- Pridat `video_revision` typ (Revize videi, 1 kredit)
- Odstranit zastarale typy ktere uz neodpovidaji ceniku
- Aktualizovat `clientMonthOutputs` aby pouzivaly nove IDs

### 4. `src/data/publicOffersMockData.ts` -- test nabidka

Pridat/aktualizovat testovaci nabidku s Creative Boost jako addon sluzbou, aby se daly overit vsechny detailed_sections v nabidce.

## Technicke detaily

- Zmeny ve 4 souborech: `serviceDetails.ts`, `serviceDefaults.ts`, `creativeBoostMockData.ts`, `publicOffersMockData.ts`
- Zadne nove zavislosti
- Kreditovy system zachovan (basePrice 400, express x1.5)
- Nove video typy: Standard (12kr) a AI b-roll (17kr), kazdy = 1 koncept + 3 hooky = 3 finalni videa
- Nova polozka: AI produktova fotka (2kr)
- Revize banneru i videi: 1 kredit/revize (prvni kolo zdarma -- to je jen info text, ne kreditova polozka)
