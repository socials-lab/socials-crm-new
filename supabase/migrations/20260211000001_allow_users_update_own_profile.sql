-- Allow users to update their own colleague profile (for MyProfile page)
-- Previously only admins/management could update colleagues, but users need to
-- update their own phone, birthday, personal_email, billing details etc.

CREATE POLICY "Users can update own profile" ON colleagues
  FOR UPDATE
  USING (id = get_colleague_id(auth.uid()))
  WITH CHECK (id = get_colleague_id(auth.uid()));
