
# Implementace: Logika ukončení spolupráce (zakázka + klient)

## Analýza současného stavu

### Co už existuje:
- **EndEngagementDialog** (`src/components/engagements/EndEngagementDialog.tsx`) - jednoduchý dialog pouze s výběrem data ukončení
- **Engagement** má pole `end_date`, `notice_period_months`, `status`
- **Client** má pole `end_date`, `status` (active, paused, lost)
- V **Engagements.tsx** je akce "Ukončit spolupráci" v dropdown menu (linka 503-511)
- V **Clients.tsx** chybí akce pro ukončení klienta

---

## Plán implementace

### 1. Databázová migrace - Nová pole pro zakázku

Přidání sloupců do tabulky `engagements`:
- `termination_reason` (text) - důvod ukončení
- `termination_initiated_by` (text) - 'client' | 'agency'  
- `termination_notes` (text) - poznámky k ukončení

```sql
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS 
  termination_reason text DEFAULT NULL;

ALTER TABLE engagements ADD COLUMN IF NOT EXISTS 
  termination_initiated_by text DEFAULT NULL;

ALTER TABLE engagements ADD COLUMN IF NOT EXISTS 
  termination_notes text DEFAULT NULL;
```

---

### 2. Aktualizace typů (`src/types/crm.ts`)

Přidání nových typů:

```typescript
// Důvod ukončení spolupráce
export type TerminationReason = 
  | 'budget_cut'        // Snížení rozpočtu
  | 'strategy_change'   // Změna strategie
  | 'dissatisfied'      // Nespokojenost s výsledky
  | 'agency_terminated' // Ukončeno agenturou
  | 'project_completed' // Projekt dokončen
  | 'merged_with_another' // Sloučeno s jinou zakázkou
  | 'other';            // Jiný důvod

// Kdo inicioval ukončení
export type TerminationInitiatedBy = 'client' | 'agency';

// Konstanty pro labely
export const TERMINATION_REASON_LABELS: Record<TerminationReason, string> = {
  budget_cut: 'Snížení rozpočtu',
  strategy_change: 'Změna strategie',
  dissatisfied: 'Nespokojenost s výsledky',
  agency_terminated: 'Ukončeno agenturou',
  project_completed: 'Projekt dokončen',
  merged_with_another: 'Sloučeno s jinou zakázkou',
  other: 'Jiný důvod',
};
```

Rozšíření `Engagement` interface o nová pole.

---

### 3. Rozšíření EndEngagementDialog (`src/components/engagements/EndEngagementDialog.tsx`)

Aktuální dialog má pouze:
- Datum ukončení (date picker)
- Tlačítka Zrušit/Potvrdit

Rozšířím o:
- **Radio group**: Kdo ukončuje? (Klient / Agentura)
- **Select**: Důvod ukončení (7 možností)
- **Textarea**: Poznámky k ukončení
- **Info box**: Zobrazení výpovědní lhůty a data poslední fakturace

Změna props `onConfirm`:
```typescript
// Před:
onConfirm: (endDate: string) => void;

// Po:
onConfirm: (data: {
  end_date: string;
  termination_reason: TerminationReason;
  termination_initiated_by: TerminationInitiatedBy;
  termination_notes: string;
}) => void;
```

---

### 4. Nový komponent EndClientDialog (`src/components/clients/EndClientDialog.tsx`)

Nový dialog pro ukončení celé spolupráce s klientem:
- Zobrazení seznamu aktivních zakázek s MRR
- Celkové MRR, které bude ztraceno
- Výběr data ukončení
- Výběr důvodu ukončení
- Checkbox "Ukončit všechny aktivní zakázky ke stejnému datu" (default: checked)

Akce při potvrzení:
1. Nastaví `end_date` na klientovi
2. Nastaví `end_date` + `termination_reason` na všech aktivních zakázkách

---

### 5. Integrace do Clients.tsx

Přidání do stránky klientů:
- Import nového dialogu
- Stav pro dialog: `endClientDialogOpen`, `clientToEnd`
- Akce "Ukončit spolupráci" v rozšířeném detailu klienta (vedle tlačítka Upravit)

---

### 6. Aktualizace Engagements.tsx

Úprava handleru `onConfirm` v EndEngagementDialog:
```typescript
onConfirm={(data) => {
  if (engagementToEnd) {
    updateEngagement(engagementToEnd.id, { 
      end_date: data.end_date,
      termination_reason: data.termination_reason,
      termination_initiated_by: data.termination_initiated_by,
      termination_notes: data.termination_notes,
    });
    toast.success(`Spolupráce bude ukončena k ${...}`);
  }
}}
```

---

## Soubory k úpravě

| Soubor | Změna |
|--------|-------|
| `docs/supabase-migration-termination.sql` | Nový - SQL migrace |
| `src/types/crm.ts` | Přidat typy + rozšířit Engagement interface |
| `src/components/engagements/EndEngagementDialog.tsx` | Rozšířit o důvod, iniciátora, poznámky |
| `src/components/clients/EndClientDialog.tsx` | **Nový** - dialog pro ukončení klienta |
| `src/pages/Clients.tsx` | Přidat akci "Ukončit spolupráci" |
| `src/pages/Engagements.tsx` | Aktualizovat onConfirm handler |
| `src/hooks/useCRMData.tsx` | Přidat funkci pro hromadné ukončení zakázek klienta |

---

## Pořadí implementace

1. **Databázová migrace** - přidat nové sloupce
2. **Typy** - rozšířit TypeScript definice
3. **EndEngagementDialog** - rozšířit stávající dialog
4. **Engagements.tsx** - aktualizovat handler
5. **EndClientDialog** - vytvořit nový komponent
6. **Clients.tsx** - přidat integraci
7. **useCRMData** - přidat helper funkci

---

## Očekávaný výsledek

Po implementaci bude k dispozici:
1. Rozšířený dialog pro ukončení zakázky s důvodem a poznámkami
2. Nový dialog pro ukončení spolupráce s celým klientem
3. Automatické nastavení end_date na všech zakázkách při ukončení klienta
4. Data o důvodech ukončení pro budoucí analýzu churnu
