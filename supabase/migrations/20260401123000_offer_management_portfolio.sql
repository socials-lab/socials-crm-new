-- Offer management + portfolio module (no mock fallback path)

-- 1) Extend public_offers to support the redesigned editable offer.
ALTER TABLE public.public_offers
  ADD COLUMN IF NOT EXISTS audit_html text,
  ADD COLUMN IF NOT EXISTS loom_url text,
  ADD COLUMN IF NOT EXISTS intro_discount_percent numeric,
  ADD COLUMN IF NOT EXISTS intro_discount_months integer,
  ADD COLUMN IF NOT EXISTS history jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS content_blocks_snapshot jsonb;

-- Backfill loom_url from legacy notion_url when present.
UPDATE public.public_offers
SET loom_url = notion_url
WHERE loom_url IS NULL
  AND notion_url IS NOT NULL;

-- 2) Editable content blocks used by internal "Nabidka" editor.
CREATE TABLE IF NOT EXISTS public.offer_content_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text UNIQUE NOT NULL,
  title text,
  subtitle text,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.offer_content_blocks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'offer_content_blocks'
      AND policyname = 'Anyone can read offer_content_blocks'
  ) THEN
    CREATE POLICY "Anyone can read offer_content_blocks"
      ON public.offer_content_blocks
      FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'offer_content_blocks'
      AND policyname = 'CRM users can manage offer_content_blocks'
  ) THEN
    CREATE POLICY "CRM users can manage offer_content_blocks"
      ON public.offer_content_blocks
      FOR ALL
      TO authenticated
      USING (has_crm_access(auth.uid()))
      WITH CHECK (has_crm_access(auth.uid()));
  END IF;
END $$;

INSERT INTO public.offer_content_blocks (section_key, title, subtitle, content)
VALUES
  ('why_us', '💪 Proč právě my', 'Ne sliby, ale skutečný business dopad.', '{"items":[],"links":[]}'::jsonb),
  ('benefits', '🎁 Co od nás dostanete ke každé spolupráci', 'Nejde jen o reklamu - stavíme partnerství, které vám pomůže růst', '{"items":[]}'::jsonb),
  ('onboarding', '🚀 Jak to bude probíhat', 'Celý proces zvládneme obvykle do 48 hodin od vašeho rozhodnutí.', '{"steps":[]}'::jsonb),
  ('reporting', '📊 Reporting až na úroveň zisku', 'Pro Shoptet klienty dodáváme reporting až na úroveň contribution margin.', '{"note":"","demo_report_url":""}'::jsonb),
  ('creative_portfolio', '🎨 Grafika, která prodává', 'Specializujeme se na grafiku pro výkonnostní reklamy.', '{}'::jsonb),
  ('cta', '🚀 Pojďme do toho', 'Stačí vyplnit krátký formulář a můžeme začít.', '{"extended_subtitle":"","button_text":"Začít spolupráci","footer_note":""}'::jsonb),
  ('clients_logos', '❤️ Značky, které jsme pomohli posunout', 'Pomáháme růst firmám napříč odvětvími', '{"images":[]}'::jsonb),
  ('certifications', '🏆 Certifikace & partnerství', 'Oficiálně certifikovaný tým s přístupem k nejnovějším nástrojům', '{"images":[]}'::jsonb),
  ('credibility_badges', null, null, '{"items":[]}'::jsonb)
ON CONFLICT (section_key) DO NOTHING;

-- 3) Public storage bucket for editor-uploaded offer assets.
INSERT INTO storage.buckets (id, name, public)
VALUES ('offer-assets', 'offer-assets', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Public can view offer assets'
  ) THEN
    CREATE POLICY "Public can view offer assets"
      ON storage.objects
      FOR SELECT
      TO anon, authenticated
      USING (bucket_id = 'offer-assets');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'CRM users can upload offer assets'
  ) THEN
    CREATE POLICY "CRM users can upload offer assets"
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'offer-assets' AND has_crm_access(auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'CRM users can update offer assets'
  ) THEN
    CREATE POLICY "CRM users can update offer assets"
      ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (bucket_id = 'offer-assets' AND has_crm_access(auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'CRM users can delete offer assets'
  ) THEN
    CREATE POLICY "CRM users can delete offer assets"
      ON storage.objects
      FOR DELETE
      TO authenticated
      USING (bucket_id = 'offer-assets' AND has_crm_access(auth.uid()));
  END IF;
END $$;

-- 4) Portfolio items (publicly visible subset + CRM management).
CREATE TABLE IF NOT EXISTS public.portfolio_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  file_url text NOT NULL,
  type text NOT NULL DEFAULT 'image' CHECK (type IN ('image', 'video')),
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'portfolio_items'
      AND policyname = 'Anyone can view active portfolio items'
  ) THEN
    CREATE POLICY "Anyone can view active portfolio items"
      ON public.portfolio_items
      FOR SELECT
      TO anon, authenticated
      USING (is_active = true);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'portfolio_items'
      AND policyname = 'CRM users can view all portfolio items'
  ) THEN
    CREATE POLICY "CRM users can view all portfolio items"
      ON public.portfolio_items
      FOR SELECT
      TO authenticated
      USING (has_crm_access(auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'portfolio_items'
      AND policyname = 'CRM users can manage portfolio items'
  ) THEN
    CREATE POLICY "CRM users can manage portfolio items"
      ON public.portfolio_items
      FOR ALL
      TO authenticated
      USING (has_crm_access(auth.uid()))
      WITH CHECK (has_crm_access(auth.uid()));
  END IF;
END $$;

INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolio', 'portfolio', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Anyone can view portfolio files'
  ) THEN
    CREATE POLICY "Anyone can view portfolio files"
      ON storage.objects
      FOR SELECT
      TO anon, authenticated
      USING (bucket_id = 'portfolio');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'CRM users can upload portfolio files'
  ) THEN
    CREATE POLICY "CRM users can upload portfolio files"
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'portfolio' AND has_crm_access(auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'CRM users can update portfolio files'
  ) THEN
    CREATE POLICY "CRM users can update portfolio files"
      ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (bucket_id = 'portfolio' AND has_crm_access(auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'CRM users can delete portfolio files'
  ) THEN
    CREATE POLICY "CRM users can delete portfolio files"
      ON storage.objects
      FOR DELETE
      TO authenticated
      USING (bucket_id = 'portfolio' AND has_crm_access(auth.uid()));
  END IF;
END $$;
