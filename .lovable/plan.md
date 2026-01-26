
# Plán: Evidence historie kapacity kolegů

## Cíl
Vytvořit systém pro sledování změn kapacity kolegů včetně historie, aby admin viděl, jak se kapacita vyvíjela v čase.

## Co bude implementováno

### 1. Databázová tabulka pro historii kapacity

Nová tabulka `colleague_capacity_history`:
- `id` - unikátní identifikátor
- `colleague_id` - odkaz na kolegu
- `capacity_hours` - nová hodnota kapacity
- `previous_capacity_hours` - předchozí hodnota (pro snadné zobrazení změny)
- `effective_from` - od kdy platí
- `reason` - důvod změny (volitelné)
- `changed_by` - kdo změnu provedl
- `created_at` - časové razítko

### 2. Automatický trigger

Databázový trigger na tabulce `colleagues`, který při změně `capacity_hours_per_month` automaticky vytvoří záznam v historii.

### 3. UI komponenty

**Dialog historie kapacity** (přístupný z karty kolegy):
- Tlačítko "Historie kapacity" v rozbalené kartě kolegy
- Timeline zobrazení změn kapacity
- Datum, předchozí hodnota, nová hodnota, důvod, autor

**Rozšíření editačního formuláře kolegy**:
- Pole "Důvod změny kapacity" (zobrazí se pouze při změně kapacity)

### 4. Oprávnění

- Pouze super admin může měnit kapacitu
- Pouze super admin vidí historii kapacity

---

## Technické detaily

### SQL Migrace

```sql
-- Tabulka pro historii kapacity
CREATE TABLE public.colleague_capacity_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    colleague_id uuid REFERENCES public.colleagues(id) ON DELETE CASCADE NOT NULL,
    capacity_hours integer NOT NULL,
    previous_capacity_hours integer,
    effective_from date NOT NULL DEFAULT CURRENT_DATE,
    reason text DEFAULT '',
    changed_by uuid REFERENCES auth.users(id),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Index pro rychlé vyhledávání
CREATE INDEX idx_capacity_history_colleague ON colleague_capacity_history(colleague_id);

-- RLS politiky
ALTER TABLE colleague_capacity_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CRM users can read capacity history" 
  ON colleague_capacity_history FOR SELECT 
  USING (is_crm_user(auth.uid()));

CREATE POLICY "Admins can manage capacity history"
  ON colleague_capacity_history FOR ALL
  USING (is_admin(auth.uid()));

-- Trigger pro automatické logování
CREATE OR REPLACE FUNCTION log_capacity_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE' AND 
        OLD.capacity_hours_per_month IS DISTINCT FROM NEW.capacity_hours_per_month) THEN
        INSERT INTO colleague_capacity_history (
            colleague_id, 
            capacity_hours, 
            previous_capacity_hours,
            changed_by
        ) VALUES (
            NEW.id,
            NEW.capacity_hours_per_month,
            OLD.capacity_hours_per_month,
            auth.uid()
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_log_capacity_change
    AFTER UPDATE ON colleagues
    FOR EACH ROW
    EXECUTE FUNCTION log_capacity_change();
```

### Nové soubory

1. `src/hooks/useColleagueCapacityHistory.tsx` - hook pro načítání historie
2. `src/components/colleagues/CapacityHistoryDialog.tsx` - dialog se zobrazením historie

### Úpravy existujících souborů

1. `src/pages/Colleagues.tsx` - přidání tlačítka "Historie kapacity" do rozbalené karty
2. `src/types/crm.ts` - přidání typu `ColleagueCapacityRecord`

---

## Vizuální návrh

```text
+------------------------------------------+
|  Historie kapacity - Jan Novák           |
+------------------------------------------+
|                                          |
|  15. 1. 2026                             |
|  ├─ Kapacita: 160 → 140 hod/měs         |
|  └─ Důvod: Snížení úvazku               |
|                                          |
|  1. 12. 2025                             |
|  ├─ Kapacita: 120 → 160 hod/měs         |
|  └─ Důvod: Návrat z rodičovské          |
|                                          |
|  1. 6. 2025                              |
|  ├─ Kapacita: 160 → 120 hod/měs         |
|  └─ Důvod: Rodičovská dovolená          |
|                                          |
+------------------------------------------+
|                            [ Zavřít ]    |
+------------------------------------------+
```

## Sekvence implementace

1. Vytvořit SQL migraci s tabulkou a triggerem
2. Přidat TypeScript typ pro záznam historie
3. Vytvořit hook pro načítání dat
4. Vytvořit dialog komponentu
5. Integrovat do stránky Kolegové
