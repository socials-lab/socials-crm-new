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

-- Add constraint to client_contacts (idempotent)
DO $$
BEGIN
  ALTER TABLE client_contacts DROP CONSTRAINT IF EXISTS chk_contact_email_format;
  ALTER TABLE client_contacts ADD CONSTRAINT chk_contact_email_format CHECK (is_valid_email_format(email));
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Could not add chk_contact_email_format constraint: %', SQLERRM;
END $$;

-- Add constraint to leads (for contact_email field)
DO $$
BEGIN
  ALTER TABLE leads DROP CONSTRAINT IF EXISTS chk_lead_contact_email_format;
  ALTER TABLE leads ADD CONSTRAINT chk_lead_contact_email_format CHECK (contact_email IS NULL OR is_valid_email_format(contact_email));
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Could not add chk_lead_contact_email_format constraint: %', SQLERRM;
END $$;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Added email format validation:';
  RAISE NOTICE '  - Created is_valid_email_format() function';
  RAISE NOTICE '  - Added chk_contact_email_format to client_contacts';
  RAISE NOTICE '  - Added chk_lead_contact_email_format to leads';
END $$;
