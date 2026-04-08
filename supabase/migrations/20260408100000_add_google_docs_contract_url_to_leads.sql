-- Add dedicated field for Google Docs contract URL to leads table.
-- This keeps the Google Docs URL separate from contract_url (which gets overwritten by DigiSign URL after draft creation).
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS google_docs_contract_url TEXT;

-- Migrate existing Google Docs URLs from contract_url into the new field.
UPDATE leads
SET google_docs_contract_url = contract_url
WHERE contract_url ILIKE '%docs.google.com/document/%'
  AND google_docs_contract_url IS NULL;
