-- Migration: Add soft delete support to engagements
-- Adds deleted_at column and updates queries to filter deleted engagements

-- Add deleted_at column
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Create index for efficient queries on non-deleted engagements
CREATE INDEX IF NOT EXISTS idx_engagements_deleted_at
ON engagements(deleted_at)
WHERE deleted_at IS NULL;

-- Create soft delete function
CREATE OR REPLACE FUNCTION soft_delete_engagement(p_engagement_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE engagements
  SET deleted_at = NOW(),
      status = 'cancelled',
      updated_at = NOW()
  WHERE id = p_engagement_id
    AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create restore function
CREATE OR REPLACE FUNCTION restore_engagement(p_engagement_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE engagements
  SET deleted_at = NULL,
      updated_at = NOW()
  WHERE id = p_engagement_id
    AND deleted_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION soft_delete_engagement(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION restore_engagement(UUID) TO authenticated;

DO $$
BEGIN
  RAISE NOTICE 'Added soft delete support to engagements table';
  RAISE NOTICE '  - Added deleted_at column';
  RAISE NOTICE '  - Created soft_delete_engagement() function';
  RAISE NOTICE '  - Created restore_engagement() function';
END $$;
