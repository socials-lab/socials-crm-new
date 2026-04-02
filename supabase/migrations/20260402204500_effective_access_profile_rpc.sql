CREATE OR REPLACE FUNCTION public.get_effective_access_profile()
RETURNS TABLE (
  user_id UUID,
  role app_role,
  is_super_admin BOOLEAN,
  is_active BOOLEAN,
  can_see_financials BOOLEAN,
  can_edit_academy BOOLEAN,
  page_permissions JSONB
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    ur.user_id,
    ur.role,
    COALESCE(ur.is_super_admin, false) AS is_super_admin,
    COALESCE(ur.is_active, true) AS is_active,
    COALESCE(ur.can_see_financials, false) AS can_see_financials,
    COALESCE(ur.can_edit_academy, false) AS can_edit_academy,
    COALESCE(ur.page_permissions::jsonb, '[]'::jsonb) AS page_permissions
  FROM public.user_roles ur
  WHERE ur.user_id = public.get_effective_user_id()
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_effective_access_profile() TO authenticated;
