
# Plán: Úprava KPI sekce na stránce Leads

## Cíl
Zjednodušit KPI karty na stránce Leads a přidat filtrování dle časového období, aby obchodníci mohli sledovat vývoj leadů v čase.

## Požadované změny

### 1. Nové KPI karty (4 metriky)
| Metrika | Popis | Vzorec |
|---------|-------|--------|
| **Aktivní leady** | Počet leadů v aktivní fázi pipeline | `leads.filter(stage != won/lost/postponed).length` |
| **Lead → Won** | Konverzní poměr z nového leadu na vyhraný | `wonLeads.length / (wonLeads + lostLeads).length * 100%` |
| **Potenciální hodnota** | Celková odhadovaná MRR u aktivních leadů | `suma(estimated_price)` pro aktivní leady |
| **Vyhrané leady** | Počet + celková MRR vyhraných leadů | `wonLeads.length` + `suma(estimated_price)` pro won |

### 2. Časové filtrování
Přidám nad KPI karty jednoduchý selektor období:
- **Tento měsíc** (default)
- **Minulý měsíc**
- **Tento kvartál**
- **Minulý kvartál**
- **YTD (Year to Date)**
- **Celý rok**

Filtr bude aplikován na základě data vytvoření leadu (`created_at`) nebo data vyhrání (`converted_at`).

---

## Technické změny

### Soubor: `src/pages/Leads.tsx`

#### Nové importy
```typescript
import { Calendar, TrendingUp, Target, Trophy } from 'lucide-react';
import { startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, subMonths, subQuarters, isWithinInterval } from 'date-fns';
```

#### Nový state pro období
```typescript
type KPIPeriod = 'this_month' | 'last_month' | 'this_quarter' | 'last_quarter' | 'ytd' | 'year';
const [kpiPeriod, setKpiPeriod] = useState<KPIPeriod>('this_month');
```

#### Nová logika filtrace leadů dle období
```typescript
const getKPIPeriodRange = (period: KPIPeriod): { start: Date; end: Date } => {
  const now = new Date();
  switch(period) {
    case 'this_month': return { start: startOfMonth(now), end: endOfMonth(now) };
    case 'last_month': return { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) };
    case 'this_quarter': return { start: startOfQuarter(now), end: now };
    case 'last_quarter': return { start: startOfQuarter(subQuarters(now, 1)), end: endOfQuarter(subQuarters(now, 1)) };
    case 'ytd': return { start: startOfYear(now), end: now };
    case 'year': return { start: startOfYear(now), end: endOfYear(now) };
  }
};

const kpiFilteredLeads = useMemo(() => {
  const { start, end } = getKPIPeriodRange(kpiPeriod);
  return leads.filter(l => {
    const createdAt = new Date(l.created_at);
    return isWithinInterval(createdAt, { start, end });
  });
}, [leads, kpiPeriod]);
```

#### Aktualizované KPI výpočty
```typescript
const kpis = useMemo(() => {
  const { start, end } = getKPIPeriodRange(kpiPeriod);
  
  // Aktivní leady vytvořené v období
  const activeLeads = kpiFilteredLeads.filter(l => 
    !['won', 'lost', 'postponed'].includes(l.stage)
  );
  
  // Vyhrané leady (converted_at v daném období)
  const wonLeads = leads.filter(l => {
    if (l.stage !== 'won') return false;
    const convertedAt = l.converted_at ? new Date(l.converted_at) : new Date(l.updated_at);
    return isWithinInterval(convertedAt, { start, end });
  });
  
  // Prohrané leady (stage = lost, updated v období)
  const lostLeads = leads.filter(l => {
    if (l.stage !== 'lost') return false;
    const lostAt = new Date(l.updated_at);
    return isWithinInterval(lostAt, { start, end });
  });
  
  // Konverzní poměr
  const conversionRate = wonLeads.length + lostLeads.length > 0 
    ? Math.round((wonLeads.length / (wonLeads.length + lostLeads.length)) * 100) 
    : 0;
  
  // Potenciální hodnota aktivních
  const potentialValue = activeLeads.reduce((sum, l) => sum + l.estimated_price, 0);
  
  // Hodnota vyhraných
  const wonValue = wonLeads.reduce((sum, l) => sum + l.estimated_price, 0);

  return {
    activeCount: activeLeads.length,
    conversionRate,
    potentialValue,
    wonCount: wonLeads.length,
    wonValue,
  };
}, [leads, kpiFilteredLeads, kpiPeriod]);
```

#### Nové UI

**Selektor období nad KPI kartami:**
```tsx
<div className="flex items-center gap-2 mb-4">
  <Calendar className="h-4 w-4 text-muted-foreground" />
  <span className="text-sm text-muted-foreground">KPI období:</span>
  <Select value={kpiPeriod} onValueChange={setKpiPeriod}>
    <SelectTrigger className="w-[160px]">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="this_month">Tento měsíc</SelectItem>
      <SelectItem value="last_month">Minulý měsíc</SelectItem>
      <SelectItem value="this_quarter">Tento kvartál</SelectItem>
      <SelectItem value="last_quarter">Minulý kvartál</SelectItem>
      <SelectItem value="ytd">Year to Date</SelectItem>
      <SelectItem value="year">Celý rok</SelectItem>
    </SelectContent>
  </Select>
</div>
```

**Nové KPI karty (4 karty):**
```tsx
<div className="grid gap-4 md:grid-cols-4">
  <KPICard
    title="Aktivní leady"
    value={kpis.activeCount}
    subtitle="v pipeline"
    icon={Target}
  />
  <KPICard
    title="Lead → Won"
    value={`${kpis.conversionRate}%`}
    subtitle="konverzní poměr"
    icon={TrendingUp}
  />
  <KPICard
    title="Potenciální hodnota"
    value={formatCurrency(kpis.potentialValue)}
    subtitle="aktivní pipeline"
    icon={Target}
  />
  <KPICard
    title="Vyhrané leady"
    value={kpis.wonCount}
    subtitle={formatCurrency(kpis.wonValue) + ' MRR'}
    icon={Trophy}
  />
</div>
```

---

## Vizuální náhled

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  📅 KPI období: [Tento měsíc ▼]                                             │
├─────────────────┬─────────────────┬─────────────────┬───────────────────────┤
│  Aktivní leady  │  Lead → Won     │  Potenciální    │  Vyhrané leady        │
│       8         │     45%         │    hodnota      │       3               │
│   v pipeline    │ konverzní poměr │    125k CZK     │    85k CZK MRR        │
└─────────────────┴─────────────────┴─────────────────┴───────────────────────┘
```

---

## Pomocné funkce

```typescript
const formatCurrency = (value: number) => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${Math.round(value / 1000)}k`;
  }
  return value.toString();
};
```

---

## Shrnutí změn

1. **Odebrané KPI:** "Očekávaná hodnota" (vážená hodnota) - zbytečná duplikace
2. **Nové/upravené KPI:** Vyhrané leady s počtem + MRR hodnotou v subtitle
3. **Nový filtr:** Selektor časového období pro KPI metriky
4. **Ikony:** Přidání ikon ke každé KPI kartě pro lepší vizuální orientaci

---

## Soubory k úpravě

| Soubor | Typ změny |
|--------|-----------|
| `src/pages/Leads.tsx` | Přidání period selectoru, úprava KPI kalkulací |
