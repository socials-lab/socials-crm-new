-- Migration: Cascade service deactivation when engagement is cancelled
-- When an engagement status changes to 'cancelled', automatically deactivate all its services

CREATE OR REPLACE FUNCTION cascade_engagement_cancellation()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger when status changes to 'cancelled'
  IF NEW.status = 'cancelled' AND (OLD.status IS DISTINCT FROM 'cancelled') THEN
    -- Deactivate all active services for this engagement
    UPDATE engagement_services
    SET is_active = false,
        updated_at = NOW()
    WHERE engagement_id = NEW.id
      AND is_active = true;

    -- Log this automatic deactivation (if we have services that were deactivated)
    IF FOUND THEN
      -- Optional: Could log to engagement_history here
      RAISE NOTICE 'Auto-deactivated services for cancelled engagement %', NEW.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on engagements
DROP TRIGGER IF EXISTS engagement_cancellation_cascade ON engagements;
CREATE TRIGGER engagement_cancellation_cascade
  AFTER UPDATE ON engagements
  FOR EACH ROW
  WHEN (NEW.status = 'cancelled' AND OLD.status IS DISTINCT FROM 'cancelled')
  EXECUTE FUNCTION cascade_engagement_cancellation();

-- Add comment for documentation
COMMENT ON FUNCTION cascade_engagement_cancellation() IS 'Automatically deactivates engagement services when engagement is cancelled';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Created cascade_engagement_cancellation trigger';
  RAISE NOTICE '  - Services will be auto-deactivated when engagement is cancelled';
END $$;
