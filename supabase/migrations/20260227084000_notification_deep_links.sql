-- Add deep links to lead-targeted notifications so clicking opens specific lead detail

-- new_lead: link directly to created lead
CREATE OR REPLACE FUNCTION notify_new_lead()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_admin_notification(
    'new_lead',
    'Nový lead!',
    'Nový lead: "' || NEW.company_name || '"',
    '/leads?openLead=' || NEW.id::text,
    jsonb_build_object('lead_id', NEW.id, 'company_name', NEW.company_name)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- offer_sent: link directly to related lead
CREATE OR REPLACE FUNCTION notify_offer_sent()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.offer_sent_at IS NOT NULL AND OLD.offer_sent_at IS NULL THEN
    PERFORM create_admin_notification(
      'offer_sent',
      'Nabídka odeslána!',
      'Nabídka odeslána pro: "' || NEW.company_name || '"',
      '/leads?openLead=' || NEW.id::text,
      jsonb_build_object('lead_id', NEW.id, 'company_name', NEW.company_name)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- lead_converted: prefer opening related client when available
CREATE OR REPLACE FUNCTION notify_lead_converted()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.stage = 'won' AND OLD.stage != 'won' THEN
    PERFORM create_admin_notification(
      'lead_converted',
      'Lead převeden na klienta!',
      'Lead "' || NEW.company_name || '" byl úspěšně převeden.',
      CASE
        WHEN NEW.converted_to_client_id IS NOT NULL THEN '/clients?highlight=' || NEW.converted_to_client_id::text
        ELSE '/clients'
      END,
      jsonb_build_object(
        'lead_id', NEW.id,
        'company_name', NEW.company_name,
        'client_id', NEW.converted_to_client_id
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
