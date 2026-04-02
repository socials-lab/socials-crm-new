-- Secure impersonation context for RLS-sensitive role checks.
-- Uses JWT app_metadata.impersonated_user_id, validated server-side.

CREATE OR REPLACE FUNCTION public.get_effective_user_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  _real_user_id UUID;
  _impersonated_user_text TEXT;
  _impersonated_user_id UUID;
BEGIN
  _real_user_id := auth.uid();
  IF _real_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  _impersonated_user_text := auth.jwt()->>'impersonated_user_id';
  IF _impersonated_user_text IS NULL OR btrim(_impersonated_user_text) = '' THEN
    RETURN _real_user_id;
  END IF;

  IF NOT public.check_is_super_admin(_real_user_id) THEN
    RAISE EXCEPTION 'Impersonation claim is only allowed for superadmins.';
  END IF;

  BEGIN
    _impersonated_user_id := _impersonated_user_text::UUID;
  EXCEPTION
    WHEN invalid_text_representation THEN
      RAISE EXCEPTION 'Invalid impersonated_user_id claim format.';
  END;

  IF _impersonated_user_id = _real_user_id THEN
    RAISE EXCEPTION 'Impersonation target cannot be the same as caller.';
  END IF;

  IF public.check_is_super_admin(_impersonated_user_id) THEN
    RAISE EXCEPTION 'Superadmin to superadmin impersonation is forbidden.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = _impersonated_user_id
      AND COALESCE(ur.is_active, TRUE)
  ) THEN
    RAISE EXCEPTION 'Impersonated user must have an active role.';
  END IF;

  RETURN _impersonated_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.resolve_effective_subject(_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  IF _user_id = auth.uid() THEN
    RETURN public.get_effective_user_id();
  END IF;
  RETURN _user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  _subject_user_id UUID;
BEGIN
  _subject_user_id := public.resolve_effective_subject(_user_id);
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = _subject_user_id
      AND COALESCE(ur.is_active, TRUE)
      AND COALESCE(ur.is_super_admin, FALSE)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_management(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  _subject_user_id UUID;
BEGIN
  _subject_user_id := public.resolve_effective_subject(_user_id);
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = _subject_user_id
      AND COALESCE(ur.is_active, TRUE)
      AND (ur.role IN ('admin', 'management') OR COALESCE(ur.is_super_admin, FALSE))
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.has_role(check_role app_role)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  _subject_user_id UUID;
  _is_super_admin BOOLEAN;
  _role app_role;
BEGIN
  _subject_user_id := public.get_effective_user_id();
  SELECT COALESCE(ur.is_super_admin, FALSE), ur.role
  INTO _is_super_admin, _role
  FROM public.user_roles ur
  WHERE ur.user_id = _subject_user_id
    AND COALESCE(ur.is_active, TRUE)
  LIMIT 1;

  IF COALESCE(_is_super_admin, FALSE) THEN
    RETURN TRUE;
  END IF;

  RETURN _role = check_role;
END;
$$;

CREATE OR REPLACE FUNCTION public.has_crm_access(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  _subject_user_id UUID;
BEGIN
  _subject_user_id := public.resolve_effective_subject(_user_id);
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = _subject_user_id
      AND COALESCE(ur.is_active, TRUE)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  _subject_user_id UUID;
  _role app_role;
BEGIN
  _subject_user_id := public.resolve_effective_subject(_user_id);
  SELECT ur.role
  INTO _role
  FROM public.user_roles ur
  WHERE ur.user_id = _subject_user_id
    AND COALESCE(ur.is_active, TRUE)
  LIMIT 1;

  RETURN _role;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_colleague_id(_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  _subject_user_id UUID;
  _colleague_id UUID;
BEGIN
  _subject_user_id := public.resolve_effective_subject(_user_id);
  SELECT c.id
  INTO _colleague_id
  FROM public.colleagues c
  WHERE c.profile_id = _subject_user_id
  LIMIT 1;
  RETURN _colleague_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_effective_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_effective_subject(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_or_management(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_crm_access(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_colleague_id(UUID) TO authenticated;
