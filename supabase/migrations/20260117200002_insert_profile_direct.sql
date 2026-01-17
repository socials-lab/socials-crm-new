-- Directly insert profile for the admin user
-- Get email from auth.users and insert if missing

DO $$
DECLARE
  v_user_id UUID := 'aed9bb9f-c412-4f85-99dd-219e46f9d360';
  v_email TEXT;
  v_full_name TEXT;
BEGIN
  -- Get user info from auth.users
  SELECT email, COALESCE(raw_user_meta_data->>'full_name', email)
  INTO v_email, v_full_name
  FROM auth.users
  WHERE id = v_user_id;

  IF v_email IS NOT NULL THEN
    -- Insert profile if it doesn't exist
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (v_user_id, v_email, v_full_name)
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'Created profile for user % with email %', v_user_id, v_email;
  ELSE
    RAISE NOTICE 'No user found with id %', v_user_id;
  END IF;
END $$;

-- Show profiles count after
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM public.profiles;
  RAISE NOTICE 'Total profiles: %', v_count;
END $$;
