-- Migration: End-to-end currency hardening invariants
-- Enforces NOT NULL + allowed set (CZK, EUR, USD) and invoice/line-item currency consistency

-- =============================================================================
-- STEP 1: Backfill nulls and normalize invalid values
-- =============================================================================

-- leads.currency
UPDATE leads SET currency = 'CZK' WHERE currency IS NULL OR currency NOT IN ('CZK', 'EUR', 'USD');
ALTER TABLE leads ALTER COLUMN currency SET DEFAULT 'CZK';
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_currency_allowed;
ALTER TABLE leads ADD CONSTRAINT leads_currency_allowed
  CHECK (currency IS NOT NULL AND currency IN ('CZK', 'EUR', 'USD'));
ALTER TABLE leads ALTER COLUMN currency SET NOT NULL;

-- engagements.currency
UPDATE engagements SET currency = 'CZK' WHERE currency IS NULL OR currency NOT IN ('CZK', 'EUR', 'USD');
ALTER TABLE engagements ALTER COLUMN currency SET DEFAULT 'CZK';
ALTER TABLE engagements DROP CONSTRAINT IF EXISTS engagements_currency_allowed;
-- (idempotent - drop before add)
ALTER TABLE engagements ADD CONSTRAINT engagements_currency_allowed
  CHECK (currency IS NOT NULL AND currency IN ('CZK', 'EUR', 'USD'));
ALTER TABLE engagements ALTER COLUMN currency SET NOT NULL;

-- engagement_services.currency (validated by trigger, add CHECK)
UPDATE engagement_services es SET currency = COALESCE(e.currency, 'CZK')
FROM engagements e WHERE es.engagement_id = e.id AND (es.currency IS NULL OR es.currency NOT IN ('CZK', 'EUR', 'USD'));
UPDATE engagement_services SET currency = 'CZK' WHERE currency IS NULL OR currency NOT IN ('CZK', 'EUR', 'USD');
ALTER TABLE engagement_services ALTER COLUMN currency SET DEFAULT 'CZK';
ALTER TABLE engagement_services DROP CONSTRAINT IF EXISTS engagement_services_currency_allowed;
ALTER TABLE engagement_services ADD CONSTRAINT engagement_services_currency_allowed
  CHECK (currency IS NOT NULL AND currency IN ('CZK', 'EUR', 'USD'));
ALTER TABLE engagement_services ALTER COLUMN currency SET NOT NULL;

-- extra_works.currency
UPDATE extra_works SET currency = 'CZK' WHERE currency IS NULL OR currency NOT IN ('CZK', 'EUR', 'USD');
ALTER TABLE extra_works ALTER COLUMN currency SET DEFAULT 'CZK';
ALTER TABLE extra_works DROP CONSTRAINT IF EXISTS extra_works_currency_allowed;
ALTER TABLE extra_works ADD CONSTRAINT extra_works_currency_allowed
  CHECK (currency IS NOT NULL AND currency IN ('CZK', 'EUR', 'USD'));
ALTER TABLE extra_works ALTER COLUMN currency SET NOT NULL;

-- issued_invoices.currency
UPDATE issued_invoices SET currency = 'CZK' WHERE currency IS NULL OR currency NOT IN ('CZK', 'EUR', 'USD');
ALTER TABLE issued_invoices ALTER COLUMN currency SET DEFAULT 'CZK';
ALTER TABLE issued_invoices DROP CONSTRAINT IF EXISTS issued_invoices_currency_allowed;
ALTER TABLE issued_invoices ADD CONSTRAINT issued_invoices_currency_allowed
  CHECK (currency IS NOT NULL AND currency IN ('CZK', 'EUR', 'USD'));
ALTER TABLE issued_invoices ALTER COLUMN currency SET NOT NULL;

-- invoice_line_items.currency
UPDATE invoice_line_items SET currency = 'CZK' WHERE currency IS NULL OR currency NOT IN ('CZK', 'EUR', 'USD');
ALTER TABLE invoice_line_items ALTER COLUMN currency SET DEFAULT 'CZK';
ALTER TABLE invoice_line_items DROP CONSTRAINT IF EXISTS invoice_line_items_currency_allowed;
ALTER TABLE invoice_line_items ADD CONSTRAINT invoice_line_items_currency_allowed
  CHECK (currency IS NOT NULL AND currency IN ('CZK', 'EUR', 'USD'));
ALTER TABLE invoice_line_items ALTER COLUMN currency SET NOT NULL;

-- services.currency (catalog - optional, but for consistency)
UPDATE services SET currency = 'CZK' WHERE currency IS NULL;
ALTER TABLE services ALTER COLUMN currency SET DEFAULT 'CZK';

-- =============================================================================
-- STEP 3: Invoice line items must match parent invoice currency
-- =============================================================================

CREATE OR REPLACE FUNCTION validate_invoice_line_item_currency()
RETURNS TRIGGER AS $$
DECLARE
  v_invoice_currency TEXT;
  v_extra_work_currency TEXT;
  v_service_currency TEXT;
BEGIN
  -- Get parent invoice currency
  SELECT currency INTO v_invoice_currency
  FROM issued_invoices
  WHERE id = NEW.invoice_id;

  IF v_invoice_currency IS NULL THEN
    RETURN NEW; -- Let FK handle missing invoice
  END IF;

  -- Line item currency must match invoice currency
  IF NEW.currency IS NULL OR NEW.currency != v_invoice_currency THEN
    NEW.currency := v_invoice_currency;
  END IF;

  -- If linked to extra_work, source currency must match
  IF NEW.extra_work_id IS NOT NULL THEN
    SELECT currency INTO v_extra_work_currency
    FROM extra_works WHERE id = NEW.extra_work_id;
    IF v_extra_work_currency IS NOT NULL AND v_extra_work_currency != v_invoice_currency THEN
      RAISE EXCEPTION 'Extra work currency (%) must match invoice currency (%)',
        v_extra_work_currency, v_invoice_currency;
    END IF;
  END IF;

  -- If linked to engagement_service, source currency must match
  IF NEW.engagement_service_id IS NOT NULL THEN
    SELECT currency INTO v_service_currency
    FROM engagement_services WHERE id = NEW.engagement_service_id;
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

-- =============================================================================
-- STEP 4: Block engagement currency change when services exist (strict block)
-- =============================================================================

CREATE OR REPLACE FUNCTION prevent_engagement_currency_change_with_services()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.currency IS DISTINCT FROM NEW.currency THEN
    IF EXISTS (SELECT 1 FROM engagement_services WHERE engagement_id = NEW.id) THEN
      RAISE EXCEPTION 'Cannot change engagement currency when it has services. Remove or update services first.'
        USING HINT = 'Engagement currency is locked once services exist. Use a coordinated migration if needed.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_engagement_currency_change_with_services ON engagements;

CREATE TRIGGER prevent_engagement_currency_change_with_services
BEFORE UPDATE OF currency ON engagements
FOR EACH ROW EXECUTE FUNCTION prevent_engagement_currency_change_with_services();

-- =============================================================================
-- STEP 5: Add currency to extra work immutability (invoiced items)
-- =============================================================================

CREATE OR REPLACE FUNCTION prevent_invoiced_extra_work_edit()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'invoiced' THEN
    IF NEW.hours_worked IS DISTINCT FROM OLD.hours_worked
       OR NEW.hourly_rate IS DISTINCT FROM OLD.hourly_rate
       OR NEW.amount IS DISTINCT FROM OLD.amount
       OR NEW.name IS DISTINCT FROM OLD.name
       OR NEW.description IS DISTINCT FROM OLD.description
       OR NEW.work_date IS DISTINCT FROM OLD.work_date
       OR NEW.billing_period IS DISTINCT FROM OLD.billing_period
       OR NEW.client_id IS DISTINCT FROM OLD.client_id
       OR NEW.engagement_id IS DISTINCT FROM OLD.engagement_id
       OR NEW.colleague_id IS DISTINCT FROM OLD.colleague_id
       OR NEW.currency IS DISTINCT FROM OLD.currency
    THEN
      RAISE EXCEPTION 'Cannot modify invoiced extra work item. Only status and invoice fields can be updated.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger already exists, function was replaced
COMMENT ON TRIGGER prevent_invoiced_extra_work_edit ON extra_works IS
  'Prevents modification of invoiced extra work items including currency. Invoiced items are fully immutable.';
