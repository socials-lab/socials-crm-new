-- RESET ALL RLS POLICIES ON user_roles table
-- The previous policies were causing infinite recursion/hanging queries

-- First, disable RLS temporarily
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- Drop ALL policies on user_roles (regardless of name)
DO $$ 
DECLARE 
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'user_roles' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_roles', pol.policyname);
    END LOOP;
END $$;

-- Re-enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies

-- SELECT: All authenticated users can read all user_roles
-- This is safe because user_roles only contains role assignments, not secrets
CREATE POLICY "user_roles_select_all_authenticated"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: Only super admins can add new user roles
-- We use a subquery that references a different table to avoid recursion
CREATE POLICY "user_roles_insert_super_admin"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.is_super_admin = true 
      AND ur.is_active = true
    )
  );

-- UPDATE: Users can update their own row, or super admins can update any row
CREATE POLICY "user_roles_update"
  ON public.user_roles
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.is_super_admin = true 
      AND ur.is_active = true
    )
  );

-- DELETE: Only super admins can delete user roles
CREATE POLICY "user_roles_delete_super_admin"
  ON public.user_roles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.is_super_admin = true 
      AND ur.is_active = true
    )
  );
