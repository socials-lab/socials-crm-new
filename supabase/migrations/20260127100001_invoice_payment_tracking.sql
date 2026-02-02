-- Migration: Add payment tracking columns to issued_invoices
-- This fixes the webhook that was trying to update non-existent columns

-- Add status column with enum-like constraint
ALTER TABLE issued_invoices
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'issued';

-- Add paid_at column
ALTER TABLE issued_invoices
ADD COLUMN IF NOT EXISTS paid_at DATE;

-- Add constraint for valid status values
ALTER TABLE issued_invoices
ADD CONSTRAINT issued_invoices_status_check
CHECK (status IN ('draft', 'issued', 'sent', 'paid', 'overdue', 'cancelled'));

-- Add index for filtering by status
CREATE INDEX IF NOT EXISTS idx_issued_invoices_status ON issued_invoices(status);

-- Add index for payment date queries
CREATE INDEX IF NOT EXISTS idx_issued_invoices_paid_at ON issued_invoices(paid_at) WHERE paid_at IS NOT NULL;

COMMENT ON COLUMN issued_invoices.status IS 'Invoice status: draft, issued, sent, paid, overdue, cancelled';
COMMENT ON COLUMN issued_invoices.paid_at IS 'Date when invoice was marked as paid (from Fakturoid webhook)';
