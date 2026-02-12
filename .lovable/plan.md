

## Inline editace ceníku kreditů

Tabulka kreditů v detailu služby Creative Boost bude přímo editovatelná -- bez nutnosti otevírat dialogové okno.

### Co se změní

**Tabulka výstupů bude inline editovatelná:**
- Název výstupu -- kliknutím se změní na textový input
- Kredity -- kliknutím se změní na číselný input
- Tlačítko pro smazání řádku (ikona X na konci každého řádku)
- Tlačítko "Přidat typ" pod tabulkou pro přidání nového řádku
- Změny se ukládají automaticky po opuštění pole (onBlur) nebo stisknutí Enter

### Technické detaily

**Soubor: `src/components/services/ServiceDetailView.tsx`**
- Komponenta dostane nový prop `onUpdate` (volitelný) -- callback pro uložení změn credit_pricing
- Pokud je `onUpdate` předán, tabulka se zobrazí v editovatelném režimu
- Každá buňka (název, kredity) bude obsahovat inline input místo prostého textu
- Přidáme sloupec s tlačítkem pro smazání řádku
- Pod tabulku přidáme tlačítko "Přidat typ výstupu"
- Při každé změně se volá `onUpdate` s aktualizovaným polem `outputTypes`

**Soubor: `src/pages/Services.tsx`**
- Předáme `onUpdate` callback do `ServiceDetailView`, který zavolá `updateService` pro uložení změn

Editovatelná tabulka bude vizuálně stejná jako aktuální, jen s tím rozdílem, že hodnoty půjde přímo měnit kliknutím.

