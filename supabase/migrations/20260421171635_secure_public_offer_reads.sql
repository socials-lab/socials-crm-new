DROP POLICY IF EXISTS "Public can view active offers by token" ON public.public_offers;

CREATE OR REPLACE FUNCTION public.get_public_offer_by_token(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offer jsonb;
BEGIN
  SELECT to_jsonb(po)
  INTO v_offer
  FROM public.public_offers po
  WHERE po.token = p_token
    AND po.is_active = true
  LIMIT 1;

  RETURN v_offer;
END;
$$;

REVOKE ALL ON FUNCTION public.get_public_offer_by_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_offer_by_token(text) TO anon, authenticated;
