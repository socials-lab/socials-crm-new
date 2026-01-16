-- Check if profiles table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'profiles'
) AS profiles_table_exists;

-- Check if trigger exists
SELECT EXISTS (
  SELECT FROM pg_trigger 
  WHERE tgname = 'on_auth_user_created'
) AS trigger_exists;

-- Check if function exists
SELECT EXISTS (
  SELECT FROM pg_proc 
  WHERE proname = 'handle_new_user'
) AS function_exists;
