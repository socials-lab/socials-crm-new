-- Migration: Add service-specific capacity slots to colleagues
-- Allows tracking different capacities for Meta Ads, Google Ads, and Graphics

-- Add capacity_slots column as JSONB to store per-service-type capacity
ALTER TABLE public.colleagues
ADD COLUMN IF NOT EXISTS capacity_slots JSONB DEFAULT '{"meta": 3, "google": 2, "graphics": 2}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.colleagues.capacity_slots IS 'JSON object storing capacity slots per service type: {meta: number, google: number, graphics: number}';

-- Example structure:
-- {
--   "meta": 3,      -- Meta Ads (Facebook, Instagram) slots
--   "google": 2,    -- Google Ads (PPC) slots
--   "graphics": 2   -- Grafika slots
-- }

-- Update existing colleagues to have default capacity slots based on their position
-- Meta specialists get more meta slots, PPC specialists get more google slots, etc.

UPDATE public.colleagues
SET capacity_slots = 
  CASE 
    WHEN position ILIKE '%meta%' OR position ILIKE '%facebook%' OR position ILIKE '%instagram%' OR position ILIKE '%socials%'
      THEN '{"meta": 5, "google": 0, "graphics": 0}'::jsonb
    WHEN position ILIKE '%ppc%' OR position ILIKE '%google%' OR position ILIKE '%performance%'
      THEN '{"meta": 2, "google": 5, "graphics": 0}'::jsonb
    WHEN position ILIKE '%grafi%' OR position ILIKE '%design%' OR position ILIKE '%creative%'
      THEN '{"meta": 0, "google": 0, "graphics": 5}'::jsonb
    ELSE '{"meta": 2, "google": 2, "graphics": 1}'::jsonb
  END
WHERE capacity_slots IS NULL OR capacity_slots = '{"meta": 3, "google": 2, "graphics": 2}'::jsonb;
