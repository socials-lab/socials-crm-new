-- Migration: Add invoicing protection for Creative Boost
-- Prevents the same month's Creative Boost from being invoiced multiple times

-- Add invoicing tracking columns to creative_boost_client_months
ALTER TABLE creative_boost_client_months
ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES issued_invoices(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS invoiced_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS invoiced_amount DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS invoiced_credits INTEGER;

-- Add index for finding uninvoiced months
CREATE INDEX IF NOT EXISTS idx_cb_client_months_invoiced
ON creative_boost_client_months(client_id, year, month)
WHERE invoice_id IS NULL;

-- Add constraint: if invoiced_at is set, invoice_id must also be set
ALTER TABLE creative_boost_client_months
ADD CONSTRAINT cb_invoicing_consistency
CHECK (
  (invoiced_at IS NULL AND invoice_id IS NULL) OR
  (invoiced_at IS NOT NULL AND invoice_id IS NOT NULL)
);

COMMENT ON COLUMN creative_boost_client_months.invoice_id IS 'Reference to the invoice that billed this Creative Boost month';
COMMENT ON COLUMN creative_boost_client_months.invoiced_at IS 'Timestamp when this Creative Boost month was invoiced';
COMMENT ON COLUMN creative_boost_client_months.invoiced_amount IS 'Amount invoiced for this month (snapshot at invoice time)';
COMMENT ON COLUMN creative_boost_client_months.invoiced_credits IS 'Number of credits invoiced (snapshot at invoice time)';
