-- Migration: Add reward per credit column for Creative Boost services
-- This column stores the reward amount (in CZK) that the assigned graphic designer/video editor
-- receives for each credit of Creative Boost work they complete.

-- Add the column with default value of 80 CZK
ALTER TABLE engagement_services 
ADD COLUMN IF NOT EXISTS creative_boost_reward_per_credit numeric DEFAULT 80;

-- Add comment for documentation
COMMENT ON COLUMN engagement_services.creative_boost_reward_per_credit IS 'Reward per credit for the graphic designer/video editor working on Creative Boost outputs (default 80 CZK)';
