-- Daily sync of Fakturoid invoice statuses/history for active clients.
-- Runs once per day via pg_cron and calls Edge Function:
--   fakturoid-import-historical-invoices

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.sync_fakturoid_invoice_statuses_daily()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $fn$
DECLARE
  edge_function_url TEXT := 'https://bkemtvqmbpxopuasgxcq.supabase.co/functions/v1/fakturoid-import-historical-invoices';
  anon_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrZW10dnFtYnB4b3B1YXNneGNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzODQ3NTksImV4cCI6MjA4Mzk2MDc1OX0.w84I0KkFiJZ01BxABdfE9PqSbTkiwNl6jp7SD0ut0Xg';
BEGIN
  PERFORM net.http_post(
    url := edge_function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || anon_key,
      'X-Admin-Key', 'update-urls-secret-2026'
    ),
    body := jsonb_build_object(
      'dry_run', false,
      'only_active_clients', true
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
  WHERE jobname = 'daily-fakturoid-invoice-status-sync'
  LIMIT 1;

  IF existing_job_id IS NOT NULL THEN
    PERFORM cron.unschedule(existing_job_id);
  END IF;

  -- Every day at 03:15 UTC.
  PERFORM cron.schedule(
    'daily-fakturoid-invoice-status-sync',
    '15 3 * * *',
    'SELECT public.sync_fakturoid_invoice_statuses_daily();'
  );
END;
$do$;
