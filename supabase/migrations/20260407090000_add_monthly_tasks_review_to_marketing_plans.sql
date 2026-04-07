-- Replace the plain-text planned_main_tasks with a structured JSONB task list
-- and add a monthly review/evaluation field
ALTER TABLE marketing_monthly_plans
  ADD COLUMN IF NOT EXISTS monthly_tasks  JSONB   NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS monthly_review TEXT;
