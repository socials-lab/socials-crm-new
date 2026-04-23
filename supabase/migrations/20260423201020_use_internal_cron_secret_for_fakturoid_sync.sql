CREATE OR REPLACE FUNCTION public.sync_fakturoid_invoice_statuses_daily()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $fn$
DECLARE
  edge_function_url TEXT := 'https://bkemtvqmbpxopuasgxcq.supabase.co/functions/v1/fakturoid-import-historical-invoices';
  anon_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrZW10dnFtYnB4b3B1YXNneGNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzODQ3NTksImV4cCI6MjA4Mzk2MDc1OX0.w84I0KkFiJZ01BxABdfE9PqSbTkiwNl6jp7SD0ut0Xg';
  internal_secret TEXT;
BEGIN
  SELECT secret
  INTO internal_secret
  FROM public.internal_function_secrets
  WHERE name = 'internal-cron';

  IF internal_secret IS NULL OR btrim(internal_secret) = '' THEN
    RAISE EXCEPTION 'Missing internal secret for daily Fakturoid cron sync';
  END IF;

  PERFORM net.http_post(
    url := edge_function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || anon_key,
      'X-Admin-Key', internal_secret
    ),
    body := jsonb_build_object(
      'dry_run', false,
      'only_active_clients', true
    )
  );
END;
$fn$;
