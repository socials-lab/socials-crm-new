-- =============================================
-- SOP (Standard Operating Procedures) Tables
-- =============================================

-- SOP Categories
CREATE TABLE IF NOT EXISTS sop_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    icon TEXT DEFAULT 'BookOpen',
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for sorting
CREATE INDEX IF NOT EXISTS idx_sop_categories_sort ON sop_categories(sort_order);
CREATE INDEX IF NOT EXISTS idx_sop_categories_active ON sop_categories(is_active);

-- SOP Articles
CREATE TABLE IF NOT EXISTS sop_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES sop_categories(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT DEFAULT '',
    search_text TEXT DEFAULT '',
    tags TEXT[] DEFAULT '{}',
    sort_order INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT FALSE,
    owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    attachments JSONB DEFAULT '[]',
    view_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for articles
CREATE INDEX IF NOT EXISTS idx_sop_articles_category ON sop_articles(category_id);
CREATE INDEX IF NOT EXISTS idx_sop_articles_published ON sop_articles(is_published);
CREATE INDEX IF NOT EXISTS idx_sop_articles_sort ON sop_articles(sort_order);
CREATE INDEX IF NOT EXISTS idx_sop_articles_owner ON sop_articles(owner_id);
CREATE INDEX IF NOT EXISTS idx_sop_articles_search ON sop_articles USING gin(to_tsvector('simple', search_text));

-- SOP Update Suggestions (for users to suggest updates to articles)
CREATE TABLE IF NOT EXISTS sop_update_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES sop_articles(id) ON DELETE CASCADE,
    suggested_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'dismissed')),
    resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for suggestions
CREATE INDEX IF NOT EXISTS idx_sop_suggestions_article ON sop_update_suggestions(article_id);
CREATE INDEX IF NOT EXISTS idx_sop_suggestions_status ON sop_update_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_sop_suggestions_suggested_by ON sop_update_suggestions(suggested_by);

-- =============================================
-- RLS Policies
-- =============================================

-- Enable RLS on all SOP tables
ALTER TABLE sop_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE sop_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sop_update_suggestions ENABLE ROW LEVEL SECURITY;

-- SOP Categories Policies
-- All authenticated users can read active categories
CREATE POLICY "sop_categories_select_authenticated"
ON sop_categories FOR SELECT
TO authenticated
USING (is_active = TRUE);

-- Only super_admins can insert categories
CREATE POLICY sop_categories_insert_admin ON sop_categories
FOR INSERT TO authenticated
WITH CHECK (is_super_admin(auth.uid()));

-- Only super_admins can update categories
CREATE POLICY sop_categories_update_admin ON sop_categories
FOR UPDATE TO authenticated
USING (is_super_admin(auth.uid()));

-- Only super_admins can delete categories
CREATE POLICY sop_categories_delete_admin ON sop_categories
FOR DELETE TO authenticated
USING (is_super_admin(auth.uid()));

-- SOP Articles Policies
-- Users can read published articles, or if they are owner/creator/super admin
CREATE POLICY sop_articles_select_published ON sop_articles
FOR SELECT TO authenticated
USING (
    is_published = TRUE
    OR owner_id = auth.uid()
    OR created_by = auth.uid()
    OR is_super_admin(auth.uid())
);

-- Only super_admins can insert articles
CREATE POLICY sop_articles_insert_admin ON sop_articles
FOR INSERT TO authenticated
WITH CHECK (is_super_admin(auth.uid()));

-- Owners or super_admins can update articles
CREATE POLICY sop_articles_update_admin_owner ON sop_articles
FOR UPDATE TO authenticated
USING (
    owner_id = auth.uid()
    OR is_super_admin(auth.uid())
);

-- Only super_admins can delete articles
CREATE POLICY sop_articles_delete_admin ON sop_articles
FOR DELETE TO authenticated
USING (is_super_admin(auth.uid()));

-- SOP Suggestions Policies
-- All authenticated users can read suggestions
CREATE POLICY "sop_suggestions_select_authenticated"
ON sop_update_suggestions FOR SELECT
TO authenticated
USING (TRUE);

-- All authenticated users can create suggestions
CREATE POLICY "sop_suggestions_insert_authenticated"
ON sop_update_suggestions FOR INSERT
TO authenticated
WITH CHECK (suggested_by = auth.uid());

-- Super admins or article owners can update suggestions (resolve them)
CREATE POLICY sop_suggestions_update_admin ON sop_update_suggestions
FOR UPDATE TO authenticated
USING (
    is_super_admin(auth.uid())
    OR EXISTS (
        SELECT 1 FROM sop_articles
        WHERE sop_articles.id = sop_update_suggestions.article_id
        AND sop_articles.owner_id = auth.uid()
    )
);

-- =============================================
-- Functions
-- =============================================

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_sop_view_count(article_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE sop_articles
    SET view_count = view_count + 1
    WHERE id = article_id;
END;
$$;

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_sop_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS sop_categories_updated_at ON sop_categories;
CREATE TRIGGER sop_categories_updated_at
    BEFORE UPDATE ON sop_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_sop_updated_at();

DROP TRIGGER IF EXISTS sop_articles_updated_at ON sop_articles;
CREATE TRIGGER sop_articles_updated_at
    BEFORE UPDATE ON sop_articles
    FOR EACH ROW
    EXECUTE FUNCTION update_sop_updated_at();

-- =============================================
-- Storage Bucket for SOP Attachments
-- =============================================

-- Create storage bucket for SOP attachments (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'sop-attachments',
    'sop-attachments',
    FALSE,
    52428800, -- 50MB limit
    ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'image/png', 'image/jpeg', 'image/gif', 'image/webp', 'text/plain', 'text/csv']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for SOP attachments
CREATE POLICY "sop_attachments_read_authenticated"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'sop-attachments');

CREATE POLICY sop_attachments_insert_admin ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'sop-attachments'
    AND is_super_admin(auth.uid())
);

CREATE POLICY sop_attachments_delete_admin ON storage.objects
FOR DELETE TO authenticated
USING (
    bucket_id = 'sop-attachments'
    AND is_super_admin(auth.uid())
);
