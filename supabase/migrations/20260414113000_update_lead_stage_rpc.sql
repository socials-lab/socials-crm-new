-- Allow all CRM users to move leads through pipeline stages
-- without granting full leads row update permissions.

CREATE OR REPLACE FUNCTION public.update_lead_stage(
  p_lead_id uuid,
  p_stage public.lead_stage
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT has_crm_access(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized to update lead stage';
  END IF;

  UPDATE public.leads
  SET
    stage = p_stage,
    updated_at = now()
  WHERE id = p_lead_id
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lead not found';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_lead_stage(uuid, public.lead_stage) TO authenticated;
