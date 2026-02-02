-- Migration: Add missing database constraints for data integrity

-- =============================================================================
-- STEP 1: Validate contact belongs to client
-- =============================================================================

CREATE OR REPLACE FUNCTION validate_engagement_contact()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.contact_person_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM client_contacts
      WHERE id = NEW.contact_person_id
        AND client_id = NEW.client_id
        AND deleted_at IS NULL
    ) THEN
      RAISE EXCEPTION 'Contact person must belong to the engagement client'
        USING HINT = 'The selected contact is not associated with this client';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_engagement_contact_trigger ON engagements;
CREATE TRIGGER validate_engagement_contact_trigger
BEFORE INSERT OR UPDATE ON engagements
FOR EACH ROW EXECUTE FUNCTION validate_engagement_contact();

-- =============================================================================
-- STEP 2: Add CHECK constraints
-- =============================================================================

-- Notice period must be non-negative
DO $$
BEGIN
  ALTER TABLE engagements DROP CONSTRAINT IF EXISTS positive_notice_period;
  ALTER TABLE engagements ADD CONSTRAINT positive_notice_period
    CHECK (notice_period_months IS NULL OR notice_period_months >= 0);
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Could not add positive_notice_period constraint: %', SQLERRM;
END $$;

-- End date must be after start date
DO $$
BEGIN
  ALTER TABLE engagements DROP CONSTRAINT IF EXISTS valid_date_range;
  ALTER TABLE engagements ADD CONSTRAINT valid_date_range
    CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date);
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Could not add valid_date_range constraint: %', SQLERRM;
END $$;

-- Prices must be non-negative
DO $$
BEGIN
  ALTER TABLE engagement_services DROP CONSTRAINT IF EXISTS positive_price;
  ALTER TABLE engagement_services ADD CONSTRAINT positive_price
    CHECK (price >= 0);
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Could not add positive_price constraint: %', SQLERRM;
END $$;

DO $$
BEGIN
  ALTER TABLE engagement_services DROP CONSTRAINT IF EXISTS positive_credit_price;
  ALTER TABLE engagement_services ADD CONSTRAINT positive_credit_price
    CHECK (creative_boost_price_per_credit IS NULL OR creative_boost_price_per_credit >= 0);
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Could not add positive_credit_price constraint: %', SQLERRM;
END $$;

-- Creative Boost min <= max credits
DO $$
BEGIN
  ALTER TABLE engagement_services DROP CONSTRAINT IF EXISTS valid_credit_range;
  ALTER TABLE engagement_services ADD CONSTRAINT valid_credit_range
    CHECK (
      creative_boost_min_credits IS NULL OR
      creative_boost_max_credits IS NULL OR
      creative_boost_min_credits <= creative_boost_max_credits
    );
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Could not add valid_credit_range constraint: %', SQLERRM;
END $$;

-- =============================================================================
-- STEP 3: Add indexes for performance
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_engagements_client_status
ON engagements(client_id, status)
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_engagements_contact
ON engagements(contact_person_id)
WHERE contact_person_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_engagement_services_engagement
ON engagement_services(engagement_id, is_active);

CREATE INDEX IF NOT EXISTS idx_engagement_assignments_engagement
ON engagement_assignments(engagement_id)
WHERE end_date IS NULL;

-- =============================================================================
-- STEP 4: Prevent adding services/assignments to completed engagements
-- =============================================================================

CREATE OR REPLACE FUNCTION validate_engagement_not_completed()
RETURNS TRIGGER AS $$
DECLARE
  v_engagement_status TEXT;
BEGIN
  SELECT status INTO v_engagement_status
  FROM engagements
  WHERE id = NEW.engagement_id;

  IF v_engagement_status IN ('completed', 'cancelled') THEN
    RAISE EXCEPTION 'Cannot add items to a % engagement', v_engagement_status
      USING HINT = 'Reopen the engagement first before adding services or assignments';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- For engagement_services
DROP TRIGGER IF EXISTS validate_service_engagement_status ON engagement_services;
CREATE TRIGGER validate_service_engagement_status
BEFORE INSERT ON engagement_services
FOR EACH ROW EXECUTE FUNCTION validate_engagement_not_completed();

-- For engagement_assignments
DROP TRIGGER IF EXISTS validate_assignment_engagement_status ON engagement_assignments;
CREATE TRIGGER validate_assignment_engagement_status
BEFORE INSERT ON engagement_assignments
FOR EACH ROW EXECUTE FUNCTION validate_engagement_not_completed();

DO $$
BEGIN
  RAISE NOTICE 'Added database constraints and indexes:';
  RAISE NOTICE '  - Contact-client validation trigger';
  RAISE NOTICE '  - CHECK constraints for dates and prices';
  RAISE NOTICE '  - Performance indexes';
  RAISE NOTICE '  - Service/assignment status validation';
END $$;
