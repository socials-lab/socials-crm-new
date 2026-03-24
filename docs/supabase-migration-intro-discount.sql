-- Migration: Add introductory discount fields to engagement_services
-- Run this in the Supabase SQL Editor

ALTER TABLE engagement_services
  ADD COLUMN IF NOT EXISTS intro_discount_percent numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS intro_discount_months integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS intro_discount_start_date date DEFAULT NULL;

COMMENT ON COLUMN engagement_services.intro_discount_percent IS 'Introductory discount percentage (e.g. 10 for 10%)';
COMMENT ON COLUMN engagement_services.intro_discount_months IS 'Number of months the intro discount is active';
COMMENT ON COLUMN engagement_services.intro_discount_start_date IS 'Start date of the intro discount period';
