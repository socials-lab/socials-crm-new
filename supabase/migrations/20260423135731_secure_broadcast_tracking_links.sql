CREATE TABLE IF NOT EXISTS public.broadcast_tracked_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id UUID NOT NULL REFERENCES public.broadcasts(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.broadcast_recipients(id) ON DELETE CASCADE,
  link_token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  target_url TEXT NOT NULL,
  clicked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_broadcast_tracked_links_broadcast_id
  ON public.broadcast_tracked_links (broadcast_id);

CREATE INDEX IF NOT EXISTS idx_broadcast_tracked_links_recipient_id
  ON public.broadcast_tracked_links (recipient_id);

CREATE INDEX IF NOT EXISTS idx_broadcast_tracked_links_link_token
  ON public.broadcast_tracked_links (link_token);

ALTER TABLE public.broadcast_tracked_links ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'broadcast_tracked_links'
      AND policyname = 'CRM users can read broadcast tracked links'
  ) THEN
    CREATE POLICY "CRM users can read broadcast tracked links"
      ON public.broadcast_tracked_links
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
      AND tablename = 'broadcast_tracked_links'
      AND policyname = 'CRM users can manage broadcast tracked links'
  ) THEN
    CREATE POLICY "CRM users can manage broadcast tracked links"
      ON public.broadcast_tracked_links
      FOR ALL
      TO authenticated
      USING (has_crm_access(auth.uid()))
      WITH CHECK (has_crm_access(auth.uid()));
  END IF;
END $$;
