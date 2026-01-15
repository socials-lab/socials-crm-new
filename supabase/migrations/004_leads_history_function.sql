-- ============================================
-- Sub-Plan 04: Leads Pipeline - History Helper Function
-- ============================================

-- Helper function to log lead changes consistently
CREATE OR REPLACE FUNCTION log_lead_change(
  _lead_id UUID,
  _change_type lead_change_type,
  _field_name TEXT DEFAULT NULL,
  _field_label TEXT DEFAULT NULL,
  _old_value TEXT DEFAULT NULL,
  _new_value TEXT DEFAULT NULL
) RETURNS void AS $$
DECLARE
  _changed_by_name TEXT;
BEGIN
  -- Get the full name of the current user
  SELECT full_name INTO _changed_by_name
  FROM profiles
  WHERE id = auth.uid();
  
  -- If no name found, use email as fallback
  IF _changed_by_name IS NULL THEN
    SELECT email INTO _changed_by_name
    FROM profiles
    WHERE id = auth.uid();
  END IF;
  
  -- Insert history entry
  INSERT INTO lead_history (
    lead_id,
    change_type,
    field_name,
    field_label,
    old_value,
    new_value,
    changed_by,
    changed_by_name
  ) VALUES (
    _lead_id,
    _change_type,
    _field_name,
    _field_label,
    _old_value,
    _new_value,
    auth.uid(),
    COALESCE(_changed_by_name, 'Unknown')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
