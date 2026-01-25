-- Migration: Add billing change audit trail
-- Tracks changes to sensitive billing fields for compliance

-- Create billing change log table
CREATE TABLE IF NOT EXISTS billing_change_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT
);

-- Index for quick lookups by client
CREATE INDEX idx_billing_change_log_client_id ON billing_change_log(client_id);
CREATE INDEX idx_billing_change_log_changed_at ON billing_change_log(changed_at DESC);

-- RLS policies
ALTER TABLE billing_change_log ENABLE ROW LEVEL SECURITY;

-- Only CRM users can read audit logs
CREATE POLICY "CRM users can read billing change log"
  ON billing_change_log
  FOR SELECT
  TO authenticated
  USING (has_crm_access(auth.uid()));

-- Trigger function to log billing changes
CREATE OR REPLACE FUNCTION log_billing_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Log IČO changes
  IF OLD.ico IS DISTINCT FROM NEW.ico THEN
    INSERT INTO billing_change_log (client_id, changed_by, field_name, old_value, new_value)
    VALUES (NEW.id, auth.uid(), 'ico', OLD.ico, NEW.ico);
  END IF;

  -- Log DIČ changes
  IF OLD.dic IS DISTINCT FROM NEW.dic THEN
    INSERT INTO billing_change_log (client_id, changed_by, field_name, old_value, new_value)
    VALUES (NEW.id, auth.uid(), 'dic', OLD.dic, NEW.dic);
  END IF;

  -- Log company name changes
  IF OLD.name IS DISTINCT FROM NEW.name THEN
    INSERT INTO billing_change_log (client_id, changed_by, field_name, old_value, new_value)
    VALUES (NEW.id, auth.uid(), 'name', OLD.name, NEW.name);
  END IF;

  -- Log billing_street changes
  IF OLD.billing_street IS DISTINCT FROM NEW.billing_street THEN
    INSERT INTO billing_change_log (client_id, changed_by, field_name, old_value, new_value)
    VALUES (NEW.id, auth.uid(), 'billing_street', OLD.billing_street, NEW.billing_street);
  END IF;

  -- Log billing_city changes
  IF OLD.billing_city IS DISTINCT FROM NEW.billing_city THEN
    INSERT INTO billing_change_log (client_id, changed_by, field_name, old_value, new_value)
    VALUES (NEW.id, auth.uid(), 'billing_city', OLD.billing_city, NEW.billing_city);
  END IF;

  -- Log billing_zip changes
  IF OLD.billing_zip IS DISTINCT FROM NEW.billing_zip THEN
    INSERT INTO billing_change_log (client_id, changed_by, field_name, old_value, new_value)
    VALUES (NEW.id, auth.uid(), 'billing_zip', OLD.billing_zip, NEW.billing_zip);
  END IF;

  -- Log billing_country changes
  IF OLD.billing_country IS DISTINCT FROM NEW.billing_country THEN
    INSERT INTO billing_change_log (client_id, changed_by, field_name, old_value, new_value)
    VALUES (NEW.id, auth.uid(), 'billing_country', OLD.billing_country, NEW.billing_country);
  END IF;

  -- Log billing_email changes
  IF OLD.billing_email IS DISTINCT FROM NEW.billing_email THEN
    INSERT INTO billing_change_log (client_id, changed_by, field_name, old_value, new_value)
    VALUES (NEW.id, auth.uid(), 'billing_email', OLD.billing_email, NEW.billing_email);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on clients table
DROP TRIGGER IF EXISTS billing_changes_trigger ON clients;
CREATE TRIGGER billing_changes_trigger
  AFTER UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION log_billing_changes();

-- Comment
COMMENT ON TABLE billing_change_log IS 'Audit trail for changes to sensitive billing fields on clients';
