-- Align DB schema with existing frontend/service payloads.
-- Service reward configuration is stored as JSONB array of tier/role settings.

ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS reward_config jsonb;

COMMENT ON COLUMN public.services.reward_config IS
'Colleague reward config by tier. Example: [{"tier":"growth","roles":[{"role":"specialist","hours":10,"reward":5000,"reward_type":"fixed_monthly"}]}]';
