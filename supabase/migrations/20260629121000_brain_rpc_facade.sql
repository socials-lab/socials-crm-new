-- P0: public RPC fasáda nad schématem `agent` (SECURITY DEFINER).
-- AI Hub volá jen tyhle funkce → schéma `agent` NEMUSÍ být vystavené v PostgREST
-- (maximální izolace: cockpit/CRM na agent tabulky fyzicky nedosáhnou).
-- EXECUTE jen pro service_role.

-- Zápis sekce: section řádek (+verze) + append-only event + cockpit-compat blob.
-- Vše v jednom volání = atomické. Merge blobu pod row-lockem → konec race condition
-- (starý kód dělal read-modify-write v Pythonu bez zámku → ztráta sekcí).
create or replace function public.brain_write_section(
  p_client uuid, p_section text, p_data jsonb, p_run uuid default null
) returns void
language plpgsql security definer set search_path = '' as $$
begin
  insert into agent.brain_section (client_id, section_key, data, version, updated_by_run, updated_at)
  values (p_client, p_section, p_data, 1, p_run, now())
  on conflict (client_id, section_key) do update
    set data = excluded.data,
        version = agent.brain_section.version + 1,
        updated_by_run = excluded.updated_by_run,
        updated_at = now();

  insert into agent.brain_event (client_id, section_key, run_id, payload)
  values (p_client, p_section, p_run, p_data);

  insert into public.account_brain (client_id, data, updated_at)
  values (p_client, jsonb_build_object(p_section, p_data), now())
  on conflict (client_id) do update
    set data = public.account_brain.data || jsonb_build_object(p_section, p_data),
        updated_at = now();
end $$;

-- Čtení: assembluje celý brain ze section řádků (source of truth).
create or replace function public.brain_get(p_client uuid)
returns jsonb language sql security definer set search_path = '' as $$
  select coalesce(jsonb_object_agg(section_key, data), '{}'::jsonb)
  from agent.brain_section where client_id = p_client;
$$;

-- Pozor: Supabase default privileges grantují EXECUTE i roli anon + authenticated,
-- ne jen PUBLIC → SECURITY DEFINER = privilege escalation přes veřejný anon klíč.
-- Odebrat od public, anon i authenticated; přístup jen service_role.
revoke execute on function public.brain_write_section(uuid, text, jsonb, uuid) from public, anon, authenticated;
revoke execute on function public.brain_get(uuid) from public, anon, authenticated;
grant  execute on function public.brain_write_section(uuid, text, jsonb, uuid) to service_role;
grant  execute on function public.brain_get(uuid) to service_role;
