-- ============================================
-- Fix set_contact_as_primary Soft-Delete Filter
-- ============================================
-- Issue #7: set_contact_as_primary doesn't filter soft-deleted
-- A soft-deleted contact could theoretically be set as primary
-- ============================================

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
BEGIN
  -- Get the contact's client_id and name (only non-deleted contacts)
  SELECT client_id, name INTO v_client_id, v_contact_name
  FROM client_contacts
  WHERE id = p_contact_id AND deleted_at IS NULL;

  -- Check contact exists and is not deleted
  IF v_client_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Kontakt nebyl nalezen nebo byl smazán'
    );
  END IF;

  -- Find current primary contact (only non-deleted)
  SELECT id, name INTO v_old_primary_id, v_old_primary_name
  FROM client_contacts
  WHERE client_id = v_client_id
    AND is_primary = true
    AND deleted_at IS NULL;

  -- If already primary, nothing to do
  IF v_old_primary_id = p_contact_id THEN
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Kontakt je již primární',
      'contact_id', p_contact_id,
      'contact_name', v_contact_name
    );
  END IF;

  -- Unset primary on all non-deleted contacts for this client
  UPDATE client_contacts
  SET is_primary = false, updated_at = NOW()
  WHERE client_id = v_client_id
    AND is_primary = true
    AND deleted_at IS NULL;

  -- Set the target contact as primary (only if not deleted)
  UPDATE client_contacts
  SET is_primary = true, updated_at = NOW()
  WHERE id = p_contact_id AND deleted_at IS NULL;

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

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Updated set_contact_as_primary to filter soft-deleted contacts';
END $$;
