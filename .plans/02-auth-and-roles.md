# Sub-Plan 02: Auth and Roles

## Status: Not Started

## Scope
Authentication flow, role-based access control, and RLS policies for all tables.

## Goals
- [ ] Create RLS policies for all 29 tables
- [ ] Create auth helper functions in auth schema
- [ ] Update useAuth.tsx hook for real Supabase auth
- [ ] Update useUserRole.tsx hook to fetch roles from database
- [ ] Configure Supabase Auth providers (email, Google)

## RLS Policy Strategy

| Role | Access Level |
|------|--------------|
| Super Admin | Full access to everything, bypasses all policies |
| Admin | Full access except super admin management |
| Management | Full read, write to most data |
| Project Manager | Full access to assigned clients/engagements, read elsewhere |
| Specialist | Access to own assignments, extra work, meetings |
| Finance | Read access + full write to invoicing tables |

### Policy Patterns

1. **Super Admin Bypass**: `auth.is_super_admin()` returns TRUE for full access
2. **Admin/Management**: `auth.is_admin_or_management()` for most write operations
3. **CRM Access**: `auth.has_crm_access()` for any authenticated user with a role
4. **Owner-based**: Check if `owner_id` or `colleague_id` matches current user's colleague

## Database Changes

### Helper Functions to Create (in auth schema)

| Function | Purpose |
|----------|---------|
| auth.has_role(role) | Check if user has specific role |
| auth.is_super_admin() | Check if user is super admin |
| auth.can_see_financials() | Check financial access permission |
| auth.get_colleague_id() | Get colleague ID for current user |
| auth.is_admin_or_management() | Check admin/management role |
| auth.has_crm_access() | Check if user has any CRM role |
| auth.can_view_page(page) | Check if user can view specific page |
| auth.can_edit_page(page) | Check if user can edit on specific page |

### RLS Policies by Table

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| profiles | Own + admins | System | Own | - |
| user_roles | Own + super admins | Super admins | Super admins | Super admins |
| colleagues | CRM users | Admins | Admins | Admins |
| services | CRM users | Admins | Admins | Admins |
| clients | CRM users | Admins | Admins | Admins |
| client_contacts | CRM users | Admins | Admins | Admins |
| client_services | CRM users | Admins | Admins | Admins |
| leads | CRM users | Admins/PMs | Owner/Admins | Admins |
| lead_history | CRM users | System | - | - |
| engagements | CRM users | Admins | Admins | Admins |
| engagement_services | CRM users | Admins | Admins | Admins |
| engagement_assignments | CRM users | Admins | Admins | Admins |
| engagement_history | CRM users | System | - | - |
| engagement_monthly_metrics | Finance/Admins | Finance/Admins | Finance/Admins | Finance/Admins |
| extra_works | CRM users | CRM users | Creator/Admins | Admins |
| issued_invoices | Finance/Admins | Finance/Admins | Finance/Admins | Finance/Admins |
| invoice_line_items | Finance/Admins | Finance/Admins | Finance/Admins | Finance/Admins |
| output_types | CRM users | Admins | Admins | Admins |
| creative_boost_client_months | CRM users | Assigned/Admins | Assigned/Admins | Admins |
| creative_boost_outputs | CRM users | CRM users | Creator/Admins | Admins |
| creative_boost_settings_history | CRM users | System | - | - |
| meetings | CRM users | CRM users | Creator/Admins | Admins |
| meeting_participants | CRM users | CRM users | CRM users | CRM users |
| meeting_tasks | CRM users | CRM users | Assigned/Admins | Admins |
| applicants | CRM users | Admins | Owner/Admins | Admins |
| feedback_ideas | CRM users | CRM users | Author/Admins | Admins |
| feedback_votes | CRM users | Own | Own | Own |
| notifications | Own | System | Own | Own |

## Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/migrations/002_rls_policies.sql` | Create - all RLS policies |
| `src/hooks/useAuth.tsx` | Modify - real auth implementation |
| `src/hooks/useUserRole.tsx` | Modify - fetch from database |

## Implementation Steps
- [ ] Create auth helper functions (is_super_admin, has_role, etc.)
- [ ] Create RLS policies for profiles and user_roles
- [ ] Create RLS policies for colleagues and services
- [ ] Create RLS policies for clients and client_contacts
- [ ] Create RLS policies for leads and lead_history
- [ ] Create RLS policies for engagements and related tables
- [ ] Create RLS policies for extra_works
- [ ] Create RLS policies for invoicing tables
- [ ] Create RLS policies for Creative Boost tables
- [ ] Create RLS policies for meetings tables
- [ ] Create RLS policies for applicants
- [ ] Create RLS policies for feedback tables
- [ ] Create RLS policies for notifications
- [ ] Update useAuth.tsx with proper auth flow (keep dev bypass option)
- [ ] Update useUserRole.tsx to query user_roles table
- [ ] Configure Google OAuth in Supabase dashboard

## Testing Checklist
- [ ] User can sign up with email/password
- [ ] User can sign in with email/password
- [ ] User can sign in with Google OAuth
- [ ] Profile auto-created on signup (trigger works)
- [ ] New users have no role (redirect to approval pending)
- [ ] Admin can assign roles to users
- [ ] Super admin can access everything
- [ ] Specialist can only see own work
- [ ] Finance can access invoicing
- [ ] RLS properly blocks unauthorized access
- [ ] Dev bypass still works for local development

## Page Permissions Structure

The `user_roles.page_permissions` column stores a JSONB array:

```json
[
  { "page": "dashboard", "can_view": true, "can_edit": false },
  { "page": "leads", "can_view": true, "can_edit": true },
  { "page": "clients", "can_view": true, "can_edit": false },
  ...
]
```

### Available Pages
- dashboard, my-work
- leads, clients, contacts, engagements
- extra-work, creative-boost, meetings
- invoicing, services
- colleagues, recruitment, feedback
- analytics, settings

### Permission Logic
1. Super admin: Full access to all pages
2. If page_permissions is empty/null: Use role-based defaults
3. Otherwise: Check specific page permission

## Notes
- Keep DEV_BYPASS environment variable for local development
- Super admins should be set directly in database, not via UI
- First user should be made super admin manually
- `last_login` updated on each successful sign-in
