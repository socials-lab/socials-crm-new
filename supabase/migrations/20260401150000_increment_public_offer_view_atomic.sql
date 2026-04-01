-- Atomic offer view increment to avoid lost updates.

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
    AND is_active = true;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_public_offer_view(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_public_offer_view(text) TO anon, authenticated;
