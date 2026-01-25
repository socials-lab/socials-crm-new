-- Migration: Add advisory lock RPC function for Fakturoid race condition prevention
-- Uses PostgreSQL advisory locks to prevent concurrent subject creation

-- =============================================================================
-- Create RPC function for advisory lock
-- =============================================================================

CREATE OR REPLACE FUNCTION acquire_client_lock(p_client_id UUID)
RETURNS void AS $$
DECLARE
  v_lock_key BIGINT;
BEGIN
  -- Convert UUID to a bigint for the advisory lock
  -- Use hashtext on the UUID string for consistent hashing
  v_lock_key := hashtext(p_client_id::TEXT);

  -- Acquire transaction-level advisory lock
  -- This lock is automatically released at the end of the transaction
  PERFORM pg_advisory_xact_lock(v_lock_key);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION acquire_client_lock(UUID) TO authenticated;

-- =============================================================================
-- Create function to safely create Fakturoid subject with lock
-- =============================================================================

CREATE OR REPLACE FUNCTION try_set_fakturoid_subject_id(
  p_client_id UUID,
  p_fakturoid_subject_id BIGINT
)
RETURNS TABLE (
  success BOOLEAN,
  existing_subject_id BIGINT
) AS $$
DECLARE
  v_lock_key BIGINT;
  v_existing_id BIGINT;
BEGIN
  -- Acquire lock first
  v_lock_key := hashtext(p_client_id::TEXT);
  PERFORM pg_advisory_xact_lock(v_lock_key);

  -- Check if subject already exists (double-check pattern)
  SELECT fakturoid_subject_id INTO v_existing_id
  FROM clients
  WHERE id = p_client_id;

  IF v_existing_id IS NOT NULL THEN
    -- Subject already exists, return existing ID
    RETURN QUERY SELECT FALSE, v_existing_id;
    RETURN;
  END IF;

  -- Safe to update
  UPDATE clients
  SET fakturoid_subject_id = p_fakturoid_subject_id,
      updated_at = NOW()
  WHERE id = p_client_id
    AND fakturoid_subject_id IS NULL;

  IF FOUND THEN
    RETURN QUERY SELECT TRUE, p_fakturoid_subject_id;
  ELSE
    -- Another concurrent request updated it between our check and update
    SELECT fakturoid_subject_id INTO v_existing_id
    FROM clients
    WHERE id = p_client_id;

    RETURN QUERY SELECT FALSE, v_existing_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION try_set_fakturoid_subject_id(UUID, BIGINT) TO authenticated;

-- =============================================================================
-- Success message
-- =============================================================================
DO $$
BEGIN
  RAISE NOTICE 'Successfully created advisory lock functions for Fakturoid integration';
  RAISE NOTICE '  - acquire_client_lock(UUID): Acquires transaction-level advisory lock';
  RAISE NOTICE '  - try_set_fakturoid_subject_id(UUID, BIGINT): Safely sets subject ID with double-check';
END $$;
