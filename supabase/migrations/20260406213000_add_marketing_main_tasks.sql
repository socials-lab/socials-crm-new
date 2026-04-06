SET ROLE postgres;

ALTER TABLE public.marketing_monthly_plans
  ADD COLUMN IF NOT EXISTS planned_main_tasks TEXT NOT NULL DEFAULT '';

