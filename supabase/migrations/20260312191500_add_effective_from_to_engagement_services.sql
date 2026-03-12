-- Add missing service activation date used by modification apply logic.
ALTER TABLE engagement_services
ADD COLUMN IF NOT EXISTS effective_from DATE;
