-- ============================================
-- Fix RLS Permission Mismatch for Client Contacts
-- ============================================
-- Problem: Users could DELETE contacts they cannot VIEW due to different RLS logic
-- between SELECT and INSERT/UPDATE/DELETE policies.
--
-- Fix: Update DELETE (and INSERT/UPDATE) policies to also require visibility.
-- Admin/management can only modify contacts they can see via client access.
-- ============================================

-- Drop existing write policies on client_contacts
DROP POLICY IF EXISTS "Admins can insert client contacts" ON client_contacts;
DROP POLICY IF EXISTS "Admins can update client contacts" ON client_contacts;
DROP POLICY IF EXISTS "Admins can delete client contacts" ON client_contacts;

-- Create new policies that require both:
-- 1. Admin or management role
-- 2. Visibility to the contact (via client access)

-- INSERT: Admin/management can add contacts to clients they can access
CREATE POLICY "Admins can insert client contacts"
  ON client_contacts FOR INSERT
  WITH CHECK (
    is_admin_or_management(auth.uid()) AND
    (has_full_client_access(auth.uid()) OR is_assigned_to_client(auth.uid(), client_id))
  );

-- UPDATE: Admin/management can update contacts they can view
CREATE POLICY "Admins can update client contacts"
  ON client_contacts FOR UPDATE
  USING (
    is_admin_or_management(auth.uid()) AND
    (has_full_client_access(auth.uid()) OR is_assigned_to_client(auth.uid(), client_id))
  )
  WITH CHECK (
    is_admin_or_management(auth.uid()) AND
    (has_full_client_access(auth.uid()) OR is_assigned_to_client(auth.uid(), client_id))
  );

-- DELETE: Admin/management can delete contacts they can view
CREATE POLICY "Admins can delete client contacts"
  ON client_contacts FOR DELETE
  USING (
    is_admin_or_management(auth.uid()) AND
    (has_full_client_access(auth.uid()) OR is_assigned_to_client(auth.uid(), client_id))
  );
