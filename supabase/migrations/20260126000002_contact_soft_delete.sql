-- ============================================
-- Contact Soft Delete Implementation
-- ============================================
-- Add soft-delete capability to client_contacts table
-- for audit trail consistency with clients table.
-- ============================================

-- Add soft-delete column
ALTER TABLE client_contacts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Create index for filtering deleted contacts
CREATE INDEX IF NOT EXISTS idx_client_contacts_deleted_at ON client_contacts(deleted_at);

-- Create soft-delete function for contacts
CREATE OR REPLACE FUNCTION soft_delete_contact(p_contact_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_contact RECORD;
  v_contact_count INTEGER;
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

-- Update the SELECT policy to filter out soft-deleted contacts
-- Drop both possible policy names to handle existing installations
DROP POLICY IF EXISTS "Users can view contacts for accessible clients" ON client_contacts;
DROP POLICY IF EXISTS "CRM users can view client contacts" ON client_contacts;

CREATE POLICY "CRM users can view client contacts"
  ON client_contacts FOR SELECT
  USING (
    deleted_at IS NULL AND
    (
      has_full_client_access(auth.uid()) OR
      is_assigned_to_client(auth.uid(), client_id)
    )
  );

-- Update the validate_contact_deletion trigger to account for soft-delete
CREATE OR REPLACE FUNCTION validate_contact_deletion()
RETURNS TRIGGER AS $$
DECLARE
  v_contact_count INTEGER;
  v_is_primary BOOLEAN;
BEGIN
  -- Get the primary status
  v_is_primary := OLD.is_primary;

  -- Count remaining contacts for this client (excluding soft-deleted and the one being deleted)
  SELECT COUNT(*) INTO v_contact_count
  FROM client_contacts
  WHERE client_id = OLD.client_id
    AND id != OLD.id
    AND deleted_at IS NULL;

  -- Prevent deleting the only contact
  IF v_contact_count = 0 THEN
    RAISE EXCEPTION 'Nelze smazat jediný kontakt klienta. Klient musí mít alespoň jeden kontakt.';
  END IF;

  -- Prevent deleting primary contact if there are other contacts
  IF v_is_primary AND v_contact_count > 0 THEN
    RAISE EXCEPTION 'Nelze smazat primární kontakt. Nejprve nastavte jiný kontakt jako primární.';
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Update contact-related queries to exclude soft-deleted
-- Note: The existing fetch queries in the frontend already filter via the RLS policy
