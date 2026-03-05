

## Plan: Login status, last login, and activity log in Access Management

### 1. Login status & last login date

The `auth.users` table (managed by Supabase) contains `last_sign_in_at` and `email_confirmed_at` fields, but these cannot be queried from the client. Solution:

**Create an edge function `get-users-auth-info`** that:
- Accepts a list of user IDs
- Uses the Supabase Admin API to fetch `last_sign_in_at` and `created_at` from `auth.users`
- Returns a map of `user_id → { last_sign_in_at, email_confirmed_at, created_at }`
- Only callable by super admins (verify via `is_admin` check)

**Update `UserManagement.tsx`**:
- Call the edge function after fetching user roles
- Add two new columns to the table:
  - "Status" — green badge "Aktivní" if `last_sign_in_at` exists, orange "Čeká na přijetí" if not
  - "Poslední přihlášení" — formatted `last_sign_in_at` date, or "—"

### 2. Activity log

**Create a `user_activity_log` table** with columns:
- `id` (uuid, PK)
- `user_id` (uuid, NOT NULL, references auth.users)
- `action` (text) — e.g. "lead_created", "engagement_updated", "extra_work_approved"
- `entity_type` (text) — e.g. "lead", "engagement", "client"
- `entity_id` (uuid, nullable)
- `entity_name` (text, nullable) — human-readable name for display
- `metadata` (jsonb, nullable) — extra details
- `created_at` (timestamptz, default now())

RLS: Super admins can read all; users can read their own.

**Create a logging utility `src/services/activityLogger.ts`**:
- `logActivity(action, entityType, entityId, entityName, metadata?)` — inserts into `user_activity_log` using the current auth user
- Simple fire-and-forget (no await needed in calling code)

**Integrate logging into key CRM actions** (initial set):
- `useCRMData` hook: log on `addClient`, `addEngagement`, `updateEngagement`, `addColleague`
- `useLeadsData` hook: log on `addLead`, `updateLead`
- `useModificationRequests`: log on create/approve
- Extra work creation/approval
- Meeting creation

**Add activity log display in `UserManagement.tsx`**:
- Add a "Log aktivity" button in the user row dropdown menu
- Opens a Sheet/Dialog showing the last 50 actions for that user
- Each row: timestamp, action description, entity link

### Files to create
- `supabase/functions/get-users-auth-info/index.ts`
- `src/services/activityLogger.ts`

### Files to modify
- `src/components/settings/UserManagement.tsx` — add columns + activity log button
- `src/hooks/useCRMData.tsx` — add activity logging calls
- `src/hooks/useLeadsData.tsx` — add activity logging calls

### Database migration
- Create `user_activity_log` table with RLS policies

