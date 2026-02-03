-- =============================================
-- Send email for every notification via pg_net
-- =============================================

-- Ensure pg_net extension is enabled
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Add email notification preference to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN DEFAULT TRUE;

-- Trigger function: call send-notification-email edge function on every notification INSERT
CREATE OR REPLACE FUNCTION send_notification_email_trigger()
RETURNS TRIGGER AS $$
DECLARE
  edge_function_url TEXT;
  anon_key TEXT;
BEGIN
  edge_function_url := 'https://bkemtvqmbpxopuasgxcq.supabase.co/functions/v1/send-notification-email';
  anon_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrZW10dnFtYnB4b3B1YXNneGNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzODQ3NTksImV4cCI6MjA4Mzk2MDc1OX0.w84I0KkFiJZ01BxABdfE9PqSbTkiwNl6jp7SD0ut0Xg';

  -- Fire async HTTP request via pg_net (non-blocking)
  PERFORM net.http_post(
    url := edge_function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || anon_key
    ),
    body := jsonb_build_object(
      'user_id', NEW.user_id,
      'type', NEW.type,
      'title', NEW.title,
      'message', NEW.message,
      'link', NEW.link
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_notification_send_email
  AFTER INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION send_notification_email_trigger();
