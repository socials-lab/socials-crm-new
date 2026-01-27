

# Plán: Logika ukončení spolupráce (zakázka + klient)

## Přehled současného stavu

### Co už existuje:
- **Engagement** (zakázka) má pole `end_date` a `notice_period_months`
- **EndEngagementDialog** umožňuje nastavit datum ukončení zakázky
- **Client** (klient) má pole `end_date` a `status` (active, paused, lost)
- Po nastavení `end_date` se zakázka zobrazí v dashboardu jako "končící"

### Co chybí:
- Automatické workflow při ukončení
- Ukončení na úrovni klienta (všechny zakázky najednou)
- Propojení mezi ukončením klienta a jeho zakázek
- Volba důvodu ukončení
- Zobrazení stavu ukončení v UI

---

## Navrhovaná logika ukončení

### 1. Úroveň zakázky (Engagement)

**Proces:**
```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  1. OZNÁMENÍ UKONČENÍ                                                       │
│     ↓                                                                       │
│  [Nastavit end_date] + [Důvod ukončení] + [Výpovědní lhůta]                │
│     ↓                                                                       │
│  2. SLEDOVÁNÍ (Dashboard sekce "Končící spolupráce")                        │
│     ↓                                                                       │
│  3. OFFBOARDING (manuální úkoly týmu)                                       │
│     ↓                                                                       │
│  4. PO DATU UKONČENÍ → Status: "completed" nebo "cancelled"                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Nová pole v dialogu:**
- `end_date` - datum ukončení (už existuje)
- `termination_reason` - důvod ukončení (nové)
- `termination_initiated_by` - kdo inicioval (klient/agentura)
- `termination_notes` - poznámky k ukončení

**Důvody ukončení (enum):**
- `budget_cut` - Snížení rozpočtu
- `strategy_change` - Změna strategie
- `dissatisfied` - Nespokojenost s výsledky
- `agency_terminated` - Ukončeno agenturou
- `project_completed` - Projekt dokončen
- `merged_with_another` - Sloučeno s jinou zakázkou
- `other` - Jiný důvod

---

### 2. Úroveň klienta (Client)

**Dva scénáře:**

#### A) Ukončení celé spolupráce s klientem
Když klient končí kompletně:
1. Otevře dialog "Ukončit spolupráci s klientem"
2. Nastaví `end_date` na klientovi
3. **Automaticky** nastaví `end_date` na všech aktivních zakázkách
4. Po datu ukončení → status klienta na `lost` nebo `paused`

#### B) Ukončení jednotlivé zakázky
Když končí jen jedna zakázka:
1. Použije stávající EndEngagementDialog
2. Klient zůstává aktivní s ostatními zakázkami
3. Pokud končí poslední aktivní zakázka → nabídnout ukončení klienta

---

## Změny v kódu

### Databáze (nová pole)

```sql
-- Přidání důvodu ukončení na zakázku
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS 
  termination_reason text DEFAULT NULL;

ALTER TABLE engagements ADD COLUMN IF NOT EXISTS 
  termination_initiated_by text DEFAULT NULL; -- 'client' | 'agency'

ALTER TABLE engagements ADD COLUMN IF NOT EXISTS 
  termination_notes text DEFAULT NULL;
```

### Soubory k úpravě

| Soubor | Změna |
|--------|-------|
| `src/components/engagements/EndEngagementDialog.tsx` | Přidat důvod ukončení a další pole |
| `src/pages/Clients.tsx` | Přidat akci "Ukončit spolupráci" pro klienta |
| `src/components/clients/EndClientDialog.tsx` | **Nový** - dialog pro ukončení klienta |
| `src/types/crm.ts` | Přidat typy pro termination_reason |
| Migrace DB | Přidat nová pole |

---

## UI návrh

### Rozšířený EndEngagementDialog (zakázka)

```text
┌─────────────────────────────────────────────────────────────────┐
│ Ukončit spolupráci                                       [X]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Zakázka: TestBrand - Retainer 2025                             │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 📅 Datum ukončení *                                         │ │
│ │ [28. února 2026                                    📅]      │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Kdo ukončuje? *                                             │ │
│ │ ○ Klient   ○ Agentura                                       │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Důvod ukončení *                                            │ │
│ │ [Snížení rozpočtu                                    ▼]     │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Poznámky                                                    │ │
│ │ [                                                         ] │ │
│ │ [                                                         ] │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ⚠️ Výpovědní lhůta: 1 měsíc                                    │
│    Poslední fakturace bude za únor 2026                        │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                               [Zrušit]  [Potvrdit ukončení]     │
└─────────────────────────────────────────────────────────────────┘
```

### Nový EndClientDialog (klient)

```text
┌─────────────────────────────────────────────────────────────────┐
│ Ukončit spolupráci s klientem                            [X]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Klient: TestBrand (Test Client s.r.o.)                         │
│                                                                 │
│ ⚠️ Aktivní zakázky:                                            │
│   • Retainer 2025 (50 000 CZK/měsíc)                           │
│   • Creative Boost (25 000 CZK/měsíc)                          │
│                                                                 │
│ Celkové MRR: 75 000 CZK                                        │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 📅 Datum ukončení (pro všechny zakázky) *                   │ │
│ │ [28. února 2026                                    📅]      │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Důvod ukončení *                                            │ │
│ │ [Snížení rozpočtu                                    ▼]     │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ☑️ Ukončit všechny aktivní zakázky ke stejnému datu           │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                               [Zrušit]  [Ukončit spolupráci]    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Workflow automatizace

### Po nastavení end_date:
1. Zakázka se objeví v dashboardu "Končící spolupráce"
2. Barevné značení dle urgence (už implementováno)

### Po překročení end_date:
- **Manuální akce**: Admin změní status na `completed`
- (Volitelně budoucí: automatický cron job)

### Ukončení klienta:
1. Nastaví `end_date` na klientovi
2. Nastaví `end_date` na všech aktivních zakázkách
3. Po datu: Admin změní status klienta na `lost`

---

## Očekávaný výsledek

1. **Rozšířený dialog pro ukončení zakázky** s důvodem a poznámkami
2. **Nový dialog pro ukončení klienta** s hromadným ukončením zakázek
3. **Akce "Ukončit spolupráci"** v dropdown menu klienta
4. **Sledování důvodů ukončení** pro analytics (churn analysis)
5. **Jasný proces** s výpovědní lhůtou a datem ukončení

