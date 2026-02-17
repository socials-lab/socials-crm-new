-- Add owner_id to sop_articles
ALTER TABLE public.sop_articles
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES public.profiles(id);

-- SOP Update Suggestions table
CREATE TABLE public.sop_update_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES public.sop_articles(id) ON DELETE CASCADE NOT NULL,
  suggested_by UUID REFERENCES public.profiles(id) NOT NULL,
  reason TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  resolved_by UUID REFERENCES public.profiles(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.sop_update_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CRM users can read sop_update_suggestions"
  ON public.sop_update_suggestions FOR SELECT
  TO authenticated
  USING (is_crm_user(auth.uid()));

CREATE POLICY "CRM users can insert sop_update_suggestions"
  ON public.sop_update_suggestions FOR INSERT
  TO authenticated
  WITH CHECK (is_crm_user(auth.uid()));

CREATE POLICY "Admins can manage sop_update_suggestions"
  ON public.sop_update_suggestions FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()));
