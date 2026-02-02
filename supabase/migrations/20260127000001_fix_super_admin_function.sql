-- Migration: Fix is_user_super_admin() function
-- Bug: Was querying WHERE id = v_user_id instead of WHERE user_id = v_user_id
-- This caused ALL super admin checks to fail

CREATE OR REPLACE FUNCTION is_user_super_admin()
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
  v_is_super_admin BOOLEAN;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;

  -- Check user_roles table for super_admin status
  -- FIX: Changed from "WHERE id = v_user_id" to "WHERE user_id = v_user_id"
  SELECT is_super_admin INTO v_is_super_admin
  FROM user_roles
  WHERE user_id = v_user_id;

  RETURN COALESCE(v_is_super_admin, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
  RAISE NOTICE 'Fixed is_user_super_admin() function - now correctly queries user_id column';
END $$;
