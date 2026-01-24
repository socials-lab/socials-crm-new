-- Fix empty project contacts for lead that was submitted without validation
UPDATE public.leads 
SET onboarding_project_contacts = onboarding_signatories
WHERE id = '761d27e2-d7a3-4b0b-b03c-068e236cd4db'
  AND onboarding_project_contacts = '[]'::jsonb;
