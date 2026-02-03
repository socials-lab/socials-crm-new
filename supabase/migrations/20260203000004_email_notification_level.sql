-- Replace boolean with a level: 'none', 'important', 'all'
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_notification_level TEXT DEFAULT 'none';

-- Migrate existing data
UPDATE profiles SET email_notification_level = CASE
  WHEN email_notifications_enabled = TRUE THEN 'all'
  ELSE 'none'
END;
