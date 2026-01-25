-- Migration: Business logic constraints
-- Prevents engagement orphaning and adds creative boost validation

-- =============================================================================
-- 1. Prevent engagement orphaning when contact deleted
-- =============================================================================

-- First, check if any engagements reference contacts that would be orphaned
-- (This is just informational - the constraint change handles the protection)

-- Change FK behavior from SET NULL to RESTRICT
-- This prevents deleting a contact that is assigned as contact_person on an engagement
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'engagements_contact_person_id_fkey'
    AND table_name = 'engagements'
  ) THEN
    ALTER TABLE engagements DROP CONSTRAINT engagements_contact_person_id_fkey;
  END IF;
END $$;

-- Add new constraint with RESTRICT instead of SET NULL
ALTER TABLE engagements
  ADD CONSTRAINT engagements_contact_person_id_fkey
    FOREIGN KEY (contact_person_id)
    REFERENCES client_contacts(id)
    ON DELETE RESTRICT;

-- =============================================================================
-- 2. Creative boost credits validation
-- =============================================================================

-- Check if creative_boost_service_settings table exists before adding constraint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'creative_boost_service_settings'
  ) THEN
    -- Check for invalid data first
    IF EXISTS (
      SELECT 1 FROM creative_boost_service_settings
      WHERE min_credits IS NOT NULL
        AND max_credits IS NOT NULL
        AND min_credits > max_credits
    ) THEN
      RAISE EXCEPTION 'Cannot add constraint: found creative_boost_service_settings with min_credits > max_credits';
    END IF;

    -- Add constraint if not exists
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.check_constraints
      WHERE constraint_name = 'credits_order'
    ) THEN
      ALTER TABLE creative_boost_service_settings
        ADD CONSTRAINT credits_order
        CHECK (min_credits IS NULL OR max_credits IS NULL OR min_credits <= max_credits);
    END IF;
  END IF;
END $$;

-- =============================================================================
-- Success message
-- =============================================================================
DO $$
BEGIN
  RAISE NOTICE 'Successfully added business logic constraints:';
  RAISE NOTICE '  - engagements_contact_person_id_fkey: ON DELETE RESTRICT';
  RAISE NOTICE '  - credits_order: min_credits <= max_credits (if table exists)';
END $$;
