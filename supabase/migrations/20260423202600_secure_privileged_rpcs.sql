SET ROLE postgres;

CREATE OR REPLACE FUNCTION public.convert_lead_to_client(
  p_lead_id UUID,
  p_client_data JSONB,
  p_primary_contact JSONB,
  p_engagement_data JSONB,
  p_additional_contacts JSONB DEFAULT '[]'::JSONB,
  p_services JSONB DEFAULT '[]'::JSONB,
  p_assignments JSONB DEFAULT '[]'::JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_id UUID;
  v_engagement_id UUID;
  v_primary_contact_id UUID;
  v_contact JSONB;
  v_service JSONB;
  v_service_id UUID;
  v_assignment JSONB;
  v_ico TEXT;
  v_currency TEXT;
  v_session_user_id UUID;
  v_effective_user_id UUID;
  v_can_convert BOOLEAN;
BEGIN
  v_session_user_id := auth.uid();
  IF v_session_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required'
      USING ERRCODE = '42501';
  END IF;

  v_effective_user_id := public.resolve_effective_subject(v_session_user_id);

  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = v_effective_user_id
      AND COALESCE(ur.is_active, TRUE)
  )
  INTO v_can_convert;

  IF NOT COALESCE(v_can_convert, FALSE) THEN
    RAISE EXCEPTION 'Not authorized to convert leads'
      USING ERRCODE = '42501';
  END IF;

  v_currency := COALESCE(NULLIF(p_engagement_data->>'currency', ''), p_client_data->>'currency', 'CZK');
  IF v_currency NOT IN ('CZK', 'EUR', 'USD') THEN
    v_currency := 'CZK';
  END IF;

  v_ico := p_client_data->>'ico';

  IF v_ico IS NOT NULL AND v_ico != '' AND EXISTS (SELECT 1 FROM public.clients WHERE ico = v_ico AND deleted_at IS NULL) THEN
    RAISE EXCEPTION 'Klient s IČO % již existuje', v_ico USING ERRCODE = 'unique_violation';
  END IF;

  IF EXISTS (SELECT 1 FROM public.leads WHERE id = p_lead_id AND converted_to_client_id IS NOT NULL) THEN
    RAISE EXCEPTION 'Lead již byl převeden' USING ERRCODE = 'check_violation';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.leads WHERE id = p_lead_id) THEN
    RAISE EXCEPTION 'Lead s ID % neexistuje', p_lead_id USING ERRCODE = 'foreign_key_violation';
  END IF;

  INSERT INTO public.clients (
    name, brand_name, ico, dic, website, country, industry, status, tier, currency,
    sales_representative_id, billing_street, billing_city, billing_zip, billing_country,
    billing_email, acquisition_channel, start_date, end_date, notes, pinned_notes,
    fakturoid_subject_id, created_by
  ) VALUES (
    p_client_data->>'name',
    p_client_data->>'brand_name',
    v_ico,
    NULLIF(p_client_data->>'dic', ''),
    NULLIF(p_client_data->>'website', ''),
    COALESCE(NULLIF(p_client_data->>'country', ''), 'Czech Republic'),
    NULLIF(p_client_data->>'industry', ''),
    'active',
    COALESCE(p_client_data->>'tier', 'standard')::client_tier,
    v_currency,
    (p_client_data->>'sales_representative_id')::UUID,
    NULLIF(p_client_data->>'billing_street', ''),
    NULLIF(p_client_data->>'billing_city', ''),
    NULLIF(p_client_data->>'billing_zip', ''),
    NULLIF(p_client_data->>'billing_country', ''),
    NULLIF(p_client_data->>'billing_email', ''),
    COALESCE(p_client_data->>'acquisition_channel', 'other'),
    CASE WHEN p_client_data->>'start_date' IS NOT NULL AND p_client_data->>'start_date' != ''
      THEN (p_client_data->>'start_date')::DATE ELSE CURRENT_DATE END,
    CASE WHEN p_client_data->>'end_date' IS NOT NULL AND p_client_data->>'end_date' != ''
      THEN (p_client_data->>'end_date')::DATE ELSE NULL END,
    COALESCE(p_client_data->>'notes', ''),
    COALESCE(p_client_data->>'pinned_notes', ''),
    (p_client_data->>'fakturoid_subject_id')::INTEGER,
    v_session_user_id
  ) RETURNING id INTO v_client_id;

  INSERT INTO public.client_contacts (
    client_id, name, position, email, phone, is_primary, is_decision_maker, notes
  ) VALUES (
    v_client_id,
    p_primary_contact->>'name',
    NULLIF(p_primary_contact->>'position', ''),
    NULLIF(p_primary_contact->>'email', ''),
    NULLIF(p_primary_contact->>'phone', ''),
    true, true, COALESCE(p_primary_contact->>'notes', '')
  ) RETURNING id INTO v_primary_contact_id;

  FOR v_contact IN SELECT * FROM jsonb_array_elements(p_additional_contacts)
  LOOP
    INSERT INTO public.client_contacts (
      client_id, name, position, email, phone, is_primary, is_decision_maker, notes
    ) VALUES (
      v_client_id,
      v_contact->>'name', NULLIF(v_contact->>'position', ''),
      NULLIF(v_contact->>'email', ''), NULLIF(v_contact->>'phone', ''),
      false, COALESCE((v_contact->>'is_decision_maker')::BOOLEAN, false),
      COALESCE(v_contact->>'notes', '')
    );
  END LOOP;

  INSERT INTO public.engagements (
    client_id, contact_person_id, name, type, status, billing_model,
    monthly_fee, one_off_fee, currency, start_date, end_date, notice_period_months,
    offer_url, contract_url, notes
  ) VALUES (
    v_client_id,
    v_primary_contact_id,
    p_engagement_data->>'name',
    COALESCE(p_engagement_data->>'type', 'retainer')::engagement_type,
    'active',
    COALESCE(p_engagement_data->>'billing_model', 'fixed_fee')::billing_model,
    COALESCE((p_engagement_data->>'monthly_fee')::DECIMAL, 0),
    COALESCE((p_engagement_data->>'one_off_fee')::DECIMAL, 0),
    v_currency,
    CASE WHEN p_engagement_data->>'start_date' IS NOT NULL AND p_engagement_data->>'start_date' != ''
      THEN (p_engagement_data->>'start_date')::DATE ELSE CURRENT_DATE END,
    CASE WHEN p_engagement_data->>'end_date' IS NOT NULL AND p_engagement_data->>'end_date' != ''
      THEN (p_engagement_data->>'end_date')::DATE ELSE NULL END,
    (p_engagement_data->>'notice_period_months')::INTEGER,
    NULLIF(p_engagement_data->>'offer_url', ''),
    NULLIF(p_engagement_data->>'contract_url', ''),
    COALESCE(p_engagement_data->>'notes', '')
  ) RETURNING id INTO v_engagement_id;

  FOR v_service IN SELECT * FROM jsonb_array_elements(p_services)
  LOOP
    INSERT INTO public.engagement_services (
      engagement_id, service_id, name, price, billing_type, currency,
      is_active, notes, selected_tier, invoicing_status,
      intro_discount_percent, intro_discount_months, intro_discount_start_date,
      creative_boost_min_credits, creative_boost_max_credits, creative_boost_price_per_credit,
      creative_boost_reward_per_credit_banner, creative_boost_reward_per_credit_video,
      creative_boost_fixed_billing
    ) VALUES (
      v_engagement_id,
      (v_service->>'service_id')::UUID,
      v_service->>'name',
      COALESCE((v_service->>'price')::DECIMAL, 0),
      COALESCE(v_service->>'billing_type', 'monthly'),
      COALESCE(v_service->>'currency', v_currency),
      true,
      COALESCE(v_service->>'notes', ''),
      (NULLIF(v_service->>'selected_tier', ''))::service_tier,
      CASE WHEN v_service->>'billing_type' = 'one_off' THEN 'pending'::one_off_invoicing_status
           ELSE 'not_applicable'::one_off_invoicing_status END,
      NULLIF(v_service->>'intro_discount_percent', '')::DECIMAL,
      NULLIF(v_service->>'intro_discount_months', '')::INTEGER,
      CASE
        WHEN NULLIF(v_service->>'intro_discount_start_date', '') IS NOT NULL
          THEN (v_service->>'intro_discount_start_date')::DATE
        WHEN NULLIF(v_service->>'intro_discount_percent', '') IS NOT NULL
          AND NULLIF(v_service->>'intro_discount_months', '') IS NOT NULL
          THEN CURRENT_DATE
        ELSE NULL
      END,
      NULLIF(v_service->>'creative_boost_credits', '')::INTEGER,
      NULLIF(v_service->>'creative_boost_credits', '')::INTEGER,
      NULLIF(v_service->>'creative_boost_price_per_credit', '')::DECIMAL,
      COALESCE(NULLIF(v_service->>'creative_boost_graphic_reward', '')::DECIMAL, 80),
      COALESCE(NULLIF(v_service->>'creative_boost_editor_reward', '')::DECIMAL, 80),
      CASE WHEN v_service->>'creative_boost_credits' IS NOT NULL THEN true ELSE NULL END
    ) RETURNING id INTO v_service_id;
  END LOOP;

  FOR v_assignment IN SELECT * FROM jsonb_array_elements(p_assignments)
  LOOP
    INSERT INTO public.engagement_assignments (
      engagement_id, engagement_service_id, colleague_id, role_on_engagement,
      cost_model, hourly_cost, monthly_cost, percentage_of_revenue,
      start_date, end_date, notes
    ) VALUES (
      v_engagement_id,
      NULL,
      (v_assignment->>'colleague_id')::UUID,
      v_assignment->>'role',
      COALESCE(v_assignment->>'cost_model', 'fixed_monthly')::cost_model,
      (v_assignment->>'hourly_cost')::DECIMAL,
      (v_assignment->>'monthly_cost')::DECIMAL,
      (v_assignment->>'percentage_of_revenue')::DECIMAL,
      CASE WHEN v_assignment->>'start_date' IS NOT NULL AND v_assignment->>'start_date' != ''
        THEN (v_assignment->>'start_date')::DATE ELSE CURRENT_DATE END,
      CASE WHEN v_assignment->>'end_date' IS NOT NULL AND v_assignment->>'end_date' != ''
        THEN (v_assignment->>'end_date')::DATE ELSE NULL END,
      COALESCE(v_assignment->>'notes', '')
    );
  END LOOP;

  UPDATE public.leads SET
    stage = 'won',
    converted_to_client_id = v_client_id,
    converted_to_engagement_id = v_engagement_id,
    converted_at = NOW()
  WHERE id = p_lead_id;

  RETURN jsonb_build_object(
    'success', true,
    'client_id', v_client_id,
    'engagement_id', v_engagement_id,
    'primary_contact_id', v_primary_contact_id
  );

EXCEPTION
  WHEN unique_violation THEN RAISE;
  WHEN check_violation THEN RAISE;
  WHEN foreign_key_violation THEN RAISE;
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Chyba při převodu leadu: %', SQLERRM USING ERRCODE = SQLSTATE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.convert_lead_to_client(UUID, JSONB, JSONB, JSONB, JSONB, JSONB, JSONB) TO authenticated;

CREATE OR REPLACE FUNCTION public.create_invoice_with_items(
  p_engagement_id UUID,
  p_engagement_name TEXT,
  p_client_id UUID,
  p_client_name TEXT,
  p_year INT,
  p_month INT,
  p_line_items JSONB,
  p_total_amount NUMERIC,
  p_currency TEXT,
  p_issued_by UUID,
  p_extra_work_ids UUID[] DEFAULT '{}',
  p_one_off_service_ids UUID[] DEFAULT '{}',
  p_creative_boost_client_month_ids UUID[] DEFAULT '{}'
)
RETURNS issued_invoices
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invoice issued_invoices;
  v_invoice_number TEXT;
  v_line_item JSONB;
  v_actual_days_in_month INT;
  v_line_currency TEXT;
  v_total_credits INT := 0;
  v_total_amount NUMERIC := 0;
  v_extra_updated INT;
  v_session_user_id UUID;
  v_effective_user_id UUID;
  v_can_issue BOOLEAN;
BEGIN
  v_session_user_id := auth.uid();
  IF v_session_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required'
      USING ERRCODE = '42501';
  END IF;

  v_effective_user_id := public.resolve_effective_subject(v_session_user_id);

  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = v_effective_user_id
      AND COALESCE(ur.is_active, TRUE)
      AND (
        ur.role IN ('admin', 'management', 'finance')
        OR COALESCE(ur.is_super_admin, FALSE)
        OR COALESCE(ur.can_see_financials, FALSE)
      )
  )
  INTO v_can_issue;

  IF NOT COALESCE(v_can_issue, FALSE) THEN
    RAISE EXCEPTION 'Not authorized to issue invoices'
      USING ERRCODE = '42501';
  END IF;

  IF p_currency IS NULL OR p_currency NOT IN ('CZK', 'EUR', 'USD') THEN
    RAISE EXCEPTION 'Invoice currency must be CZK, EUR, or USD, got %', p_currency;
  END IF;

  FOR v_line_item IN SELECT * FROM jsonb_array_elements(p_line_items)
  LOOP
    v_line_currency := COALESCE(v_line_item->>'currency', 'CZK');
    IF v_line_currency != p_currency THEN
      RAISE EXCEPTION 'Line item currency (%) must match invoice currency (%)',
        v_line_currency, p_currency;
    END IF;
  END LOOP;

  v_actual_days_in_month := days_in_month(p_year, p_month);
  v_invoice_number := generate_invoice_number(p_year);

  INSERT INTO public.issued_invoices (
    engagement_id, engagement_name, client_id, client_name,
    year, month, invoice_number, line_items, total_amount,
    currency, issued_at, issued_by
  ) VALUES (
    p_engagement_id, p_engagement_name, p_client_id, p_client_name,
    p_year, p_month, v_invoice_number, p_line_items, p_total_amount,
    p_currency, NOW(), v_session_user_id
  ) RETURNING * INTO v_invoice;

  FOR v_line_item IN SELECT * FROM jsonb_array_elements(p_line_items)
  LOOP
    INSERT INTO public.invoice_line_items (
      invoice_id, source, engagement_id, extra_work_id,
      engagement_service_id, creative_boost_client_month_id,
      source_description, source_amount,
      period_start, period_end, prorated_days, total_days_in_month,
      prorated_amount, line_description, unit_price, quantity,
      adjustment_amount, adjustment_reason, final_amount,
      is_approved, note, hours, hourly_rate,
      currency, is_reverse_charge, vat_rate, unit_name
    ) VALUES (
      v_invoice.id,
      (v_line_item->>'source')::line_item_source,
      (v_line_item->>'engagement_id')::UUID,
      (v_line_item->>'extra_work_id')::UUID,
      (v_line_item->>'engagement_service_id')::UUID,
      (v_line_item->>'creative_boost_client_month_id')::UUID,
      COALESCE(v_line_item->>'source_description', ''),
      COALESCE((v_line_item->>'source_amount')::NUMERIC, 0),
      COALESCE(NULLIF(v_line_item->>'period_start', '')::DATE, CURRENT_DATE),
      COALESCE(NULLIF(v_line_item->>'period_end', '')::DATE, CURRENT_DATE),
      COALESCE((v_line_item->>'prorated_days')::INT, v_actual_days_in_month),
      COALESCE((v_line_item->>'total_days_in_month')::INT, v_actual_days_in_month),
      COALESCE((v_line_item->>'prorated_amount')::NUMERIC, 0),
      COALESCE(v_line_item->>'line_description', ''),
      COALESCE((v_line_item->>'unit_price')::NUMERIC, 0),
      COALESCE((v_line_item->>'quantity')::NUMERIC, 1),
      COALESCE((v_line_item->>'adjustment_amount')::NUMERIC, 0),
      COALESCE(v_line_item->>'adjustment_reason', ''),
      COALESCE((v_line_item->>'final_amount')::NUMERIC, 0),
      COALESCE((v_line_item->>'is_approved')::BOOLEAN, true),
      COALESCE(v_line_item->>'note', ''),
      (v_line_item->>'hours')::NUMERIC,
      (v_line_item->>'hourly_rate')::NUMERIC,
      COALESCE(v_line_item->>'currency', p_currency),
      COALESCE((v_line_item->>'is_reverse_charge')::BOOLEAN, false),
      COALESCE((v_line_item->>'vat_rate')::NUMERIC, 21),
      COALESCE(v_line_item->>'unit_name', 'ks')
    );
  END LOOP;

  IF array_length(p_extra_work_ids, 1) > 0 THEN
    UPDATE public.extra_works
    SET status = 'invoiced',
        invoice_id = v_invoice.id,
        invoice_number = v_invoice_number,
        invoiced_at = NOW(),
        updated_at = NOW()
    WHERE id = ANY(p_extra_work_ids)
      AND status = 'ready_to_invoice';

    GET DIAGNOSTICS v_extra_updated = ROW_COUNT;
    IF v_extra_updated < array_length(p_extra_work_ids, 1) THEN
      RAISE EXCEPTION 'Some extra works could not be invoiced (may have been invoiced already or not ready_to_invoice)';
    END IF;
  END IF;

  IF array_length(p_one_off_service_ids, 1) > 0 THEN
    UPDATE public.engagement_services
    SET invoicing_status = 'invoiced',
        invoice_id = v_invoice.id,
        invoiced_at = NOW(),
        invoiced_in_period = p_year || '-' || LPAD(p_month::TEXT, 2, '0'),
        updated_at = NOW()
    WHERE id = ANY(p_one_off_service_ids);
  END IF;

  IF array_length(p_creative_boost_client_month_ids, 1) > 0 THEN
    SELECT
      COALESCE(SUM((elem->>'quantity')::INT), 0),
      COALESCE(SUM((elem->>'unit_price')::NUMERIC * COALESCE((elem->>'quantity')::NUMERIC, 1)), 0)
    INTO v_total_credits, v_total_amount
    FROM jsonb_array_elements(p_line_items) elem
    WHERE (elem->>'source') = 'creative_boost';

    UPDATE public.creative_boost_client_months
    SET invoice_id = v_invoice.id,
        invoiced_at = NOW(),
        invoiced_credits = v_total_credits,
        invoiced_amount = v_total_amount
    WHERE id = ANY(p_creative_boost_client_month_ids);
  END IF;

  RETURN v_invoice;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_invoice_with_items(UUID, TEXT, UUID, TEXT, INT, INT, JSONB, NUMERIC, TEXT, UUID, UUID[], UUID[], UUID[]) TO authenticated;

CREATE OR REPLACE FUNCTION public.apply_modification_request(
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
  v_session_user_id UUID;
  v_effective_user_id UUID;
  v_is_admin BOOLEAN;
BEGIN
  v_session_user_id := auth.uid();
  IF v_session_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required'
      USING ERRCODE = '42501';
  END IF;

  v_effective_user_id := public.resolve_effective_subject(v_session_user_id);

  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = v_effective_user_id
      AND COALESCE(ur.is_active, TRUE)
      AND (ur.role = 'admin' OR COALESCE(ur.is_super_admin, FALSE))
  )
  INTO v_is_admin;

  IF NOT COALESCE(v_is_admin, FALSE) THEN
    RAISE EXCEPTION 'Only admin can apply modification requests'
      USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_request FROM public.modification_requests WHERE id = p_request_id;

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

      INSERT INTO public.engagement_services (
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
      UPDATE public.engagement_services
      SET
        price = (v_changes->>'new_price')::NUMERIC,
        updated_at = NOW()
      WHERE id = v_request.engagement_service_id;

      v_result := jsonb_build_object('updated_service_id', v_request.engagement_service_id);

    WHEN 'deactivate_service' THEN
      v_effective_from := COALESCE(v_request.effective_from, CURRENT_DATE);

      UPDATE public.engagement_services
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
      INSERT INTO public.engagement_assignments (
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
      UPDATE public.engagement_assignments
      SET
        cost_model = COALESCE(v_changes->>'new_cost_model', cost_model),
        monthly_cost = COALESCE((v_changes->>'new_monthly_cost')::NUMERIC, monthly_cost),
        hourly_cost = COALESCE((v_changes->>'new_hourly_cost')::NUMERIC, hourly_cost),
        percentage_of_revenue = COALESCE((v_changes->>'new_percentage_of_revenue')::NUMERIC, percentage_of_revenue),
        updated_at = NOW()
      WHERE id = v_request.engagement_assignment_id;

      v_result := jsonb_build_object('updated_assignment_id', v_request.engagement_assignment_id);

    WHEN 'remove_assignment' THEN
      UPDATE public.engagement_assignments
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
    FROM public.engagement_services
    WHERE engagement_id = v_request.engagement_id
      AND billing_type = 'monthly'
      AND (
        (end_date IS NULL AND is_active = true)
        OR (end_date IS NOT NULL AND end_date > CURRENT_DATE)
      );

    UPDATE public.engagements
    SET
      monthly_fee = v_new_monthly_fee,
      updated_at = NOW()
    WHERE id = v_request.engagement_id;
  END IF;

  UPDATE public.modification_requests
  SET
    status = 'applied',
    reviewed_by = COALESCE(reviewed_by, v_session_user_id),
    reviewed_at = COALESCE(reviewed_at, NOW()),
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

GRANT EXECUTE ON FUNCTION public.apply_modification_request(UUID, UUID) TO authenticated;
