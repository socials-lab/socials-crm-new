-- Migration: Enhance invoice creation to handle extra works and one-off services atomically

-- Update create_invoice_with_items to also mark related items as invoiced
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
  p_one_off_service_ids UUID[] DEFAULT '{}'
)
RETURNS issued_invoices AS $$
DECLARE
  v_invoice issued_invoices;
  v_invoice_number TEXT;
  v_line_item JSONB;
BEGIN
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

  -- Insert line items into separate table
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
      COALESCE(v_line_item->>'period_start', CURRENT_DATE::TEXT),
      COALESCE(v_line_item->>'period_end', CURRENT_DATE::TEXT),
      COALESCE((v_line_item->>'prorated_days')::INT, 0),
      COALESCE((v_line_item->>'total_days_in_month')::INT, 30),
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
      COALESCE(v_line_item->>'currency', 'CZK'),
      COALESCE((v_line_item->>'is_reverse_charge')::BOOLEAN, false),
      COALESCE((v_line_item->>'vat_rate')::NUMERIC, 21),
      COALESCE(v_line_item->>'unit_name', 'ks')
    );
  END LOOP;

  -- Mark extra works as invoiced (if any provided)
  IF array_length(p_extra_work_ids, 1) > 0 THEN
    UPDATE extra_works
    SET status = 'invoiced',
        invoice_id = v_invoice.id,
        invoice_number = v_invoice_number,
        invoiced_at = NOW(),
        updated_at = NOW()
    WHERE id = ANY(p_extra_work_ids);
  END IF;

  -- Mark one-off services as invoiced (if any provided)
  IF array_length(p_one_off_service_ids, 1) > 0 THEN
    UPDATE engagement_services
    SET invoicing_status = 'invoiced',
        invoice_id = v_invoice.id,
        invoiced_at = NOW(),
        invoiced_in_period = p_year || '-' || LPAD(p_month::TEXT, 2, '0'),
        updated_at = NOW()
    WHERE id = ANY(p_one_off_service_ids);
  END IF;

  RETURN v_invoice;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permission for the updated function
GRANT EXECUTE ON FUNCTION create_invoice_with_items(UUID, TEXT, UUID, TEXT, INT, INT, JSONB, NUMERIC, TEXT, UUID, UUID[], UUID[]) TO authenticated;

DO $$
BEGIN
  RAISE NOTICE 'Enhanced create_invoice_with_items function:';
  RAISE NOTICE '  - Now marks extra_works as invoiced atomically';
  RAISE NOTICE '  - Now marks one-off services as invoiced atomically';
  RAISE NOTICE '  - All operations in single transaction';
END $$;
