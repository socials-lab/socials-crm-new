-- One-off operational reset for QA retest:
-- Bring Bitter lemon s.r.o. lead back to pre-offer/pre-onboarding/pre-contract state.

DO $$
DECLARE
  v_lead_id uuid := 'a8ab590e-ef96-4160-a488-f4067f48c32e';
  v_lead_count integer;
  v_offer_count integer;
BEGIN
  UPDATE public.leads
  SET
    stage = 'new_lead',
    offer_url = NULL,
    offer_created_at = NULL,
    offer_sent_at = NULL,
    offer_sent_by_id = NULL,
    onboarding_form_sent_at = NULL,
    onboarding_form_url = NULL,
    onboarding_form_completed_at = NULL,
    onboarding_start_date = NULL,
    onboarding_signatories = '[]'::jsonb,
    onboarding_project_contacts = '[]'::jsonb,
    contract_created_at = NULL,
    contract_signed_at = NULL,
    contract_url = NULL,
    digisign_id = NULL,
    updated_at = now()
  WHERE id = v_lead_id;

  GET DIAGNOSTICS v_lead_count = ROW_COUNT;

  UPDATE public.public_offers
  SET
    is_active = false,
    updated_at = now()
  WHERE lead_id = v_lead_id
    AND is_active = true;

  GET DIAGNOSTICS v_offer_count = ROW_COUNT;

  RAISE NOTICE 'Reset lead rows: %, deactivated offers: %', v_lead_count, v_offer_count;
END $$;
