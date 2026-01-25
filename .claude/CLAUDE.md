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
