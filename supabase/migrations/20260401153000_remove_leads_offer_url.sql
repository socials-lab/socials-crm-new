-- lead offer URL is now derived from public_offers.token on frontend.
-- keep token as single source of truth and remove redundant leads.offer_url.

ALTER TABLE public.leads
DROP COLUMN IF EXISTS offer_url;
