-- Colleague invoicing identity and preferred invoicing currency.
-- Used for rewards/reports display (CZK + EUR conversion).

alter table public.colleagues
  add column if not exists invoice_display_name text,
  add column if not exists invoice_currency text not null default 'CZK';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'colleagues_invoice_currency_check'
  ) then
    alter table public.colleagues
      add constraint colleagues_invoice_currency_check
      check (invoice_currency in ('CZK', 'EUR'));
  end if;
end
$$;
