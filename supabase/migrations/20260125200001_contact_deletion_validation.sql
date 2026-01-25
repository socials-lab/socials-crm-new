-- Migration: Server-side validation for contact deletion
-- Prevents deleting primary contacts or the last contact for a client

-- =============================================================================
-- Create trigger function to validate contact deletion
-- =============================================================================

CREATE OR REPLACE FUNCTION validate_contact_deletion()
RETURNS TRIGGER AS $$
DECLARE
  v_contact_count INTEGER;
  v_is_primary BOOLEAN;
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
    RAISE EXCEPTION 'Nelze smazat jediný kontakt klienta. Klient musí mít alespoň jeden kontakt.'
      USING HINT = 'Přidejte nový kontakt před smazáním tohoto';
  END IF;

  -- Prevent deleting primary contact if there are other contacts
  IF v_is_primary AND v_contact_count > 0 THEN
    RAISE EXCEPTION 'Nelze smazat primární kontakt. Nejprve označte jiný kontakt jako primární.'
      USING HINT = 'Upravte jiný kontakt a nastavte is_primary = true před smazáním tohoto';
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- Create the trigger
-- =============================================================================

DROP TRIGGER IF EXISTS validate_contact_deletion_trigger ON client_contacts;
CREATE TRIGGER validate_contact_deletion_trigger
  BEFORE DELETE ON client_contacts
  FOR EACH ROW
  EXECUTE FUNCTION validate_contact_deletion();

-- =============================================================================
-- Success message
-- =============================================================================
DO $$
BEGIN
  RAISE NOTICE 'Successfully created contact deletion validation trigger';
  RAISE NOTICE '  - Prevents deleting the only contact for a client';
  RAISE NOTICE '  - Prevents deleting primary contact without reassigning';
END $$;
