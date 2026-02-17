
# Inline tvorba kategorie pri vytvareni SOP

## Co se zmeni

V dialogu "Novy SOP clanek" (`AddSOPArticleDialog.tsx`) pridame moznost vytvorit novou kategorii primo z vyberoveho pole kategorii, bez nutnosti zavirat dialog a otvirat separatni formular.

## Jak to bude fungovat

1. Ve `Select` dropdownu pro kategorii se na konci seznamu objevi polozka **"+ Vytvorit novou kategorii"**
2. Po kliknuti se pod Select zobrazi inline formular s polemi:
   - Nazev kategorie (povinny)
   - Popis (volitelny)
   - Ikona (select z existujicich ikon)
3. Tlacitka "Vytvorit" a "Zrusit" vedle sebe
4. Po vytvoreni se nova kategorie automaticky vybere a inline formular se skryje

## Technicke zmeny

### `src/components/sop/AddSOPArticleDialog.tsx`
- Pridat stav `showNewCategory` (boolean), `newCatTitle`, `newCatDescription`, `newCatIcon`
- Do Select pridat specialni polozku `__new__` s textem "+ Vytvorit novou kategorii"
- Pri vyberu `__new__` nastavit `showNewCategory = true` a `categoryId = ''`
- Pod Select zobrazit podminene inline formular (Input nazev, Input popis, Select ikona, Button Vytvorit / Zrusit)
- Funkce `handleCreateCategory`: zavola `addCategory`, po uspesnem vytvoreni nastavi `categoryId` na nove ID a skryje inline formular
- Pouzit existujici `addCategory` z `useSOPData` hooku

### `src/hooks/useSOPData.tsx`
- Upravit `addCategory` aby vracela ID nove vytvorene kategorie (nyni vraci `void`)
- Zmena navratove hodnoty na `Promise<string | undefined>` (vraci ID)
- U demo rezimu vygenerovat nahodne ID a pridat kategorii do localniho stavu
