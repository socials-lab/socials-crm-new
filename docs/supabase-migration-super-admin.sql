-- Migration: Add super admin role for danny@socials.cz
-- This migration:
-- 1. Creates profile for danny@socials.cz if missing
-- 2. Assigns super admin role to danny@socials.cz
-- 3. Updates handle_new_user trigger to auto-assign super admin to first user

-- 1. Insert profile for danny@socials.cz
INSERT INTO public.profiles (id, email, first_name, last_name)
VALUES ('746cca60-f2b3-44ae-ab5a-2b0168393399', 'danny@socials.cz', 'Danny', 'Admin')
ON CONFLICT (id) DO NOTHING;

-- 2. Assign super admin role
INSERT INTO public.user_roles (user_id, role, is_super_admin)
VALUES ('746cca60-f2b3-44ae-ab5a-2b0168393399', 'admin', TRUE)
ON CONFLICT DO NOTHING;

-- 3. Update handle_new_user trigger to auto-assign super admin + auto-link colleague
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_count INTEGER;
    existing_colleague_id UUID;
BEGIN
    -- 1. Create profile
    INSERT INTO public.profiles (id, first_name, last_name, email)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data ->> 'first_name',
        NEW.raw_user_meta_data ->> 'last_name',
        NEW.email
    );
    
    -- 2. Link existing colleague by email (if exists and not already linked)
    SELECT id INTO existing_colleague_id
    FROM public.colleagues
    WHERE email = NEW.email
      AND profile_id IS NULL
    LIMIT 1;
    
    IF existing_colleague_id IS NOT NULL THEN
        UPDATE public.colleagues
        SET profile_id = NEW.id
        WHERE id = existing_colleague_id;
    END IF;
    
    -- 3. If this is the first user, auto-assign super admin role
    SELECT COUNT(*) INTO user_count FROM public.user_roles;
    IF user_count = 0 THEN
        INSERT INTO public.user_roles (user_id, role, is_super_admin)
        VALUES (NEW.id, 'admin', TRUE);
    END IF;
    
    RETURN NEW;
END;
$$;

-- 4. Create colleague record for danny@socials.cz linked to profile
INSERT INTO public.colleagues (full_name, email, position, seniority, status, profile_id, is_freelancer)
VALUES ('Danny', 'danny@socials.cz', 'Managing Director', 'partner', 'active', '746cca60-f2b3-44ae-ab5a-2b0168393399', false)
ON CONFLICT DO NOTHING;

-- 5. Delete test seed colleague
DELETE FROM public.colleagues WHERE email = 'admin@company.cz';
