-- ============================================
-- Extra Work Constraints and Soft Delete
-- Fixes critical issues: cascade deletion, negative amounts, backward status transitions
-- ============================================

-- 1. Fix Colleague Deletion Cascade (CRITICAL)
-- Currently ON DELETE CASCADE destroys all extra work history when colleague is deleted
-- Change to RESTRICT to prevent data loss

ALTER TABLE extra_works
DROP CONSTRAINT IF EXISTS extra_works_colleague_id_fkey;

ALTER TABLE extra_works
ADD CONSTRAINT extra_works_colleague_id_fkey
FOREIGN KEY (colleague_id) REFERENCES colleagues(id) ON DELETE RESTRICT;

-- 2. Add Positive Value Constraints (CRITICAL)
-- Prevent negative or zero amounts which would corrupt invoices

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'extra_works_amount_positive') THEN
    ALTER TABLE extra_works ADD CONSTRAINT extra_works_amount_positive CHECK (amount > 0);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'extra_works_hours_positive') THEN
    ALTER TABLE extra_works ADD CONSTRAINT extra_works_hours_positive CHECK (hours_worked IS NULL OR hours_worked >= 0);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'extra_works_rate_positive') THEN
    ALTER TABLE extra_works ADD CONSTRAINT extra_works_rate_positive CHECK (hourly_rate IS NULL OR hourly_rate >= 0);
  END IF;
END $$;

-- 3. Add Soft Delete Column
-- Follow existing pattern from clients/engagements for data preservation

ALTER TABLE extra_works ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_extra_works_deleted_at
ON extra_works(deleted_at)
WHERE deleted_at IS NULL;

-- 4. Status Transition Validation Trigger (CRITICAL)
-- Enforce linear status flow: pending_approval -> in_progress -> ready_to_invoice -> invoiced
-- Block any backward transitions to maintain data integrity

CREATE OR REPLACE FUNCTION validate_extra_work_status_transition()
RETURNS TRIGGER AS $$
BEGIN
  -- Block any changes to invoiced items (fully immutable per user decision)
  IF OLD.status = 'invoiced' AND NEW.status != 'invoiced' THEN
    RAISE EXCEPTION 'Cannot change status of invoiced extra work item. Invoiced items are immutable.';
  END IF;

  -- Block backward transition from ready_to_invoice
  IF OLD.status = 'ready_to_invoice' AND NEW.status NOT IN ('ready_to_invoice', 'invoiced') THEN
    RAISE EXCEPTION 'Invalid status transition: cannot go backward from ready_to_invoice to %', NEW.status;
  END IF;

  -- Block backward transition from in_progress
  IF OLD.status = 'in_progress' AND NEW.status NOT IN ('in_progress', 'ready_to_invoice') THEN
    RAISE EXCEPTION 'Invalid status transition: cannot go backward from in_progress to %', NEW.status;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists and create new one
DROP TRIGGER IF EXISTS extra_work_status_transition ON extra_works;

CREATE TRIGGER extra_work_status_transition
BEFORE UPDATE ON extra_works
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION validate_extra_work_status_transition();

-- 5. Soft Delete Function
-- Allows deletion only for non-invoiced items, sets deleted_at instead of hard delete

CREATE OR REPLACE FUNCTION soft_delete_extra_work(p_extra_work_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE extra_works
  SET deleted_at = NOW(),
      updated_at = NOW()
  WHERE id = p_extra_work_id
    AND deleted_at IS NULL
    AND status != 'invoiced';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Extra work not found, already deleted, or is invoiced (cannot delete invoiced items)';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Prevent editing key fields on invoiced items
-- Additional safeguard at database level

CREATE OR REPLACE FUNCTION prevent_invoiced_extra_work_edit()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'invoiced' THEN
    -- Only allow updating invoice-related fields (set during invoice creation)
    IF NEW.hours_worked IS DISTINCT FROM OLD.hours_worked
       OR NEW.hourly_rate IS DISTINCT FROM OLD.hourly_rate
       OR NEW.amount IS DISTINCT FROM OLD.amount
       OR NEW.name IS DISTINCT FROM OLD.name
       OR NEW.description IS DISTINCT FROM OLD.description
       OR NEW.work_date IS DISTINCT FROM OLD.work_date
       OR NEW.billing_period IS DISTINCT FROM OLD.billing_period
       OR NEW.client_id IS DISTINCT FROM OLD.client_id
       OR NEW.engagement_id IS DISTINCT FROM OLD.engagement_id
       OR NEW.colleague_id IS DISTINCT FROM OLD.colleague_id
    THEN
      RAISE EXCEPTION 'Cannot modify invoiced extra work item. Only status and invoice fields can be updated.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_invoiced_extra_work_edit ON extra_works;

CREATE TRIGGER prevent_invoiced_extra_work_edit
BEFORE UPDATE ON extra_works
FOR EACH ROW
WHEN (OLD.status = 'invoiced')
EXECUTE FUNCTION prevent_invoiced_extra_work_edit();

-- 7. Add comment for documentation
COMMENT ON COLUMN extra_works.deleted_at IS 'Soft delete timestamp. NULL means not deleted. Deleted items are completely hidden per user decision.';
COMMENT ON TRIGGER extra_work_status_transition ON extra_works IS 'Enforces linear status flow: pending_approval -> in_progress -> ready_to_invoice -> invoiced. No backward transitions allowed.';
COMMENT ON TRIGGER prevent_invoiced_extra_work_edit ON extra_works IS 'Prevents modification of invoiced extra work items. Invoiced items are fully immutable.';
