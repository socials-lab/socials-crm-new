-- Migration: Engagement Modification Requests
-- Schvalovací workflow pro úpravy zakázek

-- 1. Create enum for request types
CREATE TYPE modification_request_type AS ENUM (
  'add_service',
  'update_service_price',
  'deactivate_service',
  'add_assignment',
  'update_assignment',
  'remove_assignment'
);

-- 2. Create enum for request status
CREATE TYPE modification_request_status AS ENUM (
  'pending',
  'approved',
  'rejected'
);

-- 3. Create the engagement_modification_requests table
CREATE TABLE engagement_modification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  
  -- Request type and status
  request_type modification_request_type NOT NULL,
  status modification_request_status DEFAULT 'pending',
  
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
  requested_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  requested_at TIMESTAMPTZ DEFAULT now(),
  note TEXT,
  
  -- Review tracking
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Enable RLS
ALTER TABLE engagement_modification_requests ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies
CREATE POLICY "CRM users can read modification requests"
  ON engagement_modification_requests
  FOR SELECT
  USING (is_crm_user(auth.uid()));

CREATE POLICY "CRM users can create modification requests"
  ON engagement_modification_requests
  FOR INSERT
  WITH CHECK (is_crm_user(auth.uid()));

CREATE POLICY "Admins can manage modification requests"
  ON engagement_modification_requests
  FOR ALL
  USING (is_admin(auth.uid()));

-- 6. Create update trigger for updated_at
CREATE TRIGGER update_modification_requests_updated_at
  BEFORE UPDATE ON engagement_modification_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 7. Create index for faster queries
CREATE INDEX idx_modification_requests_engagement_id 
  ON engagement_modification_requests(engagement_id);
CREATE INDEX idx_modification_requests_status 
  ON engagement_modification_requests(status);
CREATE INDEX idx_modification_requests_requested_by 
  ON engagement_modification_requests(requested_by);
