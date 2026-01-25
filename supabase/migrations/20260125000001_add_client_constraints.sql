-- Migration: Add UNIQUE constraints on clients.ico and clients.fakturoid_subject_id
-- Also adds date ordering constraints

-- =============================================================================
-- STEP 1: Check for duplicate IČO records
-- This will FAIL the migration if duplicates exist, requiring manual resolution
-- =============================================================================
DO $$
DECLARE
  dup_count INTEGER;
  dup_list TEXT;
BEGIN
  SELECT COUNT(*), string_agg(ico || ' (IDs: ' || ids || ')', E'\n')
  INTO dup_count, dup_list
  FROM (
    SELECT ico, string_agg(id::text, ', ') as ids
    FROM clients
    WHERE ico IS NOT NULL AND ico != ''
    GROUP BY ico
    HAVING COUNT(*) > 1
  ) duplicates;

  IF dup_count > 0 THEN
    RAISE EXCEPTION E'MIGRATION BLOCKED: Found % duplicate IČO records.\n\nFix manually before proceeding:\n%', dup_count, dup_list;
  END IF;
END $$;

-- =============================================================================
-- STEP 2: Check for duplicate Fakturoid subject IDs
-- =============================================================================
DO $$
DECLARE
  dup_count INTEGER;
  dup_list TEXT;
BEGIN
  SELECT COUNT(*), string_agg(fakturoid_subject_id::text || ' (IDs: ' || ids || ')', E'\n')
  INTO dup_count, dup_list
  FROM (
    SELECT fakturoid_subject_id, string_agg(id::text, ', ') as ids
    FROM clients
    WHERE fakturoid_subject_id IS NOT NULL
    GROUP BY fakturoid_subject_id
    HAVING COUNT(*) > 1
  ) duplicates;

  IF dup_count > 0 THEN
    RAISE EXCEPTION E'MIGRATION BLOCKED: Found % duplicate Fakturoid subject IDs.\n\nFix manually before proceeding:\n%', dup_count, dup_list;
  END IF;
END $$;

-- =============================================================================
-- STEP 3: Add UNIQUE constraint on clients.ico
-- =============================================================================
ALTER TABLE clients ADD CONSTRAINT clients_ico_unique UNIQUE (ico);

-- =============================================================================
-- STEP 4: Add UNIQUE constraint on clients.fakturoid_subject_id (partial - only non-null)
-- =============================================================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_fakturoid_subject_id_unique
ON clients(fakturoid_subject_id)
WHERE fakturoid_subject_id IS NOT NULL;

-- =============================================================================
-- STEP 5: Add date ordering constraints
-- =============================================================================

-- Check for invalid dates in clients before adding constraint
DO $$
DECLARE
  invalid_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO invalid_count
  FROM clients
  WHERE end_date IS NOT NULL AND start_date IS NOT NULL AND start_date > end_date;

  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'MIGRATION BLOCKED: Found % clients with end_date before start_date. Fix manually.', invalid_count;
  END IF;
END $$;

ALTER TABLE clients ADD CONSTRAINT clients_date_order
  CHECK (end_date IS NULL OR start_date IS NULL OR start_date <= end_date);

-- Check for invalid dates in engagements before adding constraint
DO $$
DECLARE
  invalid_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO invalid_count
  FROM engagements
  WHERE end_date IS NOT NULL AND start_date IS NOT NULL AND start_date > end_date;

  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'MIGRATION BLOCKED: Found % engagements with end_date before start_date. Fix manually.', invalid_count;
  END IF;
END $$;

ALTER TABLE engagements ADD CONSTRAINT engagements_date_order
  CHECK (end_date IS NULL OR start_date IS NULL OR start_date <= end_date);

-- Check for invalid dates in engagement_assignments before adding constraint
DO $$
DECLARE
  invalid_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO invalid_count
  FROM engagement_assignments
  WHERE end_date IS NOT NULL AND start_date IS NOT NULL AND start_date > end_date;

  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'MIGRATION BLOCKED: Found % assignments with end_date before start_date. Fix manually.', invalid_count;
  END IF;
END $$;

ALTER TABLE engagement_assignments ADD CONSTRAINT assignments_date_order
  CHECK (end_date IS NULL OR start_date IS NULL OR start_date <= end_date);

-- =============================================================================
-- Success message
-- =============================================================================
DO $$
BEGIN
  RAISE NOTICE 'Successfully added constraints:';
  RAISE NOTICE '  - clients_ico_unique (UNIQUE on ico)';
  RAISE NOTICE '  - idx_clients_fakturoid_subject_id_unique (UNIQUE on fakturoid_subject_id)';
  RAISE NOTICE '  - clients_date_order (CHECK start_date <= end_date)';
  RAISE NOTICE '  - engagements_date_order (CHECK start_date <= end_date)';
  RAISE NOTICE '  - assignments_date_order (CHECK start_date <= end_date)';
END $$;
