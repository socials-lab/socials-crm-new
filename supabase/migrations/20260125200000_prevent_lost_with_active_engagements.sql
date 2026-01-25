-- Migration: Prevent marking clients as "lost" when they have active engagements
-- This is a safety net for the UI validation

-- =============================================================================
-- Create trigger function to validate client status change to "lost"
-- =============================================================================

CREATE OR REPLACE FUNCTION validate_client_lost_status()
RETURNS TRIGGER AS $$
DECLARE
  v_active_count INTEGER;
BEGIN
  -- Only check when changing TO "lost" status
  IF NEW.status = 'lost' AND (OLD.status IS NULL OR OLD.status != 'lost') THEN
    -- Count active engagements for this client
    SELECT COUNT(*) INTO v_active_count
    FROM engagements
    WHERE client_id = NEW.id
      AND status = 'active';

    IF v_active_count > 0 THEN
      RAISE EXCEPTION 'Nelze označit klienta jako ztraceného, pokud má % aktivních zakázek. Nejprve ukončete nebo pozastavte všechny zakázky.', v_active_count
        USING HINT = 'Změňte stav aktivních zakázek na "completed", "paused" nebo "cancelled" před označením klienta jako ztraceného';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- Create the trigger
-- =============================================================================

DROP TRIGGER IF EXISTS validate_client_lost_status_trigger ON clients;
CREATE TRIGGER validate_client_lost_status_trigger
  BEFORE UPDATE OF status ON clients
  FOR EACH ROW
  EXECUTE FUNCTION validate_client_lost_status();

-- =============================================================================
-- Success message
-- =============================================================================
DO $$
BEGIN
  RAISE NOTICE 'Successfully created trigger to prevent marking clients as lost with active engagements';
END $$;
