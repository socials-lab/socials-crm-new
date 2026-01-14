# Architecture Decisions Log

This document records key architectural decisions made during implementation.

---

## Format

Each decision follows this format:

```
## [DATE] Decision Title

**Context:** Why was this decision needed?

**Decision:** What was decided?

**Rationale:** Why this choice over alternatives?

**Consequences:** What are the implications?
```

---

## Decisions

### [2026-01-14] Compliance Review - Added Missing Tables and Fields

**Context:** During compliance review of sub-plans against codebase, several missing items were identified.

**Decisions Made:**

1. **Added `engagement_monthly_metrics` table** (Sub-Plan 05)
   - Tracks monthly revenue, costs, and margin per engagement
   - Finance/admin visibility only
   - Required by `EngagementMonthlyMetrics` TypeScript type

2. **Added `client_services` table** (Sub-Plans 01, 03)
   - Direct link between clients and services
   - Separate from `engagement_services` which tracks services within a contract
   - Required by `ClientService` TypeScript type

3. **Changed `allowed_pages` to `page_permissions` JSONB** (Sub-Plans 01, 02)
   - Original: Simple TEXT[] array of page IDs
   - Updated: JSONB array with `{ page, can_view, can_edit }` objects
   - Provides granular view/edit permissions per page
   - Required by `PagePermission` TypeScript type

4. **Added `last_login` field to `user_roles`** (Sub-Plan 01)
   - Tracks when user last signed in
   - Required by `CRMUser` TypeScript type

**Rationale:** Ensure database schema matches existing TypeScript types for type safety and compatibility.

**Consequences:** 
- Total tables increased from 26 to 29
- More complex permission checking logic
- Better audit trail for user activity

---

### [2026-01-14] Schema Strategy - Complete Replacement (Option B)

**Context:** Existing Supabase database has some tables but is missing many fields and tables. No .env credentials provided, so no data to preserve.

**Decision:** Complete schema replacement (Option B) - drop all existing tables and create from scratch.

**Rationale:**
- No production data exists (no credentials)
- Existing schema is incomplete (missing upsell fields, birthday, page_permissions, etc.)
- Cleaner than ALTER migrations
- Ensures consistent schema state

**Consequences:**
- Will need fresh Supabase project or reset existing one
- All migrations start from 001_initial_schema.sql
- No backward compatibility concerns

---

### [2026-01-14] Additional Schema Updates from Compliance Review

**Items Added:**

1. **'client' role added to app_role enum**
   - TypeScript type includes 'client' for client portal access (future)

2. **Upsell tracking fields**
   - `engagement_services.upsold_by_id` → colleagues.id
   - `engagement_services.upsell_commission_percent` → DECIMAL
   - `extra_works.upsold_by_id` → colleagues.id
   - `extra_works.upsell_commission_percent` → DECIMAL

3. **Profile name handling**
   - Use `full_name` in profiles table (matches TypeScript)
   - Drop separate first_name/last_name approach

4. **Creative Boost transformer functions**
   - Hook will transform camelCase (TypeScript) ↔ snake_case (DB)
   - e.g., `baseCredits` ↔ `base_credits`
