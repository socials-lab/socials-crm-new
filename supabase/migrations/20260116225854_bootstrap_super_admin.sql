-- Bootstrap super admin for kubikrana@gmail.com
INSERT INTO public.user_roles (user_id, role, is_super_admin, is_active, can_see_financials, page_permissions)
SELECT 
  id,
  'admin',
  TRUE,
  TRUE,
  TRUE,
  '[{"page": "dashboard", "can_view": true, "can_edit": true}, {"page": "my-work", "can_view": true, "can_edit": true}, {"page": "leads", "can_view": true, "can_edit": true}, {"page": "clients", "can_view": true, "can_edit": true}, {"page": "contacts", "can_view": true, "can_edit": true}, {"page": "engagements", "can_view": true, "can_edit": true}, {"page": "extra-work", "can_view": true, "can_edit": true}, {"page": "creative-boost", "can_view": true, "can_edit": true}, {"page": "meetings", "can_view": true, "can_edit": true}, {"page": "invoicing", "can_view": true, "can_edit": true}, {"page": "services", "can_view": true, "can_edit": true}, {"page": "colleagues", "can_view": true, "can_edit": true}, {"page": "recruitment", "can_view": true, "can_edit": true}, {"page": "feedback", "can_view": true, "can_edit": true}, {"page": "analytics", "can_view": true, "can_edit": true}, {"page": "settings", "can_view": true, "can_edit": true}, {"page": "notifications", "can_view": true, "can_edit": true}]'::jsonb
FROM auth.users
WHERE email = 'kubikrana@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET
  role = 'admin',
  is_super_admin = TRUE,
  is_active = TRUE,
  can_see_financials = TRUE,
  page_permissions = EXCLUDED.page_permissions;
