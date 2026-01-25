-- ============================================
-- Add Length Constraints to client_contacts
-- ============================================
-- Issue #5: Database missing length constraints
-- Frontend enforces max lengths but database doesn't
-- ============================================

-- Add length constraints to client_contacts table
-- Using ALTER TABLE ADD CONSTRAINT for each field

-- Name: max 255 characters (matches frontend validation)
ALTER TABLE client_contacts
  ADD CONSTRAINT chk_contact_name_length
  CHECK (char_length(name) <= 255);

-- Position: max 100 characters (nullable field)
ALTER TABLE client_contacts
  ADD CONSTRAINT chk_contact_position_length
  CHECK (position IS NULL OR char_length(position) <= 100);

-- Email: max 320 characters (RFC 5321 max length for email)
ALTER TABLE client_contacts
  ADD CONSTRAINT chk_contact_email_length
  CHECK (email IS NULL OR char_length(email) <= 320);

-- Phone: max 50 characters
ALTER TABLE client_contacts
  ADD CONSTRAINT chk_contact_phone_length
  CHECK (phone IS NULL OR char_length(phone) <= 50);

-- Notes: max 2000 characters (matches frontend validation)
ALTER TABLE client_contacts
  ADD CONSTRAINT chk_contact_notes_length
  CHECK (char_length(COALESCE(notes, '')) <= 2000);

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
