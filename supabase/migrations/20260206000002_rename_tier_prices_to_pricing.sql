-- Rename tier_prices to tier_pricing to match the expected column name

SET ROLE postgres;

-- Drop the incorrectly named column if it exists and add the correct one
ALTER TABLE services DROP COLUMN IF EXISTS tier_prices;

-- Add tier_pricing if it doesn't exist
ALTER TABLE services ADD COLUMN IF NOT EXISTS tier_pricing JSONB;

COMMENT ON COLUMN services.tier_pricing IS 'JSON object for tier pricing: {growth: {price, spend}, pro: {price, spend}, elite: {price, spend}}';
