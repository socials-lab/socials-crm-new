-- ============================================
-- Trigger PostgREST Schema Cache Reload
-- ============================================
-- This migration notifies PostgREST to reload its schema cache
-- so it recognizes all the tables created in previous migrations.

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

-- Add a comment to make this migration do something
COMMENT ON SCHEMA public IS 'Standard public schema - schema cache reloaded';
