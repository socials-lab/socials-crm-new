-- ============================================
-- External Integrations Fields
-- ============================================

-- Add Fakturoid subject_id to clients table
ALTER TABLE clients 
  ADD COLUMN IF NOT EXISTS fakturoid_subject_id INTEGER;

-- Add DigiSign ID to leads table
ALTER TABLE leads 
  ADD COLUMN IF NOT EXISTS digisign_id TEXT;

-- Add Google Calendar event ID to meetings table
ALTER TABLE meetings 
  ADD COLUMN IF NOT EXISTS google_event_id TEXT;

-- Indexes for external IDs
CREATE INDEX IF NOT EXISTS idx_clients_fakturoid_subject_id ON clients(fakturoid_subject_id) WHERE fakturoid_subject_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_digisign_id ON leads(digisign_id) WHERE digisign_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_meetings_google_event_id ON meetings(google_event_id) WHERE google_event_id IS NOT NULL;
