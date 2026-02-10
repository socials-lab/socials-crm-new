#!/bin/bash
# Helper script to run psql queries with auto-fetched credentials

# Get fresh credentials from Supabase CLI
eval $(npx supabase db dump --dry-run 2>&1 | grep -E "^export PG")

# Run the query with SET ROLE postgres for full access
PGPASSWORD="$PGPASSWORD" psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -c "SET ROLE postgres; $1"
