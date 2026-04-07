-- Ensure all active colleagues have default access to SOP and Bug Reports.
-- Keep existing permissions untouched; only add missing can_view entries.

UPDATE public.user_roles ur
SET page_permissions = (
  CASE
    WHEN NOT EXISTS (
      SELECT 1
      FROM jsonb_array_elements(COALESCE(ur.page_permissions, '[]'::jsonb)) AS perm
      WHERE perm->>'page' = 'my-work'
    ) THEN COALESCE(ur.page_permissions, '[]'::jsonb) || jsonb_build_array(
      jsonb_build_object('page', 'my-work', 'can_view', true, 'can_edit', false)
    )
    ELSE COALESCE(ur.page_permissions, '[]'::jsonb)
  END
)
WHERE ur.is_active = true;

UPDATE public.user_roles ur
SET page_permissions = (
  CASE
    WHEN NOT EXISTS (
      SELECT 1
      FROM jsonb_array_elements(COALESCE(ur.page_permissions, '[]'::jsonb)) AS perm
      WHERE perm->>'page' = 'sop'
    ) THEN COALESCE(ur.page_permissions, '[]'::jsonb) || jsonb_build_array(
      jsonb_build_object('page', 'sop', 'can_view', true, 'can_edit', false)
    )
    ELSE COALESCE(ur.page_permissions, '[]'::jsonb)
  END
)
WHERE ur.is_active = true;

UPDATE public.user_roles ur
SET page_permissions = (
  CASE
    WHEN NOT EXISTS (
      SELECT 1
      FROM jsonb_array_elements(COALESCE(ur.page_permissions, '[]'::jsonb)) AS perm
      WHERE perm->>'page' = 'bug-reports'
    ) THEN COALESCE(ur.page_permissions, '[]'::jsonb) || jsonb_build_array(
      jsonb_build_object('page', 'bug-reports', 'can_view', true, 'can_edit', false)
    )
    ELSE COALESCE(ur.page_permissions, '[]'::jsonb)
  END
)
WHERE ur.is_active = true;

