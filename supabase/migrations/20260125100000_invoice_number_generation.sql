-- Migration: Add atomic invoice number generation with locking
-- Prevents race condition when multiple users create invoices simultaneously

-- =============================================================================
-- STEP 1: Create advisory lock helper functions
-- =============================================================================

-- Get a lock for invoice number generation (prevents concurrent access)
CREATE OR REPLACE FUNCTION acquire_invoice_number_lock()
RETURNS VOID AS $$
BEGIN
  -- Use advisory lock with a fixed key for invoice generation
  -- Key: 1 (namespace) + year as second part for year-specific locking
  PERFORM pg_advisory_lock(1, EXTRACT(YEAR FROM CURRENT_DATE)::INT);
END;
$$ LANGUAGE plpgsql;

-- Release the lock
CREATE OR REPLACE FUNCTION release_invoice_number_lock()
RETURNS VOID AS $$
BEGIN
  PERFORM pg_advisory_unlock(1, EXTRACT(YEAR FROM CURRENT_DATE)::INT);
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- STEP 2: Create atomic invoice number generation function
-- =============================================================================

CREATE OR REPLACE FUNCTION generate_invoice_number(p_year INT DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
  v_year INT;
  v_next_num INT;
  v_invoice_number TEXT;
BEGIN
  -- Use provided year or current year
  v_year := COALESCE(p_year, EXTRACT(YEAR FROM CURRENT_DATE)::INT);

  -- Acquire advisory lock for this year
  PERFORM pg_advisory_lock(1, v_year);

  BEGIN
    -- Find the maximum invoice number for this year
    SELECT COALESCE(
      MAX(
        CASE
          WHEN invoice_number ~ ('^FV-' || v_year || '-\d+$')
          THEN CAST(SUBSTRING(invoice_number FROM 'FV-\d{4}-(\d+)') AS INT)
          ELSE 0
        END
      ),
      0
    ) + 1
    INTO v_next_num
    FROM issued_invoices
    WHERE year = v_year;

    -- Format: FV-YYYY-NNN (zero-padded to at least 3 digits)
    v_invoice_number := 'FV-' || v_year || '-' || LPAD(v_next_num::TEXT, 3, '0');

    -- Release lock
    PERFORM pg_advisory_unlock(1, v_year);

    RETURN v_invoice_number;
  EXCEPTION WHEN OTHERS THEN
    -- Make sure to release lock on error
    PERFORM pg_advisory_unlock(1, v_year);
    RAISE;
  END;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- STEP 3: Create transactional invoice creation function
-- =============================================================================

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
  p_issued_by UUID
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

  RETURN v_invoice;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- STEP 4: Grant execute permission
-- =============================================================================

GRANT EXECUTE ON FUNCTION generate_invoice_number(INT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_invoice_with_items(UUID, TEXT, UUID, TEXT, INT, INT, JSONB, NUMERIC, TEXT, UUID) TO authenticated;

-- =============================================================================
-- Success message
-- =============================================================================
DO $$
BEGIN
  RAISE NOTICE 'Successfully created invoice number generation functions:';
  RAISE NOTICE '  - generate_invoice_number(year): Atomic invoice number generation with advisory locking';
  RAISE NOTICE '  - create_invoice_with_items(...): Transactional invoice creation with line items';
END $$;
