-- Add termination tracking fields for engagements
-- Fixes PGRST204 errors when updating terminated engagements

ALTER TABLE public.engagements
  ADD COLUMN IF NOT EXISTS termination_reason text,
  ADD COLUMN IF NOT EXISTS termination_initiated_by text,
  ADD COLUMN IF NOT EXISTS termination_notes text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'engagements_termination_reason_check'
  ) THEN
    ALTER TABLE public.engagements
      ADD CONSTRAINT engagements_termination_reason_check
      CHECK (
        termination_reason IS NULL OR
        termination_reason IN (
          'budget_cut',
          'strategy_change',
          'dissatisfied',
          'agency_terminated',
          'project_completed',
          'merged_with_another',
          'other'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'engagements_termination_initiated_by_check'
  ) THEN
    ALTER TABLE public.engagements
      ADD CONSTRAINT engagements_termination_initiated_by_check
      CHECK (
        termination_initiated_by IS NULL OR
        termination_initiated_by IN ('client', 'agency')
      );
  END IF;
END $$;