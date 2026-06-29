-- P1: deklarace, které brain sekce agent potřebuje na vstupu (ContextBuilder je složí).
-- Samostatný sloupec — NE input_schema (to je JSON-schema výstupního kontraktu).

alter table public.agents add column if not exists input_sections text[] not null default '{}';

-- Backfill ze známých řetězců (REQUIRED sekce v agentech).
update public.agents set input_sections = array['eshop','personas','offers','angles','competition']
  where key in ('strategy-composer','strategy-overview','strategy-targeting','strategy-launch');
update public.agents set input_sections = array['eshop']                 where key = 'persona-builder';
update public.agents set input_sections = array['eshop','personas']      where key = 'offer-designer';
update public.agents set input_sections = array['eshop','personas','offers'] where key = 'angles-generator';
