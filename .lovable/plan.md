
# Plán: KPI karta s plněním obchodního plánu na Dashboardu

## Přehled

Přidání nové KPI karty na hlavní dashboard, která zobrazí plnění obchodního plánu pro aktuální měsíc s vizuální indikací trendu.

---

## Změny

### 1. Extrakce logiky do sdíleného utility modulu

Vytvořím nový soubor `src/utils/businessPlanUtils.ts` s funkcemi pro:
- Získání cíle pro měsíc (z localStorage nebo default hodnot 2026)
- Výpočet skutečných tržeb (z faktur nebo odhad)

Toto umožní sdílení logiky mezi Dashboard a BusinessPlanTab.

### 2. Úprava Dashboardu

Přidám novou KPI kartu do gridu vedle ostatních metrik:

```
┌─────────────────────────────────────────────────────────────────┐
│ 📊 Plán leden                                                   │
│ 85.2%                                                           │
│ 1,36M / 1,6M Kč                                                 │
│ [Progress bar ███████████████░░░░░]                             │
└─────────────────────────────────────────────────────────────────┘
```

**Zobrazené informace:**
- Název měsíce v titulku
- Procentuální plnění jako hlavní hodnota
- Subtitle: skutečnost / cíl
- Progress bar v kartě
- Barevné zvýraznění dle stavu (zelená ≥100%, oranžová ≥80%, červená <80%)

---

## Soubory k úpravě

| Soubor | Změna |
|--------|-------|
| `src/utils/businessPlanUtils.ts` | **Nový** - sdílená logika pro obchodní plán |
| `src/pages/Dashboard.tsx` | Přidání KPI karty s plněním plánu |
| `src/components/analytics/BusinessPlanTab.tsx` | Refaktoring na použití utility funkcí |

---

## Technické detaily

### Nový utility soubor

```typescript
// src/utils/businessPlanUtils.ts

const STORAGE_KEY = 'crm-business-plan';

const DEFAULT_TARGETS_2026: Record<number, number> = {
  1: 1600000,   // Leden
  2: 1700000,   // Únor
  3: 1850000,   // Březen
  ...
  12: 2600000,  // Prosinec
};

export function getTargetForMonth(year: number, month: number): number {
  // Načti z localStorage nebo vrať default
}

export function calculateActualRevenue(
  year: number, 
  month: number,
  issuedInvoices: any[],
  engagements: any[],
  extraWorks: any[],
  engagementServices: any[]
): { actual: number; source: 'invoiced' | 'estimated' } {
  // Logika výpočtu skutečných tržeb
}
```

### Úprava Dashboard.tsx

```typescript
// Přidání importu
import { getTargetForMonth, calculateActualRevenue } from '@/utils/businessPlanUtils';

// V komponentě Dashboard
const currentMonthPlan = useMemo(() => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  
  const target = getTargetForMonth(year, month);
  const { actual, source } = calculateActualRevenue(
    year, month, issuedInvoices, engagements, extraWorks, engagementServices
  );
  const progress = target > 0 ? (actual / target) * 100 : 0;
  
  return { year, month, target, actual, progress, source };
}, [issuedInvoices, engagements, extraWorks, engagementServices]);

// V KPI gridu přidat novou kartu
<KPICard
  title={`📊 Plán ${currentMonthName}`}
  value={`${currentMonthPlan.progress.toFixed(0)}%`}
  subtitle={`${formatCurrency(currentMonthPlan.actual)} / ${formatCurrency(currentMonthPlan.target)}`}
  icon={Target}
/>
```

---

## Očekávaný výsledek

Po implementaci bude dashboard obsahovat novou KPI kartu:
- Zobrazující aktuální měsíc a % plnění
- S progress barem uvnitř karty
- Barevně odlišenou dle stavu plnění
- Kliknutím přesměruje na Analytics → Obchodní plán (volitelné rozšíření)
