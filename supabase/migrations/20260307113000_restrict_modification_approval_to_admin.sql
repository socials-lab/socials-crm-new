-- Restrict modification request approval to admin users only.
-- This prevents non-admin users from calling the RPC directly.

SET ROLE postgres;

CREATE OR REPLACE FUNCTION approve_modification_request(
  p_request_id UUID,
  p_reviewed_by UUID
)
RETURNS modification_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request modification_requests%ROWTYPE;
  v_is_client_facing BOOLEAN;
  v_token TEXT;
  v_actor_id UUID;
  v_is_admin BOOLEAN;
BEGIN
  v_actor_id := auth.uid();

  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_reviewed_by IS DISTINCT FROM v_actor_id THEN
    RAISE EXCEPTION 'reviewed_by must match authenticated user';
  END IF;

  SELECT (ur.role = 'admin' OR COALESCE(ur.is_super_admin, FALSE))
  INTO v_is_admin
  FROM user_roles ur
  WHERE ur.user_id = v_actor_id
    AND ur.is_active = TRUE
  LIMIT 1;

  IF NOT COALESCE(v_is_admin, FALSE) THEN
    RAISE EXCEPTION 'Only admin can approve modification requests';
  END IF;

  -- Get current request
  SELECT * INTO v_request FROM modification_requests WHERE id = p_request_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found';
  END IF;

  IF v_request.status != 'pending' THEN
    RAISE EXCEPTION 'Request is not pending';
  END IF;

  -- Check if client-facing (needs token)
  v_is_client_facing := v_request.request_type IN ('add_service', 'update_service_price', 'deactivate_service');

  -- Generate token for client-facing requests using UUIDs (always available)
  IF v_is_client_facing THEN
    v_token := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
  END IF;

  -- Update the request
  UPDATE modification_requests
  SET
    status = 'approved',
    reviewed_by = p_reviewed_by,
    reviewed_at = NOW(),
    upgrade_offer_token = v_token,
    upgrade_offer_valid_until = CASE WHEN v_is_client_facing THEN NOW() + INTERVAL '14 days' ELSE NULL END,
    updated_at = NOW()
  WHERE id = p_request_id
  RETURNING * INTO v_request;

  RETURN v_request;
END;
$$;

GRANT EXECUTE ON FUNCTION approve_modification_request(UUID, UUID) TO authenticated;
