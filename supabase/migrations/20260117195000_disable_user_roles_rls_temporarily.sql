-- TEMPORARILY DISABLE RLS on user_roles to debug the hanging query issue
-- This is a debug migration - we'll add proper RLS back once we confirm this fixes it

ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- Also drop any remaining policies that might still exist
DO $$ 
DECLARE 
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'user_roles' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_roles', pol.policyname);
    END LOOP;
END $$;
