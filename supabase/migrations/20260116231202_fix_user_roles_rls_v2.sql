-- Fix user_roles RLS policy circular dependency (v2)
-- The previous policy still queried user_roles within itself

-- Drop ALL policies on user_roles to start fresh
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can update roles" ON public.user_roles;

-- Create a SINGLE simple policy: users can only see their own role
-- This avoids any circular dependency
CREATE POLICY "Users can view own role"
  ON public.user_roles
  FOR SELECT
  USING (user_id = auth.uid());

-- For mutations, use a SECURITY DEFINER function instead of RLS
-- Create a function to check if user is super admin (bypasses RLS)
CREATE OR REPLACE FUNCTION public.check_is_super_admin(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_super_admin FROM user_roles WHERE user_id = check_user_id AND is_active = true LIMIT 1),
    false
  );
$$;

-- Allow super admins to insert new roles
CREATE POLICY "Super admins can insert roles"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (public.check_is_super_admin(auth.uid()));

-- Allow super admins to update roles
CREATE POLICY "Super admins can update roles"
  ON public.user_roles
  FOR UPDATE
  USING (public.check_is_super_admin(auth.uid()))
  WITH CHECK (public.check_is_super_admin(auth.uid()));

-- Allow super admins to delete roles
CREATE POLICY "Super admins can delete roles"
  ON public.user_roles
  FOR DELETE
  USING (public.check_is_super_admin(auth.uid()));
