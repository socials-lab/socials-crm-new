-- P2: durabilní fronta agentních úloh (pgmq) + public RPC fasáda.
-- Nahrazuje fire-and-forget daemon thread v AI Hub routes.py. I in-process worker
-- pak dává durabilitu: když proces spadne uprostřed úlohy, visibility timeout vrátí
-- zprávu do fronty a další poll ji vyzvedne (s threadem se úloha ztratila).
-- Schéma pgmq zůstává skryté; AI Hub volá jen public fasádu (service_role only).

create extension if not exists pgmq;

-- Idempotentní založení fronty.
do $$
begin
  perform pgmq.create('agent_jobs');
exception when others then null;  -- už existuje
end $$;

-- Enqueue úlohy → vrací msg_id.
create or replace function public.job_enqueue(p_kind text, p_payload jsonb default '{}'::jsonb)
returns bigint language sql security definer set search_path = pg_catalog, pgmq as $$
  select pgmq.send('agent_jobs', jsonb_build_object('kind', p_kind, 'payload', coalesce(p_payload, '{}'::jsonb)));
$$;

-- Read: zviditelní zpráv na p_vt sekund (po pádu workeru se vrátí do fronty).
create or replace function public.job_read(p_vt int default 300, p_qty int default 1)
returns table (msg_id bigint, read_ct int, message jsonb)
language sql security definer set search_path = pg_catalog, pgmq as $$
  select msg_id, read_ct, message from pgmq.read('agent_jobs', p_vt, p_qty);
$$;

-- Hotovo → smazat z fronty.
create or replace function public.job_complete(p_msg_id bigint)
returns boolean language sql security definer set search_path = pg_catalog, pgmq as $$
  select pgmq.delete('agent_jobs', p_msg_id);
$$;

-- Selhání → archiv (pro inspekci, ne ztráta).
create or replace function public.job_fail(p_msg_id bigint)
returns boolean language sql security definer set search_path = pg_catalog, pgmq as $$
  select pgmq.archive('agent_jobs', p_msg_id);
$$;

revoke execute on function public.job_enqueue(text, jsonb)  from public, anon, authenticated;
revoke execute on function public.job_read(int, int)         from public, anon, authenticated;
revoke execute on function public.job_complete(bigint)       from public, anon, authenticated;
revoke execute on function public.job_fail(bigint)           from public, anon, authenticated;
grant execute on function public.job_enqueue(text, jsonb)    to service_role;
grant execute on function public.job_read(int, int)          to service_role;
grant execute on function public.job_complete(bigint)        to service_role;
grant execute on function public.job_fail(bigint)            to service_role;
