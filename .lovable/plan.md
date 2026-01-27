
# Plan: Analytics Dashboard Updates

## Summary
Three changes to the Analytics dashboard:
1. Odebrat kartu "MoM změna fakturace" ze sekce Klienti & Zakázky
2. Přidat graf "Vývoj počtu zakázek" (12 měsíců)
3. Přidat KPI "Průměrný MRR na klienta" do sekce Finance

---

## 1. Odstranění karty "MoM změna fakturace"

V sekci **Klienti & Zakázky** odeberu třetí KPI kartu, která zobrazuje procentní změnu fakturace oproti minulému měsíci. Tato informace zůstane dostupná v sekci Finance.

**Změna v souboru:** `src/components/analytics/ClientsEngagementsAnalytics.tsx`
- Odstraním `KPICard` s title "MoM změna fakturace" (řádky 151-163)
- Grid zůstane se 2 kartami: "Aktivní zakázky" a "Celková fakturace"

---

## 2. Přidání grafu "Vývoj počtu zakázek"

Nový AreaChart zobrazující počet aktivních zakázek za posledních 12 měsíců.

**Změny:**

### A. Data (`src/pages/Analytics.tsx`)
V `clientsEngagementsData` přidám nový trend `engagementTrend`:
```typescript
const engagementTrend = Array.from({ length: 12 }, (_, i) => {
  const date = subMonths(periodStart, 11 - i);
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  
  const activeInMonth = engagements.filter(e => {
    if (!e.start_date) return false;
    const start = new Date(e.start_date);
    const end = e.end_date ? new Date(e.end_date) : null;
    return e.status === 'active' && start <= monthEnd && (!end || end >= monthStart);
  }).length;

  return {
    month: format(date, 'MMM', { locale: cs }),
    count: activeInMonth,
  };
});
```

### B. Component Props
Přidám `engagementTrend` do interface `ClientEngagementsAnalyticsProps` a předám jako prop.

### C. Graf (`src/components/analytics/ClientsEngagementsAnalytics.tsx`)
Přidám nový graf vedle "Vývoj počtu klientů":
```typescript
<Card>
  <CardHeader className="pb-2">
    <CardTitle className="text-base font-medium">
      Vývoj počtu zakázek (12 měsíců)
    </CardTitle>
  </CardHeader>
  <CardContent>
    <AreaChart data={engagementTrend}>
      <Area 
        type="monotone" 
        dataKey="count" 
        stroke="hsl(var(--chart-2))" 
        fill="hsl(var(--chart-2))"
        fillOpacity={0.3}
        name="Aktivní zakázky"
      />
    </AreaChart>
  </CardContent>
</Card>
```

---

## 3. Přidání KPI "Průměrný MRR na klienta"

Nová metrika ukazující průměrnou měsíční tržbu na klienta.

**Změny:**

### A. Výpočet (`src/pages/Analytics.tsx`)
V `financeData` přidám:
```typescript
// Počet aktivních klientů pro období
const activeClientsForPeriod = clients.filter(c => {
  if (!c.start_date) return c.status === 'active';
  const start = new Date(c.start_date);
  const end = c.end_date ? new Date(c.end_date) : null;
  return start <= periodEnd && (!end || end >= periodStart);
}).length;

// Průměrný MRR na klienta
const avgMrrPerClient = activeClientsForPeriod > 0 
  ? totalInvoicing / activeClientsForPeriod 
  : 0;
```

### B. Props a Interface
Přidám `avgMrrPerClient` do `FinanceAnalyticsProps` interface a předám jako prop.

### C. KPI Karta (`src/components/analytics/FinanceAnalytics.tsx`)
Přidám novou kartu do gridu KPI karet:
```typescript
<KPICard
  title="Prům. MRR na klienta"
  value={`${formatCurrency(avgMrrPerClient)} Kč`}
  icon={Users}
  subtitle="měsíční"
/>
```

---

## Přehled souborů k úpravě

| Soubor | Úpravy |
|--------|--------|
| `src/pages/Analytics.tsx` | Přidat `engagementTrend` data, přidat `avgMrrPerClient` výpočet |
| `src/components/analytics/ClientsEngagementsAnalytics.tsx` | Odstranit "MoM změna fakturace" kartu, přidat graf zakázek |
| `src/components/analytics/FinanceAnalytics.tsx` | Přidat KPI kartu pro průměrný MRR na klienta |

---

## Technical Details

### Nová data struktura pro engagementTrend
```typescript
interface EngagementTrendItem {
  month: string;  // např. "led", "úno", "bře"
  count: number;  // počet aktivních zakázek
}
```

### Výpočet avgMrrPerClient
- Vzorec: `totalInvoicing / activeClientsCount`
- Pokud není žádný aktivní klient, vrátí 0
- Zobrazeno ve formátu "XXK Kč" (zaokrouhleno na tisíce)
