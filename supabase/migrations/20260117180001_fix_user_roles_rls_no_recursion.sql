-- Fix RLS on user_roles to avoid circular dependency
-- The previous policy used check_is_super_admin which queries user_roles,
-- causing infinite recursion.

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;

-- Create a policy that uses a direct EXISTS check with a CTE
-- This avoids the recursion by using the auth.uid() directly in a subquery
-- that's optimized to only check the specific user row
CREATE POLICY "Users can view roles"
  ON public.user_roles
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur2 
      WHERE ur2.user_id = auth.uid() 
      AND ur2.is_super_admin = true 
      AND ur2.is_active = true
    )
  );

-- Note: The above still has a potential recursion issue because the EXISTS
-- subquery also hits the same RLS policy. Let's use a different approach:
-- Grant select on specific columns based on auth context

-- Actually, the cleanest fix is to temporarily disable RLS for the super_admin check
-- We can do this by creating a SECURITY DEFINER function that sets 
-- session-level config to bypass RLS for that specific query

-- Drop the policy we just created
DROP POLICY IF EXISTS "Users can view roles" ON public.user_roles;

-- Create a helper function that bypasses RLS for checking super admin status
CREATE OR REPLACE FUNCTION public.is_super_admin_bypass_rls(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  -- Temporarily disable RLS for this query
  SET LOCAL row_security = off;
  
  SELECT COALESCE(is_super_admin, false)
  INTO is_admin
  FROM user_roles
  WHERE user_id = check_user_id AND is_active = true
  LIMIT 1;
  
  RETURN COALESCE(is_admin, false);
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.is_super_admin_bypass_rls(UUID) TO authenticated;

-- Now create the policy using this function
CREATE POLICY "Users can view roles"
  ON public.user_roles
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR public.is_super_admin_bypass_rls(auth.uid())
  );
