ALTER TABLE public.applicants
  ADD COLUMN IF NOT EXISTS onboarding_access_token TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_access_expires_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS applicants_onboarding_access_token_key
  ON public.applicants (onboarding_access_token)
  WHERE onboarding_access_token IS NOT NULL;
