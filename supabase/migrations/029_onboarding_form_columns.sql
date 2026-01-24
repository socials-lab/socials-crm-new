-- Add columns for storing onboarding form data on leads table
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS onboarding_signatories JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS onboarding_project_contacts JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS onboarding_start_date TEXT;

COMMENT ON COLUMN public.leads.onboarding_signatories IS 'Osoby oprávněné k podpisu smlouvy (z onboarding formuláře)';
COMMENT ON COLUMN public.leads.onboarding_project_contacts IS 'Kontaktní osoby pro projekt/Freelo (z onboarding formuláře)';
COMMENT ON COLUMN public.leads.onboarding_start_date IS 'Datum zahájení spolupráce (z onboarding formuláře)';
