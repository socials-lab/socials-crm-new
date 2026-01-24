-- Remove unused contract_sent_at column
-- DigiSign automatically sends contracts when created, so this tracking field is redundant

ALTER TABLE public.leads 
DROP COLUMN IF EXISTS contract_sent_at;
