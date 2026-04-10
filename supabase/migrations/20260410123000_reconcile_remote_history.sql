-- Reconcile migration history with production.
-- This version exists in remote supabase_migrations.schema_migrations but was missing in git.
-- Intentionally no-op to keep future deploys deterministic.
select 1;
