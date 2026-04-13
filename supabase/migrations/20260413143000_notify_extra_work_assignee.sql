-- Notify assignee on extra work creation and client approval.

ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'extra_work_created';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'extra_work_approved';

CREATE OR REPLACE FUNCTION public.notify_extra_work_assignee()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_client_name TEXT;
BEGIN
  SELECT
    c.profile_id,
    COALESCE(cl.brand_name, cl.name, 'neznámý klient')
  INTO v_user_id, v_client_name
  FROM public.colleagues c
  LEFT JOIN public.clients cl ON cl.id = NEW.client_id
  WHERE c.id = NEW.colleague_id
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications (user_id, type, title, message, link, metadata)
    VALUES (
      v_user_id,
      'extra_work_created',
      '🔧 Nová vícepráce',
      format('Byla vám přiřazena vícepráce "%s" (%s).', NEW.name, v_client_name),
      format('/extra-work?highlight=%s', NEW.id),
      jsonb_build_object(
        'extra_work_id', NEW.id,
        'client_name', v_client_name,
        'colleague_id', NEW.colleague_id
      )
    );
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE'
     AND NEW.client_approved_at IS NOT NULL
     AND OLD.client_approved_at IS NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message, link, metadata)
    VALUES (
      v_user_id,
      'extra_work_approved',
      '✅ Vícepráce schválena klientem',
      format('Klient schválil vícepráci "%s". Můžete začít realizovat.', NEW.name),
      format('/extra-work?highlight=%s', NEW.id),
      jsonb_build_object(
        'extra_work_id', NEW.id,
        'client_name', v_client_name,
        'colleague_id', NEW.colleague_id
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_notify_extra_work_assignee ON public.extra_works;
CREATE TRIGGER trg_notify_extra_work_assignee
AFTER INSERT OR UPDATE ON public.extra_works
FOR EACH ROW
EXECUTE FUNCTION public.notify_extra_work_assignee();

