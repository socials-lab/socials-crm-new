-- Migration: Engagement Modification Requests
-- Schvalovací workflow pro úpravy zakázek
-- 
-- Workflow:
-- 1. Kolega navrhne úpravu (status: pending)
-- 2. Admin schválí interně (status: approved) → vytvoří se upgrade_offer_token
-- 3. Odkaz se pošle klientovi
-- 4. Klient potvrdí (status: client_approved)
-- 5. Služba se aktivuje (status: applied)

-- 1. Create the engagement_modification_requests table
CREATE TABLE engagement_modification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  
  -- Request type (text instead of enum for flexibility)
  request_type TEXT NOT NULL CHECK (request_type IN (
    'add_service',
    'update_service_price',
    'deactivate_service',
    'add_assignment',
    'update_assignment',
    'remove_assignment'
  )),
  
  -- Status workflow
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',          -- Čeká na interní schválení
    'approved',         -- Interně schváleno, čeká na klienta (pro client-facing změny)
    'client_approved',  -- Klient potvrdil, připraveno k aplikaci
    'applied',          -- Změna byla aplikována
    'rejected'          -- Zamítnuto (interně nebo klientem)
  )),
  
  -- Proposed changes as JSON
  proposed_changes JSONB NOT NULL,
  
  -- For services: reference to existing service (for update/deactivate)
  engagement_service_id UUID REFERENCES engagement_services(id) ON DELETE SET NULL,
  
  -- For assignments: reference to existing assignment (for update/remove)
  engagement_assignment_id UUID REFERENCES engagement_assignments(id) ON DELETE SET NULL,
  
  -- Upsell metadata
  effective_from DATE,
  upsold_by_id UUID REFERENCES colleagues(id) ON DELETE SET NULL,
  upsell_commission_percent DECIMAL DEFAULT 10,
  
  -- Workflow tracking
  requested_by UUID,
  requested_at TIMESTAMPTZ DEFAULT now(),
  note TEXT,
  
  -- Internal review
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Client approval (for client-facing changes like add_service, update_price, deactivate)
  upgrade_offer_token TEXT UNIQUE,
  upgrade_offer_valid_until TIMESTAMPTZ,
  client_email TEXT,
  client_approved_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE engagement_modification_requests ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policies for CRM users
CREATE POLICY "CRM users can read modification requests"
  ON engagement_modification_requests
  FOR SELECT
  TO authenticated
  USING (is_crm_user(auth.uid()));

CREATE POLICY "CRM users can create modification requests"
  ON engagement_modification_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (is_crm_user(auth.uid()));

CREATE POLICY "CRM users can update modification requests"
  ON engagement_modification_requests
  FOR UPDATE
  TO authenticated
  USING (is_crm_user(auth.uid()));

-- 4. Public access for client approval (via token)
CREATE POLICY "Public can view by token"
  ON engagement_modification_requests
  FOR SELECT
  TO anon
  USING (upgrade_offer_token IS NOT NULL);

CREATE POLICY "Public can update by token for approval"
  ON engagement_modification_requests
  FOR UPDATE
  TO anon
  USING (upgrade_offer_token IS NOT NULL AND status = 'approved')
  WITH CHECK (upgrade_offer_token IS NOT NULL);

-- 5. Create update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_modification_requests_updated_at
  BEFORE UPDATE ON engagement_modification_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. Create indexes for faster queries
CREATE INDEX idx_modification_requests_engagement_id 
  ON engagement_modification_requests(engagement_id);
CREATE INDEX idx_modification_requests_status 
  ON engagement_modification_requests(status);
CREATE INDEX idx_modification_requests_token 
  ON engagement_modification_requests(upgrade_offer_token) 
  WHERE upgrade_offer_token IS NOT NULL;
CREATE INDEX idx_modification_requests_requested_by 
  ON engagement_modification_requests(requested_by);
