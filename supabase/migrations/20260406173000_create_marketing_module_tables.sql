SET ROLE postgres;

CREATE TABLE IF NOT EXISTS public.marketing_monthly_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL CHECK (year >= 2020 AND year <= 2100),
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  planned_total_budget NUMERIC NOT NULL DEFAULT 0 CHECK (planned_total_budget >= 0),
  planned_labor_budget NUMERIC NOT NULL DEFAULT 0 CHECK (planned_labor_budget >= 0),
  planned_meta_budget NUMERIC NOT NULL DEFAULT 0 CHECK (planned_meta_budget >= 0),
  planned_ppc_budget NUMERIC NOT NULL DEFAULT 0 CHECK (planned_ppc_budget >= 0),
  planned_leads INTEGER NOT NULL DEFAULT 0 CHECK (planned_leads >= 0),
  planned_new_clients INTEGER NOT NULL DEFAULT 0 CHECK (planned_new_clients >= 0),
  notes TEXT NOT NULL DEFAULT '',
  created_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT marketing_monthly_plans_year_month_unique UNIQUE (year, month)
);

CREATE TABLE IF NOT EXISTS public.marketing_work_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  colleague_id UUID NOT NULL REFERENCES public.colleagues(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('content_manager', 'video_editor', 'graphic_designer')),
  activity_date DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NULL,
  hours NUMERIC NULL CHECK (hours IS NULL OR hours >= 0),
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  created_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.marketing_ad_spend_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL CHECK (year >= 2020 AND year <= 2100),
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  spend_date DATE NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('meta', 'ppc', 'other')),
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  note TEXT NULL,
  created_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS update_marketing_monthly_plans_updated_at ON public.marketing_monthly_plans;
CREATE TRIGGER update_marketing_monthly_plans_updated_at
  BEFORE UPDATE ON public.marketing_monthly_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_marketing_work_logs_updated_at ON public.marketing_work_logs;
CREATE TRIGGER update_marketing_work_logs_updated_at
  BEFORE UPDATE ON public.marketing_work_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_marketing_ad_spend_entries_updated_at ON public.marketing_ad_spend_entries;
CREATE TRIGGER update_marketing_ad_spend_entries_updated_at
  BEFORE UPDATE ON public.marketing_ad_spend_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_marketing_work_logs_activity_date
  ON public.marketing_work_logs (activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_marketing_work_logs_colleague_id
  ON public.marketing_work_logs (colleague_id);
CREATE INDEX IF NOT EXISTS idx_marketing_ad_spend_entries_year_month
  ON public.marketing_ad_spend_entries (year, month);

ALTER TABLE public.marketing_monthly_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_work_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_ad_spend_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "marketing_monthly_plans_select" ON public.marketing_monthly_plans;
CREATE POLICY "marketing_monthly_plans_select"
  ON public.marketing_monthly_plans
  FOR SELECT
  USING (has_crm_access(auth.uid()));

DROP POLICY IF EXISTS "marketing_monthly_plans_insert" ON public.marketing_monthly_plans;
CREATE POLICY "marketing_monthly_plans_insert"
  ON public.marketing_monthly_plans
  FOR INSERT
  WITH CHECK (is_admin_or_management(auth.uid()) OR is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "marketing_monthly_plans_update" ON public.marketing_monthly_plans;
CREATE POLICY "marketing_monthly_plans_update"
  ON public.marketing_monthly_plans
  FOR UPDATE
  USING (is_admin_or_management(auth.uid()) OR is_super_admin(auth.uid()))
  WITH CHECK (is_admin_or_management(auth.uid()) OR is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "marketing_monthly_plans_delete" ON public.marketing_monthly_plans;
CREATE POLICY "marketing_monthly_plans_delete"
  ON public.marketing_monthly_plans
  FOR DELETE
  USING (is_admin_or_management(auth.uid()) OR is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "marketing_work_logs_select" ON public.marketing_work_logs;
CREATE POLICY "marketing_work_logs_select"
  ON public.marketing_work_logs
  FOR SELECT
  USING (has_crm_access(auth.uid()));

DROP POLICY IF EXISTS "marketing_work_logs_insert" ON public.marketing_work_logs;
CREATE POLICY "marketing_work_logs_insert"
  ON public.marketing_work_logs
  FOR INSERT
  WITH CHECK (
    has_crm_access(auth.uid()) AND (
      is_admin_or_management(auth.uid()) OR
      is_super_admin(auth.uid()) OR
      colleague_id IN (SELECT id FROM public.colleagues WHERE profile_id = auth.uid())
    )
  );

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

DROP POLICY IF EXISTS "marketing_work_logs_delete" ON public.marketing_work_logs;
CREATE POLICY "marketing_work_logs_delete"
  ON public.marketing_work_logs
  FOR DELETE
  USING (
    is_admin_or_management(auth.uid()) OR
    is_super_admin(auth.uid())
  );

DROP POLICY IF EXISTS "marketing_ad_spend_entries_select" ON public.marketing_ad_spend_entries;
CREATE POLICY "marketing_ad_spend_entries_select"
  ON public.marketing_ad_spend_entries
  FOR SELECT
  USING (has_crm_access(auth.uid()));

DROP POLICY IF EXISTS "marketing_ad_spend_entries_insert" ON public.marketing_ad_spend_entries;
CREATE POLICY "marketing_ad_spend_entries_insert"
  ON public.marketing_ad_spend_entries
  FOR INSERT
  WITH CHECK (is_admin_or_management(auth.uid()) OR is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "marketing_ad_spend_entries_update" ON public.marketing_ad_spend_entries;
CREATE POLICY "marketing_ad_spend_entries_update"
  ON public.marketing_ad_spend_entries
  FOR UPDATE
  USING (is_admin_or_management(auth.uid()) OR is_super_admin(auth.uid()))
  WITH CHECK (is_admin_or_management(auth.uid()) OR is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "marketing_ad_spend_entries_delete" ON public.marketing_ad_spend_entries;
CREATE POLICY "marketing_ad_spend_entries_delete"
  ON public.marketing_ad_spend_entries
  FOR DELETE
  USING (is_admin_or_management(auth.uid()) OR is_super_admin(auth.uid()));

