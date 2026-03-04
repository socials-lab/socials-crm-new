-- Ensure super admins receive admin/management notifications.

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
  WHERE (ur.role IN ('admin', 'management') OR COALESCE(ur.is_super_admin, false))
    AND ur.is_active = true
    AND (p_exclude_user_id IS NULL OR ur.user_id != p_exclude_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION notify_admins_new_feedback()
RETURNS TRIGGER AS $$
DECLARE
  admin_record RECORD;
  author_name TEXT;
BEGIN
  SELECT full_name INTO author_name
  FROM colleagues
  WHERE id = NEW.author_id;

  FOR admin_record IN
    SELECT ur.user_id
    FROM user_roles ur
    WHERE (ur.role IN ('admin', 'management') OR COALESCE(ur.is_super_admin, false))
      AND ur.is_active = true
      AND ur.user_id != (SELECT profile_id FROM colleagues WHERE id = NEW.author_id)
  LOOP
    INSERT INTO notifications (user_id, type, title, message, link, metadata)
    VALUES (
      admin_record.user_id,
      'new_feedback_idea',
      'Nový nápad!',
      COALESCE(author_name, 'Neznámý uživatel') || ' přidal nápad: "' || NEW.title || '"',
      '/feedback?idea=' || NEW.id::text,
      jsonb_build_object('idea_id', NEW.id, 'author_id', NEW.author_id)
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
