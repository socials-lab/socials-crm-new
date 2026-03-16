-- Migration: Add reward_config JSONB column to services table
-- This stores recommended colleague rewards per service (role, hours, reward amount)
-- For core services with tiers, rewards are stored per tier
-- For addons, rewards are stored without tier

-- Structure:
-- [
--   { "tier": "growth", "roles": [{ "role": "Meta Ads Specialist", "hours": 13, "reward": 9100, "reward_type": "fixed_monthly" }] },
--   { "tier": "pro", "roles": [...] },
--   { "roles": [...] }  -- addon without tier
-- ]

ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS reward_config JSONB DEFAULT NULL;

-- Seed existing services with reward data based on the hardcoded table

-- Socials Boost
UPDATE public.services SET reward_config = '[
  {"tier": "growth", "roles": [{"role": "Meta Ads Specialist", "hours": 13, "reward": 9100, "reward_type": "fixed_monthly"}]},
  {"tier": "pro", "roles": [{"role": "Meta Ads Specialist", "hours": 17, "reward": 11900, "reward_type": "fixed_monthly"}]},
  {"tier": "elite", "roles": [{"role": "Meta Ads Specialist", "hours": 22, "reward": 15400, "reward_type": "fixed_monthly"}]}
]'::jsonb WHERE code = 'SOCIALS_BOOST';

-- PPC Boost
UPDATE public.services SET reward_config = '[
  {"tier": "growth", "roles": [{"role": "PPC Specialist", "hours": 10, "reward": 7000, "reward_type": "fixed_monthly"}]},
  {"tier": "pro", "roles": [{"role": "PPC Specialist", "hours": 15, "reward": 10500, "reward_type": "fixed_monthly"}]},
  {"tier": "elite", "roles": [{"role": "PPC Specialist", "hours": 20, "reward": 14000, "reward_type": "fixed_monthly"}]}
]'::jsonb WHERE code = 'PPC_BOOST';

-- Performance Boost
UPDATE public.services SET reward_config = '[
  {"tier": "growth", "roles": [{"role": "Meta Ads Specialist", "hours": 13, "reward": 9100, "reward_type": "fixed_monthly"}, {"role": "PPC Specialist", "hours": 8, "reward": 5600, "reward_type": "fixed_monthly"}]},
  {"tier": "pro", "roles": [{"role": "Meta Ads Specialist", "hours": 17, "reward": 11900, "reward_type": "fixed_monthly"}, {"role": "PPC Specialist", "hours": 12, "reward": 8400, "reward_type": "fixed_monthly"}]},
  {"tier": "elite", "roles": [{"role": "Meta Ads Specialist", "hours": 22, "reward": 15400, "reward_type": "fixed_monthly"}, {"role": "PPC Specialist", "hours": 16, "reward": 11200, "reward_type": "fixed_monthly"}]}
]'::jsonb WHERE code = 'PERFORMANCE_BOOST';

-- Creative Boost
UPDATE public.services SET reward_config = '[
  {"roles": [{"role": "Graphic Designer", "hours": 0, "reward": 150, "reward_type": "per_credit"}]}
]'::jsonb WHERE code = 'CREATIVE_BOOST';

-- TikTok Ads
UPDATE public.services SET reward_config = '[
  {"roles": [{"role": "Meta Ads Specialist", "hours": 7, "reward": 4900, "reward_type": "fixed_monthly"}]}
]'::jsonb WHERE code = 'TIKTOK_ADS';

-- Heureka
UPDATE public.services SET reward_config = '[
  {"roles": [{"role": "PPC Specialist", "hours": 4, "reward": 2800, "reward_type": "fixed_monthly"}]}
]'::jsonb WHERE code = 'HEUREKA_ZBOZI';

-- Glami
UPDATE public.services SET reward_config = '[
  {"roles": [{"role": "PPC Specialist", "hours": 2, "reward": 1400, "reward_type": "fixed_monthly"}]}
]'::jsonb WHERE code = 'GLAMI';

-- Favi
UPDATE public.services SET reward_config = '[
  {"roles": [{"role": "PPC Specialist", "hours": 2, "reward": 1400, "reward_type": "fixed_monthly"}]}
]'::jsonb WHERE code = 'FAVI';
