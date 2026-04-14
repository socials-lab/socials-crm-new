-- Allow any CRM user to append lead notes without owning the lead record.
-- This avoids RLS update failures on leads while keeping scoped write behavior.

CREATE OR REPLACE FUNCTION public.append_lead_note(
  p_lead_id uuid,
  p_note jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_notes jsonb;
BEGIN
  IF auth.uid() IS NULL OR NOT has_crm_access(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized to append lead note';
  END IF;

  IF p_note IS NULL OR jsonb_typeof(p_note) <> 'object' THEN
    RAISE EXCEPTION 'Invalid note payload';
  END IF;

  SELECT
    CASE
      WHEN jsonb_typeof(l.notes) = 'array' THEN l.notes
      ELSE '[]'::jsonb
    END
  INTO v_notes
  FROM public.leads l
  WHERE l.id = p_lead_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lead not found';
  END IF;

  UPDATE public.leads
  SET
    notes = v_notes || jsonb_build_array(p_note),
    updated_at = now()
  WHERE id = p_lead_id;
END;
$$;

