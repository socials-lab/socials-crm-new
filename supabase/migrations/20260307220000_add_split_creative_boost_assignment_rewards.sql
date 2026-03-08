-- Split Creative Boost assignment reward into banner and video rates
ALTER TABLE public.engagement_assignments
ADD COLUMN IF NOT EXISTS reward_per_credit_banner NUMERIC(12,2),
ADD COLUMN IF NOT EXISTS reward_per_credit_video NUMERIC(12,2);

-- Backfill existing assignments so old single-rate data remains consistent
UPDATE public.engagement_assignments
SET
  reward_per_credit_banner = COALESCE(reward_per_credit_banner, reward_per_credit),
  reward_per_credit_video = COALESCE(reward_per_credit_video, reward_per_credit)
WHERE reward_per_credit IS NOT NULL;

ALTER TABLE public.engagement_assignments
DROP CONSTRAINT IF EXISTS engagement_assignments_reward_per_credit_banner_nonnegative;

ALTER TABLE public.engagement_assignments
ADD CONSTRAINT engagement_assignments_reward_per_credit_banner_nonnegative
CHECK (reward_per_credit_banner IS NULL OR reward_per_credit_banner >= 0);

ALTER TABLE public.engagement_assignments
DROP CONSTRAINT IF EXISTS engagement_assignments_reward_per_credit_video_nonnegative;

ALTER TABLE public.engagement_assignments
ADD CONSTRAINT engagement_assignments_reward_per_credit_video_nonnegative
CHECK (reward_per_credit_video IS NULL OR reward_per_credit_video >= 0);

COMMENT ON COLUMN public.engagement_assignments.reward_per_credit_banner IS 'Creative Boost: colleague reward per credit for banner outputs.';
COMMENT ON COLUMN public.engagement_assignments.reward_per_credit_video IS 'Creative Boost: colleague reward per credit for video outputs.';
