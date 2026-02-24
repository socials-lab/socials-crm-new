-- Add pinned_notes column to engagements table
ALTER TABLE public.engagements ADD COLUMN pinned_notes text DEFAULT '' ;
