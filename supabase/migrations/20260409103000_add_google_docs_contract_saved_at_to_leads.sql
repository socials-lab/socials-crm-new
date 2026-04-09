-- Track when Google Docs contract URL was last explicitly saved.
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS google_docs_contract_saved_at TIMESTAMPTZ;

-- Backfill for existing records that already have a Google Docs contract URL.
UPDATE leads
SET google_docs_contract_saved_at = COALESCE(google_docs_contract_saved_at, updated_at, created_at)
WHERE google_docs_contract_url IS NOT NULL;
