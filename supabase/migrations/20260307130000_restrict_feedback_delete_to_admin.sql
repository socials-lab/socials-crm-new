-- Restrict feedback deletion to admin users only.
-- This prevents management users from deleting feedback ideas.

SET ROLE postgres;

DROP POLICY IF EXISTS "Admins can delete feedback ideas" ON feedback_ideas;

CREATE POLICY "Admins can delete feedback ideas"
  ON feedback_ideas FOR DELETE
  USING (has_role('admin') OR is_super_admin(auth.uid()));
