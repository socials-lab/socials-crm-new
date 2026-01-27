

# Plán: Obchodní plán s předvyplněnými cíli a skutečnými tržbami z faktur

## Přehled

Rozšíření komponenty BusinessPlanTab o:
1. **Předvyplněné roční cíle** - 1,6M v lednu → 2,6M v prosinci (celkem 25M)
2. **Automatické načítání skutečných tržeb z vystavených faktur** (`issued_invoices`)
3. **Trend plnění s vizualizací**

---

## 1. Předvyplněné měsíční cíle pro rok 2026

Rozpis pro dosažení 25M celkem s růstem z 1,6M na 2,6M:

| Měsíc | Cíl (CZK) |
|-------|-----------|
| Leden | 1 600 000 |
| Únor | 1 700 000 |
| Březen | 1 850 000 |
| Duben | 1 950 000 |
| Květen | 2 050 000 |
| Červen | 2 100 000 |
| Červenec | 2 150 000 |
| Srpen | 2 200 000 |
| Září | 2 300 000 |
| Říjen | 2 400 000 |
| Listopad | 2 500 000 |
| Prosinec | 2 600 000 |
| **CELKEM** | **25 400 000** |

---

## 2. Automatické načítání skutečných tržeb

### Zdroj dat: `issued_invoices`

Tabulka `issued_invoices` obsahuje:
- `year` - rok faktury
- `month` - měsíc za který je faktura (nikoliv kdy byla vystavena)
- `total_amount` - celková částka faktury

### Logika výpočtu skutečných tržeb

```typescript
const calculateActualRevenue = (year: number, month: number) => {
  // Primárně z vystavených faktur
  const invoicedRevenue = issuedInvoices
    .filter(inv => inv.year === year && inv.month === month)
    .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

  // Pokud nejsou faktury, fallback na estimate z aktivních zakázek
  if (invoicedRevenue > 0) {
    return invoicedRevenue;
  }
  
  // Fallback: estimate z retainerů + schválených víceprací
  return calculateEstimatedRevenue(year, month);
};
```

---

## 3. Rozšíření UI

### 3.1 Přidání dat do `useCRMData` hooku

Komponenta již používá `useCRMData`, ale potřebujeme přidat `issuedInvoices`:

```typescript
const { engagements, extraWorks, engagementServices, issuedInvoices } = useCRMData();
```

### 3.2 Nový výpočet tržeb

```typescript
const calculateActualRevenue = (year: number, month: number) => {
  // 1. Zkontroluj vystavené faktury za daný měsíc
  const invoicedRevenue = issuedInvoices
    .filter(inv => inv.year === year && inv.month === month)
    .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
  
  if (invoicedRevenue > 0) {
    return { actual: invoicedRevenue, source: 'invoiced' as const };
  }
  
  // 2. Fallback: estimate z aktivních zakázek a schválených víceprací
  const periodStart = startOfMonth(new Date(year, month - 1));
  const periodEnd = endOfMonth(new Date(year, month - 1));
  
  // Retainéry
  const retainerRevenue = engagements
    .filter(e => {
      if (e.status !== 'active' || e.type !== 'retainer') return false;
      const start = e.start_date ? new Date(e.start_date) : null;
      const end = e.end_date ? new Date(e.end_date) : null;
      if (!start) return false;
      return start <= periodEnd && (!end || end >= periodStart);
    })
    .reduce((sum, e) => sum + (e.monthly_fee || 0), 0);
  
  // Vícepráce ready k fakturaci nebo již fakturované
  const extraWorksRevenue = extraWorks
    .filter(ew => {
      const billingPeriod = ew.billing_period;
      const expectedPeriod = `${year}-${String(month).padStart(2, '0')}`;
      return billingPeriod === expectedPeriod && 
             (ew.status === 'ready_to_invoice' || ew.status === 'invoiced');
    })
    .reduce((sum, ew) => sum + (ew.amount || 0), 0);
  
  // One-off služby
  const oneOffRevenue = (engagementServices || [])
    .filter(es => {
      return es.billing_type === 'one_off' && 
             es.invoiced_in_period === `${year}-${String(month).padStart(2, '0')}`;
    })
    .reduce((sum, es) => sum + (es.price || 0), 0);
  
  return { 
    actual: retainerRevenue + extraWorksRevenue + oneOffRevenue, 
    source: 'estimated' as const 
  };
};
```

### 3.3 Vizuální indikátor zdroje dat

Přidání badge který ukazuje zda jsou data z faktur nebo z odhadu:

```
┌─────────────────────────────────────────────────────────┐
│ Leden 2026                                              │
│ Cíl: 1 600 000 Kč   Skutečnost: 1 580 000 Kč  [faktury] │
│ ████████████████████░░  98.8%                  -20k     │
└─────────────────────────────────────────────────────────┘
```

---

## 4. Trend graf

Přidání jednoduchého Recharts grafu zobrazujícího:
- Čára: plánované tržby
- Čára: skutečné tržby
- Oblast: rozdíl (zelená = nad plánem, červená = pod plánem)

```typescript
<ResponsiveContainer width="100%" height={200}>
  <AreaChart data={monthsData}>
    <XAxis dataKey="monthName" />
    <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
    <Tooltip formatter={(v) => formatCurrency(v)} />
    <Area type="monotone" dataKey="target" stroke="#94a3b8" fill="#e2e8f0" />
    <Area type="monotone" dataKey="actual" stroke="#22c55e" fill="#86efac" />
  </AreaChart>
</ResponsiveContainer>
```

---

## 5. Změny v souboru

| Soubor | Změna |
|--------|-------|
| `src/components/analytics/BusinessPlanTab.tsx` | Rozšíření o předvyplněné cíle, faktury, trend graf |

---

## Technické detaily

### Konstanty pro výchozí plán 2026

```typescript
const DEFAULT_TARGETS_2026: Record<number, number> = {
  1: 1600000,   // Leden
  2: 1700000,   // Únor
  3: 1850000,   // Březen
  4: 1950000,   // Duben
  5: 2050000,   // Květen
  6: 2100000,   // Červen
  7: 2150000,   // Červenec
  8: 2200000,   // Srpen
  9: 2300000,   // Září
  10: 2400000,  // Říjen
  11: 2500000,  // Listopad
  12: 2600000,  // Prosinec
};
```

### Logika získání cíle

```typescript
const getPlanForMonth = (year: number, month: number) => {
  // Nejprve zkontroluj localStorage (uživatelsky upravené)
  const userPlan = plans.find(p => p.year === year && p.month === month);
  if (userPlan) return userPlan.targetRevenue;
  
  // Fallback na výchozí plán pro 2026
  if (year === 2026 && DEFAULT_TARGETS_2026[month]) {
    return DEFAULT_TARGETS_2026[month];
  }
  
  return 0;
};
```

---

## Očekávaný výsledek

Po implementaci bude záložka "Obchodní plán" zobrazovat:

1. **Roční souhrn** s předvyplněným cílem 25,4M pro rok 2026
2. **Trend graf** s čárou plánu vs skutečnosti
3. **Měsíční přehled** s:
   - Předvyplněnými cíli (editovatelné)
   - Skutečnými tržbami z vystavených faktur
   - Badge [faktury] nebo [odhad] dle zdroje dat
   - Progress bar a rozdíl od plánu
4. **Automatická aktualizace** při vystavení nových faktur

