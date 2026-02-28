ALTER TABLE public.colleagues
ADD COLUMN email_signature text;
COMMENT ON COLUMN public.colleagues.email_signature IS 'Custom default signature used in outgoing email templates.';
