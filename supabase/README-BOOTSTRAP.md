# Database Bootstrap Guide

## Status

✅ Migrations 001-009 have been pushed to your Supabase database.

## Next Steps

### 1. Verify Tables Exist

Run the verification script in Supabase Dashboard SQL Editor:

```sql
-- Copy contents of verify-tables.sql and run it
```

Or via CLI:
```bash
supabase db execute -f verify-tables.sql
```

This will show you which tables exist. All required tables should be listed.

### 2. Create Your Super Admin Account

**Option A: Via Supabase Dashboard (Recommended)**

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/bkemtvqmbpxopuasgxcq
2. Navigate to SQL Editor
3. Open `bootstrap-admin.sql`
4. Replace `'YOUR_USER_EMAIL'` with your actual email address (the one you use to log in)
5. Run the script

**Option B: Via Supabase CLI**

1. Edit `bootstrap-admin.sql` and replace `'YOUR_USER_EMAIL'` with your email
2. Run:
```bash
supabase db execute -f bootstrap-admin.sql
```

**Option C: Manual SQL (if you know your user ID)**

1. Sign in to your app at http://localhost:8080/auth
2. Open browser DevTools → Application → Local Storage → find your Supabase auth token
3. Or check Supabase Dashboard → Authentication → Users → find your user ID
4. Run this SQL (replace `YOUR_USER_UUID`):

```sql
INSERT INTO user_roles (user_id, role, is_super_admin, can_see_financials, is_active, page_permissions)
VALUES (
  'YOUR_USER_UUID'::uuid,
  'admin',
  true,
  true,
  true,
  '[]'::jsonb
)
ON CONFLICT (user_id) 
DO UPDATE SET
  role = 'admin',
  is_super_admin = true,
  can_see_financials = true,
  is_active = true,
  updated_at = NOW();
```

### 3. Verify It Works

1. Refresh your app at http://localhost:8080
2. Log in with your email
3. You should now have access to all pages (no more ApprovalPending screen)
4. Check browser console - 404 errors should be gone (or replaced with empty arrays if tables are empty)

## Troubleshooting

### Still Getting 404 Errors?

1. **Check if tables exist**: Run `verify-tables.sql`
2. **Check RLS policies**: Tables might exist but RLS is blocking access
3. **Check your user role**: Make sure `user_roles` table has your user ID

### Can't Find Your User ID?

1. Go to Supabase Dashboard → Authentication → Users
2. Find your user by email
3. Copy the UUID
4. Use Option C above

### Tables Don't Exist?

If verification shows tables are missing:

1. Check migration status: `supabase migration list`
2. Re-apply migrations: `supabase db push --include-all`
3. Or manually run migration SQL files in order (001 through 009)

## What Each Migration Does

- **001_initial_schema.sql**: Creates all tables, enums, indexes, triggers
- **002_rls_policies.sql**: Sets up Row Level Security policies
- **003_colleague_profile_link.sql**: Links colleagues to user profiles
- **004_leads_history_function.sql**: Adds lead history logging function
- **005_engagement_fixes.sql**: Engagement-related fixes
- **006_invoice_line_item_service.sql**: Invoice line item improvements
- **007_notification_triggers.sql**: Notification triggers
- **008_calendar_tokens.sql**: Google Calendar integration tables
- **009_external_integrations.sql**: External service integrations
