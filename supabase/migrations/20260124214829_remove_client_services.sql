-- ============================================
-- Remove unused client_services table
-- Services are tracked via engagement_services instead
-- ============================================

-- First check if table has any data
DO $$
DECLARE
  row_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO row_count FROM client_services;
  IF row_count > 0 THEN
    RAISE WARNING 'client_services table has % rows - verify data before removing', row_count;
  END IF;
END $$;

-- Drop RLS policies first
DROP POLICY IF EXISTS "CRM users can view client services" ON client_services;
DROP POLICY IF EXISTS "Admins can insert client services" ON client_services;
DROP POLICY IF EXISTS "Admins can update client services" ON client_services;
DROP POLICY IF EXISTS "Admins can delete client services" ON client_services;

-- Drop the table
DROP TABLE IF EXISTS client_services CASCADE;
