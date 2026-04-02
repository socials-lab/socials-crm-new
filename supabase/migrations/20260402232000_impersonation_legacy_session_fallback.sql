-- Support legacy JWT sessions that do not include session_id claim.
-- We bind such sessions to a deterministic per-user pseudo-session key.

CREATE OR REPLACE FUNCTION public.get_effective_user_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  _real_user_id UUID;
  _session_id TEXT;
  _impersonated_user_id UUID;
BEGIN
  _real_user_id := auth.uid();
  IF _real_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  _session_id := auth.jwt()->>'session_id';
  IF _session_id IS NULL OR btrim(_session_id) = '' THEN
    _session_id := format('legacy:%s', _real_user_id::text);
  END IF;

  _impersonated_user_id := public.get_active_impersonation_target(_real_user_id, _session_id);
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

