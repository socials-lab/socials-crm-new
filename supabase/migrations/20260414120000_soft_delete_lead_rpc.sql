-- Allow approved CRM users to soft-delete leads without broad UPDATE rights.

CREATE OR REPLACE FUNCTION public.soft_delete_lead(p_lead_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT has_crm_access(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized to delete leads';
  END IF;

  UPDATE public.leads
  SET
    deleted_at = now(),
    updated_at = now()
  WHERE id = p_lead_id
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lead not found or already deleted';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.soft_delete_lead(uuid) TO authenticated;
