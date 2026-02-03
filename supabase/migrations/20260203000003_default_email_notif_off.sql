-- Default email notifications to OFF and update all existing profiles
ALTER TABLE profiles ALTER COLUMN email_notifications_enabled SET DEFAULT FALSE;
UPDATE profiles SET email_notifications_enabled = FALSE WHERE email_notifications_enabled IS DISTINCT FROM FALSE;
