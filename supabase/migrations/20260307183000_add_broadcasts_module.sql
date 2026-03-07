-- Broadcasts module: storage + recipient tracking

CREATE TABLE IF NOT EXISTS public.broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  body TEXT,
  recipient_count INTEGER NOT NULL DEFAULT 0,
  recipients JSONB NOT NULL DEFAULT '[]'::jsonb,
  cc_emails TEXT[] NOT NULL DEFAULT '{}'::text[],
  bcc_emails TEXT[] NOT NULL DEFAULT '{}'::text[],
  sent_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  open_count INTEGER NOT NULL DEFAULT 0,
  click_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'broadcasts'
      AND policyname = 'CRM users can read broadcasts'
  ) THEN
    CREATE POLICY "CRM users can read broadcasts"
      ON public.broadcasts
      FOR SELECT
      TO authenticated
      USING (has_crm_access(auth.uid()));
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.increment_broadcast_counter(
  _broadcast_id UUID,
  _column TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _column NOT IN ('open_count', 'click_count') THEN
    RAISE EXCEPTION 'Invalid column: %', _column;
  END IF;

  EXECUTE format(
    'UPDATE public.broadcasts SET %I = COALESCE(%I, 0) + 1 WHERE id = $1',
    _column,
    _column
  )
  USING _broadcast_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_broadcast_counter(UUID, TEXT) TO authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'broadcasts'
      AND policyname = 'CRM users can manage broadcasts'
  ) THEN
    CREATE POLICY "CRM users can manage broadcasts"
      ON public.broadcasts
      FOR ALL
      TO authenticated
      USING (has_crm_access(auth.uid()))
      WITH CHECK (has_crm_access(auth.uid()));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.broadcast_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id UUID NOT NULL REFERENCES public.broadcasts(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  contact_name TEXT,
  company TEXT,
  tracking_id UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_broadcast_recipients_broadcast_id
  ON public.broadcast_recipients (broadcast_id);

CREATE INDEX IF NOT EXISTS idx_broadcast_recipients_tracking_id
  ON public.broadcast_recipients (tracking_id);

ALTER TABLE public.broadcast_recipients ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'broadcast_recipients'
      AND policyname = 'CRM users can read broadcast recipients'
  ) THEN
    CREATE POLICY "CRM users can read broadcast recipients"
      ON public.broadcast_recipients
      FOR SELECT
      TO authenticated
      USING (has_crm_access(auth.uid()));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'broadcast_recipients'
      AND policyname = 'CRM users can manage broadcast recipients'
  ) THEN
    CREATE POLICY "CRM users can manage broadcast recipients"
      ON public.broadcast_recipients
      FOR ALL
      TO authenticated
      USING (has_crm_access(auth.uid()))
      WITH CHECK (has_crm_access(auth.uid()));
  END IF;
END $$;
