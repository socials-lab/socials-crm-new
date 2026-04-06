SET ROLE postgres;

ALTER TABLE public.marketing_monthly_plans
  ADD COLUMN IF NOT EXISTS planned_prospects INTEGER NOT NULL DEFAULT 0 CHECK (planned_prospects >= 0);

