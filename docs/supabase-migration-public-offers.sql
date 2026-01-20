-- ============================================================
-- PUBLIC OFFERS - Sdílené nabídky pro klienty
-- ============================================================
-- Tento soubor obsahuje SQL migrace pro veřejné sdílené nabídky.
-- Spusťte tyto SQL příkazy v Supabase SQL Editoru.
-- ============================================================

-- 1. Přidat sloupec offer_description do tabulky services
ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS offer_description TEXT;

COMMENT ON COLUMN public.services.offer_description IS 'Detailní popis co služba zahrnuje - zobrazí se klientům v nabídce';

-- 2. Vytvořit tabulku public_offers
CREATE TABLE IF NOT EXISTS public.public_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  
  -- Unikátní token pro veřejný odkaz
  token VARCHAR(32) UNIQUE NOT NULL,
  
  -- Obsah nabídky (snapshot dat)
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  
  -- Hlavní texty
  audit_summary TEXT,
  custom_note TEXT,
  notion_url TEXT,
  
  -- Služby (JSON snapshot)
  services JSONB NOT NULL DEFAULT '[]',
  
  -- Cenové údaje
  total_price NUMERIC NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'CZK',
  offer_type TEXT DEFAULT 'retainer',
  
  -- Validita a stav
  valid_until DATE,
  is_active BOOLEAN DEFAULT TRUE,
  viewed_at TIMESTAMP WITH TIME ZONE,
  view_count INTEGER DEFAULT 0,
  
  -- Tracking
  created_by UUID REFERENCES colleagues(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Přidat index pro rychlé vyhledávání podle tokenu
CREATE INDEX IF NOT EXISTS idx_public_offers_token ON public.public_offers(token);
CREATE INDEX IF NOT EXISTS idx_public_offers_lead_id ON public.public_offers(lead_id);

-- 4. Trigger pro updated_at
CREATE OR REPLACE TRIGGER update_public_offers_updated_at
  BEFORE UPDATE ON public.public_offers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. Povolit RLS
ALTER TABLE public.public_offers ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies

-- Veřejný přístup pro čtení aktivních nabídek podle tokenu (bez autentizace)
CREATE POLICY "Public can view active offers by token"
  ON public.public_offers
  FOR SELECT
  TO anon
  USING (is_active = true);

-- CRM uživatelé mohou číst všechny nabídky
CREATE POLICY "CRM users can read public_offers"
  ON public.public_offers
  FOR SELECT
  TO authenticated
  USING (is_crm_user(auth.uid()));

-- CRM uživatelé mohou spravovat nabídky
CREATE POLICY "CRM users can manage public_offers"
  ON public.public_offers
  FOR ALL
  TO authenticated
  USING (is_crm_user(auth.uid()));

-- 7. Funkce pro inkrementaci view_count (volatelná bez autentizace)
CREATE OR REPLACE FUNCTION public.increment_offer_view(offer_token VARCHAR)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.public_offers
  SET 
    view_count = view_count + 1,
    viewed_at = COALESCE(viewed_at, now())
  WHERE token = offer_token AND is_active = true;
END;
$$;

-- Povolit volání funkce pro anon uživatele
GRANT EXECUTE ON FUNCTION public.increment_offer_view(VARCHAR) TO anon;
GRANT EXECUTE ON FUNCTION public.increment_offer_view(VARCHAR) TO authenticated;
