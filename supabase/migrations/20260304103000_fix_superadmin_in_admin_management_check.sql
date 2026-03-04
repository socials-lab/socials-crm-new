-- Ensure super admins pass policies using is_admin_or_management()
-- This fixes operations like engagement soft-delete for super admin users.

CREATE OR REPLACE FUNCTION public.is_admin_or_management(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  _role app_role;
  _is_super_admin BOOLEAN;
BEGIN
  SELECT role, is_super_admin
  INTO _role, _is_super_admin
  FROM user_roles
  WHERE user_id = _user_id
    AND is_active = TRUE;

  RETURN _role IN ('admin', 'management') OR COALESCE(_is_super_admin, FALSE);
END;
$$;
