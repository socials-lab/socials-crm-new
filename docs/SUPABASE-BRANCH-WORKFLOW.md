# Supabase Branch Workflow (Source of Truth Rules)

## Context

- `main` is maintained by the client in Lovable.
- The client is non-technical, so `main` is often not technically production-ready.
- `main` is still the source of truth for UX, UI, and intended feature behavior.

## Our Branching Reality

- We have a long-running Supabase implementation branch: `feature/supabase-implementation-plans`.
- This branch contains the real technical implementation (DB, functions, backend wiring, reliability).
- Branch drift from `main` is large.

## Mandatory Integration Strategy

- Never do a naive merge from `main` into the Supabase implementation branch.
- New changes from `main` must be integrated manually and intelligently.
- Re-implement each relevant change in a technically correct way so the app remains functional end to end.
- Treat `main` as product intent, not as drop-in code.

## Practical Rule

- When new client commits land in `main`, review them and selectively port behavior to the Supabase branch.
- Preserve UX/feature intent while rebuilding technical details separately where needed.
- If a direct merge is attempted, stop and use manual migration/integration instead.
