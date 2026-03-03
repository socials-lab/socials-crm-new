-- Migration: One currency per client
-- Adds clients.currency as source of truth; enforces engagement/extra_work inherit from client

-- =============================================================================
-- STEP 1: Add clients.currency column (nullable for backfill)
-- =============================================================================
ALTER TABLE clients ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'CZK';

-- =============================================================================
-- STEP 2: Backfill - set client currency from most common engagement currency
-- =============================================================================
UPDATE clients c SET currency = (
  SELECT e.currency FROM engagements e
  WHERE e.client_id = c.id
  GROUP BY e.currency
  ORDER BY COUNT(*) DESC
  LIMIT 1
) WHERE EXISTS (SELECT 1 FROM engagements e WHERE e.client_id = c.id);

UPDATE clients SET currency = 'CZK' WHERE currency IS NULL OR currency NOT IN ('CZK', 'EUR', 'USD');

-- =============================================================================
-- STEP 3: Align engagements to client currency
-- =============================================================================
UPDATE engagements e SET currency = c.currency
FROM clients c WHERE e.client_id = c.id AND e.currency IS DISTINCT FROM c.currency;

-- =============================================================================
-- STEP 4: Align engagement_services to engagement currency
-- =============================================================================
UPDATE engagement_services es SET currency = e.currency
FROM engagements e WHERE es.engagement_id = e.id AND es.currency IS DISTINCT FROM e.currency;

-- =============================================================================
-- STEP 5: Align non-invoiced extra_works to engagement currency
-- =============================================================================
UPDATE extra_works ew SET currency = e.currency
FROM engagements e
WHERE ew.engagement_id = e.id AND ew.currency IS DISTINCT FROM e.currency
  AND ew.invoice_id IS NULL;

-- =============================================================================
-- STEP 6: Add NOT NULL and CHECK constraint to clients.currency
-- =============================================================================
ALTER TABLE clients ALTER COLUMN currency SET DEFAULT 'CZK';
ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_currency_allowed;
ALTER TABLE clients ADD CONSTRAINT clients_currency_allowed
  CHECK (currency IS NOT NULL AND currency IN ('CZK', 'EUR', 'USD'));
ALTER TABLE clients ALTER COLUMN currency SET NOT NULL;

-- =============================================================================
-- STEP 7: Trigger - engagement must match client currency
-- =============================================================================
CREATE OR REPLACE FUNCTION enforce_engagement_matches_client_currency()
RETURNS TRIGGER AS $$
DECLARE
  v_client_currency TEXT;
BEGIN
  SELECT currency INTO v_client_currency
  FROM clients WHERE id = NEW.client_id;

  IF v_client_currency IS NULL THEN
    RAISE EXCEPTION 'Client not found for engagement';
  END IF;

  -- On INSERT: auto-set engagement currency from client
  IF TG_OP = 'INSERT' THEN
    NEW.currency := v_client_currency;
    RETURN NEW;
  END IF;

  -- On UPDATE: block if trying to change to different currency
  IF TG_OP = 'UPDATE' AND OLD.currency IS DISTINCT FROM NEW.currency THEN
    IF NEW.currency != v_client_currency THEN
      RAISE EXCEPTION 'Engagement currency (%) must match client currency (%). Change client currency first or remove engagements.',
        NEW.currency, v_client_currency
        USING HINT = 'One currency per client - all engagements must use the same currency as the client.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_engagement_matches_client_currency ON engagements;
CREATE TRIGGER enforce_engagement_matches_client_currency
  BEFORE INSERT OR UPDATE OF currency, client_id ON engagements
  FOR EACH ROW EXECUTE FUNCTION enforce_engagement_matches_client_currency();

-- =============================================================================
-- STEP 8: Trigger - block client currency change when engagements exist
-- =============================================================================
CREATE OR REPLACE FUNCTION prevent_client_currency_change_with_engagements()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.currency IS DISTINCT FROM NEW.currency THEN
    IF EXISTS (SELECT 1 FROM engagements WHERE client_id = NEW.id) THEN
      RAISE EXCEPTION 'Cannot change client currency when engagements exist. Terminate all engagements first.'
        USING HINT = 'Client currency is locked once engagements exist.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_client_currency_change_with_engagements ON clients;
CREATE TRIGGER prevent_client_currency_change_with_engagements
  BEFORE UPDATE OF currency ON clients
  FOR EACH ROW EXECUTE FUNCTION prevent_client_currency_change_with_engagements();

-- =============================================================================
-- STEP 9: Update convert_lead_to_client to set client.currency from lead
-- =============================================================================
CREATE OR REPLACE FUNCTION convert_lead_to_client(
  p_lead_id UUID,
  p_client_data JSONB,
  p_primary_contact JSONB,
  p_engagement_data JSONB,
  p_additional_contacts JSONB DEFAULT '[]'::JSONB,
  p_services JSONB DEFAULT '[]'::JSONB,
  p_assignments JSONB DEFAULT '[]'::JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_id UUID;
  v_engagement_id UUID;
  v_primary_contact_id UUID;
  v_contact JSONB;
  v_service JSONB;
  v_service_id UUID;
  v_assignment JSONB;
  v_ico TEXT;
  v_currency TEXT;
BEGIN
  v_currency := COALESCE(NULLIF(p_engagement_data->>'currency', ''), p_client_data->>'currency', 'CZK');
  IF v_currency NOT IN ('CZK', 'EUR', 'USD') THEN
    v_currency := 'CZK';
  END IF;

  v_ico := p_client_data->>'ico';

  IF EXISTS (SELECT 1 FROM clients WHERE ico = v_ico) THEN
    RAISE EXCEPTION 'Klient s IČO % již existuje', v_ico USING ERRCODE = 'unique_violation';
  END IF;

  IF EXISTS (SELECT 1 FROM leads WHERE id = p_lead_id AND converted_to_client_id IS NOT NULL) THEN
    RAISE EXCEPTION 'Lead již byl převeden' USING ERRCODE = 'check_violation';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM leads WHERE id = p_lead_id) THEN
    RAISE EXCEPTION 'Lead s ID % neexistuje', p_lead_id USING ERRCODE = 'foreign_key_violation';
  END IF;

  INSERT INTO clients (
    name,
    brand_name,
    ico,
    dic,
    website,
    country,
    industry,
    status,
    tier,
    currency,
    sales_representative_id,
    billing_street,
    billing_city,
    billing_zip,
    billing_country,
    billing_email,
    acquisition_channel,
    start_date,
    end_date,
    notes,
    pinned_notes,
    fakturoid_subject_id,
    created_by
  ) VALUES (
    p_client_data->>'name',
    p_client_data->>'brand_name',
    v_ico,
    NULLIF(p_client_data->>'dic', ''),
    NULLIF(p_client_data->>'website', ''),
    COALESCE(NULLIF(p_client_data->>'country', ''), 'Czech Republic'),
    NULLIF(p_client_data->>'industry', ''),
    'active',
    COALESCE(p_client_data->>'tier', 'standard')::client_tier,
    v_currency,
    (p_client_data->>'sales_representative_id')::UUID,
    NULLIF(p_client_data->>'billing_street', ''),
    NULLIF(p_client_data->>'billing_city', ''),
    NULLIF(p_client_data->>'billing_zip', ''),
    NULLIF(p_client_data->>'billing_country', ''),
    NULLIF(p_client_data->>'billing_email', ''),
    COALESCE(p_client_data->>'acquisition_channel', 'other'),
    CASE
      WHEN p_client_data->>'start_date' IS NOT NULL AND p_client_data->>'start_date' != ''
      THEN (p_client_data->>'start_date')::DATE ELSE CURRENT_DATE
    END,
    CASE
      WHEN p_client_data->>'end_date' IS NOT NULL AND p_client_data->>'end_date' != ''
      THEN (p_client_data->>'end_date')::DATE ELSE NULL
    END,
    COALESCE(p_client_data->>'notes', ''),
    COALESCE(p_client_data->>'pinned_notes', ''),
    (p_client_data->>'fakturoid_subject_id')::INTEGER,
    (p_client_data->>'created_by')::UUID
  ) RETURNING id INTO v_client_id;

  INSERT INTO client_contacts (
    client_id, name, position, email, phone, is_primary, is_decision_maker, notes
  ) VALUES (
    v_client_id,
    p_primary_contact->>'name',
    NULLIF(p_primary_contact->>'position', ''),
    NULLIF(p_primary_contact->>'email', ''),
    NULLIF(p_primary_contact->>'phone', ''),
    true, true, COALESCE(p_primary_contact->>'notes', '')
  ) RETURNING id INTO v_primary_contact_id;

  FOR v_contact IN SELECT * FROM jsonb_array_elements(p_additional_contacts)
  LOOP
    INSERT INTO client_contacts (
      client_id, name, position, email, phone, is_primary, is_decision_maker, notes
    ) VALUES (
      v_client_id,
      v_contact->>'name', NULLIF(v_contact->>'position', ''),
      NULLIF(v_contact->>'email', ''), NULLIF(v_contact->>'phone', ''),
      false, COALESCE((v_contact->>'is_decision_maker')::BOOLEAN, false),
      COALESCE(v_contact->>'notes', '')
    );
  END LOOP;

  INSERT INTO engagements (
    client_id, contact_person_id, name, type, status, billing_model,
    monthly_fee, one_off_fee, currency, start_date, end_date, notice_period_months,
    offer_url, contract_url, notes
  ) VALUES (
    v_client_id,
    v_primary_contact_id,
    p_engagement_data->>'name',
    COALESCE(p_engagement_data->>'type', 'retainer')::engagement_type,
    'active',
    COALESCE(p_engagement_data->>'billing_model', 'fixed_fee')::billing_model,
    COALESCE((p_engagement_data->>'monthly_fee')::DECIMAL, 0),
    COALESCE((p_engagement_data->>'one_off_fee')::DECIMAL, 0),
    v_currency,
    CASE WHEN p_engagement_data->>'start_date' IS NOT NULL AND p_engagement_data->>'start_date' != ''
      THEN (p_engagement_data->>'start_date')::DATE ELSE CURRENT_DATE END,
    CASE WHEN p_engagement_data->>'end_date' IS NOT NULL AND p_engagement_data->>'end_date' != ''
      THEN (p_engagement_data->>'end_date')::DATE ELSE NULL END,
    (p_engagement_data->>'notice_period_months')::INTEGER,
    NULLIF(p_engagement_data->>'offer_url', ''),
    NULLIF(p_engagement_data->>'contract_url', ''),
    COALESCE(p_engagement_data->>'notes', '')
  ) RETURNING id INTO v_engagement_id;

  FOR v_service IN SELECT * FROM jsonb_array_elements(p_services)
  LOOP
    INSERT INTO engagement_services (
      engagement_id, service_id, name, price, billing_type, currency,
      is_active, notes, selected_tier, invoicing_status
    ) VALUES (
      v_engagement_id,
      (v_service->>'service_id')::UUID,
      v_service->>'name',
      COALESCE((v_service->>'price')::DECIMAL, 0),
      COALESCE(v_service->>'billing_type', 'monthly'),
      COALESCE(v_service->>'currency', v_currency),
      true,
      COALESCE(v_service->>'notes', ''),
      NULLIF(v_service->>'selected_tier', ''),
      CASE WHEN v_service->>'billing_type' = 'one_off' THEN 'pending'::one_off_invoicing_status
           ELSE 'not_applicable'::one_off_invoicing_status END
    ) RETURNING id INTO v_service_id;
  END LOOP;

  FOR v_assignment IN SELECT * FROM jsonb_array_elements(p_assignments)
  LOOP
    INSERT INTO engagement_assignments (
      engagement_id, engagement_service_id, colleague_id, role_on_engagement,
      cost_model, hourly_cost, monthly_cost, percentage_of_revenue,
      start_date, end_date, notes
    ) VALUES (
      v_engagement_id,
      NULL,
      (v_assignment->>'colleague_id')::UUID,
      v_assignment->>'role',
      COALESCE(v_assignment->>'cost_model', 'fixed_monthly')::cost_model,
      (v_assignment->>'hourly_cost')::DECIMAL,
      (v_assignment->>'monthly_cost')::DECIMAL,
      (v_assignment->>'percentage_of_revenue')::DECIMAL,
      CASE WHEN v_assignment->>'start_date' IS NOT NULL AND v_assignment->>'start_date' != ''
        THEN (v_assignment->>'start_date')::DATE ELSE CURRENT_DATE END,
      CASE WHEN v_assignment->>'end_date' IS NOT NULL AND v_assignment->>'end_date' != ''
        THEN (v_assignment->>'end_date')::DATE ELSE NULL END,
      COALESCE(v_assignment->>'notes', '')
    );
  END LOOP;

  UPDATE leads SET
    converted_to_client_id = v_client_id,
    converted_to_engagement_id = v_engagement_id,
    converted_at = NOW()
  WHERE id = p_lead_id;

  RETURN jsonb_build_object(
    'success', true,
    'client_id', v_client_id,
    'engagement_id', v_engagement_id,
    'primary_contact_id', v_primary_contact_id
  );

EXCEPTION
  WHEN unique_violation THEN RAISE;
  WHEN check_violation THEN RAISE;
  WHEN foreign_key_violation THEN RAISE;
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Chyba při převodu leadu: %', SQLERRM USING ERRCODE = SQLSTATE;
END;
$$;

GRANT EXECUTE ON FUNCTION convert_lead_to_client(UUID, JSONB, JSONB, JSONB, JSONB, JSONB, JSONB) TO authenticated;
