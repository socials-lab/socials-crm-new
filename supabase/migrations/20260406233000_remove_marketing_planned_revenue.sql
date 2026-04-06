SET ROLE postgres;

ALTER TABLE public.marketing_monthly_plans
  DROP COLUMN IF EXISTS planned_revenue;
