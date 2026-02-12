-- Add 'rejected' value to extra_work_status enum
ALTER TYPE extra_work_status ADD VALUE IF NOT EXISTS 'rejected';

-- Add approval flow columns to extra_works
ALTER TABLE extra_works
  ADD COLUMN IF NOT EXISTS approval_token text UNIQUE,
  ADD COLUMN IF NOT EXISTS client_approval_email text,
  ADD COLUMN IF NOT EXISTS client_approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS client_rejected_at timestamptz,
  ADD COLUMN IF NOT EXISTS client_rejection_reason text;

-- RLS policy: allow anon to read extra_works by approval_token
CREATE POLICY "Anon can read extra_works by token"
  ON extra_works
  FOR SELECT
  TO anon
  USING (approval_token IS NOT NULL AND approval_token = current_setting('request.headers', true)::json->>'x-approval-token');
