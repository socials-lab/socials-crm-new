-- Add 'bad_fit' to the lead_stage enum
ALTER TYPE public.lead_stage ADD VALUE IF NOT EXISTS 'bad_fit';
