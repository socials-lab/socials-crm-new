
# Plán: Noví klienti a Končící spolupráce na Dashboardu

## Přehled

Přidání dvou nových sekcí na dashboard:
1. **Noví klienti (poslední 3 měsíce)** - pro větší pozornost novým partnerstvím
2. **Končící spolupráce** - zakázky s nastaveným datem ukončení v blízké budoucnosti

---

## 1. Noví klienti (poslední 3 měsíce)

### Logika
- Klient je "nový", pokud jeho `start_date` je v posledních 90 dnech
- Zobrazíme jméno, datum začátku, celkový měsíční objem zakázek

### UI návrh

```
┌─────────────────────────────────────────────────────────┐
│ 🆕 Noví klienti                    [Všichni klienti →]  │
├─────────────────────────────────────────────────────────┤
│ TestBrand                                   před 2 týdny │
│ Performance + Creative Boost                  45 000 CZK │
│                                                          │
│ AcmeCorp                                  před 1 měsícem │
│ PPC správa                                   28 000 CZK │
│                                                          │
│ Žádní noví klienti za poslední 3 měsíce                 │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Končící spolupráce

### Logika
Zakázka se zobrazí jako "končící" pokud:
- Má nastavené `end_date` v příštích 60 dnech
- Status je `active` (ne completed/cancelled)

### UI návrh

```
┌─────────────────────────────────────────────────────────┐
│ 📅 Končící spolupráce               [Všechny zakázky →] │
├─────────────────────────────────────────────────────────┤
│ ⚠️ TestBrand - Social správa                            │
│ Končí: 28. února 2026 (za 32 dní)         MRR: 25 000   │
│                                                          │
│ 🟡 AcmeCorp - Retainer                                  │
│ Končí: 15. března 2026 (za 47 dní)        MRR: 40 000   │
│                                                          │
│ ✅ Žádné spolupráce nekončí v příštích 60 dnech         │
└─────────────────────────────────────────────────────────┘
```

### Barevné značení
- **Červená** (< 14 dní): Kritické - nutná akce
- **Oranžová** (14-30 dní): Upozornění - připravit offboarding
- **Žlutá** (30-60 dní): Info - sledovat

---

## 3. Proces ukončení spolupráce (Logika)

### Stávající stav
- V systému existuje `EndEngagementDialog` pro nastavení data ukončení
- Zakázka má pole `end_date` a `notice_period_months`
- Status lze změnit na `completed` nebo `cancelled`

### Doporučený proces ukončení (bez změny kódu)
1. **Klient oznámí ukončení** → Nastavit `end_date` (typicky +1 měsíc = výpovědní lhůta)
2. **Dashboard upozorní** na blížící se konec (nová sekce)
3. **Offboarding úkoly** → Tým dokončí práci, předá přístupy
4. **Po datu ukončení** → Status změnit na `completed`

### Využití existujících polí
- `end_date` - datum ukončení spolupráce
- `notice_period_months` - výpovědní lhůta (1 měsíc default)
- `status` - změnit na `completed` po ukončení

---

## Změny v kódu

| Soubor | Změna |
|--------|-------|
| `src/pages/Dashboard.tsx` | Přidání 2 nových sekcí + výpočtů |

---

## Technické detaily

### Nové useMemo bloky

```typescript
// Noví klienti (poslední 3 měsíce)
const newClients = useMemo(() => {
  const threeMonthsAgo = subDays(new Date(), 90);
  
  return clients
    .filter(c => c.status === 'active' && c.start_date && isAfter(parseISO(c.start_date), threeMonthsAgo))
    .map(client => {
      const clientEngagements = engagements.filter(e => e.client_id === client.id && e.status === 'active');
      const totalMonthly = clientEngagements.reduce((sum, e) => sum + (e.monthly_fee || 0), 0);
      const engagementNames = clientEngagements.map(e => e.name).join(', ');
      return { ...client, totalMonthly, engagementNames };
    })
    .sort((a, b) => new Date(b.start_date!).getTime() - new Date(a.start_date!).getTime())
    .slice(0, 5);
}, [clients, engagements]);

// Končící spolupráce (příštích 60 dní)
const endingEngagements = useMemo(() => {
  const now = new Date();
  const sixtyDaysFromNow = addDays(now, 60);
  
  return engagements
    .filter(e => 
      e.status === 'active' && 
      e.end_date && 
      isAfter(parseISO(e.end_date), now) && 
      !isAfter(parseISO(e.end_date), sixtyDaysFromNow)
    )
    .map(engagement => {
      const client = getClientById(engagement.client_id);
      const endDate = parseISO(engagement.end_date!);
      const daysUntilEnd = differenceInDays(endDate, now);
      const urgency = daysUntilEnd < 14 ? 'critical' : daysUntilEnd < 30 ? 'warning' : 'info';
      return { ...engagement, client, daysUntilEnd, urgency };
    })
    .sort((a, b) => a.daysUntilEnd - b.daysUntilEnd);
}, [engagements, getClientById]);
```

### Nové UI karty

Přidám dvě nové karty do gridu na dashboardu vedle existujících sekcí.

---

## Očekávaný výsledek

Po implementaci bude dashboard obsahovat:

1. **Sekce "Noví klienti"** zobrazující:
   - Klienty získané za poslední 3 měsíce
   - Relativní čas od zahájení (např. "před 2 týdny")
   - Názvy zakázek a celkové MRR
   - Link na detail klienta

2. **Sekce "Končící spolupráce"** zobrazující:
   - Zakázky s end_date v příštích 60 dnech
   - Barevně odlišené dle urgence
   - Počet dní do ukončení
   - MRR, které bude ztraceno
   - Quick akci pro zobrazení detailu zakázky
