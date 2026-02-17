-- Remove the blocking notification email trigger
-- This trigger was using pg_net.http_post which was blocking instead of being async,
-- causing lead creation and other operations to timeout.
--
-- Notifications are still created in the database, but emails are no longer
-- sent automatically via database trigger. Email sending should be handled
-- at the application level if needed.

DROP TRIGGER IF EXISTS on_notification_send_email ON notifications;

-- Keep the function for reference, but it's no longer used
-- DROP FUNCTION IF EXISTS send_notification_email_trigger();
