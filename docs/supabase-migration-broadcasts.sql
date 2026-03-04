-- Create broadcasts table
CREATE TABLE public.broadcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  body text NOT NULL,
  recipient_count integer DEFAULT 0,
  recipients jsonb DEFAULT '[]'::jsonb,
  cc_emails text[] DEFAULT '{}',
  bcc_emails text[] DEFAULT '{}',
  sent_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "CRM users can manage broadcasts"
  ON public.broadcasts FOR ALL
  USING (is_crm_user(auth.uid()));

CREATE POLICY "CRM users can read broadcasts"
  ON public.broadcasts FOR SELECT
  USING (is_crm_user(auth.uid()));
