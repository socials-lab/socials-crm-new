-- Migration: Strengthen client status validation
-- 1. Update lost status check to include paused and planned engagements
-- 2. Add validation to prevent pausing client with active engagements
-- 3. Add validation to prevent contact deletion when assigned to engagement

-- =============================================================================
-- Update the lost status validation to check all non-terminal engagements
-- =============================================================================

CREATE OR REPLACE FUNCTION validate_client_lost_status()
RETURNS TRIGGER AS $$
DECLARE
  v_non_terminal_count INTEGER;
  v_status_list TEXT;
BEGIN
  -- Only check when changing TO "lost" status
  IF NEW.status = 'lost' AND (OLD.status IS NULL OR OLD.status != 'lost') THEN
    -- Count non-terminal engagements (active, paused, planned)
    SELECT COUNT(*), string_agg(DISTINCT status::TEXT, ', ')
    INTO v_non_terminal_count, v_status_list
    FROM engagements
    WHERE client_id = NEW.id
      AND status IN ('active', 'paused', 'planned');

    IF v_non_terminal_count > 0 THEN
      RAISE EXCEPTION 'Nelze oznacit klienta jako ztraceneho. Ma % nezavrenych zakazek (stavy: %). Nejprve ukoncete nebo zruste vsechny zakazky.', v_non_terminal_count, v_status_list
        USING HINT = 'Zmente stav zakazek na "completed" nebo "cancelled" pred oznacenim klienta jako ztraceneho';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- Add validation to prevent pausing client with active engagements
-- =============================================================================

CREATE OR REPLACE FUNCTION validate_client_paused_status()
RETURNS TRIGGER AS $$
DECLARE
  v_active_count INTEGER;
BEGIN
  -- Only check when changing TO "paused" status
  IF NEW.status = 'paused' AND (OLD.status IS NULL OR OLD.status != 'paused') THEN
    -- Count active engagements
    SELECT COUNT(*) INTO v_active_count
    FROM engagements
    WHERE client_id = NEW.id
      AND status = 'active';

    IF v_active_count > 0 THEN
      RAISE EXCEPTION 'Nelze pozastavit klienta s % aktivnimi zakazkami. Nejprve pozastavte nebo ukoncete vsechny aktivni zakazky.', v_active_count
        USING HINT = 'Zmente stav aktivnich zakazek na "paused", "completed" nebo "cancelled"';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for paused status validation
DROP TRIGGER IF EXISTS validate_client_paused_status_trigger ON clients;
CREATE TRIGGER validate_client_paused_status_trigger
  BEFORE UPDATE OF status ON clients
  FOR EACH ROW
  EXECUTE FUNCTION validate_client_paused_status();

-- =============================================================================
-- Add validation to prevent deleting contact assigned to engagement
-- =============================================================================

CREATE OR REPLACE FUNCTION validate_contact_deletion()
RETURNS TRIGGER AS $$
DECLARE
  v_contact_count INTEGER;
  v_is_primary BOOLEAN;
  v_engagement_count INTEGER;
BEGIN
  -- Get the contact's is_primary status
  v_is_primary := OLD.is_primary;

  -- Count remaining contacts for this client (excluding the one being deleted)
  SELECT COUNT(*) INTO v_contact_count
  FROM client_contacts
  WHERE client_id = OLD.client_id
    AND id != OLD.id;

  -- Prevent deleting the only contact
  IF v_contact_count = 0 THEN
    RAISE EXCEPTION 'Nelze smazat jediny kontakt klienta. Klient musi mit alespon jeden kontakt.'
      USING HINT = 'Pridejte novy kontakt pred smazanim tohoto';
  END IF;

  -- Prevent deleting primary contact if there are other contacts
  IF v_is_primary AND v_contact_count > 0 THEN
    RAISE EXCEPTION 'Nelze smazat primarni kontakt. Nejprve oznacte jiny kontakt jako primarni.'
      USING HINT = 'Upravte jiny kontakt a nastavte is_primary = true pred smazanim tohoto';
  END IF;

  -- NEW: Check if contact is assigned to any engagement
  SELECT COUNT(*) INTO v_engagement_count
  FROM engagements
  WHERE contact_person_id = OLD.id;

  IF v_engagement_count > 0 THEN
    RAISE EXCEPTION 'Nelze smazat kontakt prirazeny k % zakazkam. Nejprve zmente kontaktni osobu u zakazek.'
      , v_engagement_count
      USING HINT = 'Upravte zakazky a nastavte jinou kontaktni osobu pred smazanim tohoto kontaktu';
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- Add Creative Boost credits validation
-- =============================================================================

DO $$
BEGIN
  -- Only add constraint if engagement_services table has the columns
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'engagement_services'
    AND column_name = 'creative_boost_min_credits'
  ) THEN
    -- Drop existing constraint if exists
    ALTER TABLE engagement_services
    DROP CONSTRAINT IF EXISTS creative_boost_credits_order;

    -- Add constraint to ensure min <= max
    ALTER TABLE engagement_services
    ADD CONSTRAINT creative_boost_credits_order
    CHECK (
      creative_boost_min_credits IS NULL
      OR creative_boost_max_credits IS NULL
      OR creative_boost_min_credits <= creative_boost_max_credits
    );

    RAISE NOTICE 'Added creative_boost_credits_order constraint';
  END IF;
END $$;

-- =============================================================================
-- Success message
-- =============================================================================
DO $$
BEGIN
  RAISE NOTICE 'Successfully strengthened status validation:';
  RAISE NOTICE '  - Lost status now checks active, paused, and planned engagements';
  RAISE NOTICE '  - Added paused client validation (cannot pause with active engagements)';
  RAISE NOTICE '  - Contact deletion now checks engagement assignments';
  RAISE NOTICE '  - Added creative boost credits validation (min <= max)';
END $$;
