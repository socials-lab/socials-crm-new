-- =====================================================
-- Portfolio Items — centrální správa bannerů a videí
-- Spusť tento SQL skript v Supabase SQL Editoru
-- =====================================================

-- 1. Vytvoření storage bucketu
INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolio', 'portfolio', true);

-- 2. Storage RLS policies
CREATE POLICY "Anyone can view portfolio files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'portfolio');

CREATE POLICY "CRM users can upload portfolio files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'portfolio' AND is_crm_user(auth.uid()));

CREATE POLICY "CRM users can update portfolio files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'portfolio' AND is_crm_user(auth.uid()));

CREATE POLICY "CRM users can delete portfolio files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'portfolio' AND is_crm_user(auth.uid()));

-- 3. Tabulka portfolio_items
CREATE TABLE public.portfolio_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL DEFAULT '',
    file_url TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'image' CHECK (type IN ('image', 'video')),
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. RLS na portfolio_items
ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active portfolio items"
ON public.portfolio_items FOR SELECT
TO public
USING (is_active = true);

CREATE POLICY "CRM users can view all portfolio items"
ON public.portfolio_items FOR SELECT
TO authenticated
USING (is_crm_user(auth.uid()));

CREATE POLICY "CRM users can manage portfolio items"
ON public.portfolio_items FOR ALL
TO authenticated
USING (is_crm_user(auth.uid()));
