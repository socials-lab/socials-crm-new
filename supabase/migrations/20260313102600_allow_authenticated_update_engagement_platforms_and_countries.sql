-- Allow all authenticated users to update only engagements.platforms and engagements.managed_countries
-- while keeping all other engagement fields admin-restricted.

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
  v_user_id uuid;
  v_old_platforms text[];
  v_old_managed_countries text[];
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT e.platforms, e.managed_countries
  INTO v_old_platforms, v_old_managed_countries
  FROM public.engagements e
  JOIN public.clients c ON c.id = e.client_id
  WHERE e.id = p_engagement_id
    AND e.deleted_at IS NULL
    AND c.deleted_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Engagement not found or unavailable';
  END IF;

  UPDATE public.engagements
  SET
    platforms = COALESCE(p_platforms, ARRAY[]::text[]),
    managed_countries = COALESCE(p_managed_countries, ARRAY[]::text[]),
    updated_at = now()
  WHERE id = p_engagement_id;

  IF v_old_platforms IS DISTINCT FROM COALESCE(p_platforms, ARRAY[]::text[]) THEN
    PERFORM public.log_engagement_change(
      p_engagement_id,
      'field_update',
      'platforms',
      'Platformy',
      COALESCE(array_to_string(v_old_platforms, ', '), ''),
      COALESCE(array_to_string(p_platforms, ', '), ''),
      NULL,
      NULL
    );
  END IF;

  IF v_old_managed_countries IS DISTINCT FROM COALESCE(p_managed_countries, ARRAY[]::text[]) THEN
    PERFORM public.log_engagement_change(
      p_engagement_id,
      'field_update',
      'managed_countries',
      'Spravované země',
      COALESCE(array_to_string(v_old_managed_countries, ', '), ''),
      COALESCE(array_to_string(p_managed_countries, ', '), ''),
      NULL,
      NULL
    );
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.update_engagement_platforms_and_countries(uuid, text[], text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_engagement_platforms_and_countries(uuid, text[], text[]) TO authenticated;
