import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface UserRoleContextType {
  role: AppRole | null;
  isSuperAdmin: boolean;
  isLoading: boolean;
  colleagueId: string | null;
  canSeeFinancials: boolean;
  canEditAcademy: boolean;
  allowedPages: string[];
  canAccessPage: (page: string) => boolean;
  hasRole: (role: AppRole) => boolean;
}

const UserRoleContext = createContext<UserRoleContextType | undefined>(undefined);

const DEFAULT_PAGES_WITHOUT_EXPLICIT_PERMISSIONS = ['my-work'];

export function UserRoleProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [colleagueId, setColleagueId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [canSeeFinancials, setCanSeeFinancials] = useState(false);
  const [canEditAcademy, setCanEditAcademy] = useState(false);
  const [allowedPages, setAllowedPages] = useState<string[]>([]);
  const [lastFetchedUserId, setLastFetchedUserId] = useState<string | null>(null);

  // Use user.id as dependency instead of user object to prevent refetching on token refresh
  const userId = user?.id ?? null;

  useEffect(() => {
    if (authLoading) return;

    if (!userId) {
      setRole(null);
      setIsSuperAdmin(false);
      setColleagueId(null);
      setCanSeeFinancials(false);
      setCanEditAcademy(false);
      setAllowedPages([]);
      setIsLoading(false);
      setLastFetchedUserId(null);
      return;
    }

    // Skip refetch if we already loaded data for this user
    if (lastFetchedUserId === userId) {
      return;
    }

    const fetchUserRole = async () => {
      setIsLoading(true);
      try {
        // Fetch user role - use raw query to handle both old and new schema
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (roleError) {
          console.error('Error fetching user role:', roleError);
        }

        if (roleData) {
          setRole(roleData.role);
          setIsSuperAdmin(roleData.is_super_admin || false);
          // Handle new columns that might not exist yet
          const data = roleData as Record<string, unknown>;
          setCanSeeFinancials((data.can_see_financials as boolean) || false);
          setCanEditAcademy((data.can_edit_academy as boolean) || false);
          // Extract allowed pages from page_permissions array
          const pagePermissions = data.page_permissions as Array<{ page: string; can_view: boolean }> | null;
          if (pagePermissions && Array.isArray(pagePermissions)) {
            const pages = pagePermissions.filter(p => p.can_view).map(p => p.page);
            setAllowedPages(pages);
          } else {
            setAllowedPages([]);
          }
        } else {
          // User has no role assigned yet
          setRole(null);
          setIsSuperAdmin(false);
          setCanSeeFinancials(false);
          setCanEditAcademy(false);
          setAllowedPages([]);
        }

        // Fetch linked colleague
        const { data: colleagueData, error: colleagueError } = await supabase
          .from('colleagues')
          .select('id')
          .eq('profile_id', userId)
          .maybeSingle();

        if (colleagueError) {
          console.error('Error fetching colleague:', colleagueError);
        }

        setColleagueId(colleagueData?.id || null);
        setLastFetchedUserId(userId);
      } catch (error) {
        console.error('Error in fetchUserRole:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserRole();
  }, [userId, authLoading, lastFetchedUserId]);

  const hasRole = (checkRole: AppRole): boolean => {
    if (isSuperAdmin) return true;
    return role === checkRole;
  };

  const canAccessPage = (page: string): boolean => {
    // Super admin has access to everything
    if (isSuperAdmin) return true;
    // Admin and management roles have access to everything
    if (role === 'admin' || role === 'management') return true;
    // If user has specific page permissions, check against them
    if (allowedPages.length > 0) {
      return allowedPages.includes(page);
    }

    // Default for non-admin users without explicit page permissions:
    // show only self-service area until admin grants additional pages.
    return DEFAULT_PAGES_WITHOUT_EXPLICIT_PERMISSIONS.includes(page);
  };

  return (
    <UserRoleContext.Provider value={{ 
      role, 
      isSuperAdmin, 
      isLoading, 
      colleagueId,
      canSeeFinancials,
      canEditAcademy,
      allowedPages,
      canAccessPage,
      hasRole 
    }}>
      {children}
    </UserRoleContext.Provider>
  );
}

export function useUserRole() {
  const context = useContext(UserRoleContext);
  if (context === undefined) {
    throw new Error('useUserRole must be used within a UserRoleProvider');
  }
  return context;
}
