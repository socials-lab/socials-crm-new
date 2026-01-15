-- ============================================
-- Review Fixes + Sub-Plan 05: Engagements
-- ============================================

-- ============================================
-- Fix: Update get_user_role to check is_active
-- ============================================

CREATE OR REPLACE FUNCTION get_user_role(_user_id UUID)
RETURNS app_role AS $$
DECLARE
  _role app_role;
BEGIN
  SELECT role INTO _role
  FROM user_roles
  WHERE user_id = _user_id AND is_active = TRUE;
  
  RETURN COALESCE(_role, NULL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Engagement History Helper Function
-- ============================================

CREATE OR REPLACE FUNCTION log_engagement_change(
  _engagement_id UUID,
  _change_type engagement_change_type,
  _field_name TEXT DEFAULT NULL,
  _field_label TEXT DEFAULT NULL,
  _old_value TEXT DEFAULT NULL,
  _new_value TEXT DEFAULT NULL,
  _related_entity_id UUID DEFAULT NULL,
  _related_entity_name TEXT DEFAULT NULL
) RETURNS void AS $$
DECLARE
  _changed_by_name TEXT;
BEGIN
  -- Get the full name of the current user
  SELECT COALESCE(full_name, email) INTO _changed_by_name
  FROM profiles
  WHERE id = auth.uid();
  
  -- Insert history entry
  INSERT INTO engagement_history (
    engagement_id,
    change_type,
    field_name,
    field_label,
    old_value,
    new_value,
    related_entity_id,
    related_entity_name,
    changed_by,
    changed_by_name
  ) VALUES (
    _engagement_id,
    _change_type,
    _field_name,
    _field_label,
    _old_value,
    _new_value,
    _related_entity_id,
    _related_entity_name,
    auth.uid(),
    COALESCE(_changed_by_name, 'Unknown')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
