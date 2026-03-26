-- Lead Enrichment Fields Migration
-- Adds fields for external lead enrichment tool data

-- Marketing info
ALTER TABLE leads ADD COLUMN IF NOT EXISTS enrichment_platform text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS enrichment_ad_spend_range text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS enrichment_services_needed text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS marketing_experience text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS marketing_maturity text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS has_creative_team text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS pain_point text;

-- Tracking & scoring
ALTER TABLE leads ADD COLUMN IF NOT EXISTS has_ga4 boolean DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS has_gtm boolean DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS has_meta_pixel boolean DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS has_google_ads boolean DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS tracking_detected boolean DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_score integer;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS credibility_score integer;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS enrichment_qualification_tier text;

-- Company enrichment
ALTER TABLE leads ADD COLUMN IF NOT EXISTS is_vat_payer boolean;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS is_ecommerce boolean;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS business_type text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS company_address text;

-- Social media
ALTER TABLE leads ADD COLUMN IF NOT EXISTS facebook_url text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS instagram_url text;

-- Booking
ALTER TABLE leads ADD COLUMN IF NOT EXISTS booking_status text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS booking_datetime timestamptz;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS booking_meet_link text;

-- AI research & meta
ALTER TABLE leads ADD COLUMN IF NOT EXISTS company_research text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS enrichment_completed boolean DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS enrichment_id uuid;
