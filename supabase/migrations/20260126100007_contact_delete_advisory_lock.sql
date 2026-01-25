-- ============================================
-- Add Advisory Lock to Prevent Race Conditions
-- ============================================
-- Issue #2: Race condition - two users can delete all contacts
-- Without locking, concurrent deletions can bypass the
-- "at least one contact" validation
-- ============================================

-- Update soft_delete_contact to use advisory lock
CREATE OR REPLACE FUNCTION soft_delete_contact(p_contact_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_contact RECORD;
  v_contact_count INTEGER;
  v_engagement_count INTEGER;
  v_lock_id BIGINT;
BEGIN
  -- Get the contact first to get client_id
  SELECT * INTO v_contact
  FROM client_contacts
  WHERE id = p_contact_id AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Kontakt nebyl nalezen nebo již byl smazán'
    );
  END IF;

  -- Acquire advisory lock based on client_id to prevent concurrent deletions
  -- Use hashtext to convert UUID to bigint for pg_advisory_xact_lock
  v_lock_id := hashtext(v_contact.client_id::TEXT);
  PERFORM pg_advisory_xact_lock(v_lock_id);

  -- Re-check contact still exists after acquiring lock
  -- (another transaction may have deleted it while we waited)
  SELECT * INTO v_contact
  FROM client_contacts
  WHERE id = p_contact_id AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Kontakt byl smazán jiným uživatelem'
    );
  END IF;

  -- Count remaining contacts for this client (with lock held)
  SELECT COUNT(*) INTO v_contact_count
  FROM client_contacts
  WHERE client_id = v_contact.client_id
    AND id != p_contact_id
    AND deleted_at IS NULL;

  -- Prevent deleting the only contact
  IF v_contact_count = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Nelze smazat jediný kontakt klienta. Klient musí mít alespoň jeden kontakt.'
    );
  END IF;

  -- Prevent deleting primary contact if there are other contacts
  IF v_contact.is_primary AND v_contact_count > 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Nelze smazat primární kontakt. Nejprve nastavte jiný kontakt jako primární.'
    );
  END IF;

  -- Check if contact is referenced by any engagement
  SELECT COUNT(*) INTO v_engagement_count
  FROM engagements
  WHERE contact_person_id = p_contact_id;

  IF v_engagement_count > 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Kontakt nelze smazat, protože je přiřazen k %s zakázce/zakázkám.', v_engagement_count)
    );
  END IF;

  -- Perform soft delete
  UPDATE client_contacts
  SET deleted_at = NOW(),
      updated_at = NOW()
  WHERE id = p_contact_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Kontakt byl smazán'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Updated soft_delete_contact with advisory lock:';
  RAISE NOTICE '  - Prevents race condition when multiple users delete contacts';
  RAISE NOTICE '  - Lock is scoped to client_id for minimal contention';
END $$;
