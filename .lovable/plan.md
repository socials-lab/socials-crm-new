

## Automaticka hodinovka podle pozice kolegy

### Co se zmeni

Pri vyberu kolegy se automaticky predvyplni hodinova sazba podle jeho pozice. Sazba zustane editovatelna.

### Logika mapovani

Pouzijeme existujici `HOURLY_RATE_CHEATSHEET` k mapovani pozice kolegy na hodinovku. Vytvorime helper funkci `getRateForPosition(position: string)`, ktera projde cheatsheet a hleda shodu (case-insensitive, substring match):

- Pozice obsahuje "meta" / "facebook" / "socials" -> 1 700 Kc
- Pozice obsahuje "ppc" / "google" / "search" -> 1 700 Kc
- Pozice obsahuje "analytik" -> 1 900 Kc
- Pozice obsahuje "grafi" / "video" / "design" -> 1 500 Kc
- Pozice obsahuje "seo" (bez "ai") -> 1 500 Kc
- Pozice obsahuje "ai seo" -> 1 800 Kc
- Pozice obsahuje "landing" / "ai" (obecne) -> 2 500 Kc
- Nenalezeno -> prazdne (uzivatel vyplni rucne)

### Zmeny v souborech

**`src/components/extra-work/AddExtraWorkDialog.tsx`**:
- Pridat helper `getRateForPosition()`
- Pridat handler pro zmenu kolegy, ktery najde kolegu v `activeColleagues`, precte jeho `position`, zavola helper a nastavi `hourlyRate`
- Kolega select `onValueChange` zavola novy handler misto primo `setColleagueId`

**`src/components/extra-work/EditExtraWorkDialog.tsx`**:
- Stejna logika -- pri zmene kolegy v edit dialogu se automaticky aktualizuje hodinovka
- Pridat stejny helper a handler

### Chovani

- Uzivatel vybere kolegu -> hodinovka se automaticky predvyplni
- Uzivatel muze hodinovku manualne prepsat (editovatelny input)
- Pokud se pouzije sablonovka (vzor), ta ma prednost (prepise hodinovku)
- Pokud pozice neni rozpoznana, hodinovka se nevyplni

