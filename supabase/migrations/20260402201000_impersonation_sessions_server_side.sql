-- Replace JWT-claim based impersonation with server-side session table.

CREATE TABLE IF NOT EXISTS public.impersonation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  impersonator_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  impersonated_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '60 minutes'),
  stopped_at TIMESTAMPTZ NULL,
  stopped_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT impersonator_not_same_as_target CHECK (impersonator_user_id <> impersonated_user_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_impersonation_sessions_active_unique
ON public.impersonation_sessions(impersonator_user_id)
WHERE stopped_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_impersonation_sessions_active_target
ON public.impersonation_sessions(impersonated_user_id)
WHERE stopped_at IS NULL;

ALTER TABLE public.impersonation_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS impersonation_sessions_no_direct_access ON public.impersonation_sessions;
CREATE POLICY impersonation_sessions_no_direct_access
ON public.impersonation_sessions
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

DROP TRIGGER IF EXISTS update_impersonation_sessions_updated_at ON public.impersonation_sessions;
CREATE TRIGGER update_impersonation_sessions_updated_at
BEFORE UPDATE ON public.impersonation_sessions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.get_active_impersonation_target(_impersonator_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  _target UUID;
BEGIN
  SELECT s.impersonated_user_id
  INTO _target
  FROM public.impersonation_sessions s
  WHERE s.impersonator_user_id = _impersonator_user_id
    AND s.stopped_at IS NULL
    AND s.expires_at > now()
  ORDER BY s.started_at DESC
  LIMIT 1;

  RETURN _target;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_effective_user_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  _real_user_id UUID;
  _impersonated_user_id UUID;
BEGIN
  _real_user_id := auth.uid();
  IF _real_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  _impersonated_user_id := public.get_active_impersonation_target(_real_user_id);
  IF _impersonated_user_id IS NULL THEN
    RETURN _real_user_id;
  END IF;

  IF NOT public.check_is_super_admin(_real_user_id) THEN
    RAISE EXCEPTION 'Only superadmins can have active impersonation sessions.';
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

GRANT EXECUTE ON FUNCTION public.get_active_impersonation_target(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_effective_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_effective_subject(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_or_management(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_crm_access(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_colleague_id(UUID) TO authenticated;
