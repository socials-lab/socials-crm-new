-- Sync Meta Ads spend 4× per day via pg_cron.
-- Calls the sync-meta-ad-spend Edge Function with the current year/month.

CREATE EXTENSION IF NOT EXISTS pg_net   WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_cron  WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.sync_meta_ad_spend_current_month()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $fn$
DECLARE
  edge_function_url TEXT := 'https://bkemtvqmbpxopuasgxcq.supabase.co/functions/v1/sync-meta-ad-spend';
  anon_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrZW10dnFtYnB4b3B1YXNneGNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzODQ3NTksImV4cCI6MjA4Mzk2MDc1OX0.w84I0KkFiJZ01BxABdfE9PqSbTkiwNl6jp7SD0ut0Xg';
  cur_year  INT := EXTRACT(YEAR  FROM now());
  cur_month INT := EXTRACT(MONTH FROM now());
BEGIN
  PERFORM net.http_post(
    url     := edge_function_url,
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || anon_key
    ),
    body    := jsonb_build_object(
      'year',  cur_year,
      'month', cur_month
    )
  );
END;
$fn$;

DO $do$
DECLARE
  existing_job_id bigint;
BEGIN
  SELECT jobid
  INTO existing_job_id
  FROM cron.job
  WHERE jobname = 'meta-ad-spend-sync-4x-daily'
  LIMIT 1;

  IF existing_job_id IS NOT NULL THEN
    PERFORM cron.unschedule(existing_job_id);
  END IF;

  -- Every 6 hours: 01:00, 07:00, 13:00, 19:00 UTC
  PERFORM cron.schedule(
    'meta-ad-spend-sync-4x-daily',
    '0 1,7,13,19 * * *',
    'SELECT public.sync_meta_ad_spend_current_month();'
  );
END;
$do$;
