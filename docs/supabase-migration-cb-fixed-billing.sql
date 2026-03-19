-- Migration: Add creative_boost_fixed_billing to engagement_services
-- When true: invoice full package (max_credits * price_per_credit) regardless of usage
-- When false: invoice based on actual credits used

ALTER TABLE engagement_services
ADD COLUMN IF NOT EXISTS creative_boost_fixed_billing boolean DEFAULT true;

COMMENT ON COLUMN engagement_services.creative_boost_fixed_billing IS 
  'If true, client pays fixed package price regardless of credit usage. If false, invoiced by actual usage.';
