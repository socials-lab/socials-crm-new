-- Manual upsell commissions
-- Allows admins to add one-off/manual commissions tied to a specific engagement and colleague.

SET ROLE postgres;

CREATE TABLE IF NOT EXISTS manual_upsell_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  colleague_id UUID NOT NULL REFERENCES colleagues(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'CZK',
  note TEXT,
  commission_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_manual_upsell_commissions_date
  ON manual_upsell_commissions (commission_date);

CREATE INDEX IF NOT EXISTS idx_manual_upsell_commissions_engagement
  ON manual_upsell_commissions (engagement_id);

CREATE INDEX IF NOT EXISTS idx_manual_upsell_commissions_colleague
  ON manual_upsell_commissions (colleague_id);

ALTER TABLE manual_upsell_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "manual_upsell_commissions_select"
  ON manual_upsell_commissions
  FOR SELECT
  USING (has_crm_access(auth.uid()) AND deleted_at IS NULL);

CREATE POLICY "manual_upsell_commissions_insert_admin_only"
  ON manual_upsell_commissions
  FOR INSERT
  WITH CHECK ((has_role('admin') OR is_super_admin(auth.uid())) AND deleted_at IS NULL);

CREATE POLICY "manual_upsell_commissions_update_admin_only"
  ON manual_upsell_commissions
  FOR UPDATE
  USING (has_role('admin') OR is_super_admin(auth.uid()))
  WITH CHECK (has_role('admin') OR is_super_admin(auth.uid()));

CREATE POLICY "manual_upsell_commissions_delete_admin_only"
  ON manual_upsell_commissions
  FOR DELETE
  USING (has_role('admin') OR is_super_admin(auth.uid()));
