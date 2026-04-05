-- Allow adjusting issued_at before Fakturoid linking.
-- Needed for Eco Bamboo flow where issued_at is set to the end of invoiced month
-- after local invoice creation and before push to Fakturoid.

CREATE OR REPLACE FUNCTION prevent_issued_invoice_modification()
RETURNS TRIGGER AS $$
DECLARE
  allows_invoice_number_sync BOOLEAN;
  allows_issued_at_adjustment BOOLEAN;
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

  -- issued_at can be adjusted only before linking to Fakturoid
  -- (e.g. Eco Bamboo special handling).
  allows_issued_at_adjustment := (
    OLD.issued_at IS DISTINCT FROM NEW.issued_at
    AND OLD.fakturoid_id IS NULL
    AND NEW.fakturoid_id IS NULL
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
    (OLD.issued_at IS DISTINCT FROM NEW.issued_at AND NOT allows_issued_at_adjustment) OR
    OLD.issued_by IS DISTINCT FROM NEW.issued_by
  ) THEN
    RAISE EXCEPTION 'Issued invoices cannot be modified. Only fakturoid_id, fakturoid_url, status, paid_at, approved invoice number sync, and pre-link issued_at adjustment are allowed.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
