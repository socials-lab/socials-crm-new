-- =============================================
-- Notification triggers for 6 missing types
-- =============================================

-- Helper function: create notification for all admin/management users
CREATE OR REPLACE FUNCTION create_admin_notification(
  p_type notification_type,
  p_title TEXT,
  p_message TEXT,
  p_link TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_exclude_user_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, message, link, metadata)
  SELECT ur.user_id, p_type, p_title, p_message, p_link, p_metadata
  FROM user_roles ur
  WHERE ur.role IN ('admin', 'management')
    AND ur.is_active = true
    AND (p_exclude_user_id IS NULL OR ur.user_id != p_exclude_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. new_lead: notify admins when a new lead is created
CREATE OR REPLACE FUNCTION notify_new_lead()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_admin_notification(
    'new_lead',
    'Nový lead!',
    'Nový lead: "' || NEW.company_name || '"',
    '/leads',
    jsonb_build_object('lead_id', NEW.id, 'company_name', NEW.company_name)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_new_lead
  AFTER INSERT ON leads
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_lead();

-- 2. offer_sent: notify admins when offer_sent_at is set on a lead
CREATE OR REPLACE FUNCTION notify_offer_sent()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.offer_sent_at IS NOT NULL AND OLD.offer_sent_at IS NULL THEN
    PERFORM create_admin_notification(
      'offer_sent',
      'Nabídka odeslána!',
      'Nabídka odeslána pro: "' || NEW.company_name || '"',
      '/leads',
      jsonb_build_object('lead_id', NEW.id, 'company_name', NEW.company_name)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_offer_sent
  AFTER UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION notify_offer_sent();

-- 3. lead_converted: notify admins when lead stage changes to 'won'
CREATE OR REPLACE FUNCTION notify_lead_converted()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.stage = 'won' AND OLD.stage != 'won' THEN
    PERFORM create_admin_notification(
      'lead_converted',
      'Lead převeden na klienta!',
      'Lead "' || NEW.company_name || '" byl úspěšně převeden.',
      '/clients',
      jsonb_build_object('lead_id', NEW.id, 'company_name', NEW.company_name)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_lead_converted
  AFTER UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION notify_lead_converted();
