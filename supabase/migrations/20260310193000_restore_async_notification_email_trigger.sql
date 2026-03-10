-- Restore async notification email pipeline after trigger removal.
-- Uses pg_net fire-and-forget call to edge function and tracks delivery status
-- to avoid duplicate sends.

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.notification_email_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL UNIQUE REFERENCES public.notifications(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  reason TEXT,
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.set_notification_email_deliveries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notification_email_deliveries_updated_at ON public.notification_email_deliveries;
CREATE TRIGGER trg_notification_email_deliveries_updated_at
BEFORE UPDATE ON public.notification_email_deliveries
FOR EACH ROW
EXECUTE FUNCTION public.set_notification_email_deliveries_updated_at();

-- Edge function trigger for notification emails.
-- IMPORTANT: keep this async and never raise to caller.
CREATE OR REPLACE FUNCTION public.send_notification_email_trigger()
RETURNS TRIGGER AS $$
DECLARE
  edge_function_url TEXT := 'https://bkemtvqmbpxopuasgxcq.supabase.co/functions/v1/send-notification-email';
  anon_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrZW10dnFtYnB4b3B1YXNneGNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzODQ3NTksImV4cCI6MjA4Mzk2MDc1OX0.w84I0KkFiJZ01BxABdfE9PqSbTkiwNl6jp7SD0ut0Xg';
BEGIN
  BEGIN
    PERFORM net.http_post(
      url := edge_function_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || anon_key
      ),
      body := jsonb_build_object(
        'notification_id', NEW.id,
        'user_id', NEW.user_id
      )
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'send_notification_email_trigger failed for notification %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_notification_send_email ON public.notifications;
CREATE TRIGGER on_notification_send_email
  AFTER INSERT ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.send_notification_email_trigger();
