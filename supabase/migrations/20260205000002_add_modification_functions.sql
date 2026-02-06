-- Add missing functions for modification requests
-- This is a fix migration because the previous one was partially applied

SET ROLE postgres;

-- Function to apply a modification request
CREATE OR REPLACE FUNCTION apply_modification_request(
  p_request_id UUID,
  p_applied_by UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request modification_requests%ROWTYPE;
  v_changes JSONB;
  v_new_service_id UUID;
  v_result JSONB;
BEGIN
  -- Get the request
  SELECT * INTO v_request FROM modification_requests WHERE id = p_request_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request not found');
  END IF;

  -- Check status - must be client_approved for client-facing changes, or approved for internal changes
  IF v_request.request_type IN ('add_service', 'update_service_price', 'deactivate_service') THEN
    IF v_request.status != 'client_approved' THEN
      RETURN jsonb_build_object('success', false, 'error', 'Request must be client-approved before applying');
    END IF;
  ELSE
    -- Internal changes (assignments) can be applied when approved or client_approved
    IF v_request.status NOT IN ('approved', 'client_approved') THEN
      RETURN jsonb_build_object('success', false, 'error', 'Request must be approved before applying');
    END IF;
  END IF;

  v_changes := v_request.proposed_changes;

  -- Apply changes based on request type
  CASE v_request.request_type
    WHEN 'add_service' THEN
      -- Insert new engagement service
      INSERT INTO engagement_services (
        engagement_id,
        service_id,
        name,
        price,
        billing_type,
        currency,
        is_active,
        notes,
        selected_tier,
        invoicing_status
      ) VALUES (
        v_request.engagement_id,
        (v_changes->>'service_id')::UUID,
        v_changes->>'name',
        (v_changes->>'price')::NUMERIC,
        COALESCE(v_changes->>'billing_type', 'monthly'),
        COALESCE(v_changes->>'currency', 'CZK'),
        true,
        '',
        (v_changes->>'selected_tier'),
        'not_applicable'
      )
      RETURNING id INTO v_new_service_id;

      v_result := jsonb_build_object('new_service_id', v_new_service_id);

    WHEN 'update_service_price' THEN
      -- Update the service price
      UPDATE engagement_services
      SET
        price = (v_changes->>'new_price')::NUMERIC,
        updated_at = NOW()
      WHERE id = v_request.engagement_service_id;

      v_result := jsonb_build_object('updated_service_id', v_request.engagement_service_id);

    WHEN 'deactivate_service' THEN
      -- Deactivate the service
      UPDATE engagement_services
      SET
        is_active = false,
        updated_at = NOW()
      WHERE id = v_request.engagement_service_id;

      v_result := jsonb_build_object('deactivated_service_id', v_request.engagement_service_id);

    WHEN 'add_assignment' THEN
      -- Add new colleague assignment
      INSERT INTO engagement_assignments (
        engagement_id,
        engagement_service_id,
        colleague_id,
        role_on_engagement,
        cost_model,
        monthly_cost,
        hourly_cost,
        percentage_of_revenue,
        start_date
      ) VALUES (
        v_request.engagement_id,
        v_request.engagement_service_id,
        (v_changes->>'colleague_id')::UUID,
        v_changes->>'role_on_engagement',
        COALESCE(v_changes->>'cost_model', 'fixed_monthly'),
        (v_changes->>'monthly_cost')::NUMERIC,
        (v_changes->>'hourly_cost')::NUMERIC,
        (v_changes->>'percentage_of_revenue')::NUMERIC,
        COALESCE(v_request.effective_from, CURRENT_DATE)
      )
      RETURNING id INTO v_new_service_id;

      v_result := jsonb_build_object('new_assignment_id', v_new_service_id);

    WHEN 'update_assignment' THEN
      -- Update assignment cost model
      UPDATE engagement_assignments
      SET
        cost_model = COALESCE(v_changes->>'new_cost_model', cost_model),
        monthly_cost = COALESCE((v_changes->>'new_monthly_cost')::NUMERIC, monthly_cost),
        hourly_cost = COALESCE((v_changes->>'new_hourly_cost')::NUMERIC, hourly_cost),
        percentage_of_revenue = COALESCE((v_changes->>'new_percentage_of_revenue')::NUMERIC, percentage_of_revenue),
        updated_at = NOW()
      WHERE id = v_request.engagement_assignment_id;

      v_result := jsonb_build_object('updated_assignment_id', v_request.engagement_assignment_id);

    WHEN 'remove_assignment' THEN
      -- Set end_date on assignment (soft delete)
      UPDATE engagement_assignments
      SET
        end_date = COALESCE(v_request.effective_from, CURRENT_DATE),
        updated_at = NOW()
      WHERE id = v_request.engagement_assignment_id;

      v_result := jsonb_build_object('removed_assignment_id', v_request.engagement_assignment_id);

    ELSE
      RETURN jsonb_build_object('success', false, 'error', 'Unknown request type');
  END CASE;

  -- Mark request as applied
  UPDATE modification_requests
  SET
    status = 'applied',
    updated_at = NOW()
  WHERE id = p_request_id;

  RETURN jsonb_build_object(
    'success', true,
    'request_type', v_request.request_type,
    'result', v_result
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Function to approve a modification request (generates token for client-facing)
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

  -- Generate token for client-facing requests
  IF v_is_client_facing THEN
    v_token := encode(gen_random_bytes(24), 'base64');
    -- Make URL safe
    v_token := replace(replace(replace(v_token, '+', '-'), '/', '_'), '=', '');
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

-- Function for client to accept offer via token (public, no auth required)
CREATE OR REPLACE FUNCTION client_accept_modification(
  p_token TEXT,
  p_client_email TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request modification_requests%ROWTYPE;
BEGIN
  -- Find request by token
  SELECT * INTO v_request
  FROM modification_requests
  WHERE upgrade_offer_token = p_token;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired token');
  END IF;

  -- Check if token is still valid
  IF v_request.upgrade_offer_valid_until < NOW() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Token has expired');
  END IF;

  -- Check status
  IF v_request.status != 'approved' THEN
    RETURN jsonb_build_object('success', false, 'error', 'This modification has already been processed');
  END IF;

  -- Update to client_approved
  UPDATE modification_requests
  SET
    status = 'client_approved',
    client_email = p_client_email,
    client_approved_at = NOW(),
    updated_at = NOW()
  WHERE id = v_request.id;

  -- Return success with request details
  RETURN jsonb_build_object(
    'success', true,
    'request_id', v_request.id,
    'engagement_name', v_request.engagement_name,
    'client_name', v_request.client_brand_name,
    'request_type', v_request.request_type
  );
END;
$$;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION apply_modification_request(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION approve_modification_request(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION client_accept_modification(TEXT, TEXT) TO anon, authenticated;
