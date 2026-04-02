-- Allow all approved CRM users to create leads.
-- "Approved" is represented by an active record in user_roles (has_crm_access(auth.uid())).

DROP POLICY IF EXISTS "Admins and PMs can insert leads" ON public.leads;

CREATE POLICY "CRM users can insert leads"
  ON public.leads
  FOR INSERT
  WITH CHECK (public.has_crm_access(auth.uid()));
