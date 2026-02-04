-- Add legacy lead columns required by main branch UI components
-- These were present in the original schema design but missing from this branch's DB

SET ROLE postgres;

ALTER TABLE leads ADD COLUMN IF NOT EXISTS potential_service TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS offer_type TEXT DEFAULT 'retainer';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS qualification_status TEXT DEFAULT 'pending';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS qualification_reason TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS qualified_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS contract_sent_at TIMESTAMPTZ;
