-- Fix profiles RLS policy to allow all authenticated users to read profiles
-- The current policy uses is_super_admin() which can cause circular dependencies

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Users can view own profile or admins can view all" ON public.profiles;

-- Create simple SELECT policy for all authenticated users
-- Profiles contain basic info (name, email) which is safe to share within the org
CREATE POLICY "Authenticated users can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Keep the update policy restrictive (only own profile)
-- These policies should already exist from the initial migration
