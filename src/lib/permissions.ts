/**
 * Permission helper functions for consistent access control across the application.
 * Aligns UI checks with RLS policies.
 */

import type { Profile, UserRole } from '@/types/crm';

/**
 * Roles that are allowed to modify contacts (add, edit, delete).
 * This should match the RLS policies in the database.
 */
const CONTACT_MODIFY_ROLES: UserRole[] = ['admin', 'management', 'project_manager', 'specialist'];

/**
 * Checks if a user can modify contacts (add, edit, delete).
 * Aligned with RLS policies that allow admin and management roles.
 */
export function canModifyContacts(profile: Profile | null | undefined): boolean {
  if (!profile) return false;

  // Super admins can always modify
  if (profile.is_super_admin) return true;

  // Check if user has a role that allows contact modification
  return CONTACT_MODIFY_ROLES.includes(profile.role);
}

/**
 * Checks if a user can modify clients (add, edit).
 * Currently same as contact permissions but could diverge.
 */
export function canModifyClients(profile: Profile | null | undefined): boolean {
  if (!profile) return false;

  // Super admins can always modify
  if (profile.is_super_admin) return true;

  // Check if user has a role that allows client modification
  return CONTACT_MODIFY_ROLES.includes(profile.role);
}

/**
 * Checks if a user can convert leads to clients.
 */
export function canConvertLeads(profile: Profile | null | undefined): boolean {
  if (!profile) return false;

  // Super admins can always convert
  if (profile.is_super_admin) return true;

  // Check if user has a role that allows lead conversion
  return CONTACT_MODIFY_ROLES.includes(profile.role);
}

/**
 * Checks if a user has super admin privileges.
 */
export function isSuperAdmin(profile: Profile | null | undefined): boolean {
  return profile?.is_super_admin ?? false;
}
