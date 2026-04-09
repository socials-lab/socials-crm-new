-- Store the signed contract document URL separately from the draft URL.
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS signed_contract_url TEXT;

ALTER TABLE engagements
  ADD COLUMN IF NOT EXISTS signed_contract_url TEXT;
