-- Migration: Add 'deleted' to engagement_change_type enum
-- Allows tracking of engagement deletions in the audit log

-- Add the new enum value (if it doesn't exist)
DO $$
BEGIN
  -- Check if 'deleted' already exists in the enum
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'deleted'
      AND enumtypid = 'engagement_change_type'::regtype
  ) THEN
    ALTER TYPE engagement_change_type ADD VALUE 'deleted';
    RAISE NOTICE 'Added ''deleted'' to engagement_change_type enum';
  ELSE
    RAISE NOTICE 'Value ''deleted'' already exists in engagement_change_type enum';
  END IF;
END $$;
