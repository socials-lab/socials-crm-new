ALTER TABLE public.engagement_services
ADD COLUMN IF NOT EXISTS creative_boost_fixed_billing boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.engagement_services.creative_boost_fixed_billing
IS 'When true, invoices expected Creative Boost package amount. When false, usage-based mode is configured.';
