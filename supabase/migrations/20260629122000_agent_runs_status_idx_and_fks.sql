-- P0: doplnit index na status (cockpit poll running/queued) + FK integritu.
-- engagement_id/client_id indexy už existují; FK chyběly. 0 orphanů → bezpečné.
-- ON DELETE SET NULL: zachová historii běhů i po smazání engagementu/klienta (audit).

create index if not exists idx_agent_runs_status on public.agent_runs (status);

alter table public.agent_runs
  add constraint agent_runs_engagement_fk
  foreign key (engagement_id) references public.engagements(id) on delete set null;

alter table public.agent_runs
  add constraint agent_runs_client_fk
  foreign key (client_id) references public.clients(id) on delete set null;
