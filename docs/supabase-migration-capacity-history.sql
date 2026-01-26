-- Migrace: Evidence historie kapacity kolegů
-- Datum: 2026-01-26

-- 1. Tabulka pro historii kapacity
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

-- 2. Index pro rychlé vyhledávání
CREATE INDEX idx_capacity_history_colleague ON colleague_capacity_history(colleague_id);
CREATE INDEX idx_capacity_history_date ON colleague_capacity_history(effective_from DESC);

-- 3. RLS politiky
ALTER TABLE colleague_capacity_history ENABLE ROW LEVEL SECURITY;

-- CRM uživatelé mohou číst historii
CREATE POLICY "CRM users can read capacity history" 
  ON colleague_capacity_history FOR SELECT 
  USING (is_crm_user(auth.uid()));

-- Pouze admini mohou spravovat historii (pro ruční úpravy)
CREATE POLICY "Admins can manage capacity history"
  ON colleague_capacity_history FOR ALL
  USING (is_admin(auth.uid()));

-- 4. Trigger funkce pro automatické logování změn kapacity
CREATE OR REPLACE FUNCTION log_capacity_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Logovat pouze při změně capacity_hours_per_month
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

-- 5. Trigger na tabulce colleagues
CREATE TRIGGER trigger_log_capacity_change
    AFTER UPDATE ON colleagues
    FOR EACH ROW
    EXECUTE FUNCTION log_capacity_change();
