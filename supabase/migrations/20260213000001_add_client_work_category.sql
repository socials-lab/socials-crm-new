-- Add client_work category to activity_rewards
-- This allows tracking manual work done for specific clients (not just marketing/overhead)

SET ROLE postgres;

-- First drop the existing check constraint
ALTER TABLE activity_rewards DROP CONSTRAINT IF EXISTS activity_rewards_category_check;

-- Add new check constraint with client_work
ALTER TABLE activity_rewards ADD CONSTRAINT activity_rewards_category_check
  CHECK (category IN ('marketing', 'overhead', 'client_work'));

-- Add client_name column for client_work entries
ALTER TABLE activity_rewards ADD COLUMN IF NOT EXISTS client_name TEXT;

-- Add comment for documentation
COMMENT ON COLUMN activity_rewards.client_name IS 'Client name for client_work category entries. NULL for marketing/overhead.';
