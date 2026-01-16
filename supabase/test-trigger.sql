-- Test if the handle_new_user function works
-- Run this in Supabase SQL Editor

-- First, let's check if we can insert into profiles directly
DO $$
BEGIN
  -- Try inserting a test profile (this will fail if there's an RLS or permission issue)
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    gen_random_uuid(),
    'Test User',
    'test@example.com'
  );
  
  RAISE NOTICE 'SUCCESS: Direct insert to profiles works!';
  
  -- Clean up
  DELETE FROM public.profiles WHERE email = 'test@example.com';
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'FAILED: %', SQLERRM;
END $$;

-- Check if the function can be called
SELECT proname, prosecdef, proowner::regrole 
FROM pg_proc 
WHERE proname = 'handle_new_user';
