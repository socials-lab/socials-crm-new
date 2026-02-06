-- Fix apply_modification_request to copy upsold_by_id and upsell_commission_percent
-- to the new engagement_service for proper commission tracking

SET ROLE postgres;

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
  v_tier_value TEXT;
  v_service_id_value TEXT;
  v_new_monthly_fee NUMERIC;
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
      -- Get values safely
      v_tier_value := v_changes->>'selected_tier';
      v_service_id_value := v_changes->>'service_id';

      -- Insert new engagement service with upsell tracking
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
        invoicing_status,
        upsold_by_id,
        upsell_commission_percent,
        effective_from
      ) VALUES (
        v_request.engagement_id,
        CASE
          WHEN v_service_id_value IS NULL OR v_service_id_value = '' OR v_service_id_value = 'null' THEN NULL
          ELSE v_service_id_value::UUID
        END,
        COALESCE(v_changes->>'name', 'Unnamed Service'),
        COALESCE((v_changes->>'price')::NUMERIC, 0),
        COALESCE(v_changes->>'billing_type', 'monthly'),
        COALESCE(v_changes->>'currency', 'CZK'),
        true,
        '',
        CASE
          WHEN v_tier_value IS NULL OR v_tier_value = '' OR v_tier_value = 'null' THEN NULL
          ELSE v_tier_value::service_tier
        END,
        'not_applicable',
        v_request.upsold_by_id,
        v_request.upsell_commission_percent,
        v_request.effective_from
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

  -- After service changes, update the engagement's monthly_fee to match sum of active monthly services
  IF v_request.request_type IN ('add_service', 'update_service_price', 'deactivate_service') THEN
    SELECT COALESCE(SUM(price), 0) INTO v_new_monthly_fee
    FROM engagement_services
    WHERE engagement_id = v_request.engagement_id
      AND is_active = true
      AND billing_type = 'monthly';

    UPDATE engagements
    SET
      monthly_fee = v_new_monthly_fee,
      updated_at = NOW()
    WHERE id = v_request.engagement_id;
  END IF;

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
  RETURN jsonb_build_object('success', false, 'error', SQLERRM, 'detail', SQLSTATE);
END;
$$;

GRANT EXECUTE ON FUNCTION apply_modification_request(UUID, UUID) TO authenticated;
