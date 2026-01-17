-- ============================================
-- Fix History Tables: Allow NULL changed_by for System/Webhook Operations
-- ============================================

-- ALTER lead_history, engagement_history, engagement_monthly_settings_history
-- to allow NULL changed_by for system/webhook operations

-- Fix lead_history table
ALTER TABLE lead_history 
  ALTER COLUMN changed_by DROP NOT NULL,
  ALTER COLUMN changed_by_name SET DEFAULT 'System';

-- Drop and recreate foreign key with SET NULL on delete
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  -- Find the constraint name
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'lead_history'::regclass
    AND confrelid = 'auth.users'::regclass
    AND contype = 'f';
  
  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE lead_history DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

ALTER TABLE lead_history 
  ADD CONSTRAINT lead_history_changed_by_fkey 
  FOREIGN KEY (changed_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Fix engagement_history table
ALTER TABLE engagement_history 
  ALTER COLUMN changed_by DROP NOT NULL,
  ALTER COLUMN changed_by_name SET DEFAULT 'System';

-- Drop and recreate foreign key with SET NULL on delete
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  -- Find the constraint name
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'engagement_history'::regclass
    AND confrelid = 'auth.users'::regclass
    AND contype = 'f';
  
  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE engagement_history DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

ALTER TABLE engagement_history 
  ADD CONSTRAINT engagement_history_changed_by_fkey 
  FOREIGN KEY (changed_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Fix engagement_monthly_settings_history table (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'engagement_monthly_settings_history') THEN
    ALTER TABLE engagement_monthly_settings_history 
      ALTER COLUMN changed_by DROP NOT NULL;
    ALTER TABLE engagement_monthly_settings_history 
      ALTER COLUMN changed_by_name SET DEFAULT 'System';
  END IF;
END $$;

-- Drop and recreate foreign key with SET NULL on delete (if table exists)
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'engagement_monthly_settings_history') THEN
    -- Find the constraint name
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'engagement_monthly_settings_history'::regclass
      AND confrelid = 'auth.users'::regclass
      AND contype = 'f';
    
    IF constraint_name IS NOT NULL THEN
      EXECUTE format('ALTER TABLE engagement_monthly_settings_history DROP CONSTRAINT %I', constraint_name);
    END IF;
    
    ALTER TABLE engagement_monthly_settings_history 
      ADD CONSTRAINT engagement_monthly_settings_history_changed_by_fkey 
      FOREIGN KEY (changed_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================
-- Update Helper Functions to Handle NULL auth.uid()
-- ============================================

-- Update log_lead_change function
CREATE OR REPLACE FUNCTION log_lead_change(
  _lead_id UUID,
  _change_type lead_change_type,
  _field_name TEXT DEFAULT NULL,
  _field_label TEXT DEFAULT NULL,
  _old_value TEXT DEFAULT NULL,
  _new_value TEXT DEFAULT NULL
) RETURNS void AS $$
DECLARE
  _user_id UUID;
  _changed_by_name TEXT;
BEGIN
  _user_id := auth.uid();
  
  IF _user_id IS NOT NULL THEN
    -- Get the full name of the current user
    SELECT full_name INTO _changed_by_name
    FROM profiles
    WHERE id = _user_id;
    
    -- If no name found, use email as fallback
    IF _changed_by_name IS NULL THEN
      SELECT email INTO _changed_by_name
      FROM profiles
      WHERE id = _user_id;
    END IF;
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
    _user_id,
    COALESCE(_changed_by_name, 'System')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update log_engagement_change function
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
  _user_id UUID;
  _changed_by_name TEXT;
BEGIN
  _user_id := auth.uid();
  
  IF _user_id IS NOT NULL THEN
    -- Get the full name or email of the current user
    SELECT COALESCE(full_name, email) INTO _changed_by_name
    FROM profiles
    WHERE id = _user_id;
  END IF;
  
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
    _user_id,
    COALESCE(_changed_by_name, 'System')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
