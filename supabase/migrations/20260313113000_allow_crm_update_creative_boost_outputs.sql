-- Allow all CRM users to update Creative Boost output counts.
-- The UI already exposes these controls to CRM users, so RLS must match.

DROP POLICY IF EXISTS "Creator or admins can update outputs" ON public.creative_boost_outputs;

CREATE POLICY "CRM users can update outputs"
  ON public.creative_boost_outputs
  FOR UPDATE
  TO authenticated
  USING (has_crm_access(auth.uid()))
  WITH CHECK (has_crm_access(auth.uid()));
