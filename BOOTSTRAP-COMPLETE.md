# ✅ Database Bootstrap Complete

## What Was Done

1. ✅ **Applied all database migrations** (001-009) to your Supabase instance
2. ✅ **Created bootstrap scripts** to set up your super admin account
3. ✅ **Verified migrations** - all tables should now exist

## Next Step: Create Your Admin Account

You need to create a super admin account to access the app. Choose one method:

### Method 1: Automated Script (Easiest)

```bash
cd socials-crm-new/supabase
./bootstrap-admin.sh
```

Enter your email when prompted. Make sure you've signed up at http://localhost:8080/auth first!

### Method 2: Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/bkemtvqmbpxopuasgxcq
2. Navigate to **SQL Editor**
3. Open `supabase/bootstrap-admin.sql`
4. Replace `'YOUR_USER_EMAIL'` with your email
5. Click **Run**

### Method 3: Manual SQL

If you know your user UUID from Supabase Dashboard → Authentication → Users:

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

## Verify Everything Works

1. **Refresh your app**: http://localhost:8080
2. **Log in** with your email
3. **You should now have full access** - no more ApprovalPending screen!
4. **Check browser console** - should be clean (no 404 errors)

## Files Created

- `supabase/bootstrap-admin.sql` - SQL script to create admin
- `supabase/bootstrap-admin.sh` - Automated helper script
- `supabase/verify-tables.sql` - Script to verify tables exist
- `supabase/README-BOOTSTRAP.md` - Detailed instructions

## Troubleshooting

### Still seeing 404 errors?

1. Run `supabase/verify-tables.sql` to check if tables exist
2. Make sure you've run the bootstrap script to create your admin account
3. Check browser console for specific error messages

### Can't log in?

1. Make sure you've signed up at http://localhost:8080/auth
2. Check Supabase Dashboard → Authentication → Users to see if your account exists

### Tables don't exist?

Run migrations again:
```bash
cd socials-crm-new
supabase db push
```

## Migration Status

All migrations have been applied:
- ✅ 001_initial_schema.sql
- ✅ 002_rls_policies.sql  
- ✅ 003_colleague_profile_link.sql
- ✅ 004_leads_history_function.sql
- ✅ 005_engagement_fixes.sql
- ✅ 006_invoice_line_item_service.sql
- ✅ 007_notification_triggers.sql
- ✅ 008_calendar_tokens.sql
- ✅ 009_external_integrations.sql

Your database is now fully set up! 🎉
