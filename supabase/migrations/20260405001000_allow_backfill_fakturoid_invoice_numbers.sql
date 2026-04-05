-- Allow backfill of legacy FV-* invoice numbers from Fakturoid
-- for already linked invoices (fakturoid_id already present).

CREATE OR REPLACE FUNCTION prevent_issued_invoice_modification()
RETURNS TRIGGER AS $$
DECLARE
  allows_invoice_number_sync BOOLEAN;
BEGIN
  -- Invoice number sync is allowed in two safe cases:
  -- 1) initial link to Fakturoid (fakturoid_id null -> non-null)
  -- 2) legacy backfill from internal FV-* number to Fakturoid number
  allows_invoice_number_sync := (
    OLD.invoice_number IS DISTINCT FROM NEW.invoice_number
    AND (
      (
        OLD.fakturoid_id IS NULL
        AND NEW.fakturoid_id IS NOT NULL
      )
      OR (
        OLD.fakturoid_id IS NOT NULL
        AND NEW.fakturoid_id = OLD.fakturoid_id
        AND OLD.invoice_number ~ '^FV-[0-9]{4}-[0-9]+$'
        AND NEW.invoice_number !~ '^FV-[0-9]{4}-[0-9]+$'
      )
    )
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
    RAISE EXCEPTION 'Issued invoices cannot be modified. Only fakturoid_id, fakturoid_url, status, paid_at and approved invoice number sync are allowed.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
