-- Ensure applicant onboarding columns exist in all environments.
-- This prevents submit-applicant-onboarding from failing on missing columns.

ALTER TABLE public.applicants
  ADD COLUMN IF NOT EXISTS birthday DATE,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS personal_email TEXT,
  ADD COLUMN IF NOT EXISTS billing_country TEXT;

