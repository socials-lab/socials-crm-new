-- ============================================
-- Fix RLS Circular Dependencies - Comprehensive Audit
-- ============================================
-- This migration addresses circular dependency issues in RLS policies
-- and ensures super admins can properly manage all user roles.
--
-- AUDIT SUMMARY:
-- 1. user_roles table was already fixed in 20260116231202_fix_user_roles_rls_v2.sql
-- 2. All helper functions (is_super_admin, has_crm_access, etc.) are SECURITY DEFINER
--    which means they bypass RLS - this is the CORRECT pattern
-- 3. Issue found: Super admins cannot view all roles (only their own)
-- 4. All other tables are safe - they use SECURITY DEFINER functions
-- ============================================

-- ============================================
-- PART 1: Ensure all helper functions are SECURITY DEFINER
-- and have proper search_path to prevent security issues
-- ============================================

-- Recreate check_is_super_admin with explicit search_path
CREATE OR REPLACE FUNCTION public.check_is_super_admin(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_super_admin FROM user_roles WHERE user_id = check_user_id AND is_active = true LIMIT 1),
    false
  );
$$;

-- Recreate check functions for admin/management access (for use in RLS policies)
CREATE OR REPLACE FUNCTION public.check_is_admin_or_management(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    (SELECT role IN ('admin', 'management') FROM user_roles WHERE user_id = check_user_id AND is_active = true LIMIT 1),
    false
  );
$$;

-- Recreate check function for CRM access (any authenticated user with a role)
CREATE OR REPLACE FUNCTION public.check_has_crm_access(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = check_user_id AND is_active = true
  );
$$;

-- Recreate check function for financial access
CREATE OR REPLACE FUNCTION public.check_can_see_financials(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    (SELECT can_see_financials FROM user_roles WHERE user_id = check_user_id AND is_active = true LIMIT 1),
    false
  );
$$;

-- ============================================
-- PART 2: Fix user_roles SELECT policy for super admins
-- Super admins need to be able to see ALL user roles
-- ============================================

-- First, drop any conflicting policies
DROP POLICY IF EXISTS "Super admins can view all roles" ON public.user_roles;

-- Add policy for super admins to view all roles
-- This uses the SECURITY DEFINER function which bypasses RLS
-- so there's no circular dependency
CREATE POLICY "Super admins can view all roles"
  ON public.user_roles
  FOR SELECT
  USING (public.check_is_super_admin(auth.uid()));

-- Note: The "Users can view own role" policy already exists from the v2 fix
-- Both policies are combined with OR logic, so:
-- - Regular users can see their own role (user_id = auth.uid())
-- - Super admins can see all roles (check_is_super_admin returns true)

-- ============================================
-- PART 3: Update original helper functions to match
-- new naming convention and ensure consistency
-- ============================================

-- Update is_super_admin to use explicit search_path
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  _is_super_admin BOOLEAN;
BEGIN
  SELECT is_super_admin INTO _is_super_admin
  FROM user_roles
  WHERE user_id = _user_id AND is_active = TRUE;
  
  RETURN COALESCE(_is_super_admin, FALSE);
END;
$$;

-- Update has_crm_access to use explicit search_path
CREATE OR REPLACE FUNCTION public.has_crm_access(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  _role app_role;
BEGIN
  SELECT role INTO _role
  FROM user_roles
  WHERE user_id = _user_id AND is_active = TRUE;
  
  RETURN _role IS NOT NULL;
END;
$$;

-- Update is_admin_or_management to use explicit search_path
CREATE OR REPLACE FUNCTION public.is_admin_or_management(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  _role app_role;
BEGIN
  SELECT role INTO _role
  FROM user_roles
  WHERE user_id = _user_id AND is_active = TRUE;
  
  RETURN _role IN ('admin', 'management');
END;
$$;

-- Update can_see_financials to use explicit search_path
CREATE OR REPLACE FUNCTION public.can_see_financials(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  _can_see BOOLEAN;
BEGIN
  SELECT can_see_financials INTO _can_see
  FROM user_roles
  WHERE user_id = _user_id AND is_active = TRUE;
  
  RETURN COALESCE(_can_see, FALSE);
END;
$$;

-- Update get_colleague_id to use explicit search_path
CREATE OR REPLACE FUNCTION public.get_colleague_id(_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  _colleague_id UUID;
BEGIN
  SELECT id INTO _colleague_id
  FROM colleagues
  WHERE profile_id = _user_id;
  
  RETURN _colleague_id;
END;
$$;

-- Update get_user_role to use explicit search_path
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  _role app_role;
BEGIN
  SELECT role INTO _role
  FROM user_roles
  WHERE user_id = _user_id AND is_active = TRUE;
  
  RETURN COALESCE(_role, NULL);
END;
$$;

-- Update has_role to use explicit search_path
CREATE OR REPLACE FUNCTION public.has_role(check_role app_role)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  _user_role app_role;
BEGIN
  SELECT role INTO _user_role
  FROM user_roles
  WHERE user_id = auth.uid() AND is_active = TRUE;
  
  RETURN _user_role = check_role;
END;
$$;

-- Update can_view_page to use explicit search_path
CREATE OR REPLACE FUNCTION public.can_view_page(page_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  _is_super_admin BOOLEAN;
  _page_permissions JSONB;
BEGIN
  -- Super admin can view everything
  SELECT is_super_admin INTO _is_super_admin
  FROM user_roles
  WHERE user_id = auth.uid() AND is_active = TRUE;
  
  IF _is_super_admin THEN
    RETURN TRUE;
  END IF;
  
  -- Check page_permissions JSONB
  SELECT page_permissions INTO _page_permissions
  FROM user_roles
  WHERE user_id = auth.uid() AND is_active = TRUE;
  
  -- If no permissions defined, default to role-based access
  IF _page_permissions IS NULL OR jsonb_array_length(_page_permissions) = 0 THEN
    RETURN has_crm_access(auth.uid());
  END IF;
  
  -- Check if page has can_view = true
  RETURN EXISTS (
    SELECT 1
    FROM jsonb_array_elements(_page_permissions) AS perm
    WHERE perm->>'page' = page_name
      AND (perm->>'can_view')::boolean = TRUE
  );
END;
$$;

-- Update can_edit_page to use explicit search_path
CREATE OR REPLACE FUNCTION public.can_edit_page(page_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  _is_super_admin BOOLEAN;
  _page_permissions JSONB;
BEGIN
  -- Super admin can edit everything
  SELECT is_super_admin INTO _is_super_admin
  FROM user_roles
  WHERE user_id = auth.uid() AND is_active = TRUE;
  
  IF _is_super_admin THEN
    RETURN TRUE;
  END IF;
  
  -- Check page_permissions JSONB
  SELECT page_permissions INTO _page_permissions
  FROM user_roles
  WHERE user_id = auth.uid() AND is_active = TRUE;
  
  -- If no permissions defined, default to role-based access
  IF _page_permissions IS NULL OR jsonb_array_length(_page_permissions) = 0 THEN
    RETURN is_admin_or_management(auth.uid());
  END IF;
  
  -- Check if page has can_edit = true
  RETURN EXISTS (
    SELECT 1
    FROM jsonb_array_elements(_page_permissions) AS perm
    WHERE perm->>'page' = page_name
      AND (perm->>'can_edit')::boolean = TRUE
  );
END;
$$;

-- ============================================
-- PART 4: Verify RLS is enabled on all tables
-- (Safety check - these should already be enabled)
-- ============================================

ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS colleagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS services ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS client_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS client_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS lead_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS engagements ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS engagement_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS engagement_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS engagement_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS engagement_monthly_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS extra_works ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS issued_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS output_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS creative_boost_client_months ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS creative_boost_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS creative_boost_settings_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS meeting_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS meeting_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS feedback_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS feedback_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS calendar_tokens ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PART 5: Grant execute permissions on helper functions
-- ============================================

GRANT EXECUTE ON FUNCTION public.check_is_super_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_is_admin_or_management(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_has_crm_access(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_can_see_financials(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_crm_access(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_or_management(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_see_financials(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_colleague_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_view_page(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_edit_page(TEXT) TO authenticated;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
