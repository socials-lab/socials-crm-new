-- Academy content management migration
-- Run this in Supabase SQL Editor

-- Create academy_modules table
CREATE TABLE public.academy_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    icon TEXT NOT NULL DEFAULT 'BookOpen',
    required BOOLEAN DEFAULT false,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Create academy_videos table
CREATE TABLE public.academy_videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES public.academy_modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    duration TEXT,
    video_url TEXT,
    thumbnail_url TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.academy_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_videos ENABLE ROW LEVEL SECURITY;

-- RLS policies for academy_modules
-- All authenticated CRM users can read
CREATE POLICY "CRM users can read academy modules"
ON public.academy_modules
FOR SELECT
TO authenticated
USING (public.is_crm_user(auth.uid()));

-- Only admins/super admins can insert/update/delete
CREATE POLICY "Admins can manage academy modules"
ON public.academy_modules
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- RLS policies for academy_videos
-- All authenticated CRM users can read
CREATE POLICY "CRM users can read academy videos"
ON public.academy_videos
FOR SELECT
TO authenticated
USING (public.is_crm_user(auth.uid()));

-- Only admins/super admins can insert/update/delete
CREATE POLICY "Admins can manage academy videos"
ON public.academy_videos
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Add updated_at trigger
CREATE TRIGGER update_academy_modules_updated_at
    BEFORE UPDATE ON public.academy_modules
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_academy_videos_updated_at
    BEFORE UPDATE ON public.academy_videos
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Add can_edit_academy column to user_roles for granular permission
-- This allows non-admin users to edit academy content when enabled
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS can_edit_academy BOOLEAN DEFAULT false;

-- Insert default modules (based on current hardcoded data)
INSERT INTO public.academy_modules (id, title, description, icon, required, sort_order) VALUES
('00000000-0000-0000-0000-000000000001', 'Vítej v Socials! 👋', 'Úvod do naší agentury, kultury a hodnot', 'Users', true, 1),
('00000000-0000-0000-0000-000000000002', 'Nástroje a procesy 🛠️', 'Všechny nástroje které používáme denně', 'Settings', true, 2),
('00000000-0000-0000-0000-000000000003', 'Práce s klienty 🤝', 'Jak komunikovat a pracovat s našimi klienty', 'Briefcase', true, 3),
('00000000-0000-0000-0000-000000000004', 'Performance marketing 📈', 'Základy výkonnostní reklamy', 'Target', false, 4),
('00000000-0000-0000-0000-000000000005', 'Creative Boost 🎨', 'Vše o naší kreativní službě', 'Sparkles', false, 5);

-- Insert default videos
INSERT INTO public.academy_videos (module_id, title, description, duration, video_url, sort_order) VALUES
-- Welcome module
('00000000-0000-0000-0000-000000000001', 'Kdo jsme a co děláme', 'Seznámení s agenturou Socials, naše mise a vize', '5:30', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 1),
('00000000-0000-0000-0000-000000000001', 'Naše hodnoty a kultura', 'Jak u nás pracujeme a co je pro nás důležité', '4:15', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 2),
('00000000-0000-0000-0000-000000000001', 'Seznámení s týmem', 'Kdo je kdo a na koho se obrátit', '6:00', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 3),
-- Tools module
('00000000-0000-0000-0000-000000000002', 'CRM systém - základy', 'Jak používat Socials CRM pro správu klientů', '8:20', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 1),
('00000000-0000-0000-0000-000000000002', 'Freelo - projektové řízení', 'Práce s úkoly a projekty ve Freelu', '7:45', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 2),
('00000000-0000-0000-0000-000000000002', 'Slack komunikace', 'Pravidla komunikace a kanály', '4:00', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 3),
('00000000-0000-0000-0000-000000000002', 'Google Workspace', 'Dokumenty, kalendář a další Google nástroje', '5:30', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 4),
-- Clients module
('00000000-0000-0000-0000-000000000003', 'Onboarding nového klienta', 'Proces nástupu nového klienta krok za krokem', '10:15', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 1),
('00000000-0000-0000-0000-000000000003', 'Pravidelná komunikace', 'Jak a kdy komunikovat s klienty', '6:30', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 2),
('00000000-0000-0000-0000-000000000003', 'Řešení problémů', 'Co dělat když něco nejde podle plánu', '7:00', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 3),
-- Performance module
('00000000-0000-0000-0000-000000000004', 'Meta Ads základy', 'Úvod do Facebook a Instagram reklamy', '12:00', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 1),
('00000000-0000-0000-0000-000000000004', 'Google Ads základy', 'Úvod do Google vyhledávání a PMax', '11:30', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 2),
('00000000-0000-0000-0000-000000000004', 'Reporting a analýza', 'Jak číst data a připravit report', '9:45', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 3),
-- Creative module
('00000000-0000-0000-0000-000000000005', 'Co je Creative Boost', 'Představení služby a jak funguje', '5:00', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 1),
('00000000-0000-0000-0000-000000000005', 'Kreditový systém', 'Jak fungují kredity a odměny', '6:30', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 2);
