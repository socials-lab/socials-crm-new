-- Keep legacy offers with NULL is_active shareable without re-opening anon table reads.
-- Public access stays behind the token-scoped RPC introduced later.

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
    AND COALESCE(po.is_active, true) = true
  LIMIT 1;

  RETURN v_offer;
END;
$$;

REVOKE ALL ON FUNCTION public.get_public_offer_by_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_offer_by_token(text) TO anon, authenticated;

-- Ensure view counter still increments for legacy rows.
CREATE OR REPLACE FUNCTION public.increment_public_offer_view(p_token text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.public_offers
  SET
    view_count = COALESCE(view_count, 0) + 1,
    viewed_at = COALESCE(viewed_at, now())
  WHERE token = p_token
    AND COALESCE(is_active, true) = true;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_public_offer_view(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_public_offer_view(text) TO anon, authenticated;
