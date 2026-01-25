-- Migration: Implement soft delete for clients
-- Instead of CASCADE deleting clients and all related data, use soft delete

-- =============================================================================
-- Add soft delete column to clients
-- =============================================================================

ALTER TABLE clients ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Create partial index for filtering non-deleted clients (improves query performance)
CREATE INDEX IF NOT EXISTS idx_clients_deleted_at
ON clients(deleted_at)
WHERE deleted_at IS NULL;

-- =============================================================================
-- Update foreign key constraints to prevent hard delete
-- =============================================================================

-- Change engagements FK from CASCADE to RESTRICT
ALTER TABLE engagements
DROP CONSTRAINT IF EXISTS engagements_client_id_fkey;

ALTER TABLE engagements
ADD CONSTRAINT engagements_client_id_fkey
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT;

-- Change extra_works FK from CASCADE to RESTRICT
ALTER TABLE extra_works
DROP CONSTRAINT IF EXISTS extra_works_client_id_fkey;

ALTER TABLE extra_works
ADD CONSTRAINT extra_works_client_id_fkey
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT;

-- Change client_contacts FK from CASCADE to RESTRICT
ALTER TABLE client_contacts
DROP CONSTRAINT IF EXISTS client_contacts_client_id_fkey;

ALTER TABLE client_contacts
ADD CONSTRAINT client_contacts_client_id_fkey
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT;

-- Change creative_boost_client_months FK from CASCADE to RESTRICT
ALTER TABLE creative_boost_client_months
DROP CONSTRAINT IF EXISTS creative_boost_client_months_client_id_fkey;

ALTER TABLE creative_boost_client_months
ADD CONSTRAINT creative_boost_client_months_client_id_fkey
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT;

-- Change creative_boost_deliverables FK from CASCADE to RESTRICT (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'creative_boost_deliverables') THEN
    ALTER TABLE creative_boost_deliverables
    DROP CONSTRAINT IF EXISTS creative_boost_deliverables_client_id_fkey;

    ALTER TABLE creative_boost_deliverables
    ADD CONSTRAINT creative_boost_deliverables_client_id_fkey
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT;
  END IF;
END $$;

-- Change creative_boost_client_history FK from CASCADE to RESTRICT (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'creative_boost_client_history') THEN
    ALTER TABLE creative_boost_client_history
    DROP CONSTRAINT IF EXISTS creative_boost_client_history_client_id_fkey;

    ALTER TABLE creative_boost_client_history
    ADD CONSTRAINT creative_boost_client_history_client_id_fkey
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT;
  END IF;
END $$;

-- =============================================================================
-- Create function to soft delete a client
-- =============================================================================

CREATE OR REPLACE FUNCTION soft_delete_client(p_client_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE clients
  SET deleted_at = NOW(),
      status = 'lost'
  WHERE id = p_client_id
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Client not found or already deleted';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- Update RLS policies to exclude soft-deleted clients
-- =============================================================================

-- Drop existing select policy and recreate with soft delete filter
DROP POLICY IF EXISTS "Users can view clients" ON clients;
DROP POLICY IF EXISTS "Users can view non-deleted clients" ON clients;

CREATE POLICY "Users can view non-deleted clients"
ON clients FOR SELECT
USING (deleted_at IS NULL AND auth.uid() IS NOT NULL);

-- Allow admins to view deleted clients too (for recovery purposes)
CREATE POLICY "Admins can view all clients including deleted"
ON clients FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- =============================================================================
-- Success message
-- =============================================================================
DO $$
BEGIN
  RAISE NOTICE 'Successfully implemented soft delete for clients';
  RAISE NOTICE '  - Added deleted_at column';
  RAISE NOTICE '  - Changed CASCADE to RESTRICT on all client FKs';
  RAISE NOTICE '  - Created soft_delete_client() function';
  RAISE NOTICE '  - Updated RLS policies to filter deleted clients';
END $$;
