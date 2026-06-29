-- P0: dedikované schéma `agent` + vrstvený mozek (section rows + append-only events).
-- Aditivní a NEROZBÍJEJÍCÍ: vytváří jen nové objekty, nesahá na public tabulky.
--
-- POZN. (mimo tuto migraci — mění živou API konfiguraci, dělá se v Dashboardu):
-- Aby AI Hub (supabase-py / PostgREST) viděl schéma `agent`, přidej ho do
-- Settings → API → Exposed schemas:  public, graphql_public, storage, agent
-- Ekvivalent v SQL (NEspouštět naslepo — musí obsahovat VŠECHNA stávající schémata):
--   ALTER ROLE authenticator SET pgrst.db_schemas = 'public, graphql_public, storage, agent';
--   NOTIFY pgrst, 'reload config';

create schema if not exists agent;

-- Izolace: přístup jen pro service_role (AI Hub backend, bypasuje RLS).
-- anon/authenticated (cockpit) NEDOSTÁVAJÍ žádný grant → na `agent` nesáhnou.
grant usage on schema agent to service_role;
alter default privileges in schema agent grant all on tables to service_role;
alter default privileges in schema agent grant all on sequences to service_role;

-- Strukturovaná vrstva: jedna sekce mozku = jeden řádek (konec přepisování celého blobu).
create table if not exists agent.brain_section (
  client_id      uuid        not null references public.clients(id) on delete cascade,
  section_key    text        not null,
  data           jsonb       not null default '{}'::jsonb,
  version        integer     not null default 1,
  updated_by_run uuid,
  updated_at     timestamptz not null default now(),
  primary key (client_id, section_key)
);

-- Historie: append-only log každého zápisu sekce (audit, měsíční diffy, decision ledger).
create table if not exists agent.brain_event (
  id          uuid        primary key default gen_random_uuid(),
  client_id   uuid        not null,
  section_key text        not null,
  run_id      uuid,
  payload     jsonb       not null,
  created_at  timestamptz not null default now()
);

create index if not exists idx_brain_section_client on agent.brain_section (client_id);
create index if not exists idx_brain_event_client   on agent.brain_event   (client_id, created_at desc);

-- Defense-in-depth: RLS on (service_role ji bypasuje; pro anon/auth není grant ani policy).
alter table agent.brain_section enable row level security;
alter table agent.brain_event   enable row level security;

-- Explicitní grant na právě vytvořené tabulky (default privileges kryjí jen budoucí).
grant all on agent.brain_section to service_role;
grant all on agent.brain_event   to service_role;
