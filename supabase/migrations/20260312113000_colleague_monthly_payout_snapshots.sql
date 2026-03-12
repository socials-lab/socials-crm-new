-- Monthly close + snapshot model for Colleagues "Odměny + výkazy".
-- Closed months must be immutable and rendered from snapshot data only.

CREATE TABLE IF NOT EXISTS public.payout_month_closures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year integer NOT NULL CHECK (year >= 2000 AND year <= 2200),
  month integer NOT NULL CHECK (month BETWEEN 1 AND 12),
  closed_at timestamptz NOT NULL DEFAULT now(),
  closed_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  closed_by_name text NOT NULL DEFAULT 'System',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (year, month)
);

CREATE TABLE IF NOT EXISTS public.colleague_monthly_payout_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year integer NOT NULL CHECK (year >= 2000 AND year <= 2200),
  month integer NOT NULL CHECK (month BETWEEN 1 AND 12),
  colleague_id uuid NOT NULL REFERENCES public.colleagues(id) ON DELETE RESTRICT,
  client_total numeric(12,2) NOT NULL DEFAULT 0,
  marketing_total numeric(12,2) NOT NULL DEFAULT 0,
  internal_total numeric(12,2) NOT NULL DEFAULT 0,
  grand_total numeric(12,2) NOT NULL DEFAULT 0,
  item_count integer NOT NULL DEFAULT 0,
  line_items jsonb NOT NULL DEFAULT '{}'::jsonb,
  closure_id uuid NULL REFERENCES public.payout_month_closures(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (year, month, colleague_id)
);

CREATE INDEX IF NOT EXISTS idx_payout_month_closures_year_month
ON public.payout_month_closures(year, month);

CREATE INDEX IF NOT EXISTS idx_colleague_monthly_payout_snapshots_year_month
ON public.colleague_monthly_payout_snapshots(year, month);

CREATE INDEX IF NOT EXISTS idx_colleague_monthly_payout_snapshots_colleague
ON public.colleague_monthly_payout_snapshots(colleague_id);

CREATE TRIGGER update_payout_month_closures_updated_at
BEFORE UPDATE ON public.payout_month_closures
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_colleague_monthly_payout_snapshots_updated_at
BEFORE UPDATE ON public.colleague_monthly_payout_snapshots
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.payout_month_closures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colleague_monthly_payout_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS payout_month_closures_select_authenticated ON public.payout_month_closures;
CREATE POLICY payout_month_closures_select_authenticated
ON public.payout_month_closures
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS payout_month_closures_mutate_super_admin ON public.payout_month_closures;
CREATE POLICY payout_month_closures_mutate_super_admin
ON public.payout_month_closures
FOR ALL
TO authenticated
USING (public.get_user_role(auth.uid()) = 'admin')
WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

DROP POLICY IF EXISTS colleague_monthly_payout_snapshots_select_authenticated ON public.colleague_monthly_payout_snapshots;
CREATE POLICY colleague_monthly_payout_snapshots_select_authenticated
ON public.colleague_monthly_payout_snapshots
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS colleague_monthly_payout_snapshots_mutate_super_admin ON public.colleague_monthly_payout_snapshots;
CREATE POLICY colleague_monthly_payout_snapshots_mutate_super_admin
ON public.colleague_monthly_payout_snapshots
FOR ALL
TO authenticated
USING (public.get_user_role(auth.uid()) = 'admin')
WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

CREATE OR REPLACE FUNCTION public.close_colleague_payout_month(
  p_year integer,
  p_month integer,
  p_snapshots jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role app_role;
  v_user_id uuid;
  v_user_name text;
  v_current_month_start date;
  v_target_month_start date;
  v_closure_id uuid;
BEGIN
  IF p_month < 1 OR p_month > 12 THEN
    RAISE EXCEPTION 'Invalid month %', p_month;
  END IF;

  v_user_id := auth.uid();
  v_role := public.get_user_role(v_user_id);
  IF v_role IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Only admin can close payout month.';
  END IF;

  v_current_month_start := date_trunc('month', now())::date;
  v_target_month_start := make_date(p_year, p_month, 1);
  IF v_target_month_start >= v_current_month_start THEN
    RAISE EXCEPTION 'Only past months can be closed.';
  END IF;

  SELECT COALESCE(full_name, email, 'System')
  INTO v_user_name
  FROM public.profiles
  WHERE id = v_user_id;

  INSERT INTO public.payout_month_closures (year, month, closed_at, closed_by, closed_by_name)
  VALUES (p_year, p_month, now(), v_user_id, COALESCE(v_user_name, 'System'))
  ON CONFLICT (year, month)
  DO UPDATE SET
    closed_at = EXCLUDED.closed_at,
    closed_by = EXCLUDED.closed_by,
    closed_by_name = EXCLUDED.closed_by_name,
    updated_at = now()
  RETURNING id INTO v_closure_id;

  DELETE FROM public.colleague_monthly_payout_snapshots
  WHERE year = p_year AND month = p_month;

  INSERT INTO public.colleague_monthly_payout_snapshots (
    year,
    month,
    colleague_id,
    client_total,
    marketing_total,
    internal_total,
    grand_total,
    item_count,
    line_items,
    closure_id
  )
  SELECT
    p_year,
    p_month,
    payload.colleague_id,
    payload.client_total,
    payload.marketing_total,
    payload.internal_total,
    payload.grand_total,
    payload.item_count,
    payload.line_items,
    v_closure_id
  FROM jsonb_to_recordset(p_snapshots) AS payload(
    colleague_id uuid,
    client_total numeric,
    marketing_total numeric,
    internal_total numeric,
    grand_total numeric,
    item_count integer,
    line_items jsonb
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.close_colleague_payout_month(integer, integer, jsonb) TO authenticated;
