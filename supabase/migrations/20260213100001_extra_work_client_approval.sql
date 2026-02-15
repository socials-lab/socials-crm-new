-- Add client approval fields to extra_works table
-- This enables a client-facing approval workflow where clients can approve/reject extra work

-- First, let's add 'rejected' to the extra_work_status enum
ALTER TYPE extra_work_status ADD VALUE IF NOT EXISTS 'rejected';

-- Add client approval fields
ALTER TABLE extra_works ADD COLUMN IF NOT EXISTS approval_token UUID DEFAULT gen_random_uuid();
ALTER TABLE extra_works ADD COLUMN IF NOT EXISTS client_approval_email TEXT;
ALTER TABLE extra_works ADD COLUMN IF NOT EXISTS client_approved_at TIMESTAMPTZ;
ALTER TABLE extra_works ADD COLUMN IF NOT EXISTS client_rejected_at TIMESTAMPTZ;
ALTER TABLE extra_works ADD COLUMN IF NOT EXISTS client_rejection_reason TEXT;

-- Create unique index on approval_token for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS extra_works_approval_token_idx ON extra_works(approval_token) WHERE approval_token IS NOT NULL;

-- Create a table to track public approval accesses (for audit trail)
CREATE TABLE IF NOT EXISTS extra_work_approval_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  extra_work_id UUID NOT NULL REFERENCES extra_works(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('viewed', 'approved', 'rejected')),
  email TEXT,
  ip_address TEXT,
  user_agent TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS for approval logs - CRM users can read
ALTER TABLE extra_work_approval_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY extra_work_approval_logs_crm_select ON extra_work_approval_logs
  FOR SELECT
  TO authenticated
  USING (has_crm_access(auth.uid()));

-- Function to get extra work by approval token (for public access)
CREATE OR REPLACE FUNCTION get_extra_work_by_approval_token(p_token UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  amount DECIMAL,
  currency TEXT,
  hours_worked DECIMAL,
  hourly_rate DECIMAL,
  status TEXT,
  client_name TEXT,
  engagement_name TEXT,
  colleague_name TEXT,
  client_approved_at TIMESTAMPTZ,
  client_rejected_at TIMESTAMPTZ,
  client_rejection_reason TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ew.id,
    ew.name,
    ew.description,
    ew.amount,
    ew.currency,
    ew.hours_worked,
    ew.hourly_rate,
    ew.status::TEXT,
    c.name AS client_name,
    e.name AS engagement_name,
    col.full_name AS colleague_name,
    ew.client_approved_at,
    ew.client_rejected_at,
    ew.client_rejection_reason
  FROM extra_works ew
  LEFT JOIN clients c ON ew.client_id = c.id
  LEFT JOIN engagements e ON ew.engagement_id = e.id
  LEFT JOIN colleagues col ON ew.colleague_id = col.id
  WHERE ew.approval_token = p_token
    AND ew.deleted_at IS NULL;
END;
$$;

-- Function to approve extra work via token (for public access)
CREATE OR REPLACE FUNCTION approve_extra_work_by_token(
  p_token UUID,
  p_email TEXT,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_extra_work_id UUID;
  v_status extra_work_status;
BEGIN
  -- Get the extra work
  SELECT id, status INTO v_extra_work_id, v_status
  FROM extra_works
  WHERE approval_token = p_token AND deleted_at IS NULL;

  IF v_extra_work_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Extra work not found');
  END IF;

  IF v_status != 'pending_approval' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Extra work is not pending approval', 'status', v_status::TEXT);
  END IF;

  -- Update the extra work
  UPDATE extra_works
  SET
    status = 'in_progress',
    client_approval_email = p_email,
    client_approved_at = now(),
    approval_date = now(),
    updated_at = now()
  WHERE id = v_extra_work_id;

  -- Log the approval
  INSERT INTO extra_work_approval_logs (extra_work_id, action, email, ip_address, user_agent)
  VALUES (v_extra_work_id, 'approved', p_email, p_ip_address, p_user_agent);

  RETURN jsonb_build_object('success', true, 'extra_work_id', v_extra_work_id);
END;
$$;

-- Function to reject extra work via token (for public access)
CREATE OR REPLACE FUNCTION reject_extra_work_by_token(
  p_token UUID,
  p_email TEXT,
  p_reason TEXT,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_extra_work_id UUID;
  v_status extra_work_status;
BEGIN
  -- Get the extra work
  SELECT id, status INTO v_extra_work_id, v_status
  FROM extra_works
  WHERE approval_token = p_token AND deleted_at IS NULL;

  IF v_extra_work_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Extra work not found');
  END IF;

  IF v_status != 'pending_approval' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Extra work is not pending approval', 'status', v_status::TEXT);
  END IF;

  -- Update the extra work
  UPDATE extra_works
  SET
    status = 'rejected',
    client_approval_email = p_email,
    client_rejected_at = now(),
    client_rejection_reason = p_reason,
    updated_at = now()
  WHERE id = v_extra_work_id;

  -- Log the rejection
  INSERT INTO extra_work_approval_logs (extra_work_id, action, email, ip_address, user_agent, rejection_reason)
  VALUES (v_extra_work_id, 'rejected', p_email, p_ip_address, p_user_agent, p_reason);

  RETURN jsonb_build_object('success', true, 'extra_work_id', v_extra_work_id);
END;
$$;

-- Grant execute on functions to anon role for public access
GRANT EXECUTE ON FUNCTION get_extra_work_by_approval_token(UUID) TO anon;
GRANT EXECUTE ON FUNCTION approve_extra_work_by_token(UUID, TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION reject_extra_work_by_token(UUID, TEXT, TEXT, TEXT, TEXT) TO anon;
