-- ============================================
-- Bootstrap Super Admin User
-- ============================================
-- This script creates a super admin user in the user_roles table
-- 
-- Usage:
-- 1. Replace YOUR_USER_EMAIL with your actual email
-- 2. Run this in Supabase Dashboard SQL Editor
-- 
-- Or use Supabase CLI:
-- supabase db execute -f bootstrap-admin.sql
-- ============================================

-- First, find your user ID by email
-- Replace 'YOUR_USER_EMAIL' with your actual email address
DO $$
DECLARE
  user_uuid UUID;
  user_email TEXT := 'YOUR_USER_EMAIL'; -- CHANGE THIS
BEGIN
  -- Get user ID from auth.users
  SELECT id INTO user_uuid
  FROM auth.users
  WHERE email = user_email;
  
  IF user_uuid IS NULL THEN
    RAISE EXCEPTION 'User with email % not found. Please sign up first or use correct email.', user_email;
  END IF;
  
  -- Insert or update user role as super admin
  INSERT INTO user_roles (user_id, role, is_super_admin, can_see_financials, is_active, page_permissions)
  VALUES (
    user_uuid,
    'admin',
    true,
    true,
    true,
    '[]'::jsonb
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    role = 'admin',
    is_super_admin = true,
    can_see_financials = true,
    is_active = true,
    updated_at = NOW();
  
  RAISE NOTICE 'Super admin created/updated for user: % (ID: %)', user_email, user_uuid;
END $$;

-- Alternative: If you know your user ID directly, uncomment and use this:
-- INSERT INTO user_roles (user_id, role, is_super_admin, can_see_financials, is_active, page_permissions)
-- VALUES (
--   'YOUR_USER_UUID_HERE'::uuid,  -- Replace with your actual user UUID
--   'admin',
--   true,
--   true,
--   true,
--   '[]'::jsonb
-- )
-- ON CONFLICT (user_id) 
-- DO UPDATE SET
--   role = 'admin',
--   is_super_admin = true,
--   can_see_financials = true,
--   is_active = true,
--   updated_at = NOW();
