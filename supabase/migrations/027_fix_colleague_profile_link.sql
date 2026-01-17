-- Fix unlinked colleague-profile relationship for admin@ranajakub.com
-- The invite-user function created the colleague after the profile, so the auto-link trigger missed it

UPDATE colleagues 
SET profile_id = '6e9fde7b-ca72-4090-9d92-c956152dae0c'
WHERE email = 'admin@ranajakub.com' 
  AND profile_id IS NULL;
