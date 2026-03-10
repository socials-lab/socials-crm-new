-- Force-fix admin/management check to include super admins.
-- This ensures RLS policies using is_admin_or_management() also work for super admins.

CREATE OR REPLACE FUNCTION public.is_admin_or_management(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND ur.is_active = TRUE
      AND (ur.role IN ('admin', 'management') OR COALESCE(ur.is_super_admin, FALSE))
  );
$$;
