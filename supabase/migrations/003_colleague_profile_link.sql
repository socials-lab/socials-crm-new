-- ============================================
-- Sub-Plan 02 Fixes + Sub-Plan 03: Colleague-Profile Auto-Linking
-- ============================================

-- Trigger function to link colleague when profile is created
CREATE OR REPLACE FUNCTION link_colleague_to_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Find colleague with matching email and link
  UPDATE colleagues
  SET profile_id = NEW.id
  WHERE LOWER(email) = LOWER(NEW.email)
    AND profile_id IS NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on profile insert
CREATE TRIGGER on_profile_created_link_colleague
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION link_colleague_to_profile();

-- Backfill: Link existing colleagues to profiles by email
UPDATE colleagues c
SET profile_id = p.id
FROM profiles p
WHERE LOWER(c.email) = LOWER(p.email)
  AND c.profile_id IS NULL;
