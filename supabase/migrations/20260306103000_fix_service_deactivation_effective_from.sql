-- Make service termination respect effective_from date.
-- If effective_from is in the future, keep the service active until that date.

SET ROLE postgres;

ALTER TABLE engagement_services
ADD COLUMN IF NOT EXISTS end_date DATE;

CREATE INDEX IF NOT EXISTS idx_engagement_services_end_date
ON engagement_services(end_date);

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
  v_effective_from DATE;
BEGIN
  SELECT * INTO v_request FROM modification_requests WHERE id = p_request_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request not found');
  END IF;

  IF v_request.request_type IN ('add_service', 'update_service_price', 'deactivate_service') THEN
    IF v_request.status != 'client_approved' THEN
      RETURN jsonb_build_object('success', false, 'error', 'Request must be client-approved before applying');
    END IF;
  ELSE
    IF v_request.status NOT IN ('approved', 'client_approved') THEN
      RETURN jsonb_build_object('success', false, 'error', 'Request must be approved before applying');
    END IF;
  END IF;

  v_changes := v_request.proposed_changes;

  CASE v_request.request_type
    WHEN 'add_service' THEN
      v_tier_value := v_changes->>'selected_tier';
      v_service_id_value := v_changes->>'service_id';

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
        effective_from,
        end_date
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
        v_request.effective_from,
        NULL
      )
      RETURNING id INTO v_new_service_id;

      v_result := jsonb_build_object('new_service_id', v_new_service_id);

    WHEN 'update_service_price' THEN
      UPDATE engagement_services
      SET
        price = (v_changes->>'new_price')::NUMERIC,
        updated_at = NOW()
      WHERE id = v_request.engagement_service_id;

      v_result := jsonb_build_object('updated_service_id', v_request.engagement_service_id);

    WHEN 'deactivate_service' THEN
      v_effective_from := COALESCE(v_request.effective_from, CURRENT_DATE);

      UPDATE engagement_services
      SET
        end_date = v_effective_from,
        is_active = CASE WHEN v_effective_from <= CURRENT_DATE THEN false ELSE is_active END,
        updated_at = NOW()
      WHERE id = v_request.engagement_service_id;

      v_result := jsonb_build_object(
        'deactivated_service_id', v_request.engagement_service_id,
        'effective_from', v_effective_from
      );

    WHEN 'add_assignment' THEN
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
      UPDATE engagement_assignments
      SET
        end_date = COALESCE(v_request.effective_from, CURRENT_DATE),
        updated_at = NOW()
      WHERE id = v_request.engagement_assignment_id;

      v_result := jsonb_build_object('removed_assignment_id', v_request.engagement_assignment_id);

    ELSE
      RETURN jsonb_build_object('success', false, 'error', 'Unknown request type');
  END CASE;

  IF v_request.request_type IN ('add_service', 'update_service_price', 'deactivate_service') THEN
    SELECT COALESCE(SUM(price), 0) INTO v_new_monthly_fee
    FROM engagement_services
    WHERE engagement_id = v_request.engagement_id
      AND billing_type = 'monthly'
      AND (
        (end_date IS NULL AND is_active = true)
        OR (end_date IS NOT NULL AND end_date > CURRENT_DATE)
      );

    UPDATE engagements
    SET
      monthly_fee = v_new_monthly_fee,
      updated_at = NOW()
    WHERE id = v_request.engagement_id;
  END IF;

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
