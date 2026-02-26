-- One-off operational fix:
-- Unmark onboarding form as sent for Bitter Lemon lead so onboarding email can be retried.

DO $$
DECLARE
  updated_count integer;
BEGIN
  UPDATE public.leads
  SET
    onboarding_form_sent_at = NULL,
    onboarding_form_url = NULL,
    updated_at = now()
  WHERE lower(company_name) LIKE '%bitter lemon%'
     OR lower(coalesce(website, '')) LIKE '%bitterlemon%'
     OR lower(coalesce(contact_email, '')) LIKE '%bitterlemon%';

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Unmarked onboarding sent on % lead(s)', updated_count;
END $$;
