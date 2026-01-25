-- Migration: Server-side validation for client and engagement status transitions
-- Ensures status transitions follow business rules even when called directly via API

-- =============================================================================
-- STEP 1: Create helper function to check if user is super admin
-- =============================================================================

CREATE OR REPLACE FUNCTION is_user_super_admin()
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
  v_is_super_admin BOOLEAN;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;

  -- Check user_roles table for super_admin status
  SELECT is_super_admin INTO v_is_super_admin
  FROM user_roles
  WHERE id = v_user_id;

  RETURN COALESCE(v_is_super_admin, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- STEP 2: Create client status transition validation trigger
-- =============================================================================

CREATE OR REPLACE FUNCTION validate_client_status_transition()
RETURNS TRIGGER AS $$
DECLARE
  v_is_super_admin BOOLEAN;
BEGIN
  -- Skip if status hasn't changed
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Check if user is super admin
  v_is_super_admin := is_user_super_admin();

  -- Define valid transitions for standard users
  -- lead -> active, potential, lost
  -- potential -> active, lost
  -- active -> paused, lost
  -- paused -> active, lost, potential (added potential)
  -- lost -> (nothing for standard users)

  -- Check standard transitions
  IF (OLD.status = 'lead' AND NEW.status IN ('active', 'potential', 'lost')) OR
     (OLD.status = 'potential' AND NEW.status IN ('active', 'lost')) OR
     (OLD.status = 'active' AND NEW.status IN ('paused', 'lost')) OR
     (OLD.status = 'paused' AND NEW.status IN ('active', 'lost', 'potential')) THEN
    RETURN NEW;
  END IF;

  -- Check admin-only transitions
  IF v_is_super_admin THEN
    -- lost -> active, potential (reactivation)
    IF OLD.status = 'lost' AND NEW.status IN ('active', 'potential') THEN
      RETURN NEW;
    END IF;
  END IF;

  -- Invalid transition
  RAISE EXCEPTION 'Invalid status transition from % to %. Only super admins can reactivate lost clients.', OLD.status, NEW.status
    USING HINT = 'Contact a super admin to change this status';

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace the trigger
DROP TRIGGER IF EXISTS validate_client_status ON clients;
CREATE TRIGGER validate_client_status
  BEFORE UPDATE OF status ON clients
  FOR EACH ROW
  EXECUTE FUNCTION validate_client_status_transition();

-- =============================================================================
-- STEP 3: Create engagement status transition validation trigger
-- =============================================================================

CREATE OR REPLACE FUNCTION validate_engagement_status_transition()
RETURNS TRIGGER AS $$
DECLARE
  v_is_super_admin BOOLEAN;
BEGIN
  -- Skip if status hasn't changed
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Check if user is super admin
  v_is_super_admin := is_user_super_admin();

  -- Define valid transitions for standard users
  -- planned -> active, cancelled
  -- active -> paused, completed, cancelled
  -- paused -> active, completed, cancelled
  -- completed -> (nothing for standard users)
  -- cancelled -> (nothing for standard users)

  -- Check standard transitions
  IF (OLD.status = 'planned' AND NEW.status IN ('active', 'cancelled')) OR
     (OLD.status = 'active' AND NEW.status IN ('paused', 'completed', 'cancelled')) OR
     (OLD.status = 'paused' AND NEW.status IN ('active', 'completed', 'cancelled')) THEN
    RETURN NEW;
  END IF;

  -- Check admin-only transitions
  IF v_is_super_admin THEN
    -- completed -> active (reopen)
    -- cancelled -> active (reopen)
    IF (OLD.status = 'completed' AND NEW.status = 'active') OR
       (OLD.status = 'cancelled' AND NEW.status = 'active') THEN
      RETURN NEW;
    END IF;
  END IF;

  -- Invalid transition
  RAISE EXCEPTION 'Invalid engagement status transition from % to %. Only super admins can reopen completed/cancelled engagements.', OLD.status, NEW.status
    USING HINT = 'Contact a super admin to change this status';

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace the trigger
DROP TRIGGER IF EXISTS validate_engagement_status ON engagements;
CREATE TRIGGER validate_engagement_status
  BEFORE UPDATE OF status ON engagements
  FOR EACH ROW
  EXECUTE FUNCTION validate_engagement_status_transition();

-- =============================================================================
-- Success message
-- =============================================================================
DO $$
BEGIN
  RAISE NOTICE 'Successfully created status transition validation:';
  RAISE NOTICE '  - is_user_super_admin(): Helper function to check admin status';
  RAISE NOTICE '  - validate_client_status_transition(): Trigger function for clients';
  RAISE NOTICE '  - validate_engagement_status_transition(): Trigger function for engagements';
  RAISE NOTICE '  - Added paused -> potential transition for clients';
END $$;
