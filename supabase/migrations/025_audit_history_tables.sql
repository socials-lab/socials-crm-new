-- ============================================
-- Comprehensive Audit Logging Migration
-- Extends existing history pattern to all key entities
-- ============================================

-- ============================================
-- ENUM Types for History Change Types
-- ============================================

-- Client change types
CREATE TYPE client_change_type AS ENUM (
  'created',
  'status_change',
  'tier_change',
  'field_update',
  'contact_added',
  'contact_removed',
  'deleted'
);

-- Applicant change types
CREATE TYPE applicant_change_type AS ENUM (
  'created',
  'stage_change',
  'field_update',
  'note_added',
  'converted',
  'deleted'
);

-- Extra work change types
CREATE TYPE extra_work_change_type AS ENUM (
  'created',
  'status_change',
  'invoiced',
  'field_update',
  'deleted'
);

-- Meeting change types
CREATE TYPE meeting_change_type AS ENUM (
  'created',
  'status_change',
  'rescheduled',
  'cancelled',
  'field_update',
  'participant_added',
  'participant_removed',
  'deleted'
);

-- ============================================
-- History Tables
-- ============================================

-- Client history
-- Note: changed_by is nullable to support system/webhook operations
CREATE TABLE client_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  change_type client_change_type NOT NULL,
  field_name TEXT,
  field_label TEXT,
  old_value TEXT,
  new_value TEXT,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_by_name TEXT NOT NULL DEFAULT 'System',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Applicant history
CREATE TABLE applicant_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id UUID NOT NULL REFERENCES applicants(id) ON DELETE CASCADE,
  change_type applicant_change_type NOT NULL,
  field_name TEXT,
  field_label TEXT,
  old_value TEXT,
  new_value TEXT,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_by_name TEXT NOT NULL DEFAULT 'System',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Extra work history
CREATE TABLE extra_work_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  extra_work_id UUID NOT NULL REFERENCES extra_works(id) ON DELETE CASCADE,
  change_type extra_work_change_type NOT NULL,
  field_name TEXT,
  field_label TEXT,
  old_value TEXT,
  new_value TEXT,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_by_name TEXT NOT NULL DEFAULT 'System',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Meeting history
CREATE TABLE meeting_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  change_type meeting_change_type NOT NULL,
  field_name TEXT,
  field_label TEXT,
  old_value TEXT,
  new_value TEXT,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_by_name TEXT NOT NULL DEFAULT 'System',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Integration log (for external API calls)
CREATE TABLE integration_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service TEXT NOT NULL,        -- 'fakturoid', 'digisign', 'ares', 'google_calendar'
  action TEXT NOT NULL,         -- 'create_invoice', 'create_contract', 'lookup_company'
  related_table TEXT,           -- 'leads', 'issued_invoices', 'meetings'
  related_record_id UUID,
  request_payload JSONB,
  response_status INTEGER,
  response_payload JSONB,
  is_success BOOLEAN NOT NULL,
  error_message TEXT,
  triggered_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Indexes
-- ============================================

-- Client history indexes
CREATE INDEX idx_client_history_client_id ON client_history(client_id);
CREATE INDEX idx_client_history_created_at ON client_history(created_at DESC);
CREATE INDEX idx_client_history_changed_by ON client_history(changed_by);

-- Applicant history indexes
CREATE INDEX idx_applicant_history_applicant_id ON applicant_history(applicant_id);
CREATE INDEX idx_applicant_history_created_at ON applicant_history(created_at DESC);
CREATE INDEX idx_applicant_history_changed_by ON applicant_history(changed_by);

-- Extra work history indexes
CREATE INDEX idx_extra_work_history_extra_work_id ON extra_work_history(extra_work_id);
CREATE INDEX idx_extra_work_history_created_at ON extra_work_history(created_at DESC);
CREATE INDEX idx_extra_work_history_changed_by ON extra_work_history(changed_by);

-- Meeting history indexes
CREATE INDEX idx_meeting_history_meeting_id ON meeting_history(meeting_id);
CREATE INDEX idx_meeting_history_created_at ON meeting_history(created_at DESC);
CREATE INDEX idx_meeting_history_changed_by ON meeting_history(changed_by);

-- Integration log indexes
CREATE INDEX idx_integration_log_service ON integration_log(service);
CREATE INDEX idx_integration_log_action ON integration_log(action);
CREATE INDEX idx_integration_log_related ON integration_log(related_table, related_record_id);
CREATE INDEX idx_integration_log_is_success ON integration_log(is_success) WHERE is_success = FALSE;
CREATE INDEX idx_integration_log_created_at ON integration_log(created_at DESC);
CREATE INDEX idx_integration_log_triggered_by ON integration_log(triggered_by);

-- ============================================
-- Helper Functions
-- ============================================

-- Log client change
CREATE OR REPLACE FUNCTION log_client_change(
  _client_id UUID,
  _change_type client_change_type,
  _field_name TEXT DEFAULT NULL,
  _field_label TEXT DEFAULT NULL,
  _old_value TEXT DEFAULT NULL,
  _new_value TEXT DEFAULT NULL
) RETURNS void AS $$
DECLARE
  _changed_by_name TEXT;
  _user_id UUID;
BEGIN
  _user_id := auth.uid();
  
  IF _user_id IS NOT NULL THEN
    SELECT COALESCE(full_name, email) INTO _changed_by_name
    FROM profiles
    WHERE id = _user_id;
  END IF;
  
  INSERT INTO client_history (
    client_id,
    change_type,
    field_name,
    field_label,
    old_value,
    new_value,
    changed_by,
    changed_by_name
  ) VALUES (
    _client_id,
    _change_type,
    _field_name,
    _field_label,
    _old_value,
    _new_value,
    _user_id,
    COALESCE(_changed_by_name, 'System')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Log applicant change
CREATE OR REPLACE FUNCTION log_applicant_change(
  _applicant_id UUID,
  _change_type applicant_change_type,
  _field_name TEXT DEFAULT NULL,
  _field_label TEXT DEFAULT NULL,
  _old_value TEXT DEFAULT NULL,
  _new_value TEXT DEFAULT NULL
) RETURNS void AS $$
DECLARE
  _changed_by_name TEXT;
  _user_id UUID;
BEGIN
  _user_id := auth.uid();
  
  IF _user_id IS NOT NULL THEN
    SELECT COALESCE(full_name, email) INTO _changed_by_name
    FROM profiles
    WHERE id = _user_id;
  END IF;
  
  INSERT INTO applicant_history (
    applicant_id,
    change_type,
    field_name,
    field_label,
    old_value,
    new_value,
    changed_by,
    changed_by_name
  ) VALUES (
    _applicant_id,
    _change_type,
    _field_name,
    _field_label,
    _old_value,
    _new_value,
    _user_id,
    COALESCE(_changed_by_name, 'System')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Log extra work change
CREATE OR REPLACE FUNCTION log_extra_work_change(
  _extra_work_id UUID,
  _change_type extra_work_change_type,
  _field_name TEXT DEFAULT NULL,
  _field_label TEXT DEFAULT NULL,
  _old_value TEXT DEFAULT NULL,
  _new_value TEXT DEFAULT NULL
) RETURNS void AS $$
DECLARE
  _changed_by_name TEXT;
  _user_id UUID;
BEGIN
  _user_id := auth.uid();
  
  IF _user_id IS NOT NULL THEN
    SELECT COALESCE(full_name, email) INTO _changed_by_name
    FROM profiles
    WHERE id = _user_id;
  END IF;
  
  INSERT INTO extra_work_history (
    extra_work_id,
    change_type,
    field_name,
    field_label,
    old_value,
    new_value,
    changed_by,
    changed_by_name
  ) VALUES (
    _extra_work_id,
    _change_type,
    _field_name,
    _field_label,
    _old_value,
    _new_value,
    _user_id,
    COALESCE(_changed_by_name, 'System')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Log meeting change
CREATE OR REPLACE FUNCTION log_meeting_change(
  _meeting_id UUID,
  _change_type meeting_change_type,
  _field_name TEXT DEFAULT NULL,
  _field_label TEXT DEFAULT NULL,
  _old_value TEXT DEFAULT NULL,
  _new_value TEXT DEFAULT NULL
) RETURNS void AS $$
DECLARE
  _changed_by_name TEXT;
  _user_id UUID;
BEGIN
  _user_id := auth.uid();
  
  IF _user_id IS NOT NULL THEN
    SELECT COALESCE(full_name, email) INTO _changed_by_name
    FROM profiles
    WHERE id = _user_id;
  END IF;
  
  INSERT INTO meeting_history (
    meeting_id,
    change_type,
    field_name,
    field_label,
    old_value,
    new_value,
    changed_by,
    changed_by_name
  ) VALUES (
    _meeting_id,
    _change_type,
    _field_name,
    _field_label,
    _old_value,
    _new_value,
    _user_id,
    COALESCE(_changed_by_name, 'System')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Trigger Functions
-- ============================================

-- Client history trigger
CREATE OR REPLACE FUNCTION trigger_client_history()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_client_change(NEW.id, 'created');
  ELSIF TG_OP = 'UPDATE' THEN
    -- Track status changes
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      PERFORM log_client_change(NEW.id, 'status_change', 'status', 'Status', 
        OLD.status::TEXT, NEW.status::TEXT);
    END IF;
    -- Track tier changes
    IF OLD.tier IS DISTINCT FROM NEW.tier THEN
      PERFORM log_client_change(NEW.id, 'tier_change', 'tier', 'Tier', 
        OLD.tier::TEXT, NEW.tier::TEXT);
    END IF;
    -- Track sales representative changes
    IF OLD.sales_representative_id IS DISTINCT FROM NEW.sales_representative_id THEN
      PERFORM log_client_change(NEW.id, 'field_update', 'sales_representative_id', 'Sales Representative', 
        OLD.sales_representative_id::TEXT, NEW.sales_representative_id::TEXT);
    END IF;
    -- Track end date changes
    IF OLD.end_date IS DISTINCT FROM NEW.end_date THEN
      PERFORM log_client_change(NEW.id, 'field_update', 'end_date', 'End Date', 
        COALESCE(OLD.end_date::TEXT, ''), COALESCE(NEW.end_date::TEXT, ''));
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_client_change(OLD.id, 'deleted');
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Applicant history trigger
CREATE OR REPLACE FUNCTION trigger_applicant_history()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_applicant_change(NEW.id, 'created');
  ELSIF TG_OP = 'UPDATE' THEN
    -- Track stage changes
    IF OLD.stage IS DISTINCT FROM NEW.stage THEN
      PERFORM log_applicant_change(NEW.id, 'stage_change', 'stage', 'Stage', 
        OLD.stage::TEXT, NEW.stage::TEXT);
    END IF;
    -- Track owner changes
    IF OLD.owner_id IS DISTINCT FROM NEW.owner_id THEN
      PERFORM log_applicant_change(NEW.id, 'field_update', 'owner_id', 'Owner', 
        COALESCE(OLD.owner_id::TEXT, ''), COALESCE(NEW.owner_id::TEXT, ''));
    END IF;
    -- Track conversion to colleague
    IF OLD.converted_to_colleague_id IS NULL AND NEW.converted_to_colleague_id IS NOT NULL THEN
      PERFORM log_applicant_change(NEW.id, 'converted', 'converted_to_colleague_id', 'Converted to Colleague', 
        NULL, NEW.converted_to_colleague_id::TEXT);
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_applicant_change(OLD.id, 'deleted');
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Extra work history trigger
CREATE OR REPLACE FUNCTION trigger_extra_work_history()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_extra_work_change(NEW.id, 'created');
  ELSIF TG_OP = 'UPDATE' THEN
    -- Track status changes
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      PERFORM log_extra_work_change(NEW.id, 'status_change', 'status', 'Status', 
        OLD.status::TEXT, NEW.status::TEXT);
    END IF;
    -- Track invoicing
    IF OLD.invoice_id IS NULL AND NEW.invoice_id IS NOT NULL THEN
      PERFORM log_extra_work_change(NEW.id, 'invoiced', 'invoice_id', 'Invoiced', 
        NULL, NEW.invoice_id::TEXT);
    END IF;
    -- Track approval
    IF OLD.approval_date IS NULL AND NEW.approval_date IS NOT NULL THEN
      PERFORM log_extra_work_change(NEW.id, 'status_change', 'approval_date', 'Approved', 
        NULL, NEW.approval_date::TEXT);
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_extra_work_change(OLD.id, 'deleted');
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Meeting history trigger
CREATE OR REPLACE FUNCTION trigger_meeting_history()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_meeting_change(NEW.id, 'created');
  ELSIF TG_OP = 'UPDATE' THEN
    -- Track status changes
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      PERFORM log_meeting_change(NEW.id, 'status_change', 'status', 'Status', 
        OLD.status::TEXT, NEW.status::TEXT);
    END IF;
    -- Track rescheduling (scheduled_at change)
    IF OLD.scheduled_at IS DISTINCT FROM NEW.scheduled_at THEN
      PERFORM log_meeting_change(NEW.id, 'rescheduled', 'scheduled_at', 'Scheduled At', 
        OLD.scheduled_at::TEXT, NEW.scheduled_at::TEXT);
    END IF;
    -- Track cancellation
    IF OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
      PERFORM log_meeting_change(NEW.id, 'cancelled', 'status', 'Status', 
        OLD.status::TEXT, NEW.status::TEXT);
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_meeting_change(OLD.id, 'deleted');
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Create Triggers
-- ============================================

CREATE TRIGGER audit_clients
  AFTER INSERT OR UPDATE OR DELETE ON clients
  FOR EACH ROW EXECUTE FUNCTION trigger_client_history();

CREATE TRIGGER audit_applicants
  AFTER INSERT OR UPDATE OR DELETE ON applicants
  FOR EACH ROW EXECUTE FUNCTION trigger_applicant_history();

CREATE TRIGGER audit_extra_works
  AFTER INSERT OR UPDATE OR DELETE ON extra_works
  FOR EACH ROW EXECUTE FUNCTION trigger_extra_work_history();

CREATE TRIGGER audit_meetings
  AFTER INSERT OR UPDATE OR DELETE ON meetings
  FOR EACH ROW EXECUTE FUNCTION trigger_meeting_history();

-- ============================================
-- RLS Policies
-- ============================================

-- Enable RLS
ALTER TABLE client_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE applicant_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE extra_work_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_log ENABLE ROW LEVEL SECURITY;

-- Client history policies
CREATE POLICY "Admins can view client history" ON client_history
  FOR SELECT USING (
    is_admin_or_management(auth.uid()) OR is_super_admin(auth.uid())
  );

CREATE POLICY "System can insert client history" ON client_history
  FOR INSERT WITH CHECK (true);

-- Applicant history policies
CREATE POLICY "Admins can view applicant history" ON applicant_history
  FOR SELECT USING (
    is_admin_or_management(auth.uid()) OR is_super_admin(auth.uid())
  );

CREATE POLICY "System can insert applicant history" ON applicant_history
  FOR INSERT WITH CHECK (true);

-- Extra work history policies
CREATE POLICY "Admins can view extra work history" ON extra_work_history
  FOR SELECT USING (
    is_admin_or_management(auth.uid()) OR is_super_admin(auth.uid())
  );

CREATE POLICY "System can insert extra work history" ON extra_work_history
  FOR INSERT WITH CHECK (true);

-- Meeting history policies
CREATE POLICY "Admins can view meeting history" ON meeting_history
  FOR SELECT USING (
    is_admin_or_management(auth.uid()) OR is_super_admin(auth.uid())
  );

CREATE POLICY "System can insert meeting history" ON meeting_history
  FOR INSERT WITH CHECK (true);

-- Integration log policies
CREATE POLICY "Admins can view integration log" ON integration_log
  FOR SELECT USING (
    is_admin_or_management(auth.uid()) OR is_super_admin(auth.uid())
  );

CREATE POLICY "System can insert integration log" ON integration_log
  FOR INSERT WITH CHECK (true);
