-- Persist VAT reliability checks on leads
alter table public.leads
  add column if not exists vat_payer_status text,
  add column if not exists vat_payer_checked_at timestamptz;

comment on column public.leads.vat_payer_status is 'VAT payer reliability status from MFCR: reliable|unreliable|not_found';
comment on column public.leads.vat_payer_checked_at is 'Timestamp when vat_payer_status was last retrieved from MFCR';
