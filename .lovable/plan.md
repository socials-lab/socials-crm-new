

# Plán: Vylepšení Forecast tabu - Plánované zakázky a kompaktní design

## Přehled změn

### 1. Přidání plánovaných zakázek do forecastu
Nová funkcionalita umožní přidat "plánované příjmy" - zakázky, o kterých víte, že začnou v budoucnu, i když ještě nejsou v systému jako engagement.

### 2. Kompaktnější a čitelnější design
Redukce počtu KPI karet a zlepšení čitelnosti textů.

---

## Nový UI design

```
┌─────────────────────────────────────────────────────────────────────────┐
│  FORECAST - Únor 2026                                    [◀ Měsíc ▶]   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ SOUHRN MĚSÍCE                                                      │ │
│  │ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐              │ │
│  │ │ MRR           │ │ Churn         │ │ Nové zakázky  │              │ │
│  │ │ 1,550k → 1,470k │ │ -80k (5.2%)  │ │ +120k         │              │ │
│  │ │ ↓ -80k churn   │ │ 2 zakázky    │ │ 1 plánovaná   │              │ │
│  │ └───────────────┘ └───────────────┘ └───────────────┘              │ │
│  │                                                                    │ │
│  │ VÝSLEDNÝ STAV: 1,590k MRR | Gap do plánu: +110k | Kapacita: 3 sloty│ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌──────────────────────────────────┐ ┌──────────────────────────────┐ │
│  │ 📉 ODCHODY (Únor)               │ │ ➕ PŘÍCHODY (Únor)           │ │
│  ├──────────────────────────────────┤ ├──────────────────────────────┤ │
│  │ Mall.cz          8.2.   -32k    │ │ [+ Přidat plánovanou zakázku]│ │
│  │   └ Jan N., Eva K.              │ │                              │ │
│  │ Datart          24.2.   -48k    │ │ ✦ NewCorp s.r.o.   od 15.2.  │ │
│  │   └ Petr S.                     │ │   +120k MRR | Jan N.         │ │
│  │                                 │ │   (plánovaná)                │ │
│  │ Celkem: -80k                    │ │ Celkem: +120k                │ │
│  └──────────────────────────────────┘ └──────────────────────────────┘ │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ 👥 KAPACITA TÝMU                              [Zobrazit vše ▼]    │ │
│  │ ┌───────────┐ ┌───────────┐ ┌───────────┐                          │ │
│  │ │Jan Novák  │ │Petr S.    │ │Eva K.     │                          │ │
│  │ │4/5 → 3/5  │ │5/5 → 4/5  │ │3/5 (bez   │                          │ │
│  │ │+1 od 8.2. │ │+1 od 24.2.│ │změny)     │                          │ │
│  │ │-1 od 15.2.│ │           │ │           │                          │ │
│  │ │= 4/5      │ │= 4/5      │ │= 3/5      │                          │ │
│  │ └───────────┘ └───────────┘ └───────────┘                          │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Technické řešení pro plánované zakázky

### Možnost A: LocalStorage (jednodušší, bez DB)
- Plánované zakázky se ukládají do localStorage
- Data jsou pouze pro forecast, neovlivňují zbytek systému
- Výhoda: Rychlá implementace, žádné DB změny
- Nevýhoda: Data nejsou sdílená mezi uživateli

### Možnost B: Nová tabulka "planned_engagements" (robustnější)
- Nová tabulka v Supabase
- Sdílené mezi uživateli, persistentní
- Výhoda: Profesionální řešení, možnost reportingu
- Nevýhoda: Vyžaduje DB migraci

**Doporučení**: Začít s localStorage (Možnost A), později lze rozšířit na DB.

---

## Struktura plánované zakázky

```typescript
interface PlannedEngagement {
  id: string;                    // UUID
  name: string;                  // Název zakázky
  client_name: string;           // Jméno klienta (textově)
  lead_id?: string;              // Volitelně propojení s leadem
  monthly_fee: number;           // Plánované MRR
  start_date: string;            // Od kdy
  assigned_colleague_ids: string[]; // Přiřazení kolegové
  notes: string;                 // Poznámky
  probability_percent: number;   // Pravděpodobnost (default 100%)
  created_at: string;
}
```

---

## Nové komponenty

### 1. AddPlannedEngagementDialog
Dialog pro přidání plánované zakázky:
- Název zakázky
- Jméno klienta (text nebo select z leadů)
- Očekávané MRR
- Datum zahájení
- Přiřazení kolegové (multi-select)
- Pravděpodobnost (slider 0-100%)

### 2. PlannedEngagementCard
Karta zobrazující plánovanou zakázku s možností:
- Editace
- Smazání
- Převod na skutečnou zakázku

### 3. ForecastSummaryBar
Kompaktní summary bar místo 7 KPI karet:
- Tři hlavní metriky vedle sebe
- Výsledný stav na jednom řádku

---

## Logika forecastu s plánovanými zakázkami

```typescript
// Výpočet dopadu na kapacitu
const capacityImpact = useMemo(() => {
  return colleagues.map(colleague => {
    const current = getCurrentEngagementCount(colleague.id);
    const endingThisMonth = getEndingAssignments(colleague.id, month);
    const newPlanned = plannedEngagements
      .filter(p => 
        p.assigned_colleague_ids.includes(colleague.id) &&
        isInMonth(p.start_date, month)
      );
    
    return {
      colleague,
      current,
      afterEndings: current - endingThisMonth.length,
      afterNew: current - endingThisMonth.length + newPlanned.length,
      capacityEvents: [
        ...endingThisMonth.map(e => ({ date: e.end_date, type: 'freed', name: e.name })),
        ...newPlanned.map(p => ({ date: p.start_date, type: 'filled', name: p.name }))
      ].sort((a, b) => a.date.localeCompare(b.date))
    };
  });
}, [colleagues, engagements, assignments, plannedEngagements, month]);

// Výpočet dopadu na revenue
const revenueImpact = useMemo(() => {
  const lostMRR = endingEngagements.reduce((sum, e) => sum + e.monthly_fee, 0);
  const newMRR = plannedEngagements
    .filter(p => isInMonth(p.start_date, month))
    .reduce((sum, p) => sum + p.monthly_fee * (p.probability_percent / 100), 0);
  
  return {
    currentMRR,
    lostMRR,
    newMRR,
    projectedMRR: currentMRR - lostMRR + newMRR,
    gapToPlan: target - (currentMRR - lostMRR + newMRR)
  };
}, [engagements, plannedEngagements, month, target]);
```

---

## Změny v existujícím kódu

### ForecastTab.tsx - Refaktor

1. **Redukce KPI karet z 7 na 3 hlavní metriky**:
   - MRR (aktuální → po změnách)
   - Churn (ztráta + počet zakázek)
   - Nové (plánovaný přírůstek)

2. **Přidání summary baru** místo gridu KPI karet

3. **Dvousloupcový layout**:
   - Levý sloupec: Odchody (končící zakázky)
   - Pravý sloupec: Příchody (plánované zakázky + tlačítko přidat)

4. **Zjednodušená kapacita**:
   - Kompaktní karty kolegů s timeline změn
   - Zobrazení: "4/5 → 3/5 → 4/5" namísto dlouhých textů

5. **Odstranění**:
   - Sekce "Doporučení" (informace budou v summary)
   - Sekce "Timeline 3 měsíce" (zjednodušit do karet kolegů)

---

## Soubory k úpravě/vytvoření

| Soubor | Změna |
|--------|-------|
| `src/components/analytics/ForecastTab.tsx` | Kompletní refaktor - kompaktnější design, přidání plánovaných zakázek |
| `src/components/analytics/AddPlannedEngagementDialog.tsx` | **Nový** - dialog pro přidání plánované zakázky |
| `src/hooks/usePlannedEngagements.tsx` | **Nový** - hook pro správu plánovaných zakázek (localStorage) |

---

## Pořadí implementace

1. Vytvořit `usePlannedEngagements` hook s localStorage persistencí
2. Vytvořit `AddPlannedEngagementDialog` komponentu
3. Refaktorovat `ForecastTab` - kompaktní design
4. Přidat sekci "Příchody" s plánovanými zakázkami
5. Aktualizovat logiku výpočtu kapacity a revenue

---

## Očekávaný výsledek

1. **Kompaktnější UI**: 3 hlavní metriky místo 7, čitelné texty
2. **Plánované zakázky**: Možnost přidat budoucí klienty/zakázky
3. **Dopad na kapacitu**: Viditelné, jak nová zakázka ovlivní vytížení kolegů
4. **Dopad na revenue**: Projekce MRR včetně plánovaných příjmů
5. **Vizuální srovnání**: Odchody vs Příchody vedle sebe

