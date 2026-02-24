-- Add individual internal hourly rate to extra_works
-- This allows each extra work to have its own internal rate instead of using the colleague's default
ALTER TABLE extra_works
  ADD COLUMN IF NOT EXISTS internal_hourly_rate numeric;
