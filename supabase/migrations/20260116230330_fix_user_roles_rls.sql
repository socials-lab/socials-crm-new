-- Fix user_roles RLS policy to avoid circular dependency
-- The is_super_admin() function queries user_roles, which can cause issues

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view own role or super admins can view all" ON public.user_roles;

-- Create a simpler policy that doesn't cause circular dependency
-- Users can always read their own role
CREATE POLICY "Users can view own role"
  ON public.user_roles
  FOR SELECT
  USING (user_id = auth.uid());

-- Super admins can view all roles (checked via direct column, not function)
CREATE POLICY "Super admins can view all roles"
  ON public.user_roles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.is_super_admin = true 
      AND ur.is_active = true
    )
  );
