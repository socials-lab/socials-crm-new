-- Ensure legacy public offers remain shareable unless explicitly disabled.
UPDATE public.public_offers
SET is_active = true
WHERE is_active IS NULL;
