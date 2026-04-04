-- Add onboarding progress fields to applicants
ALTER TABLE applicants
  ADD COLUMN IF NOT EXISTS buddy_id UUID REFERENCES colleagues(id),
  ADD COLUMN IF NOT EXISTS buddy_meeting_done BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS academy_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS first_clients_assigned BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS fully_onboarded BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_terminated BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS terminated_at TIMESTAMPTZ;

-- Add new stages to applicant_stage enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'bad_fit' AND enumtypid = 'applicant_stage'::regtype) THEN
    ALTER TYPE applicant_stage ADD VALUE 'bad_fit';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'postponed' AND enumtypid = 'applicant_stage'::regtype) THEN
    ALTER TYPE applicant_stage ADD VALUE 'postponed';
  END IF;
END
$$;
