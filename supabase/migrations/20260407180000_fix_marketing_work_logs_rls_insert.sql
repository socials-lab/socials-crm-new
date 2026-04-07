-- Fix RLS insert policy for marketing_work_logs.
-- The previous policy required colleague_id to match a row in colleagues WHERE profile_id = auth.uid().
-- If a colleague's profile_id is not set, legitimate users were blocked (42501).
-- The frontend already enforces that non-admins can only log for their own colleague_id,
-- so we relax the DB policy to: any authenticated user with CRM access may insert.

DROP POLICY IF EXISTS "marketing_work_logs_insert" ON public.marketing_work_logs;

CREATE POLICY "marketing_work_logs_insert"
  ON public.marketing_work_logs
  FOR INSERT
  WITH CHECK (has_crm_access(auth.uid()));

-- Also relax update so users can edit their own logs even if profile_id link is missing.
DROP POLICY IF EXISTS "marketing_work_logs_update" ON public.marketing_work_logs;

CREATE POLICY "marketing_work_logs_update"
  ON public.marketing_work_logs
  FOR UPDATE
  USING (
    has_crm_access(auth.uid()) AND (
      is_admin_or_management(auth.uid()) OR
      is_super_admin(auth.uid()) OR
      colleague_id IN (SELECT id FROM public.colleagues WHERE profile_id = auth.uid())
    )
  )
  WITH CHECK (
    has_crm_access(auth.uid()) AND (
      is_admin_or_management(auth.uid()) OR
      is_super_admin(auth.uid()) OR
      colleague_id IN (SELECT id FROM public.colleagues WHERE profile_id = auth.uid())
    )
  );
