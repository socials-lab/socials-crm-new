-- Extend modification requests workflow for manual port from main intent.
-- Adds new request types/status and structured payload fields used by the new UI.

SET ROLE postgres;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum
    WHERE enumlabel = 'expand_country'
      AND enumtypid = 'modification_request_type'::regtype
  ) THEN
    ALTER TYPE modification_request_type ADD VALUE 'expand_country';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum
    WHERE enumlabel = 'new_engagement'
      AND enumtypid = 'modification_request_type'::regtype
  ) THEN
    ALTER TYPE modification_request_type ADD VALUE 'new_engagement';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum
    WHERE enumlabel = 'draft'
      AND enumtypid = 'modification_request_status'::regtype
  ) THEN
    ALTER TYPE modification_request_status ADD VALUE 'draft' BEFORE 'pending';
  END IF;
END $$;

ALTER TABLE modification_requests
  ADD COLUMN IF NOT EXISTS items JSONB,
  ADD COLUMN IF NOT EXISTS pricing_snapshot JSONB,
  ADD COLUMN IF NOT EXISTS bundle_discount_percent NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS client_chosen_effective_from DATE,
  ADD COLUMN IF NOT EXISTS onboarding_data JSONB;

COMMENT ON COLUMN modification_requests.items IS 'Bundled modification items for multi-change requests.';
COMMENT ON COLUMN modification_requests.pricing_snapshot IS 'UI pricing impact snapshot for review and display.';
COMMENT ON COLUMN modification_requests.bundle_discount_percent IS 'Optional discount percent applied over bundled request items.';
COMMENT ON COLUMN modification_requests.client_chosen_effective_from IS 'Effective date chosen by client during approval flow.';
COMMENT ON COLUMN modification_requests.onboarding_data IS 'Client onboarding payload submitted for new engagement requests.';

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

  SELECT * INTO v_request FROM modification_requests WHERE id = p_request_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found';
  END IF;

  IF v_request.status != 'pending' THEN
    RAISE EXCEPTION 'Request is not pending';
  END IF;

  -- All client-facing request types need offer token.
  v_is_client_facing := v_request.request_type IN (
    'expand_country',
    'add_service',
    'update_service_price',
    'deactivate_service',
    'new_engagement'
  );

  IF v_is_client_facing THEN
    v_token := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
  END IF;

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
