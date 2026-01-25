-- ============================================
-- Fix Soft-Delete Engagement Reference Check
-- ============================================
-- Issue #1: Soft-delete bypasses engagement reference check
-- Contacts referenced by engagements can be soft-deleted
-- ============================================

-- Update soft_delete_contact function to check engagement references
CREATE OR REPLACE FUNCTION soft_delete_contact(p_contact_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_contact RECORD;
  v_contact_count INTEGER;
  v_engagement_count INTEGER;
BEGIN
  -- Get the contact
  SELECT * INTO v_contact
  FROM client_contacts
  WHERE id = p_contact_id AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Kontakt nebyl nalezen nebo již byl smazán'
    );
  END IF;

  -- Count remaining contacts for this client (excluding the one being deleted)
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

  -- NEW: Check if contact is referenced by any engagement
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
  RAISE NOTICE 'Updated soft_delete_contact to check engagement references';
END $$;
