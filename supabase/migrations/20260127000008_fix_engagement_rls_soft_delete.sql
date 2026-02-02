-- Migration: Fix RLS policies to filter soft-deleted engagements
-- Ensures deleted_at IS NULL is checked at the database level

-- ============================================
-- Engagements RLS
-- ============================================

-- Drop existing policy
DROP POLICY IF EXISTS "Users can view engagements for accessible clients" ON engagements;
DROP POLICY IF EXISTS "CRM users can view engagements" ON engagements;
DROP POLICY IF EXISTS "engagements_select_policy" ON engagements;

-- Create updated policy that filters soft-deleted engagements
CREATE POLICY "engagements_select_policy"
  ON engagements FOR SELECT
  USING (
    -- Engagement must not be soft-deleted
    deleted_at IS NULL AND
    -- Parent client must not be soft-deleted
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = engagements.client_id
        AND clients.deleted_at IS NULL
    ) AND
    -- User must have access
    (
      has_full_client_access(auth.uid()) OR
      is_assigned_to_client(auth.uid(), client_id)
    )
  );

-- ============================================
-- Engagement Services RLS
-- ============================================

-- Drop existing policy
DROP POLICY IF EXISTS "CRM users can view engagement services" ON engagement_services;
DROP POLICY IF EXISTS "Users can view engagement services for accessible engagements" ON engagement_services;
DROP POLICY IF EXISTS "eng_services_select_policy" ON engagement_services;

-- Create updated policy that filters by engagement's deleted_at
CREATE POLICY "eng_services_select_policy"
  ON engagement_services FOR SELECT
  USING (
    -- Parent engagement must not be soft-deleted
    EXISTS (
      SELECT 1 FROM engagements
      WHERE engagements.id = engagement_services.engagement_id
        AND engagements.deleted_at IS NULL
    ) AND
    -- User must have access via engagement's client
    EXISTS (
      SELECT 1 FROM engagements
      WHERE engagements.id = engagement_services.engagement_id
        AND (
          has_full_client_access(auth.uid()) OR
          is_assigned_to_client(auth.uid(), engagements.client_id)
        )
    )
  );

-- ============================================
-- Engagement Assignments RLS
-- ============================================

-- Drop existing policy
DROP POLICY IF EXISTS "CRM users can view engagement assignments" ON engagement_assignments;
DROP POLICY IF EXISTS "Users can view engagement assignments for accessible engagements" ON engagement_assignments;
DROP POLICY IF EXISTS "eng_assignments_select_policy" ON engagement_assignments;

-- Create updated policy that filters by engagement's deleted_at
CREATE POLICY "eng_assignments_select_policy"
  ON engagement_assignments FOR SELECT
  USING (
    -- Parent engagement must not be soft-deleted
    EXISTS (
      SELECT 1 FROM engagements
      WHERE engagements.id = engagement_assignments.engagement_id
        AND engagements.deleted_at IS NULL
    ) AND
    -- User must have access
    EXISTS (
      SELECT 1 FROM engagements
      WHERE engagements.id = engagement_assignments.engagement_id
        AND (
          has_full_client_access(auth.uid()) OR
          is_assigned_to_client(auth.uid(), engagements.client_id)
        )
    )
  );

-- ============================================
-- Engagement History RLS
-- ============================================

-- Drop existing policy
DROP POLICY IF EXISTS "CRM users can view engagement history" ON engagement_history;
DROP POLICY IF EXISTS "Users can view history for accessible engagements" ON engagement_history;
DROP POLICY IF EXISTS "eng_history_select_policy" ON engagement_history;

-- Create updated policy that filters by engagement's deleted_at
CREATE POLICY "eng_history_select_policy"
  ON engagement_history FOR SELECT
  USING (
    -- Parent engagement must not be soft-deleted
    EXISTS (
      SELECT 1 FROM engagements
      WHERE engagements.id = engagement_history.engagement_id
        AND engagements.deleted_at IS NULL
    ) AND
    -- User must have access
    EXISTS (
      SELECT 1 FROM engagements
      WHERE engagements.id = engagement_history.engagement_id
        AND (
          has_full_client_access(auth.uid()) OR
          is_assigned_to_client(auth.uid(), engagements.client_id)
        )
    )
  );

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Updated RLS policies with shorter names to avoid identifier truncation';
END $$;
