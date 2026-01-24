-- Drop redundant columns from leads table
-- potential_service: replaced by potential_services JSONB array
-- offer_type: now derived from services' billing_type

ALTER TABLE leads DROP COLUMN IF EXISTS potential_service;
ALTER TABLE leads DROP COLUMN IF EXISTS offer_type;
