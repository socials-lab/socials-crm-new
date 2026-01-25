-- Migration: Atomic RPC function to set a contact as primary
-- This function atomically:
-- 1. Unsets all primary contacts for the client
-- 2. Sets the target contact as primary
-- All in a single transaction to prevent race conditions

CREATE OR REPLACE FUNCTION public.set_contact_as_primary(
  p_contact_id UUID
)
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
  -- Get the contact's client_id and name
  SELECT client_id, name INTO v_client_id, v_contact_name
  FROM client_contacts
  WHERE id = p_contact_id;

  -- Check contact exists
  IF v_client_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Kontakt nebyl nalezen'
    );
  END IF;

  -- Find current primary contact (if any)
  SELECT id, name INTO v_old_primary_id, v_old_primary_name
  FROM client_contacts
  WHERE client_id = v_client_id AND is_primary = true;

  -- If already primary, nothing to do
  IF v_old_primary_id = p_contact_id THEN
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Kontakt je již primární',
      'contact_id', p_contact_id,
      'contact_name', v_contact_name
    );
  END IF;

  -- Unset primary on all contacts for this client
  UPDATE client_contacts
  SET is_primary = false, updated_at = NOW()
  WHERE client_id = v_client_id AND is_primary = true;

  -- Set the target contact as primary
  UPDATE client_contacts
  SET is_primary = true, updated_at = NOW()
  WHERE id = p_contact_id;

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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.set_contact_as_primary(UUID) TO authenticated;

COMMENT ON FUNCTION public.set_contact_as_primary IS 'Atomically sets a contact as primary, unsetting any existing primary contact for the same client.';
