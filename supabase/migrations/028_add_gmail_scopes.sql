-- ============================================
-- Add Gmail scopes support to calendar_tokens
-- ============================================

-- Add scopes column to track granted permissions
ALTER TABLE calendar_tokens ADD COLUMN IF NOT EXISTS scopes text[] DEFAULT ARRAY['calendar'];

-- Clear existing tokens (users must reconnect with new scopes to enable Gmail)
TRUNCATE calendar_tokens;
