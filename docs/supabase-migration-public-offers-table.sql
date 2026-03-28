-- Create public_offers table to store offer data (migrating from localStorage)
CREATE TABLE public.public_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  token TEXT NOT NULL UNIQUE,
  company_name TEXT NOT NULL,
  website TEXT,
  contact_name TEXT NOT NULL,
  audit_summary TEXT,
  recommendation_intro TEXT,
  custom_note TEXT,
  loom_url TEXT,
  services JSONB NOT NULL DEFAULT '[]'::jsonb,
  portfolio_links JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_price NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'CZK',
  offer_type TEXT NOT NULL DEFAULT 'retainer',
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  viewed_at TIMESTAMPTZ,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  estimated_start_date TEXT,
  monthly_discount_percent NUMERIC,
  discount_scope TEXT,
  intro_discount_percent NUMERIC,
  intro_discount_months INTEGER,
  owner_name TEXT,
  owner_email TEXT,
  owner_phone TEXT,
  history JSONB DEFAULT '[]'::jsonb,
  content_blocks_snapshot JSONB
);

-- Enable RLS
ALTER TABLE public.public_offers ENABLE ROW LEVEL SECURITY;

-- CRM users can manage offers
CREATE POLICY "CRM users can manage public_offers"
  ON public.public_offers FOR ALL
  TO authenticated
  USING (is_crm_user(auth.uid()));

-- Anyone can read active offers by token (public access for offer page)
CREATE POLICY "Public can read active offers"
  ON public.public_offers FOR SELECT
  TO anon
  USING (is_active = true);

-- Allow anon to update view_count
CREATE POLICY "Anon can update view tracking"
  ON public.public_offers FOR UPDATE
  TO anon
  USING (is_active = true)
  WITH CHECK (is_active = true);

-- Index for token lookups
CREATE INDEX idx_public_offers_token ON public.public_offers(token);
CREATE INDEX idx_public_offers_lead_id ON public.public_offers(lead_id);
