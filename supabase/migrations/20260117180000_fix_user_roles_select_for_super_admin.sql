-- Allow super admins to view ALL user roles for the User Management tab
-- The current RLS policy only allows users to see their own role

-- Drop the existing SELECT policy
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;

-- Create new SELECT policy: users can see their own role OR super admins can see all roles
-- Uses the check_is_super_admin function which is SECURITY DEFINER and bypasses RLS
CREATE POLICY "Users can view roles"
  ON public.user_roles
  FOR SELECT
  USING (
    user_id = auth.uid() 
    OR public.check_is_super_admin(auth.uid())
  );
