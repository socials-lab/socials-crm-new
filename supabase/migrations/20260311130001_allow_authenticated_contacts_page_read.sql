-- ============================================
-- Allow all authenticated users to read the full contacts list
-- on the Contacts page without broadening general client access.
-- ============================================

CREATE OR REPLACE FUNCTION public.list_all_contacts_for_authenticated()
RETURNS TABLE (
  id UUID,
  client_id UUID,
  name TEXT,
  "position" TEXT,
  email TEXT,
  phone TEXT,
  is_primary BOOLEAN,
  is_decision_maker BOOLEAN,
  notes TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  client_name TEXT,
  client_brand_name TEXT,
  client_status client_status
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  RETURN QUERY
  SELECT
    cc.id,
    cc.client_id,
    cc.name,
    cc.position,
    cc.email,
    cc.phone,
    cc.is_primary,
    cc.is_decision_maker,
    cc.notes,
    cc.created_at,
    cc.updated_at,
    cc.deleted_at,
    c.name AS client_name,
    c.brand_name AS client_brand_name,
    c.status AS client_status
  FROM public.client_contacts AS cc
  JOIN public.clients AS c
    ON c.id = cc.client_id
  WHERE cc.deleted_at IS NULL
    AND c.deleted_at IS NULL
  ORDER BY cc.name;
END;
$$;

REVOKE ALL ON FUNCTION public.list_all_contacts_for_authenticated() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_all_contacts_for_authenticated() TO authenticated;
