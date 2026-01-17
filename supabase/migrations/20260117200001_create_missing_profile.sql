-- Create missing profile for the admin user
-- The handle_new_user trigger may have failed or wasn't active when the user was created

-- Insert profile for the admin user if it doesn't exist
INSERT INTO public.profiles (id, email, full_name)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', u.email)
FROM auth.users u
WHERE u.id = 'aed9bb9f-c412-4f85-99dd-219e46f9d360'
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = u.id
  );

-- Also create profiles for any other users that might be missing
INSERT INTO public.profiles (id, email, full_name)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', u.email)
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
);
