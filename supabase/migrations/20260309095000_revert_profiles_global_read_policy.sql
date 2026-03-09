-- Revert overly broad profiles read policy introduced during incident response
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;
