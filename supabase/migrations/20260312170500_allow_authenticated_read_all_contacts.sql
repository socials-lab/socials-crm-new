-- ============================================
-- Allow all authenticated users to read all contacts
-- ============================================
-- Requirement: all CRM users should be able to see all contacts.
-- Keep soft-delete guards so archived contacts/clients stay hidden.
-- ============================================

DROP POLICY IF EXISTS "CRM users can view client contacts" ON public.client_contacts;
DROP POLICY IF EXISTS "Users can view contacts for accessible clients" ON public.client_contacts;

CREATE POLICY "client_contacts_select_authenticated"
  ON public.client_contacts
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1
      FROM public.clients
      WHERE clients.id = client_contacts.client_id
        AND clients.deleted_at IS NULL
    )
  );
