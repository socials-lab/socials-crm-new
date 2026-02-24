

# Individualni interni sazba na vicepracich

## Problem

Kazdy kolega ma v profilu jednu `internal_hourly_cost` (vychozi 700 Kc). Ale v praxi muze stejny kolega delat ruzne typy praci za ruzne interni sazby -- napr. nastaveni analytiky za 750 Kc/h, ale Google Ads za 600 Kc/h. Aktualne neni mozne toto rozlisit.

## Reseni

Pridat pole `internal_hourly_rate` primo do zaznamu viceprace. Hodnota se predvyplni z profilu kolegy pri vytvoreni, ale da se rucne upravit pro kazdou vicepraci zvlast.

## Co se zmeni

### 1. Databaze -- novy sloupec v `extra_works`

Pridani sloupce `internal_hourly_rate` (numeric, nullable) do tabulky `extra_works`. Pokud je NULL, pouzije se fallback na `colleague.internal_hourly_cost`.

### 2. TypeScript typ `ExtraWork`

Pridani `internal_hourly_rate: number | null` do interface `ExtraWork` v `src/types/crm.ts`.

### 3. AddExtraWorkDialog

- Pridani pole "Interni sazba kolegy (Kc/h)" -- predvyplni se z `colleague.internal_hourly_cost` pri vyberu kolegy
- Pole je editovatelne, takze se da nastavit jina castka pro specificky typ prace
- Ulozi se do `internal_hourly_rate` pri vytvoreni

### 4. EditExtraWorkDialog

- Pridani stejneho pole "Interni sazba kolegy"
- Predvyplni se z existujici hodnoty zaznamu, nebo z kolegy jako fallback
- Odmena kolegy a marze se pocitaji z teto sazby misto globalni

### 5. ExtraWorkCard -- billing double-check

- Pouzije `work.internal_hourly_rate` misto `colleague.internal_hourly_cost` (s fallbackem na kolegu pokud neni nastaveno)
- Zadna zmena v logice barevneho kodovani marze

### 6. Mock data

- Aktualizovat mock extra works v `useCRMData.tsx` -- pridat `internal_hourly_rate` s ruznymi hodnotami pro demonstraci

## Technicke detaily

### Databazova migrace

```sql
ALTER TABLE extra_works
  ADD COLUMN IF NOT EXISTS internal_hourly_rate numeric;
```

### Zmeny v souborech

| Soubor | Zmena |
|---|---|
| `src/types/crm.ts` | Pridat `internal_hourly_rate: number \| null` |
| `src/components/extra-work/AddExtraWorkDialog.tsx` | Nove pole + predvyplneni ze sazby kolegy |
| `src/components/extra-work/EditExtraWorkDialog.tsx` | Nove pole + predvyplneni |
| `src/components/extra-work/ExtraWorkCard.tsx` | Pouzit `work.internal_hourly_rate \|\| colleague.internal_hourly_cost` |
| `src/hooks/useCRMData.tsx` | Mock data -- pridat `internal_hourly_rate` |

### Logika predvyplneni

Pri vyberu kolegy v Add/Edit dialogu:
1. Nastav klientskou sazbu (`hourly_rate`) podle `getRateForPosition()` -- beze zmeny
2. Nastav interni sazbu (`internal_hourly_rate`) z `colleague.internal_hourly_cost`
3. Uzivatel muze obe sazby rucne zmenit

### Logika v ExtraWorkCard

```
const internalRate = work.internal_hourly_rate ?? colleague?.internal_hourly_cost;
const colleagueCost = (work.hours_worked ?? 0) * (internalRate ?? 0);
```

