-- Migration: Add minimum_reward column to colleagues
-- Allows setting a minimum monthly reward for each colleague

ALTER TABLE public.colleagues
ADD COLUMN IF NOT EXISTS minimum_reward NUMERIC DEFAULT NULL;

COMMENT ON COLUMN public.colleagues.minimum_reward IS 'Minimum monthly reward guaranteed for this colleague. NULL means no minimum.';
