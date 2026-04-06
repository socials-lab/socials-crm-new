SET ROLE postgres;

ALTER TABLE public.activity_rewards
  ADD COLUMN IF NOT EXISTS marketing_work_log_id UUID NULL REFERENCES public.marketing_work_logs(id) ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS ux_activity_rewards_marketing_work_log_id
  ON public.activity_rewards (marketing_work_log_id)
  WHERE marketing_work_log_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.sync_marketing_work_log_to_activity_reward()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_billing_type TEXT;
  v_hourly_rate NUMERIC;
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.activity_rewards
    WHERE marketing_work_log_id = OLD.id;
    RETURN OLD;
  END IF;

  v_billing_type := CASE WHEN COALESCE(NEW.hours, 0) > 0 THEN 'hourly' ELSE 'fixed' END;
  v_hourly_rate := CASE
    WHEN COALESCE(NEW.hours, 0) > 0 THEN ROUND(NEW.amount / NULLIF(NEW.hours, 0), 2)
    ELSE NULL
  END;

  INSERT INTO public.activity_rewards (
    colleague_id,
    category,
    description,
    invoice_item_name,
    billing_type,
    amount,
    hours,
    hourly_rate,
    activity_date,
    client_name,
    marketing_work_log_id
  )
  VALUES (
    NEW.colleague_id,
    'marketing',
    COALESCE(NULLIF(BTRIM(NEW.description), ''), NEW.title),
    'Marketing – ' || NEW.title,
    v_billing_type,
    NEW.amount,
    CASE WHEN COALESCE(NEW.hours, 0) > 0 THEN NEW.hours ELSE NULL END,
    v_hourly_rate,
    NEW.activity_date,
    '__marketing_work_log__',
    NEW.id
  )
  ON CONFLICT (marketing_work_log_id)
  DO UPDATE SET
    colleague_id = EXCLUDED.colleague_id,
    category = EXCLUDED.category,
    description = EXCLUDED.description,
    invoice_item_name = EXCLUDED.invoice_item_name,
    billing_type = EXCLUDED.billing_type,
    amount = EXCLUDED.amount,
    hours = EXCLUDED.hours,
    hourly_rate = EXCLUDED.hourly_rate,
    activity_date = EXCLUDED.activity_date,
    client_name = EXCLUDED.client_name,
    updated_at = NOW();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_marketing_work_logs_to_activity_rewards ON public.marketing_work_logs;
CREATE TRIGGER trg_sync_marketing_work_logs_to_activity_rewards
AFTER INSERT OR UPDATE OR DELETE ON public.marketing_work_logs
FOR EACH ROW
EXECUTE FUNCTION public.sync_marketing_work_log_to_activity_reward();

-- Backfill existing marketing logs so they appear in colleague "Můj přehled" report.
INSERT INTO public.activity_rewards (
  colleague_id,
  category,
  description,
  invoice_item_name,
  billing_type,
  amount,
  hours,
  hourly_rate,
  activity_date,
  client_name,
  marketing_work_log_id
)
SELECT
  mwl.colleague_id,
  'marketing',
  COALESCE(NULLIF(BTRIM(mwl.description), ''), mwl.title) AS description,
  'Marketing – ' || mwl.title AS invoice_item_name,
  CASE WHEN COALESCE(mwl.hours, 0) > 0 THEN 'hourly' ELSE 'fixed' END AS billing_type,
  mwl.amount,
  CASE WHEN COALESCE(mwl.hours, 0) > 0 THEN mwl.hours ELSE NULL END AS hours,
  CASE WHEN COALESCE(mwl.hours, 0) > 0 THEN ROUND(mwl.amount / NULLIF(mwl.hours, 0), 2) ELSE NULL END AS hourly_rate,
  mwl.activity_date,
  '__marketing_work_log__' AS client_name,
  mwl.id AS marketing_work_log_id
FROM public.marketing_work_logs mwl
LEFT JOIN public.activity_rewards ar
  ON ar.marketing_work_log_id = mwl.id
WHERE ar.id IS NULL;

