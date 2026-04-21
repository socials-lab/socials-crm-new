-- Keep legacy offers with NULL is_active publicly readable (treated as active).
DROP POLICY IF EXISTS "Public can view active offers by token" ON public.public_offers;

CREATE POLICY "Public can view active offers by token"
  ON public.public_offers
  FOR SELECT
  TO anon
  USING (COALESCE(is_active, true) = true);

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
