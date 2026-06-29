-- P1: retrieval vrstva mozku — atomické fakty + pgvector embedding.
-- pgvector dostupný (0.8), instaluje se do schématu `extensions` (Supabase konvence).

create extension if not exists vector with schema extensions;

-- Jeden řádek = jedna atomická "věta" (nález/angle/příležitost/rozhodnutí) + embedding.
create table if not exists agent.brain_fact (
  id           uuid        primary key default gen_random_uuid(),
  client_id    uuid        not null references public.clients(id) on delete cascade,
  kind         text        not null,             -- finding|angle|opportunity|decision|persona|risk
  section_key  text,                             -- z jaké brain sekce fakt vznikl
  content      text        not null,             -- věta do kontextu i embeddingu
  data         jsonb       not null default '{}'::jsonb,  -- strukturovaný originál
  embedding    extensions.vector(1024),          -- NULL dokud ji pipeline nedopočítá (async-friendly)
  weight       real        not null default 1.0, -- důležitost (priority→weight)
  status       text        not null default 'active',  -- active|superseded|archived
  source_run   uuid,                             -- agent_runs.id, který fakt vytvořil
  content_hash text        not null,             -- md5(kind|content) → idempotentní upsert
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Idempotence: stejný fakt se při re-runu agenta nezduplikuje.
create unique index if not exists uq_brain_fact_client_hash on agent.brain_fact (client_id, content_hash);

-- HNSW (ne IVFFlat): malý dataset per klient, časté inserty, žádný bulk reindex. cosine.
create index if not exists idx_brain_fact_embedding
  on agent.brain_fact using hnsw (embedding extensions.vector_cosine_ops)
  with (m = 16, ef_construction = 64);

create index if not exists idx_brain_fact_client_status on agent.brain_fact (client_id, status, kind);
create index if not exists idx_brain_fact_pending_embed on agent.brain_fact (created_at)
  where embedding is null and status = 'active';

alter table agent.brain_fact enable row level security;  -- service_role bypass, anon/auth bez grantu
grant all on agent.brain_fact to service_role;
