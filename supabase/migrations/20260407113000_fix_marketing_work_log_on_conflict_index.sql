-- Fix ON CONFLICT target for marketing_work_log_id sync trigger.
-- The trigger uses:
--   ON CONFLICT (marketing_work_log_id) DO UPDATE
-- which requires a matching non-partial unique index/constraint.

SET ROLE postgres;

-- Clean up any accidental duplicates before enforcing uniqueness.
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY marketing_work_log_id
      ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id DESC
    ) AS rn
  FROM public.activity_rewards
  WHERE marketing_work_log_id IS NOT NULL
)
DELETE FROM public.activity_rewards ar
USING ranked r
WHERE ar.id = r.id
  AND r.rn > 1;

DROP INDEX IF EXISTS public.ux_activity_rewards_marketing_work_log_id;

CREATE UNIQUE INDEX IF NOT EXISTS ux_activity_rewards_marketing_work_log_id
  ON public.activity_rewards (marketing_work_log_id);

