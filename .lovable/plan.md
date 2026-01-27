
# Plán: Úpravy sekce Plán & Forecast

## Požadované změny

### 1. Odstranit sekci Pipeline
Odstraním celou kartu "Pipeline (leady s nabídkou)" která zobrazuje leady s odeslanou nabídkou. Tato sekce se nachází na řádcích 679-709.

### 2. Nechat tabulku měsíčního přehledu rozbalenou
Změním výchozí stav `showMonthlyTable` z `false` na `true`, aby byla tabulka při načtení stránky automaticky viditelná.

### 3. Přidat výpočet potřebného přeplnění
Přidám do tabulky nový sloupec **"K dorovnání"** (nebo podobně), který bude zobrazovat:
- Kolik zbývá celkem do ročního cíle
- Kolik musí měsíce, které ještě neproběhly, v průměru vydělat navíc, aby se dohnal případný deficit

**Vzorec:**
```
ytd_deficit = suma(cíl_minulých_měsíců) - suma(skutečnost_minulých_měsíců)
zbývající_měsíce = 12 - aktuální_měsíc + 1
měsíční_navýšení = ytd_deficit / zbývající_měsíce
```

Tento výpočet se zobrazí:
- Jako souhrnný řádek nad/pod tabulkou s textem typu: *"Pro dohnání ztráty potřebujete každý zbývající měsíc přidat ~X Kč navíc"*
- A případně v každém řádku budoucího měsíce jako dodatečná hodnota

---

## Technické změny

### Soubor: `src/components/analytics/RevenuePlanForecast.tsx`

| Změna | Detail |
|-------|--------|
| Řádek 110 | Změnit `useState(false)` → `useState(true)` pro `showMonthlyTable` |
| Řádky 679-709 | Odstranit celou sekci s Pipeline kartou |
| Řádky ~296-304 | Rozšířit `yearTotals` useMemo o výpočet deficitu a potřebného navýšení |
| Řádky ~711-836 | Přidat souhrnnou informaci o potřebném dorovnání nad tabulku měsíčního přehledu |

### Nová logika výpočtu

```typescript
// V yearTotals useMemo
const pastMonthsTarget = monthsData
  .filter(m => m.isPast)
  .reduce((sum, m) => sum + m.target, 0);
  
const pastMonthsActual = monthsData
  .filter(m => m.isPast)
  .reduce((sum, m) => sum + m.actual, 0);

const ytdDeficit = pastMonthsTarget - pastMonthsActual;
const remainingMonths = monthsData.filter(m => !m.isPast).length;
const monthlyAdjustment = remainingMonths > 0 ? ytdDeficit / remainingMonths : 0;
```

### UI zobrazení

Pokud je `ytdDeficit > 0` (jsme za plánem), zobrazí se nad tabulkou alert:
```
⚠️ Aktuální ztráta: -X Kč
Pro dohnání cíle potřebujete každý ze zbývajících Y měsíců přeplnit o ~Z Kč
```

Pokud je `ytdDeficit <= 0` (jsme před plánem), zobrazí se pozitivní zpráva:
```
✓ Jste +X Kč před plánem
```
