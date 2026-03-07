-- Harden broadcasts delivery state + RPC permissions

ALTER TABLE public.broadcasts
  ADD COLUMN IF NOT EXISTS send_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS failed_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_error TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'broadcasts_send_status_check'
      AND conrelid = 'public.broadcasts'::regclass
  ) THEN
    ALTER TABLE public.broadcasts
      ADD CONSTRAINT broadcasts_send_status_check
      CHECK (send_status IN ('pending', 'sending', 'sent', 'partial_failed', 'failed'));
  END IF;
END $$;

UPDATE public.broadcasts
SET
  send_status = CASE
    WHEN COALESCE(recipient_count, 0) = 0 THEN 'pending'
    ELSE 'sent'
  END,
  failed_count = COALESCE(failed_count, 0),
  last_error = NULL
WHERE send_status IS NULL OR send_status = '';

REVOKE EXECUTE ON FUNCTION public.increment_broadcast_counter(UUID, TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.increment_broadcast_counter(UUID, TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.increment_broadcast_counter(UUID, TEXT) TO service_role;
