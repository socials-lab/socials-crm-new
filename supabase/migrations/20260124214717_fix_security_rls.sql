-- ============================================
-- Fix Security: Re-enable RLS and implement role-based client access
-- ============================================

-- ============================================
-- 1. Re-enable RLS on profiles table
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies first
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
    END LOOP;
END $$;

-- Create new policies for profiles
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Admins and management can view all profiles"
  ON profiles FOR SELECT
  USING (is_admin_or_management(auth.uid()) OR is_super_admin(auth.uid()));

CREATE POLICY "System can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ============================================
-- 2. Re-enable RLS on user_roles table
-- ============================================

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies first
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

-- Create new policies for user_roles
-- Note: Using SECURITY DEFINER functions to avoid recursion
CREATE POLICY "Users can view own role"
  ON user_roles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Super admins can view all roles"
  ON user_roles FOR SELECT
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can insert roles"
  ON user_roles FOR INSERT
  WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update roles"
  ON user_roles FOR UPDATE
  USING (is_super_admin(auth.uid()))
  WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can delete roles"
  ON user_roles FOR DELETE
  USING (is_super_admin(auth.uid()));

-- ============================================
-- 3. Update clients RLS to be role-based
-- ============================================

-- Drop existing overly permissive policy
DROP POLICY IF EXISTS "CRM users can view clients" ON clients;

-- Create helper function for checking if user has full client access
CREATE OR REPLACE FUNCTION has_full_client_access(_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  _role app_role;
  _is_super BOOLEAN;
BEGIN
  SELECT role, is_super_admin INTO _role, _is_super
  FROM user_roles
  WHERE user_id = _user_id AND is_active = TRUE;

  -- Super admin always has access
  IF COALESCE(_is_super, FALSE) THEN
    RETURN TRUE;
  END IF;

  -- Admin, management, and finance have full client access
  RETURN _role IN ('admin', 'management', 'finance');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function for checking if user is assigned to client via engagement
CREATE OR REPLACE FUNCTION is_assigned_to_client(_user_id UUID, _client_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM engagement_assignments ea
    JOIN engagements e ON e.id = ea.engagement_id
    JOIN colleagues c ON c.id = ea.colleague_id
    WHERE c.profile_id = _user_id
    AND e.client_id = _client_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin, Management, Finance: see ALL clients
CREATE POLICY "Full access roles read all clients"
  ON clients FOR SELECT
  USING (has_full_client_access(auth.uid()));

-- Project Manager, Specialist: see only clients they're assigned to via engagements
CREATE POLICY "Assigned users read their clients"
  ON clients FOR SELECT
  USING (is_assigned_to_client(auth.uid(), id));

-- Keep existing write policies (only admin/management can write)
-- These are already in place from 002_rls_policies.sql

-- ============================================
-- 4. Update client_contacts RLS to match client access
-- ============================================

-- Drop existing policy
DROP POLICY IF EXISTS "CRM users can view client contacts" ON client_contacts;

-- Create role-based policy for contacts
CREATE POLICY "Users can view contacts for accessible clients"
  ON client_contacts FOR SELECT
  USING (
    has_full_client_access(auth.uid()) OR
    is_assigned_to_client(auth.uid(), client_id)
  );

-- ============================================
-- 5. Update engagements RLS to match client access
-- ============================================

-- Drop existing policy
DROP POLICY IF EXISTS "CRM users can view engagements" ON engagements;

-- Create role-based policy for engagements
CREATE POLICY "Users can view engagements for accessible clients"
  ON engagements FOR SELECT
  USING (
    has_full_client_access(auth.uid()) OR
    is_assigned_to_client(auth.uid(), client_id)
  );
