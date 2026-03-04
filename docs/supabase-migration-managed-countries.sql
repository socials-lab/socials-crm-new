-- Add managed_countries column to engagements table
-- This tracks which countries/markets are managed for each engagement

ALTER TABLE public.engagements 
ADD COLUMN managed_countries text[] DEFAULT '{}'::text[];
