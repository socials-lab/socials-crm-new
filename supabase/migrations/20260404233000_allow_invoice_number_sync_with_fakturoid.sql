-- Allow invoice_number to be synchronized once from Fakturoid during linking.
-- All other immutability rules remain unchanged.

CREATE OR REPLACE FUNCTION prevent_issued_invoice_modification()
RETURNS TRIGGER AS $$
DECLARE
  allows_invoice_number_sync BOOLEAN;
BEGIN
  -- Invoice number may change only when linking to Fakturoid for the first time.
  allows_invoice_number_sync := (
    OLD.invoice_number IS DISTINCT FROM NEW.invoice_number
    AND OLD.fakturoid_id IS NULL
    AND NEW.fakturoid_id IS NOT NULL
  );

  IF (
    OLD.engagement_id IS DISTINCT FROM NEW.engagement_id OR
    OLD.engagement_name IS DISTINCT FROM NEW.engagement_name OR
    OLD.client_id IS DISTINCT FROM NEW.client_id OR
    OLD.client_name IS DISTINCT FROM NEW.client_name OR
    OLD.year IS DISTINCT FROM NEW.year OR
    OLD.month IS DISTINCT FROM NEW.month OR
    (OLD.invoice_number IS DISTINCT FROM NEW.invoice_number AND NOT allows_invoice_number_sync) OR
    OLD.line_items IS DISTINCT FROM NEW.line_items OR
    OLD.total_amount IS DISTINCT FROM NEW.total_amount OR
    OLD.currency IS DISTINCT FROM NEW.currency OR
    OLD.issued_at IS DISTINCT FROM NEW.issued_at OR
    OLD.issued_by IS DISTINCT FROM NEW.issued_by
  ) THEN
    RAISE EXCEPTION 'Issued invoices cannot be modified. Only fakturoid_id, fakturoid_url, status, paid_at and initial fakturoid invoice number sync are allowed.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
