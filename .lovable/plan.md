
# ✅ Implementace: Logika ukončení spolupráce (zakázka + klient)

**Status: DOKONČENO**

## Co bylo implementováno

### 1. Databázová migrace
Vytvořen SQL soubor `docs/supabase-migration-termination.sql` s novými sloupci:
- `termination_reason` - důvod ukončení
- `termination_initiated_by` - kdo inicioval (klient/agentura)
- `termination_notes` - poznámky k ukončení

### 2. Typy (`src/types/crm.ts`)
Přidáno:
- `TerminationReason` - enum s důvody ukončení
- `TerminationInitiatedBy` - 'client' | 'agency'
- `TERMINATION_REASON_LABELS` - české popisky
- `TERMINATION_INITIATED_BY_LABELS` - české popisky
- `TerminationData` - interface pro data z dialogu
- Rozšířen `Engagement` interface o termination pole

### 3. EndEngagementDialog (`src/components/engagements/EndEngagementDialog.tsx`)
Rozšířen o:
- Radio group pro výběr kdo ukončuje (Klient/Agentura)
- Select pro důvod ukončení (7 možností)
- Textarea pro poznámky
- Info box s výpovědní lhůtou a doporučeným datem

### 4. EndClientDialog (`src/components/clients/EndClientDialog.tsx`)
Nový komponent:
- Zobrazení aktivních zakázek a celkového MRR
- Výběr data ukončení
- Výběr důvodu ukončení
- Checkbox pro hromadné ukončení všech zakázek

### 5. Integrace do Clients.tsx
- Přidán import EndClientDialog
- Přidán stav pro dialog
- Přidán dropdown menu s akcí "Ukončit spolupráci"
- Implementován handler pro ukončení klienta a všech jeho zakázek

### 6. Aktualizace Engagements.tsx
- Aktualizován onConfirm handler pro EndEngagementDialog
- Předává všechna termination data do updateEngagement

---

## Důvody ukončení
- `budget_cut` - Snížení rozpočtu
- `strategy_change` - Změna strategie
- `dissatisfied` - Nespokojenost s výsledky
- `agency_terminated` - Ukončeno agenturou
- `project_completed` - Projekt dokončen
- `merged_with_another` - Sloučeno s jinou zakázkou
- `other` - Jiný důvod

---

## Další kroky (po spuštění migrace)
1. Spustit SQL migraci v Supabase konzoli
2. Regenerovat typy: `npx supabase gen types typescript`
