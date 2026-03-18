-- Enable CRM-side bug reporting access while keeping service-role integrations.
ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role has full access to bug_reports" ON bug_reports;
CREATE POLICY "Service role has full access to bug_reports"
  ON bug_reports
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Authenticated users can read socials bug reports"
  ON bug_reports
  FOR SELECT
  TO authenticated
  USING (app_name = 'socials-crm');

CREATE POLICY "Authenticated users can insert socials bug reports"
  ON bug_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (app_name = 'socials-crm');

CREATE POLICY "Admins can update socials bug reports"
  ON bug_reports
  FOR UPDATE
  TO authenticated
  USING (app_name = 'socials-crm' AND is_admin_or_management(auth.uid()))
  WITH CHECK (app_name = 'socials-crm' AND is_admin_or_management(auth.uid()));
