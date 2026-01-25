-- ============================================
-- Auto-Set First Contact as Primary
-- ============================================
-- Issue #3: No auto-primary contact on first contact creation
-- When creating the first contact for a client, it should
-- automatically become the primary contact
-- ============================================

-- Create trigger function to auto-set first contact as primary
CREATE OR REPLACE FUNCTION auto_set_first_contact_primary()
RETURNS TRIGGER AS $$
DECLARE
  v_contact_count INTEGER;
BEGIN
  -- Count existing non-deleted contacts for this client (excluding the new one)
  SELECT COUNT(*) INTO v_contact_count
  FROM client_contacts
  WHERE client_id = NEW.client_id
    AND id != NEW.id
    AND deleted_at IS NULL;

  -- If this is the first contact, set it as primary
  IF v_contact_count = 0 THEN
    NEW.is_primary := true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trg_auto_primary_first_contact ON client_contacts;

-- Create trigger that fires BEFORE INSERT
CREATE TRIGGER trg_auto_primary_first_contact
  BEFORE INSERT ON client_contacts
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_first_contact_primary();

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Created trigger trg_auto_primary_first_contact:';
  RAISE NOTICE '  - First contact for a client is automatically set as primary';
END $$;
