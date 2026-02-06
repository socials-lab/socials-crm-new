-- Add service detail columns to services table for storing rich service information

SET ROLE postgres;

-- Add new columns for service details
ALTER TABLE services
ADD COLUMN IF NOT EXISTS tagline TEXT,
ADD COLUMN IF NOT EXISTS platforms TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS target_audience TEXT,
ADD COLUMN IF NOT EXISTS benefits TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS setup_items JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS management_items JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS tier_comparison JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS credit_pricing JSONB;

-- Add comments for documentation
COMMENT ON COLUMN services.tagline IS 'Short tagline/subtitle for the service';
COMMENT ON COLUMN services.platforms IS 'Array of platform names (e.g., Meta Ads, Google Ads)';
COMMENT ON COLUMN services.target_audience IS 'Description of target audience for this service';
COMMENT ON COLUMN services.benefits IS 'Array of benefit descriptions';
COMMENT ON COLUMN services.setup_items IS 'JSON array of setup sections: [{title: string, items: string[]}]';
COMMENT ON COLUMN services.management_items IS 'JSON array of management sections: [{title: string, items: string[]}]';
COMMENT ON COLUMN services.tier_comparison IS 'JSON array of tier features: [{feature: string, growth: string|bool, pro: string|bool, elite: string|bool}]';
COMMENT ON COLUMN services.credit_pricing IS 'JSON object for credit-based services: {basePrice, currency, expressMultiplier, colleagueRewardPerCredit, outputTypes: [{name, credits, description}]}';
