-- One-off operational reset (requested again):
-- Unmark onboarding email as sent for Bitter Lemon lead.

UPDATE public.leads
SET
  onboarding_form_sent_at = NULL,
  onboarding_form_url = NULL,
  updated_at = now()
WHERE lower(company_name) LIKE '%bitter lemon%'
   OR lower(coalesce(website, '')) LIKE '%bitterlemon%'
   OR lower(coalesce(contact_email, '')) LIKE '%bitterlemon%';
