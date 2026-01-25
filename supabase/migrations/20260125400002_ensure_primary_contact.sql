-- Migration: Ensure every client always has exactly one primary contact
-- This trigger:
-- 1. Prevents unchecking is_primary if it's the only primary
-- 2. Auto-promotes another contact if primary is being deleted
-- 3. Works with the existing deletion validation trigger

-- Function to ensure primary contact exists
CREATE OR REPLACE FUNCTION public.ensure_primary_contact()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_contact_count INTEGER;
  v_primary_count INTEGER;
  v_next_contact_id UUID;
BEGIN
  -- For UPDATE: If unchecking is_primary, ensure another contact becomes primary
  IF TG_OP = 'UPDATE' THEN
    IF OLD.is_primary = true AND NEW.is_primary = false THEN
      -- Check if there are other contacts for this client
      SELECT COUNT(*) INTO v_contact_count
      FROM client_contacts
      WHERE client_id = OLD.client_id AND id != OLD.id;

      IF v_contact_count = 0 THEN
        RAISE EXCEPTION 'Nelze odebrat primární status z jediného kontaktu klienta. Každý klient musí mít primární kontakt.';
      END IF;

      -- Auto-promote another contact to primary
      -- Prefer decision makers, then alphabetically by name
      SELECT id INTO v_next_contact_id
      FROM client_contacts
      WHERE client_id = OLD.client_id AND id != OLD.id
      ORDER BY is_decision_maker DESC, name ASC
      LIMIT 1;

      IF v_next_contact_id IS NOT NULL THEN
        UPDATE client_contacts
        SET is_primary = true, updated_at = NOW()
        WHERE id = v_next_contact_id;
      END IF;
    END IF;
  END IF;

  -- For DELETE: If deleting primary, auto-promote another (if allowed by deletion validation)
  IF TG_OP = 'DELETE' THEN
    IF OLD.is_primary = true THEN
      -- The deletion validation trigger runs BEFORE DELETE and will block if necessary
      -- If we get here, it means deletion was allowed, so we just need to promote another

      -- Check if there are other contacts
      SELECT COUNT(*) INTO v_contact_count
      FROM client_contacts
      WHERE client_id = OLD.client_id AND id != OLD.id;

      IF v_contact_count > 0 THEN
        -- Auto-promote another contact
        SELECT id INTO v_next_contact_id
        FROM client_contacts
        WHERE client_id = OLD.client_id AND id != OLD.id
        ORDER BY is_decision_maker DESC, name ASC
        LIMIT 1;

        IF v_next_contact_id IS NOT NULL THEN
          UPDATE client_contacts
          SET is_primary = true, updated_at = NOW()
          WHERE id = v_next_contact_id;
        END IF;
      END IF;
    END IF;

    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for UPDATE operations
DROP TRIGGER IF EXISTS trg_ensure_primary_contact_update ON client_contacts;
CREATE TRIGGER trg_ensure_primary_contact_update
  BEFORE UPDATE ON client_contacts
  FOR EACH ROW
  EXECUTE FUNCTION ensure_primary_contact();

-- Create trigger for DELETE operations (runs AFTER the deletion validation)
DROP TRIGGER IF EXISTS trg_ensure_primary_contact_delete ON client_contacts;
CREATE TRIGGER trg_ensure_primary_contact_delete
  AFTER DELETE ON client_contacts
  FOR EACH ROW
  EXECUTE FUNCTION ensure_primary_contact();

COMMENT ON FUNCTION public.ensure_primary_contact IS 'Ensures every client always has a primary contact. Auto-promotes another contact when primary is unchecked or deleted.';
