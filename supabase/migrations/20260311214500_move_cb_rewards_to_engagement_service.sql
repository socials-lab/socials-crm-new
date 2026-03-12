-- Store Creative Boost rewards on engagement_services (global per engagement service),
-- not per engagement assignment.

ALTER TABLE public.engagement_services
ADD COLUMN IF NOT EXISTS creative_boost_reward_per_credit_banner numeric;

ALTER TABLE public.engagement_services
ADD COLUMN IF NOT EXISTS creative_boost_reward_per_credit_video numeric;

ALTER TABLE public.engagement_services
ALTER COLUMN creative_boost_reward_per_credit_banner SET DEFAULT 80;

ALTER TABLE public.engagement_services
ALTER COLUMN creative_boost_reward_per_credit_video SET DEFAULT 80;

DO $$
DECLARE
  conflicting_services text;
BEGIN
  WITH resolved AS (
    SELECT
      engagement_service_id,
      COALESCE(reward_per_credit_banner, reward_per_credit) AS banner_reward,
      COALESCE(reward_per_credit_video, reward_per_credit) AS video_reward
    FROM public.engagement_assignments
    WHERE engagement_service_id IS NOT NULL
      AND (
        reward_per_credit_banner IS NOT NULL
        OR reward_per_credit_video IS NOT NULL
        OR reward_per_credit IS NOT NULL
      )
  ),
  conflicts AS (
    SELECT engagement_service_id
    FROM resolved
    GROUP BY engagement_service_id
    HAVING COUNT(DISTINCT banner_reward) FILTER (WHERE banner_reward IS NOT NULL) > 1
       OR COUNT(DISTINCT video_reward) FILTER (WHERE video_reward IS NOT NULL) > 1
  )
  SELECT STRING_AGG(engagement_service_id::text, ', ')
  INTO conflicting_services
  FROM conflicts;

  IF conflicting_services IS NOT NULL THEN
    RAISE EXCEPTION 'Conflicting Creative Boost assignment rewards detected for engagement_service_id(s): %. Resolve manually before migration.',
      conflicting_services;
  END IF;
END $$;

WITH resolved AS (
  SELECT
    engagement_service_id,
    MAX(COALESCE(reward_per_credit_banner, reward_per_credit)) AS banner_reward,
    MAX(COALESCE(reward_per_credit_video, reward_per_credit)) AS video_reward
  FROM public.engagement_assignments
  WHERE engagement_service_id IS NOT NULL
    AND (
      reward_per_credit_banner IS NOT NULL
      OR reward_per_credit_video IS NOT NULL
      OR reward_per_credit IS NOT NULL
    )
  GROUP BY engagement_service_id
)
UPDATE public.engagement_services es
SET
  creative_boost_reward_per_credit_banner = COALESCE(es.creative_boost_reward_per_credit_banner, resolved.banner_reward),
  creative_boost_reward_per_credit_video = COALESCE(es.creative_boost_reward_per_credit_video, resolved.video_reward)
FROM resolved
WHERE es.id = resolved.engagement_service_id;

UPDATE public.engagement_services
SET
  creative_boost_reward_per_credit_banner = COALESCE(creative_boost_reward_per_credit_banner, 80),
  creative_boost_reward_per_credit_video = COALESCE(creative_boost_reward_per_credit_video, 80)
WHERE
  creative_boost_price_per_credit IS NOT NULL
  OR LOWER(name) LIKE '%creative boost%';
