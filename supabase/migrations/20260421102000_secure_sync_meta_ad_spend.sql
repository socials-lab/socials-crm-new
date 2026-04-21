CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.internal_function_secrets (
  name TEXT PRIMARY KEY,
  secret TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.internal_function_secrets ENABLE ROW LEVEL SECURITY;

UPDATE public.internal_function_secrets
SET updated_at = now()
WHERE FALSE;

INSERT INTO public.internal_function_secrets (name, secret)
VALUES ('sync-meta-ad-spend', encode(extensions.gen_random_bytes(32), 'hex'))
ON CONFLICT (name) DO NOTHING;

CREATE OR REPLACE FUNCTION public.sync_meta_ad_spend_current_month()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $fn$
DECLARE
  edge_function_url TEXT := 'https://bkemtvqmbpxopuasgxcq.supabase.co/functions/v1/sync-meta-ad-spend';
  internal_secret TEXT;
  cur_year  INT := EXTRACT(YEAR  FROM now());
  cur_month INT := EXTRACT(MONTH FROM now());
BEGIN
  SELECT secret
  INTO internal_secret
  FROM public.internal_function_secrets
  WHERE name = 'sync-meta-ad-spend';

  IF internal_secret IS NULL OR btrim(internal_secret) = '' THEN
    RAISE EXCEPTION 'Missing internal secret for sync-meta-ad-spend';
  END IF;

  PERFORM net.http_post(
    url     := edge_function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-internal-secret', internal_secret
    ),
    body    := jsonb_build_object(
      'year',  cur_year,
      'month', cur_month
    )
  );
END;
$fn$;
