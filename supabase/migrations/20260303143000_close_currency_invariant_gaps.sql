-- Migration: close remaining currency invariant gaps

-- 1) Remove legacy RPC overload that could bypass latest currency checks
DROP FUNCTION IF EXISTS public.create_invoice_with_items(
  UUID, TEXT, UUID, TEXT, INT, INT, JSONB, NUMERIC, TEXT, UUID, UUID[], UUID[]
);

-- 2) Engagement must always match selected client currency
CREATE OR REPLACE FUNCTION enforce_engagement_matches_client_currency()
RETURNS TRIGGER AS $$
DECLARE
  v_client_currency TEXT;
BEGIN
  SELECT currency INTO v_client_currency
  FROM clients
  WHERE id = NEW.client_id;

  IF v_client_currency IS NULL THEN
    RAISE EXCEPTION 'Client not found for engagement';
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.currency := v_client_currency;
    RETURN NEW;
  END IF;

  IF NEW.currency IS DISTINCT FROM v_client_currency THEN
    RAISE EXCEPTION 'Engagement currency (%) must match client currency (%). Change client currency first or remove engagements.',
      NEW.currency, v_client_currency
      USING HINT = 'One currency per client - all engagements must use the same currency as the client.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_engagement_matches_client_currency ON engagements;
CREATE TRIGGER enforce_engagement_matches_client_currency
  BEFORE INSERT OR UPDATE OF currency, client_id ON engagements
  FOR EACH ROW EXECUTE FUNCTION enforce_engagement_matches_client_currency();

-- 3) Do not auto-rewrite invoice line-item currency; reject mismatch explicitly
CREATE OR REPLACE FUNCTION validate_invoice_line_item_currency()
RETURNS TRIGGER AS $$
DECLARE
  v_invoice_currency TEXT;
  v_extra_work_currency TEXT;
  v_service_currency TEXT;
BEGIN
  SELECT currency INTO v_invoice_currency
  FROM issued_invoices
  WHERE id = NEW.invoice_id;

  IF v_invoice_currency IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.currency IS NULL THEN
    NEW.currency := v_invoice_currency;
  ELSIF NEW.currency != v_invoice_currency THEN
    RAISE EXCEPTION 'Line item currency (%) must match invoice currency (%)',
      NEW.currency, v_invoice_currency;
  END IF;

  IF NEW.extra_work_id IS NOT NULL THEN
    SELECT currency INTO v_extra_work_currency
    FROM extra_works
    WHERE id = NEW.extra_work_id;

    IF v_extra_work_currency IS NOT NULL AND v_extra_work_currency != v_invoice_currency THEN
      RAISE EXCEPTION 'Extra work currency (%) must match invoice currency (%)',
        v_extra_work_currency, v_invoice_currency;
    END IF;
  END IF;

  IF NEW.engagement_service_id IS NOT NULL THEN
    SELECT currency INTO v_service_currency
    FROM engagement_services
    WHERE id = NEW.engagement_service_id;

    IF v_service_currency IS NOT NULL AND v_service_currency != v_invoice_currency THEN
      RAISE EXCEPTION 'Engagement service currency (%) must match invoice currency (%)',
        v_service_currency, v_invoice_currency;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_invoice_line_item_currency ON invoice_line_items;
CREATE TRIGGER enforce_invoice_line_item_currency
  BEFORE INSERT OR UPDATE ON invoice_line_items
  FOR EACH ROW EXECUTE FUNCTION validate_invoice_line_item_currency();

-- 4) Enforce extra work currency against parent engagement/client currency
CREATE OR REPLACE FUNCTION enforce_extra_work_parent_currency()
RETURNS TRIGGER AS $$
DECLARE
  v_expected_currency TEXT;
BEGIN
  IF NEW.engagement_id IS NOT NULL THEN
    SELECT currency INTO v_expected_currency
    FROM engagements
    WHERE id = NEW.engagement_id;
  ELSE
    SELECT currency INTO v_expected_currency
    FROM clients
    WHERE id = NEW.client_id;
  END IF;

  IF v_expected_currency IS NULL THEN
    RAISE EXCEPTION 'Cannot resolve expected currency for extra work';
  END IF;

  IF NEW.currency IS NULL THEN
    NEW.currency := v_expected_currency;
  ELSIF NEW.currency != v_expected_currency THEN
    RAISE EXCEPTION 'Extra work currency (%) must match parent currency (%)',
      NEW.currency, v_expected_currency;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_extra_work_parent_currency ON extra_works;
CREATE TRIGGER enforce_extra_work_parent_currency
  BEFORE INSERT OR UPDATE OF currency, engagement_id, client_id ON extra_works
  FOR EACH ROW EXECUTE FUNCTION enforce_extra_work_parent_currency();

-- 5) Ensure engagement_services can inherit from engagement in trigger path
ALTER TABLE engagement_services ALTER COLUMN currency DROP DEFAULT;

-- 6) Harden services catalog currency to same invariant
UPDATE services
SET currency = 'CZK'
WHERE currency IS NULL OR currency NOT IN ('CZK', 'EUR', 'USD');

ALTER TABLE services DROP CONSTRAINT IF EXISTS services_currency_allowed;
ALTER TABLE services ADD CONSTRAINT services_currency_allowed
  CHECK (currency IS NOT NULL AND currency IN ('CZK', 'EUR', 'USD'));
ALTER TABLE services ALTER COLUMN currency SET NOT NULL;
