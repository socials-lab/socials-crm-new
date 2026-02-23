-- Bug reports table for Citrus bug reporting system
CREATE TABLE bug_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  app_name TEXT NOT NULL,
  url TEXT,
  screenshot_url TEXT,
  console_logs JSONB DEFAULT '[]',
  network_logs JSONB DEFAULT '[]',
  dom_snapshot TEXT,
  environment JSONB DEFAULT '{}',
  pr_url TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  priority TEXT NOT NULL DEFAULT 'medium',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_bug_reports_status ON bug_reports(status);
CREATE INDEX idx_bug_reports_app_name ON bug_reports(app_name);
CREATE INDEX idx_bug_reports_created_at ON bug_reports(created_at DESC);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_bug_reports_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER bug_reports_updated_at
  BEFORE UPDATE ON bug_reports
  FOR EACH ROW EXECUTE FUNCTION update_bug_reports_updated_at();

-- RLS
ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;

-- Service role (edge functions) can do everything via SUPABASE_SERVICE_ROLE_KEY
-- Authenticated users can read bug reports
CREATE POLICY "authenticated_select" ON bug_reports
  FOR SELECT TO authenticated USING (true);

-- No direct insert/update/delete for authenticated users - managed via edge functions with service role
