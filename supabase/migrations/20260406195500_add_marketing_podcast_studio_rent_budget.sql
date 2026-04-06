SET ROLE postgres;

ALTER TABLE public.marketing_monthly_plans
  ADD COLUMN IF NOT EXISTS planned_podcast_studio_rent_budget NUMERIC NOT NULL DEFAULT 0 CHECK (planned_podcast_studio_rent_budget >= 0);
