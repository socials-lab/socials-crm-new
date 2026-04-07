SET ROLE postgres;

-- Allow users with CRM access to update/delete their own marketing logs.
-- Keep admin/management/super-admin access unchanged.

DROP POLICY IF EXISTS "marketing_work_logs_update" ON public.marketing_work_logs;

CREATE POLICY "marketing_work_logs_update"
  ON public.marketing_work_logs
  FOR UPDATE
  USING (
    has_crm_access(auth.uid()) AND (
      is_admin_or_management(auth.uid()) OR
      is_super_admin(auth.uid()) OR
      colleague_id = get_colleague_id(auth.uid())
    )
  )
  WITH CHECK (
    has_crm_access(auth.uid()) AND (
      is_admin_or_management(auth.uid()) OR
      is_super_admin(auth.uid()) OR
      colleague_id = get_colleague_id(auth.uid())
    )
  );

DROP POLICY IF EXISTS "marketing_work_logs_delete" ON public.marketing_work_logs;

CREATE POLICY "marketing_work_logs_delete"
  ON public.marketing_work_logs
  FOR DELETE
  USING (
    has_crm_access(auth.uid()) AND (
      is_admin_or_management(auth.uid()) OR
      is_super_admin(auth.uid()) OR
      colleague_id = get_colleague_id(auth.uid())
    )
  );
