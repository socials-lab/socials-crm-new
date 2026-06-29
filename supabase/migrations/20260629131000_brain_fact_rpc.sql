-- P1: retrieval RPC fasáda v `public` (SECURITY DEFINER, jen service_role).
-- Schéma `agent` zůstává skryté. Embedding se posílá jako TEXT ('[...]') a castuje
-- uvnitř → robustní přes PostgREST (vyhne se cast problémům s vector typem).

-- Zápis faktu. Embedding volitelný (null → dopočítá async pipeline).
create or replace function public.brain_add_fact(
  p_client uuid, p_kind text, p_content text,
  p_section text default null, p_data jsonb default '{}'::jsonb,
  p_weight real default 1.0, p_run uuid default null, p_embedding text default null
) returns uuid
language plpgsql security definer set search_path = pg_catalog, extensions as $$
declare v_id uuid; v_hash text;
begin
  v_hash := md5(p_kind || '|' || p_content);
  insert into agent.brain_fact (client_id, kind, section_key, content, data, weight, source_run, content_hash, embedding)
  values (p_client, p_kind, p_section, p_content, coalesce(p_data, '{}'::jsonb), p_weight, p_run, v_hash, p_embedding::extensions.vector)
  on conflict (client_id, content_hash) do update
    set data = excluded.data, weight = excluded.weight, section_key = excluded.section_key,
        source_run = excluded.source_run,
        embedding = coalesce(excluded.embedding, agent.brain_fact.embedding),
        status = 'active', updated_at = now()
  returning id into v_id;
  return v_id;
end $$;

-- Top-K similarity (per klient, jen aktivní fakty s embeddingem). cosine.
create or replace function public.brain_search(
  p_client uuid, p_query_embedding text, p_k int default 8,
  p_kinds text[] default null, p_min_weight real default 0.0
) returns table (id uuid, kind text, section_key text, content text, data jsonb, weight real, similarity real)
language sql security definer set search_path = pg_catalog, extensions as $$
  select f.id, f.kind, f.section_key, f.content, f.data, f.weight,
         1 - (f.embedding <=> p_query_embedding::extensions.vector) as similarity
  from agent.brain_fact f
  where f.client_id = p_client and f.status = 'active' and f.embedding is not null
    and (p_kinds is null or f.kind = any(p_kinds))
    and f.weight >= p_min_weight
  order by f.embedding <=> p_query_embedding::extensions.vector
  limit greatest(p_k, 1);
$$;

-- Batch dopočet embeddingů (async pipeline / pg_cron worker).
create or replace function public.brain_set_embeddings(p_rows jsonb)
returns int language plpgsql security definer set search_path = pg_catalog, extensions as $$
declare r jsonb; n int := 0;
begin
  for r in select * from jsonb_array_elements(p_rows) loop
    update agent.brain_fact set embedding = (r->>'embedding')::extensions.vector, updated_at = now()
      where id = (r->>'id')::uuid;
    n := n + 1;
  end loop;
  return n;
end $$;

create or replace function public.brain_pending_embeddings(p_limit int default 100)
returns table (id uuid, content text)
language sql security definer set search_path = pg_catalog, extensions as $$
  select id, content from agent.brain_fact where embedding is null and status = 'active'
  order by created_at limit p_limit;
$$;

-- KRITICKÉ: Supabase defaultně grantuje EXECUTE i anon+authenticated → odebrat.
revoke execute on function public.brain_add_fact(uuid, text, text, text, jsonb, real, uuid, text) from public, anon, authenticated;
revoke execute on function public.brain_search(uuid, text, int, text[], real) from public, anon, authenticated;
revoke execute on function public.brain_set_embeddings(jsonb) from public, anon, authenticated;
revoke execute on function public.brain_pending_embeddings(int) from public, anon, authenticated;
grant execute on function public.brain_add_fact(uuid, text, text, text, jsonb, real, uuid, text) to service_role;
grant execute on function public.brain_search(uuid, text, int, text[], real) to service_role;
grant execute on function public.brain_set_embeddings(jsonb) to service_role;
grant execute on function public.brain_pending_embeddings(int) to service_role;
