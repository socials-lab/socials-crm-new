-- ============================================
-- Fix RLS Policy for Soft-Deleted Clients
-- ============================================
-- Issue #8: RLS gap - contacts of soft-deleted clients visible
-- The current RLS SELECT policy doesn't check parent client deleted_at
-- ============================================

-- Drop the existing policy (handles both possible names)
DROP POLICY IF EXISTS "CRM users can view client contacts" ON client_contacts;
DROP POLICY IF EXISTS "Users can view contacts for accessible clients" ON client_contacts;

-- Create updated policy that also filters by client's deleted_at
CREATE POLICY "CRM users can view client contacts"
  ON client_contacts FOR SELECT
  USING (
    -- Contact must not be soft-deleted
    deleted_at IS NULL AND
    -- Parent client must not be soft-deleted
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = client_contacts.client_id
        AND clients.deleted_at IS NULL
    ) AND
    -- User must have access (CRM access or assigned to client)
    (
      has_full_client_access(auth.uid()) OR
      is_assigned_to_client(auth.uid(), client_id)
    )
  );

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Updated RLS policy for client_contacts to filter by client soft-delete status';
END $$;
