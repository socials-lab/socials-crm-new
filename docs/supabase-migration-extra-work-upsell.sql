-- Add upsell tracking and per-work internal rate columns to extra_works

ALTER TABLE extra_works
  ADD COLUMN IF NOT EXISTS internal_hourly_rate numeric,
  ADD COLUMN IF NOT EXISTS upsold_by_id uuid REFERENCES colleagues(id),
  ADD COLUMN IF NOT EXISTS upsell_commission_percent numeric DEFAULT 10;

-- Set test upsell data on one extra work: "Nastavení analytiky" (36d07c76)
-- Danny (abeb4751) sold this work done by Danny New (c3358a35)
UPDATE extra_works
SET 
  internal_hourly_rate = 700,
  upsold_by_id = 'abeb4751-9691-42bc-8b21-fdf6c90d6524',
  upsell_commission_percent = 10
WHERE id = '36d07c76-771e-46e4-9b4c-f292a45b7f13';

-- Set internal_hourly_rate on other records too
UPDATE extra_works
SET internal_hourly_rate = 700
WHERE internal_hourly_rate IS NULL;
