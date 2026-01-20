-- Migration: Add default offer values to services table
-- Run this in Supabase SQL Editor

-- Add columns for default offer values
ALTER TABLE services
ADD COLUMN IF NOT EXISTS offer_description TEXT,
ADD COLUMN IF NOT EXISTS default_deliverables TEXT[],
ADD COLUMN IF NOT EXISTS default_frequency TEXT,
ADD COLUMN IF NOT EXISTS default_turnaround TEXT,
ADD COLUMN IF NOT EXISTS default_requirements TEXT[];

-- Add comments for documentation
COMMENT ON COLUMN services.offer_description IS 'Detailed description shown in public offers';
COMMENT ON COLUMN services.default_deliverables IS 'Default list of what client gets - can be overridden per offer';
COMMENT ON COLUMN services.default_frequency IS 'Default delivery frequency (e.g., "8 campaigns/month")';
COMMENT ON COLUMN services.default_turnaround IS 'Default turnaround time (e.g., "14 days from start")';
COMMENT ON COLUMN services.default_requirements IS 'Default list of what we need from client';
