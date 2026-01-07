-- Migration: Add upsell tracking to extra_works and engagement_services
-- This allows tracking which colleague sold the work/service and their commission

-- Add upsell columns to extra_works
ALTER TABLE public.extra_works
ADD COLUMN IF NOT EXISTS upsold_by_id UUID REFERENCES colleagues(id),
ADD COLUMN IF NOT EXISTS upsell_commission_percent NUMERIC DEFAULT 10;

-- Add upsell columns to engagement_services
ALTER TABLE public.engagement_services
ADD COLUMN IF NOT EXISTS upsold_by_id UUID REFERENCES colleagues(id),
ADD COLUMN IF NOT EXISTS upsell_commission_percent NUMERIC DEFAULT 10;

-- Add comments for documentation
COMMENT ON COLUMN public.extra_works.upsold_by_id IS 'Colleague who sold this extra work (upsell). NULL if not an upsell.';
COMMENT ON COLUMN public.extra_works.upsell_commission_percent IS 'Commission percentage for the selling colleague. Default 10%.';
COMMENT ON COLUMN public.engagement_services.upsold_by_id IS 'Colleague who sold this service (upsell). NULL if not an upsell.';
COMMENT ON COLUMN public.engagement_services.upsell_commission_percent IS 'Commission percentage for the selling colleague. Default 10%.';
