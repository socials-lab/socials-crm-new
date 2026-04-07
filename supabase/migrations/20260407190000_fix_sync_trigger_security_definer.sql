-- The sync trigger function runs in the security context of the calling user,
-- which means it is subject to RLS on activity_rewards. If the user's profile_id
-- is not linked in colleagues, get_colleague_id() returns NULL and the INSERT
-- into activity_rewards fails silently, preventing the sync to "Můj přehled".
--
-- Fix: recreate the function as SECURITY DEFINER so it bypasses RLS and can
-- always write the synced record on behalf of the marketing work log owner.
-- Also adds is_recurring = false (the column may not exist yet; we add it safely).

SET ROLE postgres;

-- Ensure is_recurring column exists on activity_rewards (used by the UI).
ALTER TABLE public.activity_rewards
  ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN NOT NULL DEFAULT FALSE;

-- Recreate the sync function with SECURITY DEFINER so it bypasses RLS.
CREATE OR REPLACE FUNCTION public.sync_marketing_work_log_to_activity_reward()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_billing_type TEXT;
  v_hourly_rate  NUMERIC;
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.activity_rewards
    WHERE marketing_work_log_id = OLD.id;
    RETURN OLD;
  END IF;

  v_billing_type := CASE WHEN COALESCE(NEW.hours, 0) > 0 THEN 'hourly' ELSE 'fixed' END;
  v_hourly_rate  := CASE
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
    is_recurring,
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
    FALSE,
    '__marketing_work_log__',
    NEW.id
  )
  ON CONFLICT (marketing_work_log_id)
  DO UPDATE SET
    colleague_id      = EXCLUDED.colleague_id,
    category          = EXCLUDED.category,
    description       = EXCLUDED.description,
    invoice_item_name = EXCLUDED.invoice_item_name,
    billing_type      = EXCLUDED.billing_type,
    amount            = EXCLUDED.amount,
    hours             = EXCLUDED.hours,
    hourly_rate       = EXCLUDED.hourly_rate,
    activity_date     = EXCLUDED.activity_date,
    client_name       = EXCLUDED.client_name,
    updated_at        = NOW();

  RETURN NEW;
END;
$$;

-- Re-attach the trigger (idempotent).
DROP TRIGGER IF EXISTS trg_sync_marketing_work_logs_to_activity_rewards ON public.marketing_work_logs;
CREATE TRIGGER trg_sync_marketing_work_logs_to_activity_rewards
AFTER INSERT OR UPDATE OR DELETE ON public.marketing_work_logs
FOR EACH ROW
EXECUTE FUNCTION public.sync_marketing_work_log_to_activity_reward();

-- Backfill any existing marketing work logs that don't yet have a matching activity_reward.
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
  is_recurring,
  client_name,
  marketing_work_log_id
)
SELECT
  mwl.colleague_id,
  'marketing',
  COALESCE(NULLIF(BTRIM(mwl.description), ''), mwl.title),
  'Marketing – ' || mwl.title,
  CASE WHEN COALESCE(mwl.hours, 0) > 0 THEN 'hourly' ELSE 'fixed' END,
  mwl.amount,
  CASE WHEN COALESCE(mwl.hours, 0) > 0 THEN mwl.hours ELSE NULL END,
  CASE WHEN COALESCE(mwl.hours, 0) > 0 THEN ROUND(mwl.amount / NULLIF(mwl.hours, 0), 2) ELSE NULL END,
  mwl.activity_date,
  FALSE,
  '__marketing_work_log__',
  mwl.id
FROM public.marketing_work_logs mwl
LEFT JOIN public.activity_rewards ar ON ar.marketing_work_log_id = mwl.id
WHERE ar.id IS NULL;
