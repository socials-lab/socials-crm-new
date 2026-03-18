-- Lead email open tracking (custom pixel tracking for CRM lead emails)

CREATE TABLE IF NOT EXISTS public.lead_email_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  subject TEXT,
  to_recipients TEXT[] NOT NULL DEFAULT '{}'::text[],
  cc_recipients TEXT[] NOT NULL DEFAULT '{}'::text[],
  gmail_message_id TEXT,
  sent_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  opened_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_email_tracking_lead_id
  ON public.lead_email_tracking (lead_id);

CREATE INDEX IF NOT EXISTS idx_lead_email_tracking_opened_at
  ON public.lead_email_tracking (opened_at);

CREATE INDEX IF NOT EXISTS idx_lead_email_tracking_tracking_token
  ON public.lead_email_tracking (tracking_token);

ALTER TABLE public.lead_email_tracking ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS update_lead_email_tracking_updated_at ON public.lead_email_tracking;
CREATE TRIGGER update_lead_email_tracking_updated_at
BEFORE UPDATE ON public.lead_email_tracking
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.append_lead_note_if_missing(
  _lead_id UUID,
  _note JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _note_id TEXT;
  _updated_rows INTEGER;
BEGIN
  _note_id := COALESCE(_note->>'id', '');

  IF _note_id = '' THEN
    RAISE EXCEPTION 'append_lead_note_if_missing: _note.id is required';
  END IF;

  UPDATE public.leads
  SET notes = CASE
    WHEN EXISTS (
      SELECT 1
      FROM jsonb_array_elements(COALESCE(notes, '[]'::jsonb)) AS existing_note
      WHERE existing_note->>'id' = _note_id
    )
    THEN COALESCE(notes, '[]'::jsonb)
    ELSE COALESCE(notes, '[]'::jsonb) || jsonb_build_array(_note)
  END
  WHERE id = _lead_id;

  GET DIAGNOSTICS _updated_rows = ROW_COUNT;
  RETURN _updated_rows > 0;
END;
$$;
