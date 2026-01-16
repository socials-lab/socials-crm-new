-- ============================================
-- Reload PostgREST Schema Cache
-- ============================================
-- Run this in Supabase Dashboard SQL Editor:
-- https://supabase.com/dashboard/project/bkemtvqmbpxopuasgxcq/sql
-- 
-- This tells PostgREST to reload its schema cache
-- so it recognizes newly created tables.
-- ============================================

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

-- Verify tables exist
SELECT 'Tables in public schema:' as info;

SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'applicants',
    'meeting_participants',
    'meeting_tasks',
    'feedback_ideas',
    'feedback_votes',
    'creative_boost_client_months',
    'creative_boost_outputs'
  )
ORDER BY tablename;

-- If you see all 7 tables listed, the schema is correct.
-- Wait a few seconds after running this, then refresh your app.
