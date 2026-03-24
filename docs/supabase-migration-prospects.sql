-- Migration: Create prospects module (prospects + prospect_interactions)
-- Run this in the Supabase SQL Editor

-- Enum for prospect status
CREATE TYPE public.prospect_status AS ENUM ('new', 'contacted', 'qualified', 'converted', 'irrelevant');

-- Enum for interaction type
CREATE TYPE public.prospect_interaction_type AS ENUM ('webinar_registration', 'lead_magnet_download', 'webinar_attended', 'other');

-- Prospects table
CREATE TABLE public.prospects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text DEFAULT NULL,
  company text DEFAULT NULL,
  status prospect_status NOT NULL DEFAULT 'new',
  converted_to_lead_id uuid DEFAULT NULL REFERENCES public.leads(id) ON DELETE SET NULL,
  notes jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Unique constraint on email for deduplication
CREATE UNIQUE INDEX prospects_email_unique ON public.prospects (lower(email));

-- Prospect interactions table
CREATE TABLE public.prospect_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id uuid NOT NULL REFERENCES public.prospects(id) ON DELETE CASCADE,
  type prospect_interaction_type NOT NULL DEFAULT 'other',
  title text NOT NULL,
  metadata jsonb DEFAULT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX prospect_interactions_prospect_id_idx ON public.prospect_interactions (prospect_id);

-- Enable RLS
ALTER TABLE public.prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospect_interactions ENABLE ROW LEVEL SECURITY;

-- RLS policies (same pattern as other CRM tables)
CREATE POLICY "CRM users can read prospects" ON public.prospects FOR SELECT TO authenticated USING (is_crm_user(auth.uid()));
CREATE POLICY "CRM users can manage prospects" ON public.prospects FOR ALL TO authenticated USING (is_crm_user(auth.uid()));

CREATE POLICY "CRM users can read prospect_interactions" ON public.prospect_interactions FOR SELECT TO authenticated USING (is_crm_user(auth.uid()));
CREATE POLICY "CRM users can manage prospect_interactions" ON public.prospect_interactions FOR ALL TO authenticated USING (is_crm_user(auth.uid()));

-- Updated_at trigger
CREATE TRIGGER update_prospects_updated_at BEFORE UPDATE ON public.prospects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE public.prospects IS 'Contacts from lead magnets and webinars';
COMMENT ON TABLE public.prospect_interactions IS 'Activities/interactions of prospects (webinar registrations, downloads, etc.)';
