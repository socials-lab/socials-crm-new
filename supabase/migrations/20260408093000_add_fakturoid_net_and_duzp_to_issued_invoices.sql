SET ROLE postgres;

ALTER TABLE public.issued_invoices
  ADD COLUMN IF NOT EXISTS fakturoid_total_without_vat NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS fakturoid_total_with_vat NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS fakturoid_duzp_date DATE;

-- Backfill for existing rows:
-- - keep current total_amount as a safe fallback for net amount
-- - use issued_at date as DUZP fallback where no explicit DUZP exists yet
UPDATE public.issued_invoices
SET
  fakturoid_total_without_vat = COALESCE(fakturoid_total_without_vat, total_amount),
  fakturoid_total_with_vat = COALESCE(fakturoid_total_with_vat, total_amount),
  fakturoid_duzp_date = COALESCE(fakturoid_duzp_date, (issued_at AT TIME ZONE 'UTC')::date)
WHERE
  fakturoid_total_without_vat IS NULL
  OR fakturoid_total_with_vat IS NULL
  OR fakturoid_duzp_date IS NULL;
