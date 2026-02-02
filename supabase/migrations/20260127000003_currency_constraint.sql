-- Migration: Enforce single currency per engagement
-- All engagement_services must use the same currency as their parent engagement

-- Add trigger to enforce currency match
CREATE OR REPLACE FUNCTION validate_service_currency()
RETURNS TRIGGER AS $$
DECLARE
  v_engagement_currency TEXT;
BEGIN
  -- Get the engagement's currency
  SELECT currency INTO v_engagement_currency
  FROM engagements
  WHERE id = NEW.engagement_id;

  -- If engagement doesn't exist, let the FK constraint handle it
  IF v_engagement_currency IS NULL THEN
    RETURN NEW;
  END IF;

  -- Check if service currency matches engagement currency
  IF NEW.currency IS NOT NULL AND NEW.currency != v_engagement_currency THEN
    RAISE EXCEPTION 'Service currency (%) must match engagement currency (%)',
      NEW.currency, v_engagement_currency
      USING HINT = 'All services on an engagement must use the same currency as the engagement';
  END IF;

  -- Auto-set currency to match engagement if not provided
  IF NEW.currency IS NULL THEN
    NEW.currency := v_engagement_currency;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS enforce_service_currency ON engagement_services;

-- Create the trigger
CREATE TRIGGER enforce_service_currency
BEFORE INSERT OR UPDATE ON engagement_services
FOR EACH ROW EXECUTE FUNCTION validate_service_currency();

-- Update existing services to match their engagement's currency
UPDATE engagement_services es
SET currency = e.currency
FROM engagements e
WHERE es.engagement_id = e.id
  AND es.currency != e.currency;

DO $$
DECLARE
  v_updated_count INT;
BEGIN
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RAISE NOTICE 'Currency constraint added to engagement_services';
  RAISE NOTICE '  - Updated % existing services to match engagement currency', v_updated_count;
END $$;
