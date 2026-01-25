-- Migration: Make email required for contacts
-- This is a two-step process:
-- 1. First, identify and fix contacts without emails
-- 2. Then add the NOT NULL constraint

-- Step 1: Report contacts without emails (logged for review)
DO $$
DECLARE
  v_count INTEGER;
  v_contact RECORD;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM client_contacts
  WHERE email IS NULL OR email = '';

  IF v_count > 0 THEN
    RAISE NOTICE 'Found % contacts without email addresses:', v_count;

    FOR v_contact IN
      SELECT cc.id, cc.name, c.name as client_name, c.brand_name
      FROM client_contacts cc
      JOIN clients c ON c.id = cc.client_id
      WHERE cc.email IS NULL OR cc.email = ''
    LOOP
      RAISE NOTICE '  - Contact: % (Client: % / %)', v_contact.name, v_contact.brand_name, v_contact.client_name;
    END LOOP;

    -- For now, we'll set a placeholder email that can be updated later
    -- Format: contact_[id]@needs-update.local
    UPDATE client_contacts
    SET email = 'contact_' || LEFT(id::text, 8) || '@needs-update.local',
        notes = COALESCE(notes, '') || E'\n[Auto-generated email - please update with real email address]'
    WHERE email IS NULL OR email = '';

    RAISE NOTICE 'Placeholder emails have been set. Please update with real email addresses.';
  ELSE
    RAISE NOTICE 'All contacts already have email addresses.';
  END IF;
END $$;

-- Step 2: Add NOT NULL constraint
ALTER TABLE client_contacts
ALTER COLUMN email SET NOT NULL;

-- Step 3: Add a check constraint for non-empty email
ALTER TABLE client_contacts
ADD CONSTRAINT chk_contact_email_not_empty
CHECK (email IS NOT NULL AND email != '');

COMMENT ON COLUMN client_contacts.email IS 'Contact email address (required). Used for Freelo, DigiSign, and other integrations.';
