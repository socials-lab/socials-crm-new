-- Migration: Add birthday column to colleagues table
-- Description: Enables tracking colleague birthdays for birthday notifications

-- Add birthday column to colleagues table
ALTER TABLE colleagues
ADD COLUMN IF NOT EXISTS birthday date NULL;

-- Add comment for documentation
COMMENT ON COLUMN colleagues.birthday IS 'Birth date of the colleague for birthday notifications';
