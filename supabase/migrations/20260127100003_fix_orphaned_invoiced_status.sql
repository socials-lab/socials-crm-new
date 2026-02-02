-- Migration: Fix orphaned "invoiced" status when invoice is deleted
-- When an invoice is deleted, reset related records back to their pre-invoiced state

-- Function to reset extra_works when invoice is deleted
CREATE OR REPLACE FUNCTION reset_extra_work_on_invoice_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Reset extra works that were linked to this invoice
  UPDATE extra_works
  SET
    status = 'ready_to_invoice',
    invoice_id = NULL,
    invoice_number = NULL,
    invoiced_at = NULL
  WHERE invoice_id = OLD.id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Function to reset engagement_services (one-offs) when invoice is deleted
CREATE OR REPLACE FUNCTION reset_one_off_services_on_invoice_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Reset one-off services that were linked to this invoice
  UPDATE engagement_services
  SET
    invoicing_status = 'pending',
    invoice_id = NULL,
    invoiced_at = NULL,
    invoiced_in_period = NULL
  WHERE invoice_id = OLD.id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Function to reset creative_boost_client_months when invoice is deleted
CREATE OR REPLACE FUNCTION reset_creative_boost_on_invoice_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Reset Creative Boost months that were linked to this invoice
  UPDATE creative_boost_client_months
  SET
    invoice_id = NULL,
    invoiced_at = NULL,
    invoiced_amount = NULL,
    invoiced_credits = NULL
  WHERE invoice_id = OLD.id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to run BEFORE delete (so we can still reference OLD.id)
DROP TRIGGER IF EXISTS reset_extra_work_on_invoice_delete_trigger ON issued_invoices;
CREATE TRIGGER reset_extra_work_on_invoice_delete_trigger
  BEFORE DELETE ON issued_invoices
  FOR EACH ROW
  EXECUTE FUNCTION reset_extra_work_on_invoice_delete();

DROP TRIGGER IF EXISTS reset_one_off_services_on_invoice_delete_trigger ON issued_invoices;
CREATE TRIGGER reset_one_off_services_on_invoice_delete_trigger
  BEFORE DELETE ON issued_invoices
  FOR EACH ROW
  EXECUTE FUNCTION reset_one_off_services_on_invoice_delete();

DROP TRIGGER IF EXISTS reset_creative_boost_on_invoice_delete_trigger ON issued_invoices;
CREATE TRIGGER reset_creative_boost_on_invoice_delete_trigger
  BEFORE DELETE ON issued_invoices
  FOR EACH ROW
  EXECUTE FUNCTION reset_creative_boost_on_invoice_delete();

COMMENT ON FUNCTION reset_extra_work_on_invoice_delete() IS 'Resets extra_works status to ready_to_invoice when linked invoice is deleted';
COMMENT ON FUNCTION reset_one_off_services_on_invoice_delete() IS 'Resets one-off services status to pending when linked invoice is deleted';
COMMENT ON FUNCTION reset_creative_boost_on_invoice_delete() IS 'Clears invoicing data from Creative Boost months when linked invoice is deleted';
