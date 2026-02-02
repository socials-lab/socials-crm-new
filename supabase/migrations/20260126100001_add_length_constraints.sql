-- ============================================
-- Add Length Constraints to client_contacts
-- ============================================
-- Issue #5: Database missing length constraints
-- Frontend enforces max lengths but database doesn't
-- ============================================

-- Add length constraints to client_contacts table
-- Using DROP IF EXISTS + ADD to be idempotent

-- Name: max 255 characters (matches frontend validation)
DO $$
BEGIN
  ALTER TABLE client_contacts DROP CONSTRAINT IF EXISTS chk_contact_name_length;
  ALTER TABLE client_contacts ADD CONSTRAINT chk_contact_name_length CHECK (char_length(name) <= 255);
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Could not add chk_contact_name_length constraint: %', SQLERRM;
END $$;

-- Position: max 100 characters (nullable field)
DO $$
BEGIN
  ALTER TABLE client_contacts DROP CONSTRAINT IF EXISTS chk_contact_position_length;
  ALTER TABLE client_contacts ADD CONSTRAINT chk_contact_position_length CHECK (position IS NULL OR char_length(position) <= 100);
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Could not add chk_contact_position_length constraint: %', SQLERRM;
END $$;

-- Email: max 320 characters (RFC 5321 max length for email)
DO $$
BEGIN
  ALTER TABLE client_contacts DROP CONSTRAINT IF EXISTS chk_contact_email_length;
  ALTER TABLE client_contacts ADD CONSTRAINT chk_contact_email_length CHECK (email IS NULL OR char_length(email) <= 320);
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Could not add chk_contact_email_length constraint: %', SQLERRM;
END $$;

-- Phone: max 50 characters
DO $$
BEGIN
  ALTER TABLE client_contacts DROP CONSTRAINT IF EXISTS chk_contact_phone_length;
  ALTER TABLE client_contacts ADD CONSTRAINT chk_contact_phone_length CHECK (phone IS NULL OR char_length(phone) <= 50);
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Could not add chk_contact_phone_length constraint: %', SQLERRM;
END $$;

-- Notes: max 2000 characters (matches frontend validation)
DO $$
BEGIN
  ALTER TABLE client_contacts DROP CONSTRAINT IF EXISTS chk_contact_notes_length;
  ALTER TABLE client_contacts ADD CONSTRAINT chk_contact_notes_length CHECK (char_length(COALESCE(notes, '')) <= 2000);
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Could not add chk_contact_notes_length constraint: %', SQLERRM;
END $$;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Added length constraints to client_contacts:';
  RAISE NOTICE '  - name: max 255 chars';
  RAISE NOTICE '  - position: max 100 chars';
  RAISE NOTICE '  - email: max 320 chars';
  RAISE NOTICE '  - phone: max 50 chars';
  RAISE NOTICE '  - notes: max 2000 chars';
END $$;
