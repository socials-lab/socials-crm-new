-- SOP Categories table
CREATE TABLE public.sop_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  icon TEXT DEFAULT 'BookOpen',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.sop_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CRM users can read sop_categories"
  ON public.sop_categories FOR SELECT
  TO authenticated
  USING (is_crm_user(auth.uid()));

CREATE POLICY "Admins can manage sop_categories"
  ON public.sop_categories FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()));

-- SOP Articles table
CREATE TABLE public.sop_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.sop_categories(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  search_text TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.sop_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CRM users can read sop_articles"
  ON public.sop_articles FOR SELECT
  TO authenticated
  USING (is_crm_user(auth.uid()));

CREATE POLICY "Admins can manage sop_articles"
  ON public.sop_articles FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()));

-- Fulltext search index
CREATE INDEX idx_sop_articles_search ON public.sop_articles
  USING gin(to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(search_text, '')));

-- Search function
CREATE OR REPLACE FUNCTION public.search_sop_articles(search_query TEXT)
RETURNS SETOF public.sop_articles AS $$
  SELECT * FROM public.sop_articles
  WHERE is_published = true
    AND (
      to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(search_text, ''))
      @@ plainto_tsquery('simple', search_query)
      OR title ILIKE '%' || search_query || '%'
      OR search_text ILIKE '%' || search_query || '%'
    )
  ORDER BY
    ts_rank(to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(search_text, '')),
            plainto_tsquery('simple', search_query)) DESC;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Updated_at triggers
CREATE TRIGGER update_sop_categories_updated_at
  BEFORE UPDATE ON public.sop_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sop_articles_updated_at
  BEFORE UPDATE ON public.sop_articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
