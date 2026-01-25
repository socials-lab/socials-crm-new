-- ============================================
-- Add Email Format Validation
-- ============================================
-- Issue #6: Email format not validated in database
-- Uses basic format check: something@something.something
-- ============================================

-- Create reusable email validation function
CREATE OR REPLACE FUNCTION is_valid_email_format(email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- NULL is valid (nullable field)
  IF email IS NULL THEN
    RETURN TRUE;
  END IF;

  -- Empty string is valid (handled by other constraint)
  IF email = '' THEN
    RETURN TRUE;
  END IF;

  -- Basic format: at least one char before @, at least one char after @,
  -- then a dot, then at least one char after the dot
  -- This is intentionally permissive per user decision
  RETURN email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add constraint to client_contacts
ALTER TABLE client_contacts
  ADD CONSTRAINT chk_contact_email_format
  CHECK (is_valid_email_format(email));

-- Add constraint to leads (for contact_email field)
-- First check if the constraint doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_lead_contact_email_format'
  ) THEN
    ALTER TABLE leads
      ADD CONSTRAINT chk_lead_contact_email_format
      CHECK (contact_email IS NULL OR is_valid_email_format(contact_email));
  END IF;
END $$;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Added email format validation:';
  RAISE NOTICE '  - Created is_valid_email_format() function';
  RAISE NOTICE '  - Added chk_contact_email_format to client_contacts';
  RAISE NOTICE '  - Added chk_lead_contact_email_format to leads';
END $$;
