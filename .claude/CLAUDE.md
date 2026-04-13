# Project Rules

## Supabase Database Access (PREFERRED METHOD)

**Always use psql for database operations** - it bypasses RLS and allows full admin access.

**Never say "I can't access the database" - always try the CLI approach first.**

Get connection credentials via dry-run (this gets FRESH, WORKING credentials):
```bash
npx supabase db dump --dry-run 2>&1 | grep -E "PGHOST|PGPORT|PGUSER|PGPASSWORD|PGDATABASE"
```

Then use those env vars with psql (this uses the pooler which is more reliable):
```bash
PGHOST="aws-1-eu-west-2.pooler.supabase.com" PGPORT="5432" PGUSER="cli_login_postgres.bkemtvqmbpxopuasgxcq" PGPASSWORD="<from above>" PGDATABASE="postgres" psql -c "SET ROLE postgres; SELECT * FROM table_name;"
```

**If direct connection to db.*.supabase.co fails, always fall back to the pooler connection from dry-run.**

For modifications (DELETE/UPDATE), disable user triggers if there are history triggers:
```bash
PGPASSWORD="<password>" psql -h db.bkemtvqmbpxopuasgxcq.supabase.co -p 5432 -U cli_login_postgres -d postgres -c "
SET ROLE postgres;
BEGIN;
ALTER TABLE table_name DISABLE TRIGGER USER;
DELETE FROM table_name WHERE id = 'uuid';
ALTER TABLE table_name ENABLE TRIGGER USER;
COMMIT;
"
```

## Supabase REST API (limited - blocked by RLS)

Only works for tables with permissive RLS policies:
```bash
curl -s "https://bkemtvqmbpxopuasgxcq.supabase.co/rest/v1/TABLE?select=*" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY"
```

## Supabase JS Client Gotchas

- `supabase.rpc()` returns a `PostgrestFilterBuilder`, NOT a raw Promise
- It is "thenable" (can be awaited) but does NOT have `.catch()` method
- Wrong: `await supabase.rpc(...).catch(console.error)`
- Correct: `supabase.rpc(...).then(({ error }) => { if (error) console.error(error); })`
- Or use try/catch with await

## 🚨 Migration Drift Guardrails (MANDATORY)

This repo has multiple developers/agents on one branch. To prevent deploy breakage, follow this strict flow.

1. **Always sync first (required):**
   ```bash
   git fetch origin
   git checkout feature/supabase-implementation-plans
   git pull --ff-only origin feature/supabase-implementation-plans
   ```

2. **Before creating/applying any migration, verify local vs remote history:**
   ```bash
   npx supabase migration list --db-url "$SUPABASE_DB_URL_PROD"
   ```

3. **If remote has migration versions not present locally:**
   - **DO NOT** generate placeholder/reconcile/manual backfill migrations.
   - **DO NOT** continue with deploy.
   - First retry step 1 (pull latest) and re-check.
   - If still missing after pull: **STOP** and notify user to contact **Jakub Rana** (owner) to get the missing migration committed/pushed.

4. **Forbidden patterns:**
   - Never create `*_placeholder.sql` to satisfy missing history.
   - Never create duplicate migration version timestamps.
   - Never "repair" by inventing unknown prior migrations.

5. **If drift is detected, required user message format:**
   - State exact missing migration version(s).
   - State that deploy is blocked intentionally to avoid schema corruption/history conflicts.
   - Instruct: "Please contact Jakub Rana to push the missing migration(s), then rerun deploy."
