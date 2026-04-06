SET ROLE postgres;

ALTER TABLE public.marketing_monthly_plans
  ADD COLUMN IF NOT EXISTS planned_revenue NUMERIC NOT NULL DEFAULT 0 CHECK (planned_revenue >= 0);

