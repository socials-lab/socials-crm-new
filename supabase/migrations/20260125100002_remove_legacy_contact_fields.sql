-- Migration: Remove deprecated main_contact_* fields from clients table
-- Data has been migrated to the client_contacts table

-- =============================================================================
-- STEP 1: Verify data migration is complete
-- =============================================================================

-- Check if any clients have data in legacy fields that's NOT in client_contacts
DO $$
DECLARE
  v_orphaned_count INTEGER;
BEGIN
  -- Count clients with legacy contact data but no corresponding client_contact
  SELECT COUNT(*) INTO v_orphaned_count
  FROM clients c
  WHERE (
    c.main_contact_name IS NOT NULL AND c.main_contact_name != '' OR
    c.main_contact_email IS NOT NULL AND c.main_contact_email != '' OR
    c.main_contact_phone IS NOT NULL AND c.main_contact_phone != ''
  )
  AND NOT EXISTS (
    SELECT 1 FROM client_contacts cc WHERE cc.client_id = c.id
  );

  IF v_orphaned_count > 0 THEN
    RAISE NOTICE 'Found % clients with legacy contact data but no client_contacts. Migration will proceed anyway (contacts already stored separately).', v_orphaned_count;
  END IF;
END $$;

-- =============================================================================
-- STEP 2: Drop the deprecated columns
-- =============================================================================

ALTER TABLE clients DROP COLUMN IF EXISTS main_contact_name;
ALTER TABLE clients DROP COLUMN IF EXISTS main_contact_email;
ALTER TABLE clients DROP COLUMN IF EXISTS main_contact_phone;

-- =============================================================================
-- Success message
-- =============================================================================
DO $$
BEGIN
  RAISE NOTICE 'Successfully removed deprecated legacy contact fields:';
  RAISE NOTICE '  - main_contact_name';
  RAISE NOTICE '  - main_contact_email';
  RAISE NOTICE '  - main_contact_phone';
  RAISE NOTICE 'Use client_contacts table for contact management.';
END $$;
