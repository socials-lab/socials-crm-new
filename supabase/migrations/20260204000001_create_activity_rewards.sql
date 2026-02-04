-- Activity Rewards table for internal work (interní práce)
-- Tracks marketing and overhead activities that colleagues invoice separately from client work

SET ROLE postgres;

CREATE TABLE activity_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  colleague_id UUID NOT NULL REFERENCES colleagues(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('marketing', 'overhead')),
  description TEXT NOT NULL,
  invoice_item_name TEXT NOT NULL,
  billing_type TEXT NOT NULL CHECK (billing_type IN ('fixed', 'hourly')),
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  hours NUMERIC,
  hourly_rate NUMERIC,
  activity_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- updated_at trigger (reuses existing function from 001_initial_schema)
CREATE TRIGGER update_activity_rewards_updated_at
  BEFORE UPDATE ON activity_rewards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE activity_rewards ENABLE ROW LEVEL SECURITY;

-- SELECT: any CRM user can read all activity rewards
CREATE POLICY "activity_rewards_select" ON activity_rewards
  FOR SELECT USING (has_crm_access(auth.uid()));

-- INSERT: own colleague_id or admin/management
CREATE POLICY "activity_rewards_insert" ON activity_rewards
  FOR INSERT WITH CHECK (
    colleague_id = get_colleague_id(auth.uid())
    OR is_admin_or_management(auth.uid())
  );

-- UPDATE: own colleague_id or admin/management
CREATE POLICY "activity_rewards_update" ON activity_rewards
  FOR UPDATE USING (
    colleague_id = get_colleague_id(auth.uid())
    OR is_admin_or_management(auth.uid())
  );

-- DELETE: own colleague_id or admin/management
CREATE POLICY "activity_rewards_delete" ON activity_rewards
  FOR DELETE USING (
    colleague_id = get_colleague_id(auth.uid())
    OR is_admin_or_management(auth.uid())
  );

-- Index for common query pattern (filter by colleague + date)
CREATE INDEX idx_activity_rewards_colleague_date
  ON activity_rewards (colleague_id, activity_date DESC);
