-- Add monthly % discount metadata for public offers
ALTER TABLE public.public_offers
ADD COLUMN IF NOT EXISTS monthly_discount_percent NUMERIC,
ADD COLUMN IF NOT EXISTS discount_scope TEXT;
COMMENT ON COLUMN public.public_offers.monthly_discount_percent IS 'Monthly discount percent (0-100) applied to selected monthly services';
COMMENT ON COLUMN public.public_offers.discount_scope IS 'Scope of monthly discount: core_only | all_services';
ALTER TABLE public.public_offers
ADD CONSTRAINT public_offers_monthly_discount_percent_range
CHECK (
  monthly_discount_percent IS NULL
  OR (monthly_discount_percent >= 0 AND monthly_discount_percent <= 100)
);
ALTER TABLE public.public_offers
ADD CONSTRAINT public_offers_discount_scope_valid
CHECK (
  discount_scope IS NULL
  OR discount_scope IN ('core_only', 'all_services')
);
