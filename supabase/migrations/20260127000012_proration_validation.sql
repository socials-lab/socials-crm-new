-- Migration: Add server-side validation for proration values
-- Ensures prorated_days cannot exceed total_days_in_month

-- Add CHECK constraint for valid proration
ALTER TABLE invoice_line_items
DROP CONSTRAINT IF EXISTS valid_proration_range;

ALTER TABLE invoice_line_items
ADD CONSTRAINT valid_proration_range CHECK (
  -- If prorated_days is set, it must be valid
  prorated_days IS NULL OR (
    prorated_days > 0 AND
    (total_days_in_month IS NULL OR prorated_days <= total_days_in_month)
  )
);

-- Add CHECK constraint for total_days_in_month being reasonable
ALTER TABLE invoice_line_items
DROP CONSTRAINT IF EXISTS valid_days_in_month;

ALTER TABLE invoice_line_items
ADD CONSTRAINT valid_days_in_month CHECK (
  total_days_in_month IS NULL OR (
    total_days_in_month >= 28 AND total_days_in_month <= 31
  )
);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Added proration validation constraints:';
  RAISE NOTICE '  - valid_proration_range: prorated_days must be positive and <= total_days_in_month';
  RAISE NOTICE '  - valid_days_in_month: must be between 28 and 31';
END $$;
