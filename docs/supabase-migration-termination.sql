-- Migration: Add termination fields to engagements table
-- Date: 2026-01-27
-- Description: Adds columns to track engagement termination reason, initiator, and notes

-- Add termination_reason column
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS 
  termination_reason text DEFAULT NULL;

-- Add termination_initiated_by column ('client' or 'agency')
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS 
  termination_initiated_by text DEFAULT NULL;

-- Add termination_notes column
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS 
  termination_notes text DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN engagements.termination_reason IS 'Reason for termination: budget_cut, strategy_change, dissatisfied, agency_terminated, project_completed, merged_with_another, other';
COMMENT ON COLUMN engagements.termination_initiated_by IS 'Who initiated the termination: client or agency';
COMMENT ON COLUMN engagements.termination_notes IS 'Additional notes about the termination';
