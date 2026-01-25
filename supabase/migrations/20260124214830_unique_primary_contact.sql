-- ============================================
-- Add unique constraint: only one primary contact per client
-- ============================================

-- First, fix any existing duplicates (keep the oldest one as primary)
WITH duplicates AS (
  SELECT id, client_id, created_at,
    ROW_NUMBER() OVER (PARTITION BY client_id ORDER BY created_at) as rn
  FROM client_contacts
  WHERE is_primary = true
)
UPDATE client_contacts
SET is_primary = false
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Create partial unique index (only one primary per client)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_primary_contact
ON client_contacts (client_id)
WHERE is_primary = true;
