CREATE OR REPLACE FUNCTION public.update_engagement_platforms_and_countries(
  p_engagement_id uuid,
  p_platforms text[],
  p_managed_countries text[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT has_crm_access(v_user_id) THEN
    RAISE EXCEPTION 'CRM access required';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.engagements
    WHERE id = p_engagement_id
      AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Engagement not found';
  END IF;

  UPDATE public.engagements
  SET
    platforms = COALESCE(p_platforms, '{}'::text[]),
    managed_countries = COALESCE(p_managed_countries, '{}'::text[])
  WHERE id = p_engagement_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Engagement update failed';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.update_engagement_platforms_and_countries(uuid, text[], text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_engagement_platforms_and_countries(uuid, text[], text[]) TO authenticated;
