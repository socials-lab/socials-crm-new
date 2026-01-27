

# Implementace: Rozšířené časové filtry v Analytice

## Analýza současného stavu

### Aktuální implementace:
- **Rok**: Select dropdown (2023-2026)
- **Měsíc**: Navigace pomocí prev/next tlačítek
- Všechny výpočty používají `selectedYear` a `selectedMonth` pro vytvoření `periodStart` a `periodEnd`

### Problém:
- Nelze zobrazit data za delší období (kvartál, rok, YTD)
- Chybí srovnání s minulým rokem
- Každý tab pracuje pouze s jedním měsícem

---

## Navrhované řešení

### Nový "Period Mode" selektor

Přidání nového dropdown selectu s možnostmi:

| Režim | Popis | Období |
|-------|-------|--------|
| `month` | Měsíc | Konkrétní měsíc v roce |
| `quarter` | Kvartál | Q1 (1-3), Q2 (4-6), Q3 (7-9), Q4 (10-12) |
| `ytd` | Year to Date | Od 1.1. do aktuálního měsíce |
| `year` | Celý rok | Celý vybraný rok |
| `last_year` | Minulý rok | Celý předchozí rok |
| `custom` | Vlastní období | Od-Do datepicker (volitelně) |

### UI návrh

```
┌─────────────────────────────────────────────────────────────────────┐
│ Období: [Měsíc ▼]  Rok: [2026 ▼]  [◀ Únor ▶]                       │
│                                                                     │
│ nebo při výběru "Kvartál":                                          │
│ Období: [Kvartál ▼]  Rok: [2026 ▼]  [Q1 ▼]                         │
│                                                                     │
│ nebo při výběru "YTD":                                              │
│ Období: [YTD ▼]  Rok: [2026 ▼]  (1.1. - 27.1.2026)                 │
│                                                                     │
│ nebo při výběru "Minulý rok":                                       │
│ Období: [Minulý rok ▼]  (1.1.2025 - 31.12.2025)                    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Technická implementace

### 1. Nový typ pro období

```typescript
type PeriodMode = 'month' | 'quarter' | 'ytd' | 'year' | 'last_year';

interface PeriodConfig {
  mode: PeriodMode;
  year: number;
  month?: number;      // pro mode 'month'
  quarter?: 1 | 2 | 3 | 4;  // pro mode 'quarter'
}
```

### 2. Nový state v Analytics.tsx

```typescript
const [periodMode, setPeriodMode] = useState<PeriodMode>('month');
const [selectedQuarter, setSelectedQuarter] = useState(1);

// Vypočítané období podle režimu
const { periodStart, periodEnd, periodLabel } = useMemo(() => {
  switch (periodMode) {
    case 'month':
      return {
        periodStart: new Date(selectedYear, selectedMonth - 1, 1),
        periodEnd: endOfMonth(new Date(selectedYear, selectedMonth - 1)),
        periodLabel: `${monthNames[selectedMonth - 1]} ${selectedYear}`,
      };
    case 'quarter':
      const qStart = (selectedQuarter - 1) * 3;
      return {
        periodStart: new Date(selectedYear, qStart, 1),
        periodEnd: endOfMonth(new Date(selectedYear, qStart + 2)),
        periodLabel: `Q${selectedQuarter} ${selectedYear}`,
      };
    case 'ytd':
      return {
        periodStart: new Date(selectedYear, 0, 1),
        periodEnd: new Date(),
        periodLabel: `YTD ${selectedYear}`,
      };
    case 'year':
      return {
        periodStart: new Date(selectedYear, 0, 1),
        periodEnd: new Date(selectedYear, 11, 31),
        periodLabel: `Rok ${selectedYear}`,
      };
    case 'last_year':
      const lastYear = new Date().getFullYear() - 1;
      return {
        periodStart: new Date(lastYear, 0, 1),
        periodEnd: new Date(lastYear, 11, 31),
        periodLabel: `Rok ${lastYear}`,
      };
  }
}, [periodMode, selectedYear, selectedMonth, selectedQuarter]);
```

### 3. Úprava všech useMemo bloků

Všechny výpočty v `overviewData`, `leadsData`, `clientsEngagementsData`, `financeData`, `teamData` budou refaktorovány:

```typescript
// Před:
const periodStart = new Date(selectedYear, selectedMonth - 1, 1);
const periodEnd = new Date(selectedYear, selectedMonth, 0);

// Po:
// periodStart a periodEnd budou brány z centrálního useMemo
```

### 4. Srovnání s předchozím obdobím

Pro delší období bude srovnání:
- **Měsíc**: vs minulý měsíc
- **Kvartál**: vs předchozí kvartál
- **YTD**: vs stejné období minulého roku
- **Rok**: vs minulý rok
- **Minulý rok**: vs předminulý rok

---

## Změny v jednotlivých komponentách

### AnalyticsOverview
- Grafy "12 měsíců" se změní na "období + kontext" (např. pro rok zobrazí měsíce, pro kvartál týdny)
- KPI budou agregovat celé období

### LeadsAnalytics
- Lead funnel za celé období
- Trendy budou odpovídat délce období

### FinanceAnalytics
- Celková fakturace za období
- Marže za období

### ForecastTab
- Zůstane primárně měsíční (forecasting dává smysl pro konkrétní měsíc)
- Při jiném režimu zobrazí info "Pro forecast přepněte na měsíční zobrazení"

### BusinessPlanTab
- Při kvartálu/roce zobrazí souhrn za celé období
- Plnění plánu se sečte za všechny měsíce v období

---

## Soubory k úpravě

| Soubor | Změna |
|--------|-------|
| `src/pages/Analytics.tsx` | Přidat periodMode state, nový Period Selector UI, refaktor useMemo bloků |
| `src/components/analytics/AnalyticsOverview.tsx` | Přijímat periodStart/periodEnd místo year/month, adaptivní grafy |
| `src/components/analytics/LeadsAnalytics.tsx` | Přijímat periodStart/periodEnd |
| `src/components/analytics/ClientsEngagementsAnalytics.tsx` | Přijímat periodStart/periodEnd |
| `src/components/analytics/FinanceAnalytics.tsx` | Přijímat periodStart/periodEnd |
| `src/components/analytics/TeamCapacityAnalytics.tsx` | Přijímat periodStart/periodEnd |
| `src/components/analytics/ForecastTab.tsx` | Handling pro ne-měsíční režimy |
| `src/components/analytics/BusinessPlanTab.tsx` | Agregace za období |

---

## Pořadí implementace

1. **Analytics.tsx** - Přidat Period Selector UI a centrální období logiku
2. **Refaktor props** - Změnit všechny child komponenty na přijímání `periodStart`/`periodEnd` místo `year`/`month`
3. **AnalyticsOverview** - Adaptovat grafy a KPI
4. **LeadsAnalytics** - Adaptovat výpočty
5. **FinanceAnalytics** - Adaptovat výpočty
6. **ClientsEngagementsAnalytics** - Adaptovat výpočty
7. **TeamCapacityAnalytics** - Adaptovat výpočty
8. **ForecastTab + BusinessPlanTab** - Speciální handling

---

## Očekávaný výsledek

1. Nový dropdown "Období" s možnostmi: Měsíc, Kvartál, YTD, Rok, Minulý rok
2. Dynamické UI podle vybraného režimu (kvartál selector, datum rozsah)
3. Všechny analytiky agregují data za vybrané období
4. Srovnání vždy s odpovídajícím předchozím obdobím
5. Grafy se adaptují na délku období (měsíce/týdny/dny)

