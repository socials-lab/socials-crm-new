SET ROLE postgres;
-- Planned engagements used by analytics forecast
CREATE TABLE public.planned_engagements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  client_name TEXT NOT NULL,
  lead_id UUID NULL REFERENCES public.leads(id) ON DELETE SET NULL,
  monthly_fee NUMERIC NOT NULL CHECK (monthly_fee >= 0),
  start_date DATE NOT NULL,
  assigned_colleague_ids UUID[] NOT NULL DEFAULT '{}',
  notes TEXT NOT NULL DEFAULT '',
  probability_percent INTEGER NOT NULL CHECK (probability_percent >= 0 AND probability_percent <= 100),
  created_by UUID NULL REFERENCES public.colleagues(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER update_planned_engagements_updated_at
  BEFORE UPDATE ON public.planned_engagements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
ALTER TABLE public.planned_engagements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "planned_engagements_select"
  ON public.planned_engagements
  FOR SELECT
  USING (has_crm_access(auth.uid()));
CREATE POLICY "planned_engagements_insert"
  ON public.planned_engagements
  FOR INSERT
  WITH CHECK (has_crm_access(auth.uid()));
CREATE POLICY "planned_engagements_update"
  ON public.planned_engagements
  FOR UPDATE
  USING (has_crm_access(auth.uid()))
  WITH CHECK (has_crm_access(auth.uid()));
CREATE POLICY "planned_engagements_delete"
  ON public.planned_engagements
  FOR DELETE
  USING (has_crm_access(auth.uid()));
CREATE INDEX idx_planned_engagements_start_date
  ON public.planned_engagements (start_date);
-- Revenue targets by month for yearly planning
CREATE TABLE public.revenue_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL CHECK (year >= 2020 AND year <= 2100),
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  target_revenue NUMERIC NOT NULL CHECK (target_revenue >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT revenue_targets_year_month_unique UNIQUE (year, month)
);
CREATE TRIGGER update_revenue_targets_updated_at
  BEFORE UPDATE ON public.revenue_targets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
ALTER TABLE public.revenue_targets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "revenue_targets_select"
  ON public.revenue_targets
  FOR SELECT
  USING (has_crm_access(auth.uid()));
CREATE POLICY "revenue_targets_insert"
  ON public.revenue_targets
  FOR INSERT
  WITH CHECK (is_admin_or_management(auth.uid()));
CREATE POLICY "revenue_targets_update"
  ON public.revenue_targets
  FOR UPDATE
  USING (is_admin_or_management(auth.uid()))
  WITH CHECK (is_admin_or_management(auth.uid()));
CREATE POLICY "revenue_targets_delete"
  ON public.revenue_targets
  FOR DELETE
  USING (is_admin_or_management(auth.uid()));
