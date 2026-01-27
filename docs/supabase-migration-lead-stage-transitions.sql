-- Create lead_stage_transitions table for funnel analytics
-- Run this migration in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.lead_stage_transitions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
    from_stage lead_stage NOT NULL,
    to_stage lead_stage NOT NULL,
    transition_value numeric DEFAULT 0,
    confirmed_at timestamptz DEFAULT now() NOT NULL,
    confirmed_by uuid,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lead_stage_transitions ENABLE ROW LEVEL SECURITY;

-- RLS policies for CRM users
CREATE POLICY "CRM users can read lead_stage_transitions"
ON public.lead_stage_transitions FOR SELECT
USING (is_crm_user(auth.uid()));

CREATE POLICY "CRM users can manage lead_stage_transitions"
ON public.lead_stage_transitions FOR ALL
USING (is_crm_user(auth.uid()));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_lead_transitions_confirmed 
ON public.lead_stage_transitions(confirmed_at);

CREATE INDEX IF NOT EXISTS idx_lead_transitions_stages 
ON public.lead_stage_transitions(from_stage, to_stage);

CREATE INDEX IF NOT EXISTS idx_lead_transitions_lead_id
ON public.lead_stage_transitions(lead_id);
