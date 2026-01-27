

# Plán: Churn Impact v obchodním plánu

## Přehled

Přidání nové sekce do **BusinessPlanTab** (Analytika → Obchodní plán), která zobrazí:
1. **Končící spolupráce** - seznam zakázek s end_date v daném měsíci
2. **Ztráta MRR** - kolik měsíčně ztratíme
3. **Potřebný růst** - o kolik musíme navýšit nové příjmy, abychom splnili plán

---

## Logika výpočtu

### Pro každý měsíc v roce:

```
Stávající MRR (retainery bez end_date v daném měsíci)
- Končící MRR (zakázky s end_date v daném měsíci)
= Očekávaný MRR po churnu

Plán pro měsíc (target)
- Očekávaný MRR po churnu
= Potřebný dodatečný příjem (k získání z nových klientů/vícepráce)
```

### Příklad:
- **Cíl února**: 1 700 000 CZK
- **Aktuální MRR**: 1 550 000 CZK
- **Končící v únoru**: Mall.cz (32k) + Datart (48k) = 80 000 CZK
- **MRR po churnu**: 1 470 000 CZK
- **Potřebný nárůst**: 1 700 000 - 1 470 000 = **230 000 CZK**

---

## UI návrh

### Nová karta v BusinessPlanTab

```
┌─────────────────────────────────────────────────────────────────┐
│ ⚠️ Dopad ukončených spoluprací – Únor 2026          [info icon]│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Zakázky končící tento měsíc:                                   │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 🔴 Mall.cz – Social správa         končí 8.2.    -32 000   │ │
│ │ 🟠 Datart – PPC retainer 2025      končí 24.2.   -48 000   │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│ │ Aktuální MRR│ │ Ztráta MRR  │ │ MRR po      │ │ Potřebný    │ │
│ │             │ │             │ │ churnu      │ │ nárůst      │ │
│ │  1 550k     │ │   -80k      │ │  1 470k     │ │  +230k      │ │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ │
│                                                                 │
│ 💡 Pro splnění plánu je potřeba získat nové zakázky/vícepráce  │
│    v hodnotě minimálně 230 000 CZK                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Barevné značení karty
- **Červená** (ztráta > 20% MRR): Vysoký churn
- **Oranžová** (ztráta 10-20% MRR): Střední churn  
- **Zelená** (ztráta < 10% MRR nebo žádná): Zdravý stav

---

## Změny v kódu

| Soubor | Změna |
|--------|-------|
| `src/components/analytics/BusinessPlanTab.tsx` | Přidat nový useMemo pro churn data + novou kartu |
| `src/utils/businessPlanUtils.ts` | (volitelně) Přidat helper funkci pro výpočet churnu |

---

## Technické detaily

### Nový useMemo blok v BusinessPlanTab.tsx

```typescript
// Churn impact for selected month
const churnImpact = useMemo(() => {
  const monthStart = new Date(selectedYear, selectedMonth - 1, 1);
  const monthEnd = new Date(selectedYear, selectedMonth, 0);
  
  // Engagements ending this month
  const endingThisMonth = engagements.filter(e => {
    if (!e.end_date || e.status !== 'active') return false;
    const endDate = parseISO(e.end_date);
    return endDate >= monthStart && endDate <= monthEnd;
  });
  
  // Calculate lost MRR
  const lostMRR = endingThisMonth.reduce((sum, e) => sum + (e.monthly_fee || 0), 0);
  
  // Current MRR (all active retainers without end_date in this month)
  const currentMRR = engagements
    .filter(e => {
      if (e.status !== 'active' || e.type !== 'retainer') return false;
      const start = e.start_date ? parseISO(e.start_date) : null;
      if (!start || start > monthEnd) return false;
      // Include if no end_date or end_date is after this month
      if (!e.end_date) return true;
      return parseISO(e.end_date) > monthEnd;
    })
    .reduce((sum, e) => sum + (e.monthly_fee || 0), 0);
  
  // MRR after churn
  const mrrAfterChurn = currentMRR - lostMRR;
  
  // Target for this month
  const target = getTargetForMonth(selectedYear, selectedMonth);
  
  // Required increase to meet plan
  const requiredIncrease = Math.max(0, target - mrrAfterChurn);
  
  // Churn severity
  const churnPercent = currentMRR > 0 ? (lostMRR / currentMRR) * 100 : 0;
  const severity = churnPercent > 20 ? 'high' : churnPercent > 10 ? 'medium' : 'low';
  
  return {
    endingEngagements: endingThisMonth.map(e => ({
      ...e,
      client: clients.find(c => c.id === e.client_id),
    })),
    currentMRR,
    lostMRR,
    mrrAfterChurn,
    target,
    requiredIncrease,
    churnPercent,
    severity,
  };
}, [selectedYear, selectedMonth, engagements, clients]);
```

### Nová UI karta

Karta bude umístěna pod "Selected Month Detail" a zobrazí:
1. Seznam končících zakázek s datem ukončení a ztraceným MRR
2. 4 KPI: Aktuální MRR, Ztráta MRR, MRR po churnu, Potřebný nárůst
3. Info box s doporučením

### Demo data

Pokud nejsou žádné reálné končící zakázky, zobrazí se demo data (stejně jako na dashboardu) pro demonstraci funkcionality.

---

## Očekávaný výsledek

1. **Nová karta "Dopad ukončených spoluprací"** v obchodním plánu
2. **Výpočet ztraceného MRR** na základě end_date zakázek
3. **Kalkulace potřebného nárůstu** pro splnění plánu
4. **Vizuální upozornění** na vysoký churn
5. **Demo data** pro testování funkcionality

