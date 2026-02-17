

## Oprava: Nezavisle scrollovatelne sloupce na SOP strance

### Problem
Cela stranka (header, search, sidebar, clanky) je v jednom scrollovatelnem kontejneru (`<main>`). `sticky` na sidebaru nefunguje spolehlive, protoze vse scrolluje dohromady.

### Reseni
Zmenit layout SOP stranky tak, aby:
1. **Header + Search bar** byly fixni navrchu (nescroluji)
2. **Levy sloupec** (kategorie) mel vlastni nezavisly scroll
3. **Pravy sloupec** (clanky) mel vlastni nezavisly scroll

Toho dosahneme tak, ze SOP stranka zabere celou vysku `<main>` kontejneru a dva sloupce budou mit kazdy svuj `overflow-y-auto`.

### Technicke zmeny

**`src/pages/SOP.tsx`**:

1. Hlavni wrapper zmenit z `space-y-6` na flex-col s `h-full` aby zabral celou vysku
2. Header a Search budou v `shrink-0` kontejneru (nezmensi se, nescroluji)
3. Desktop dva-sloupcovy layout bude `flex-1 min-h-0` (zabere zbytek vysky)
   - Levy sloupec: `overflow-y-auto` s fixni sirkou, vlastni scroll
   - Pravy sloupec: `flex-1 overflow-y-auto`, vlastni scroll
4. Odebrat `sticky` z leveho sloupce (neni potreba, protoze bude mit vlastni scroll)

**`src/components/layout/AppLayout.tsx`**:
- Overit ze `<main>` ma spravne `overflow-hidden` misto `overflow-auto`, aby scroll byl rizen uvnitr SOP stranky (ne na urovni main). Pripadne SOP stranka pouzije `h-full` aby vyplnila main.

### Vysledna struktura (desktop)

```text
+--------------------------------------------------+
| Header + Search (fixni, nescroluji)               |
+--------------------------------------------------+
| Kategorie (scroll) | Vsechny SOP (scroll)         |
| - Vsechny          | - Clanek 1                   |
| - Onboarding       | - Clanek 2                   |
| - Marketing        | - Clanek 3                   |
| - ...              | - ...                        |
|                     | - Clanek N                   |
+--------------------------------------------------+
```

Mobilni layout zustane beze zmeny (horizontalni chipy + jeden sloupec).

