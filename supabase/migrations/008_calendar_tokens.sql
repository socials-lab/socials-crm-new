-- ============================================
-- Google Calendar Integration
-- ============================================

-- Calendar tokens: Store OAuth tokens for Google Calendar
CREATE TABLE IF NOT EXISTS calendar_tokens (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE calendar_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own tokens"
  ON calendar_tokens FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_calendar_tokens_user_id ON calendar_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_tokens_expires_at ON calendar_tokens(expires_at);
