import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import type { PagePermission } from '@/types/crm';

type AppRole = Database['public']['Enums']['app_role'];

interface UserRoleContextType {
  role: AppRole | null;
  isSuperAdmin: boolean;
  isLoading: boolean;
  colleagueId: string | null;
  canSeeFinancials: boolean;
  pagePermissions: PagePermission[];
  canAccessPage: (page: string) => boolean;
  hasRole: (role: AppRole) => boolean;
}

const UserRoleContext = createContext<UserRoleContextType | undefined>(undefined);

export function UserRoleProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [colleagueId, setColleagueId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [canSeeFinancials, setCanSeeFinancials] = useState(false);
  const [pagePermissions, setPagePermissions] = useState<PagePermission[]>([]);

  useEffect(() => {
    if (authLoading || !user) {
      setIsLoading(authLoading);
      if (!user) {
        setRole(null);
        setIsSuperAdmin(false);
        setColleagueId(null);
        setCanSeeFinancials(false);
        setPagePermissions([]);
        setIsLoading(false);
      }
      return;
    }

    async function fetchUserRole() {
      setIsLoading(true);
      try {
        // Fetch user role
        const { data: userRole, error: roleError } = await supabase
          .from('user_roles')
          .select('role, is_super_admin, can_see_financials, page_permissions')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .single();

        if (roleError && roleError.code !== 'PGRST116') {
          console.error('Error fetching user role:', roleError);
        }

        if (userRole) {
          setRole(userRole.role);
          setIsSuperAdmin(userRole.is_super_admin ?? false);
          setCanSeeFinancials(userRole.can_see_financials ?? false);
          
          // Parse page_permissions JSONB
          const permissions = (userRole.page_permissions as PagePermission[]) || [];
          setPagePermissions(permissions);
        } else {
          setRole(null);
          setIsSuperAdmin(false);
          setCanSeeFinancials(false);
          setPagePermissions([]);
        }

        // Fetch colleague ID
        const { data: colleague, error: colleagueError } = await supabase
          .from('colleagues')
          .select('id')
          .eq('profile_id', user.id)
          .single();

        if (colleagueError && colleagueError.code !== 'PGRST116') {
          console.error('Error fetching colleague:', colleagueError);
        }

        setColleagueId(colleague?.id ?? null);
      } catch (error) {
        console.error('Error in fetchUserRole:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserRole();
  }, [user, authLoading]);

  const hasRole = (checkRole: AppRole): boolean => {
    if (isSuperAdmin) return true;
    return role === checkRole;
  };

  const canAccessPage = (page: string): boolean => {
    // Super admin has access to everything
    if (isSuperAdmin) return true;
    
    // If no page_permissions defined, default to role-based access
    if (pagePermissions.length === 0) {
      return has_crm_access();
    }
    
    // Check if page has can_view = true
    const permission = pagePermissions.find(p => p.page === page);
    return permission?.can_view ?? false;
  };

  // Helper function to check CRM access
  const has_crm_access = (): boolean => {
    return role !== null;
  };

  return (
    <UserRoleContext.Provider value={{ 
      role, 
      isSuperAdmin, 
      isLoading, 
      colleagueId,
      canSeeFinancials,
      pagePermissions,
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
