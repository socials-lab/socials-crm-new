-- Migration: Fix create_invoice_with_items date casting for period_start/period_end
-- Error fixed: column "period_start" is of type date but expression is of type text

CREATE OR REPLACE FUNCTION create_invoice_with_items(
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
RETURNS issued_invoices AS $$
DECLARE
  v_invoice issued_invoices;
  v_invoice_number TEXT;
  v_line_item JSONB;
  v_actual_days_in_month INT;
  v_line_currency TEXT;
  v_total_credits INT := 0;
  v_total_amount NUMERIC := 0;
  v_extra_updated INT;
BEGIN
  -- Validate: p_currency must be in allowed set
  IF p_currency IS NULL OR p_currency NOT IN ('CZK', 'EUR', 'USD') THEN
    RAISE EXCEPTION 'Invoice currency must be CZK, EUR, or USD, got %', p_currency;
  END IF;

  -- Validate: all line item currencies must match p_currency
  FOR v_line_item IN SELECT * FROM jsonb_array_elements(p_line_items)
  LOOP
    v_line_currency := COALESCE(v_line_item->>'currency', 'CZK');
    IF v_line_currency != p_currency THEN
      RAISE EXCEPTION 'Line item currency (%) must match invoice currency (%)',
        v_line_currency, p_currency;
    END IF;
  END LOOP;

  -- Calculate actual days in month
  v_actual_days_in_month := days_in_month(p_year, p_month);

  -- Generate unique invoice number with locking
  v_invoice_number := generate_invoice_number(p_year);

  -- Insert the invoice
  INSERT INTO issued_invoices (
    engagement_id,
    engagement_name,
    client_id,
    client_name,
    year,
    month,
    invoice_number,
    line_items,
    total_amount,
    currency,
    issued_at,
    issued_by
  ) VALUES (
    p_engagement_id,
    p_engagement_name,
    p_client_id,
    p_client_name,
    p_year,
    p_month,
    v_invoice_number,
    p_line_items,
    p_total_amount,
    p_currency,
    NOW(),
    p_issued_by
  ) RETURNING * INTO v_invoice;

  -- Insert line items (currency enforced by trigger; ensure each uses p_currency)
  FOR v_line_item IN SELECT * FROM jsonb_array_elements(p_line_items)
  LOOP
    INSERT INTO invoice_line_items (
      invoice_id,
      source,
      engagement_id,
      extra_work_id,
      engagement_service_id,
      source_description,
      source_amount,
      period_start,
      period_end,
      prorated_days,
      total_days_in_month,
      prorated_amount,
      line_description,
      unit_price,
      quantity,
      adjustment_amount,
      adjustment_reason,
      final_amount,
      is_approved,
      note,
      hours,
      hourly_rate,
      currency,
      is_reverse_charge,
      vat_rate,
      unit_name
    ) VALUES (
      v_invoice.id,
      (v_line_item->>'source')::line_item_source,
      (v_line_item->>'engagement_id')::UUID,
      (v_line_item->>'extra_work_id')::UUID,
      (v_line_item->>'engagement_service_id')::UUID,
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

  -- Mark extra works as invoiced (only ready_to_invoice)
  IF array_length(p_extra_work_ids, 1) > 0 THEN
    UPDATE extra_works
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

  -- Mark one-off services as invoiced
  IF array_length(p_one_off_service_ids, 1) > 0 THEN
    UPDATE engagement_services
    SET invoicing_status = 'invoiced',
        invoice_id = v_invoice.id,
        invoiced_at = NOW(),
        invoiced_in_period = p_year || '-' || LPAD(p_month::TEXT, 2, '0'),
        updated_at = NOW()
    WHERE id = ANY(p_one_off_service_ids);
  END IF;

  -- Mark Creative Boost client months as invoiced
  IF array_length(p_creative_boost_client_month_ids, 1) > 0 THEN
    SELECT
      COALESCE(SUM((elem->>'quantity')::INT), 0),
      COALESCE(SUM((elem->>'unit_price')::NUMERIC * COALESCE((elem->>'quantity')::NUMERIC, 1)), 0)
    INTO v_total_credits, v_total_amount
    FROM jsonb_array_elements(p_line_items) elem
    WHERE (elem->>'source') = 'creative_boost';

    UPDATE creative_boost_client_months
    SET invoice_id = v_invoice.id,
        invoiced_at = NOW(),
        invoiced_credits = v_total_credits,
        invoiced_amount = v_total_amount
    WHERE id = ANY(p_creative_boost_client_month_ids);
  END IF;

  RETURN v_invoice;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION create_invoice_with_items(UUID, TEXT, UUID, TEXT, INT, INT, JSONB, NUMERIC, TEXT, UUID, UUID[], UUID[], UUID[]) TO authenticated;
