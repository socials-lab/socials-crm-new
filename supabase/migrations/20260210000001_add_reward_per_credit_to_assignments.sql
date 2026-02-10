-- Add reward_per_credit column to engagement_assignments
-- This allows storing per-credit reward for Creative Boost assignments

ALTER TABLE engagement_assignments
ADD COLUMN reward_per_credit NUMERIC(12,2) DEFAULT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN engagement_assignments.reward_per_credit IS 'Custom reward per credit for Creative Boost assignments. If NULL, uses default (80 CZK).';
