CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

ALTER TABLE public.notification_email_deliveries
ADD COLUMN IF NOT EXISTS dispatch_token TEXT;

UPDATE public.notification_email_deliveries
SET dispatch_token = encode(extensions.gen_random_bytes(24), 'hex')
WHERE dispatch_token IS NULL;

ALTER TABLE public.notification_email_deliveries
ALTER COLUMN dispatch_token SET NOT NULL;

CREATE OR REPLACE FUNCTION public.send_notification_email_trigger()
RETURNS TRIGGER AS $$
DECLARE
  edge_function_url TEXT := 'https://bkemtvqmbpxopuasgxcq.supabase.co/functions/v1/send-notification-email';
  dispatch_token TEXT := encode(extensions.gen_random_bytes(24), 'hex');
BEGIN
  BEGIN
    INSERT INTO public.notification_email_deliveries (
      notification_id,
      status,
      reason,
      error_message,
      sent_at,
      dispatch_token
    ) VALUES (
      NEW.id,
      'pending',
      NULL,
      NULL,
      NULL,
      dispatch_token
    )
    ON CONFLICT (notification_id) DO UPDATE
    SET status = 'pending',
        reason = NULL,
        error_message = NULL,
        sent_at = NULL,
        dispatch_token = EXCLUDED.dispatch_token;

    PERFORM net.http_post(
      url := edge_function_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object(
        'notification_id', NEW.id,
        'user_id', NEW.user_id,
        'dispatch_token', dispatch_token
      )
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'send_notification_email_trigger failed for notification %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
