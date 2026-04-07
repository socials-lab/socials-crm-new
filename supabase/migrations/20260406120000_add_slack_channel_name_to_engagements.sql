-- Add slack_channel_name to engagements for tracking Slack integration status
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS slack_channel_name text;
