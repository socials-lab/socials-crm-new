-- Create bug_reports table for storing bug reports from the browser extension
CREATE TABLE IF NOT EXISTS bug_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  description text,
  app_name text,
  url text,
  screenshot_url text,
  console_logs jsonb,
  network_logs jsonb,
  dom_snapshot text,
  environment jsonb,
  pr_url text,
  status text DEFAULT 'new',
  priority text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;

-- Service role has full access (bypasses RLS by default, but explicit policy for clarity)
CREATE POLICY "Service role has full access to bug_reports"
  ON bug_reports
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_bug_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bug_reports_updated_at
  BEFORE UPDATE ON bug_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_bug_reports_updated_at();
