SET ROLE postgres;

ALTER TABLE public.marketing_monthly_plans
  ADD COLUMN IF NOT EXISTS planned_graphic_budget NUMERIC NOT NULL DEFAULT 0 CHECK (planned_graphic_budget >= 0),
  ADD COLUMN IF NOT EXISTS planned_video_budget NUMERIC NOT NULL DEFAULT 0 CHECK (planned_video_budget >= 0),
  ADD COLUMN IF NOT EXISTS planned_other_budget NUMERIC NOT NULL DEFAULT 0 CHECK (planned_other_budget >= 0);

-- Backfill existing creative plan into graphic bucket to keep totals consistent.
UPDATE public.marketing_monthly_plans
SET planned_graphic_budget = COALESCE(planned_creative_budget, 0)
WHERE planned_graphic_budget = 0
  AND COALESCE(planned_creative_budget, 0) > 0;

