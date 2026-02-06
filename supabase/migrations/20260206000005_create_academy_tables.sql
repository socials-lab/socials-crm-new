-- Academy content management tables

-- First, add can_edit_academy column to user_roles if not exists
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS can_edit_academy BOOLEAN DEFAULT false;

-- Create academy_modules table
CREATE TABLE IF NOT EXISTS public.academy_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    icon TEXT NOT NULL DEFAULT 'BookOpen',
    required BOOLEAN DEFAULT false,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    links JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Create academy_videos table
CREATE TABLE IF NOT EXISTS public.academy_videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES public.academy_modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    duration TEXT,
    video_url TEXT,
    thumbnail_url TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    links JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.academy_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_videos ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "CRM users can read academy modules" ON public.academy_modules;
DROP POLICY IF EXISTS "Admins can manage academy modules" ON public.academy_modules;
DROP POLICY IF EXISTS "CRM users can read academy videos" ON public.academy_videos;
DROP POLICY IF EXISTS "Admins can manage academy videos" ON public.academy_videos;
DROP POLICY IF EXISTS "academy_modules_select" ON public.academy_modules;
DROP POLICY IF EXISTS "academy_modules_insert" ON public.academy_modules;
DROP POLICY IF EXISTS "academy_modules_update" ON public.academy_modules;
DROP POLICY IF EXISTS "academy_modules_delete" ON public.academy_modules;
DROP POLICY IF EXISTS "academy_videos_select" ON public.academy_videos;
DROP POLICY IF EXISTS "academy_videos_insert" ON public.academy_videos;
DROP POLICY IF EXISTS "academy_videos_update" ON public.academy_videos;
DROP POLICY IF EXISTS "academy_videos_delete" ON public.academy_videos;

-- RLS policies for academy_modules
-- All authenticated users with CRM access can read
CREATE POLICY "academy_modules_select" ON public.academy_modules
    FOR SELECT TO authenticated
    USING (has_crm_access(auth.uid()));

-- Admins and users with can_edit_academy can insert
CREATE POLICY "academy_modules_insert" ON public.academy_modules
    FOR INSERT TO authenticated
    WITH CHECK (
        is_admin_or_management(auth.uid()) OR
        EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND can_edit_academy = true AND is_active = true)
    );

-- Admins and users with can_edit_academy can update
CREATE POLICY "academy_modules_update" ON public.academy_modules
    FOR UPDATE TO authenticated
    USING (
        is_admin_or_management(auth.uid()) OR
        EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND can_edit_academy = true AND is_active = true)
    );

-- Admins and users with can_edit_academy can delete
CREATE POLICY "academy_modules_delete" ON public.academy_modules
    FOR DELETE TO authenticated
    USING (
        is_admin_or_management(auth.uid()) OR
        EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND can_edit_academy = true AND is_active = true)
    );

-- RLS policies for academy_videos
CREATE POLICY "academy_videos_select" ON public.academy_videos
    FOR SELECT TO authenticated
    USING (has_crm_access(auth.uid()));

CREATE POLICY "academy_videos_insert" ON public.academy_videos
    FOR INSERT TO authenticated
    WITH CHECK (
        is_admin_or_management(auth.uid()) OR
        EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND can_edit_academy = true AND is_active = true)
    );

CREATE POLICY "academy_videos_update" ON public.academy_videos
    FOR UPDATE TO authenticated
    USING (
        is_admin_or_management(auth.uid()) OR
        EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND can_edit_academy = true AND is_active = true)
    );

CREATE POLICY "academy_videos_delete" ON public.academy_videos
    FOR DELETE TO authenticated
    USING (
        is_admin_or_management(auth.uid()) OR
        EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND can_edit_academy = true AND is_active = true)
    );

-- Add updated_at triggers
DROP TRIGGER IF EXISTS update_academy_modules_updated_at ON public.academy_modules;
CREATE TRIGGER update_academy_modules_updated_at
    BEFORE UPDATE ON public.academy_modules
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_academy_videos_updated_at ON public.academy_videos;
CREATE TRIGGER update_academy_videos_updated_at
    BEFORE UPDATE ON public.academy_videos
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_academy_modules_sort ON public.academy_modules(sort_order);
CREATE INDEX IF NOT EXISTS idx_academy_modules_active ON public.academy_modules(is_active);
CREATE INDEX IF NOT EXISTS idx_academy_videos_module ON public.academy_videos(module_id);
CREATE INDEX IF NOT EXISTS idx_academy_videos_sort ON public.academy_videos(sort_order);
CREATE INDEX IF NOT EXISTS idx_academy_videos_active ON public.academy_videos(is_active);
