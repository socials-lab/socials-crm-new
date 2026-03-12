-- ============================================
-- Allow all authenticated users to read all engagements
-- ============================================
-- Requirement: all CRM users should be able to see all zakazky.
-- Keep soft-delete guards so archived records stay hidden.
-- ============================================

-- Engagements
DROP POLICY IF EXISTS "Users can view engagements for accessible clients" ON public.engagements;
DROP POLICY IF EXISTS "CRM users can view engagements" ON public.engagements;
DROP POLICY IF EXISTS "engagements_select_policy" ON public.engagements;

CREATE POLICY "engagements_select_authenticated"
  ON public.engagements
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1
      FROM public.clients
      WHERE clients.id = engagements.client_id
        AND clients.deleted_at IS NULL
    )
  );

-- Engagement services
DROP POLICY IF EXISTS "CRM users can view engagement services" ON public.engagement_services;
DROP POLICY IF EXISTS "Users can view engagement services for accessible engagements" ON public.engagement_services;
DROP POLICY IF EXISTS "eng_services_select_policy" ON public.engagement_services;

CREATE POLICY "eng_services_select_authenticated"
  ON public.engagement_services
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.engagements
      WHERE engagements.id = engagement_services.engagement_id
        AND engagements.deleted_at IS NULL
    )
  );

-- Engagement assignments
DROP POLICY IF EXISTS "CRM users can view engagement assignments" ON public.engagement_assignments;
DROP POLICY IF EXISTS "Users can view engagement assignments for accessible engagements" ON public.engagement_assignments;
DROP POLICY IF EXISTS "eng_assignments_select_policy" ON public.engagement_assignments;

CREATE POLICY "eng_assignments_select_authenticated"
  ON public.engagement_assignments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.engagements
      WHERE engagements.id = engagement_assignments.engagement_id
        AND engagements.deleted_at IS NULL
    )
  );

-- Engagement history
DROP POLICY IF EXISTS "CRM users can view engagement history" ON public.engagement_history;
DROP POLICY IF EXISTS "Users can view history for accessible engagements" ON public.engagement_history;
DROP POLICY IF EXISTS "eng_history_select_policy" ON public.engagement_history;

CREATE POLICY "eng_history_select_authenticated"
  ON public.engagement_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.engagements
      WHERE engagements.id = engagement_history.engagement_id
        AND engagements.deleted_at IS NULL
    )
  );
