-- ============================================
-- Fix primary contact uniqueness with soft-delete
-- ============================================
-- The unique index for primary contact originally ignored deleted_at.
-- Soft-deleted rows with is_primary = true could block setting
-- a new primary contact and lead to 409 conflicts.
-- ============================================

-- Cleanup: soft-deleted contacts must never stay primary
UPDATE client_contacts
SET is_primary = false, updated_at = NOW()
WHERE deleted_at IS NOT NULL
  AND is_primary = true;

-- Recreate index so uniqueness applies only to active contacts
DROP INDEX IF EXISTS idx_unique_primary_contact;
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_primary_contact
ON client_contacts (client_id)
WHERE is_primary = true
  AND deleted_at IS NULL;

-- Keep RPC resilient even if stale historical data appears
CREATE OR REPLACE FUNCTION public.set_contact_as_primary(p_contact_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_id UUID;
  v_contact_name TEXT;
  v_old_primary_name TEXT;
  v_old_primary_id UUID;
  v_lock_id BIGINT;
BEGIN
  SELECT client_id, name INTO v_client_id, v_contact_name
  FROM client_contacts
  WHERE id = p_contact_id
    AND deleted_at IS NULL;

  IF v_client_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Kontakt nebyl nalezen nebo byl smazán'
    );
  END IF;

  v_lock_id := hashtext(v_client_id::TEXT);
  PERFORM pg_advisory_xact_lock(v_lock_id);

  SELECT client_id, name INTO v_client_id, v_contact_name
  FROM client_contacts
  WHERE id = p_contact_id
    AND deleted_at IS NULL;

  IF v_client_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Kontakt byl změněn nebo smazán jiným uživatelem'
    );
  END IF;

  SELECT id, name INTO v_old_primary_id, v_old_primary_name
  FROM client_contacts
  WHERE client_id = v_client_id
    AND is_primary = true
  ORDER BY (deleted_at IS NULL) DESC, updated_at DESC NULLS LAST
  LIMIT 1;

  IF v_old_primary_id = p_contact_id THEN
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Kontakt je již primární',
      'contact_id', p_contact_id,
      'contact_name', v_contact_name
    );
  END IF;

  PERFORM set_config('app.primary_switch_in_progress', 'true', true);

  UPDATE client_contacts
  SET is_primary = false, updated_at = NOW()
  WHERE client_id = v_client_id
    AND is_primary = true;

  UPDATE client_contacts
  SET is_primary = true, updated_at = NOW()
  WHERE id = p_contact_id
    AND deleted_at IS NULL;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Primární kontakt byl změněn',
    'contact_id', p_contact_id,
    'contact_name', v_contact_name,
    'old_primary_id', v_old_primary_id,
    'old_primary_name', v_old_primary_name
  );
END;
$$;
