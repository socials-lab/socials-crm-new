-- Bind impersonation to a concrete auth session (JWT session_id),
-- preventing cross-window/cross-environment leakage.

ALTER TABLE public.impersonation_sessions
ADD COLUMN IF NOT EXISTS impersonator_session_id TEXT;

-- Stop legacy sessions that do not carry session binding.
UPDATE public.impersonation_sessions
SET stopped_at = now(),
    stopped_by = impersonator_user_id
WHERE stopped_at IS NULL
  AND (impersonator_session_id IS NULL OR btrim(impersonator_session_id) = '');

DROP INDEX IF EXISTS idx_impersonation_sessions_active_unique;

CREATE UNIQUE INDEX IF NOT EXISTS idx_impersonation_sessions_active_per_session
ON public.impersonation_sessions(impersonator_user_id, impersonator_session_id)
WHERE stopped_at IS NULL;

CREATE OR REPLACE FUNCTION public.get_active_impersonation_target(
  _impersonator_user_id UUID,
  _impersonator_session_id TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  _target UUID;
BEGIN
  IF _impersonator_session_id IS NULL OR btrim(_impersonator_session_id) = '' THEN
    RETURN NULL;
  END IF;

  SELECT s.impersonated_user_id
  INTO _target
  FROM public.impersonation_sessions s
  WHERE s.impersonator_user_id = _impersonator_user_id
    AND s.impersonator_session_id = _impersonator_session_id
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
  _session_id TEXT;
  _impersonated_user_id UUID;
BEGIN
  _real_user_id := auth.uid();
  IF _real_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  _session_id := auth.jwt()->>'session_id';
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

GRANT EXECUTE ON FUNCTION public.get_active_impersonation_target(UUID, TEXT) TO authenticated;
