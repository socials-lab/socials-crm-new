-- ============================================
-- Verify Tables Exist
-- ============================================
-- This script checks if all required tables exist in the database
-- Run this in Supabase Dashboard SQL Editor to verify migrations were applied

SELECT 
  schemaname,
  tablename,
  CASE 
    WHEN tablename IN (
      'applicants',
      'meeting_participants', 
      'creative_boost_outputs',
      'clients',
      'colleagues',
      'engagements',
      'leads',
      'user_roles',
      'meetings',
      'meeting_tasks',
      'creative_boost_client_months',
      'output_types'
    ) THEN '✓ Required'
    ELSE 'Other'
  END as status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'applicants',
    'meeting_participants',
    'creative_boost_outputs',
    'clients',
    'colleagues',
    'engagements',
    'leads',
    'user_roles',
    'meetings',
    'meeting_tasks',
    'creative_boost_client_months',
    'output_types',
    'profiles',
    'services',
    'client_contacts',
    'engagement_services',
    'engagement_assignments',
    'extra_works',
    'issued_invoices',
    'invoice_line_items',
    'engagement_history',
    'lead_history',
    'notifications',
    'feedback_ideas',
    'feedback_votes'
  )
ORDER BY status DESC, tablename;

-- Count total tables
SELECT COUNT(*) as total_public_tables
FROM pg_tables
WHERE schemaname = 'public';
