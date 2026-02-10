-- Upsell Approvals table
-- Tracks approval status for upsell commissions (extra work and services)
-- Replaces localStorage-based approval tracking

SET ROLE postgres;

CREATE TABLE upsell_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type TEXT NOT NULL CHECK (item_type IN ('extra_work', 'service')),
  item_id UUID NOT NULL,
  approved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_by UUID NOT NULL REFERENCES colleagues(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure one approval per item
  UNIQUE (item_type, item_id)
);

-- RLS
ALTER TABLE upsell_approvals ENABLE ROW LEVEL SECURITY;

-- SELECT: any CRM user can read all approvals
CREATE POLICY "upsell_approvals_select" ON upsell_approvals
  FOR SELECT USING (has_crm_access(auth.uid()));

-- INSERT: admin/management only (they approve commissions)
CREATE POLICY "upsell_approvals_insert" ON upsell_approvals
  FOR INSERT WITH CHECK (is_admin_or_management(auth.uid()));

-- DELETE: admin/management only (revoke approval)
CREATE POLICY "upsell_approvals_delete" ON upsell_approvals
  FOR DELETE USING (is_admin_or_management(auth.uid()));

-- Index for fast lookups by item
CREATE INDEX idx_upsell_approvals_item
  ON upsell_approvals (item_type, item_id);

-- Index for lookups by approver
CREATE INDEX idx_upsell_approvals_approved_by
  ON upsell_approvals (approved_by);
