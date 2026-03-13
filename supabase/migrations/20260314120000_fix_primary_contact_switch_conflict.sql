-- ============================================
-- Fix primary contact switch conflict (409)
-- ============================================
-- Root cause:
-- - set_contact_as_primary() first unsets the current primary contact
-- - ensure_primary_contact() BEFORE UPDATE trigger auto-promotes another row
-- - then set_contact_as_primary() sets target row to primary
-- - this can violate unique index idx_unique_primary_contact and return 409
--
-- Fix:
-- 1) set_contact_as_primary() sets a transaction-local switch flag
-- 2) ensure_primary_contact() skips auto-promotion while switch is in progress
-- 3) add advisory lock to serialize concurrent primary switches per client
-- ============================================

CREATE OR REPLACE FUNCTION public.ensure_primary_contact()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_contact_count INTEGER;
  v_next_contact_id UUID;
  v_primary_switch_in_progress BOOLEAN;
BEGIN
  -- During atomic primary switch RPC, do not auto-promote from this trigger.
  -- The RPC handles the full transition in one transaction.
  v_primary_switch_in_progress := COALESCE(current_setting('app.primary_switch_in_progress', true), 'false') = 'true';
  IF v_primary_switch_in_progress THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    END IF;
    RETURN NEW;
  END IF;

  -- For UPDATE: If unchecking is_primary, ensure another active contact becomes primary
  IF TG_OP = 'UPDATE' THEN
    IF OLD.is_primary = true AND NEW.is_primary = false THEN
      -- Check if there are other active contacts for this client
      SELECT COUNT(*) INTO v_contact_count
      FROM client_contacts
      WHERE client_id = OLD.client_id
        AND id != OLD.id
        AND deleted_at IS NULL;

      IF v_contact_count = 0 THEN
        RAISE EXCEPTION 'Nelze odebrat primární status z jediného kontaktu klienta. Každý klient musí mít primární kontakt.';
      END IF;

      -- Auto-promote another active contact to primary
      SELECT id INTO v_next_contact_id
      FROM client_contacts
      WHERE client_id = OLD.client_id
        AND id != OLD.id
        AND deleted_at IS NULL
      ORDER BY is_decision_maker DESC, name ASC
      LIMIT 1;

      IF v_next_contact_id IS NOT NULL THEN
        UPDATE client_contacts
        SET is_primary = true, updated_at = NOW()
        WHERE id = v_next_contact_id;
      END IF;
    END IF;
  END IF;

  -- For DELETE: If deleting primary, auto-promote another active contact
  IF TG_OP = 'DELETE' THEN
    IF OLD.is_primary = true THEN
      SELECT COUNT(*) INTO v_contact_count
      FROM client_contacts
      WHERE client_id = OLD.client_id
        AND id != OLD.id
        AND deleted_at IS NULL;

      IF v_contact_count > 0 THEN
        SELECT id INTO v_next_contact_id
        FROM client_contacts
        WHERE client_id = OLD.client_id
          AND id != OLD.id
          AND deleted_at IS NULL
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
  -- Get the target contact first (active contacts only)
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

  -- Serialize primary switch operations per client
  v_lock_id := hashtext(v_client_id::TEXT);
  PERFORM pg_advisory_xact_lock(v_lock_id);

  -- Re-check after lock
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

  -- Find current primary contact (prefer active row for response metadata)
  SELECT id, name INTO v_old_primary_id, v_old_primary_name
  FROM client_contacts
  WHERE client_id = v_client_id
    AND is_primary = true
  ORDER BY (deleted_at IS NULL) DESC, updated_at DESC NULLS LAST
  LIMIT 1;

  -- If already primary, nothing to do
  IF v_old_primary_id = p_contact_id THEN
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Kontakt je již primární',
      'contact_id', p_contact_id,
      'contact_name', v_contact_name
    );
  END IF;

  -- Inform trigger this transaction is performing an atomic primary switch
  PERFORM set_config('app.primary_switch_in_progress', 'true', true);

  -- Unset previous primary contacts for the same client.
  -- Includes soft-deleted rows to avoid conflicts with unique index
  -- idx_unique_primary_contact, which does not filter deleted_at.
  UPDATE client_contacts
  SET is_primary = false, updated_at = NOW()
  WHERE client_id = v_client_id
    AND is_primary = true;

  -- Set target contact as primary
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
