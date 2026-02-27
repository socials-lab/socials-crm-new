-- Deep-link feedback notifications to the exact idea

CREATE OR REPLACE FUNCTION notify_admins_new_feedback()
RETURNS TRIGGER AS $$
DECLARE
  admin_record RECORD;
  author_name TEXT;
BEGIN
  -- Get author name
  SELECT full_name INTO author_name
  FROM colleagues WHERE id = NEW.author_id;

  -- Insert notification for each admin/management user
  FOR admin_record IN
    SELECT ur.user_id
    FROM user_roles ur
    WHERE ur.role IN ('admin', 'management')
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
