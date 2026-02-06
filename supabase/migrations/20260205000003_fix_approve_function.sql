-- Fix approve_modification_request function to not use gen_random_bytes
-- Use uuid instead which is always available in Supabase

SET ROLE postgres;

-- Enable pgcrypto if not already enabled (Supabase usually has this)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Recreate the approve function with a different token generation approach
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
BEGIN
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
    -- Concatenate two UUIDs and remove hyphens for a longer, URL-safe token
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

-- Grant execute
GRANT EXECUTE ON FUNCTION approve_modification_request(UUID, UUID) TO authenticated;
