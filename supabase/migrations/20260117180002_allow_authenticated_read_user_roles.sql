-- Simplify user_roles RLS policy to allow all authenticated users to read
-- The user_roles table contains role assignments which are not secret
-- Write operations are still protected

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Users can view roles" ON public.user_roles;

-- Create simple SELECT policy for all authenticated users
CREATE POLICY "Authenticated users can view all roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (true);

-- Ensure write policies are still restrictive (these should already exist)
-- Only super admins can INSERT/UPDATE/DELETE user_roles
