-- Add project column to marketing_work_logs to track which project/brand the activity belongs to
ALTER TABLE marketing_work_logs
  ADD COLUMN IF NOT EXISTS project TEXT CHECK (project IN ('socials', 'danny', 'otas'));
