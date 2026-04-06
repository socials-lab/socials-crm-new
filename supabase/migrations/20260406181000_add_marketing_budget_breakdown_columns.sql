SET ROLE postgres;

ALTER TABLE public.marketing_monthly_plans
  ADD COLUMN IF NOT EXISTS planned_content_budget NUMERIC NOT NULL DEFAULT 0 CHECK (planned_content_budget >= 0),
  ADD COLUMN IF NOT EXISTS planned_creative_budget NUMERIC NOT NULL DEFAULT 0 CHECK (planned_creative_budget >= 0);

-- Backfill from existing generic labor budget for current deployments.
UPDATE public.marketing_monthly_plans
SET planned_content_budget = COALESCE(planned_labor_budget, 0)
WHERE planned_content_budget = 0
  AND COALESCE(planned_labor_budget, 0) > 0;

