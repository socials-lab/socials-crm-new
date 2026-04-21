-- Allow CRM users to delete applicants via controlled RPC
-- without requiring direct table DELETE permission.

CREATE OR REPLACE FUNCTION public.delete_applicant(p_applicant_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT has_crm_access(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized to delete applicants';
  END IF;

  DELETE FROM public.applicants
  WHERE id = p_applicant_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Applicant not found';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_applicant(uuid) TO authenticated;
