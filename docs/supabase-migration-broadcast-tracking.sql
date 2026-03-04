-- Create broadcasts table (doesn't exist yet)
CREATE TABLE public.broadcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  body text,
  recipient_count integer DEFAULT 0,
  recipients jsonb DEFAULT '[]'::jsonb,
  cc_emails text[] DEFAULT '{}'::text[],
  bcc_emails text[] DEFAULT '{}'::text[],
  sent_by uuid REFERENCES auth.users(id),
  open_count integer DEFAULT 0,
  click_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CRM users can read broadcasts"
  ON public.broadcasts FOR SELECT
  TO authenticated
  USING (is_crm_user(auth.uid()));

CREATE POLICY "CRM users can manage broadcasts"
  ON public.broadcasts FOR ALL
  TO authenticated
  USING (is_crm_user(auth.uid()));

-- Create broadcast_recipients table
CREATE TABLE public.broadcast_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id uuid NOT NULL REFERENCES public.broadcasts(id) ON DELETE CASCADE,
  email text NOT NULL,
  contact_name text,
  company text,
  tracking_id uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  opened_at timestamptz,
  clicked_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.broadcast_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CRM users can read broadcast_recipients"
  ON public.broadcast_recipients FOR SELECT
  TO authenticated
  USING (is_crm_user(auth.uid()));

CREATE POLICY "CRM users can manage broadcast_recipients"
  ON public.broadcast_recipients FOR ALL
  TO authenticated
  USING (is_crm_user(auth.uid()));

-- Allow service role to insert/update (for edge functions)
-- RLS is bypassed by service role key automatically
