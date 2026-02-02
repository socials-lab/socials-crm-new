-- Migration: Add immutability constraints for issued invoices
-- Issued invoices should not be modified after creation (except for Fakturoid linking)

-- Function to prevent modifications to issued invoices (except allowed fields)
CREATE OR REPLACE FUNCTION prevent_issued_invoice_modification()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow updates only to these fields (for Fakturoid integration and status updates)
  IF (
    OLD.engagement_id IS DISTINCT FROM NEW.engagement_id OR
    OLD.engagement_name IS DISTINCT FROM NEW.engagement_name OR
    OLD.client_id IS DISTINCT FROM NEW.client_id OR
    OLD.client_name IS DISTINCT FROM NEW.client_name OR
    OLD.year IS DISTINCT FROM NEW.year OR
    OLD.month IS DISTINCT FROM NEW.month OR
    OLD.invoice_number IS DISTINCT FROM NEW.invoice_number OR
    OLD.line_items IS DISTINCT FROM NEW.line_items OR
    OLD.total_amount IS DISTINCT FROM NEW.total_amount OR
    OLD.currency IS DISTINCT FROM NEW.currency OR
    OLD.issued_at IS DISTINCT FROM NEW.issued_at OR
    OLD.issued_by IS DISTINCT FROM NEW.issued_by
  ) THEN
    RAISE EXCEPTION 'Issued invoices cannot be modified. Only fakturoid_id, fakturoid_url, status, and paid_at can be updated.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for immutability
DROP TRIGGER IF EXISTS enforce_invoice_immutability ON issued_invoices;
CREATE TRIGGER enforce_invoice_immutability
  BEFORE UPDATE ON issued_invoices
  FOR EACH ROW
  EXECUTE FUNCTION prevent_issued_invoice_modification();

-- Function to prevent modifications to invoice line items after creation
CREATE OR REPLACE FUNCTION prevent_line_item_modification()
RETURNS TRIGGER AS $$
DECLARE
  invoice_issued_at TIMESTAMPTZ;
BEGIN
  -- Check if the parent invoice has been issued
  SELECT issued_at INTO invoice_issued_at
  FROM issued_invoices
  WHERE id = OLD.invoice_id;

  -- If invoice exists and has been issued, prevent modification
  IF invoice_issued_at IS NOT NULL THEN
    RAISE EXCEPTION 'Invoice line items cannot be modified after the invoice has been issued.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for line item immutability
DROP TRIGGER IF EXISTS enforce_line_item_immutability ON invoice_line_items;
CREATE TRIGGER enforce_line_item_immutability
  BEFORE UPDATE ON invoice_line_items
  FOR EACH ROW
  EXECUTE FUNCTION prevent_line_item_modification();

-- Prevent deletion of line items from issued invoices
CREATE OR REPLACE FUNCTION prevent_line_item_deletion()
RETURNS TRIGGER AS $$
DECLARE
  invoice_issued_at TIMESTAMPTZ;
BEGIN
  -- Check if the parent invoice has been issued
  SELECT issued_at INTO invoice_issued_at
  FROM issued_invoices
  WHERE id = OLD.invoice_id;

  -- If invoice exists and has been issued, prevent deletion
  IF invoice_issued_at IS NOT NULL THEN
    RAISE EXCEPTION 'Invoice line items cannot be deleted after the invoice has been issued.';
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for line item deletion prevention
DROP TRIGGER IF EXISTS prevent_line_item_deletion_trigger ON invoice_line_items;
CREATE TRIGGER prevent_line_item_deletion_trigger
  BEFORE DELETE ON invoice_line_items
  FOR EACH ROW
  EXECUTE FUNCTION prevent_line_item_deletion();

COMMENT ON FUNCTION prevent_issued_invoice_modification() IS 'Prevents modification of core invoice fields after issuance';
COMMENT ON FUNCTION prevent_line_item_modification() IS 'Prevents modification of line items after invoice issuance';
COMMENT ON FUNCTION prevent_line_item_deletion() IS 'Prevents deletion of line items after invoice issuance';
