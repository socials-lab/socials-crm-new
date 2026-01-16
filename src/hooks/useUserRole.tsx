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
  const { user, session, loading: authLoading } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [colleagueId, setColleagueId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [canSeeFinancials, setCanSeeFinancials] = useState(false);
  const [pagePermissions, setPagePermissions] = useState<PagePermission[]>([]);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    
    if (!user || !session) {
      setRole(null);
      setIsSuperAdmin(false);
      setColleagueId(null);
      setCanSeeFinancials(false);
      setPagePermissions([]);
      setIsLoading(false);
      return;
    }

    async function fetchUserRole() {
      setIsLoading(true);
      try {
        // Use session from context - no need to call getSession() again
        const accessToken = session!.access_token;
        
        // Direct fetch to avoid any SDK issues
        const apiUrl = import.meta.env.VITE_SUPABASE_URL;
        const apiKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        const directResponse = await fetch(
          `${apiUrl}/rest/v1/user_roles?user_id=eq.${user!.id}&is_active=eq.true&select=role,is_super_admin,can_see_financials,page_permissions`,
          {
            headers: {
              'apikey': apiKey,
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            }
          }
        );
        
        const directData = await directResponse.json();
        const userRole = directData[0] || null;
        const roleError = directResponse.ok ? null : { message: directResponse.statusText };

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

        // Fetch colleague ID using direct fetch
        const colleagueResponse = await fetch(
          `${apiUrl}/rest/v1/colleagues?profile_id=eq.${user!.id}&select=id`,
          {
            headers: {
              'apikey': apiKey,
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            }
          }
        );
        const colleagueData = await colleagueResponse.json();
        const colleague = colleagueData[0] || null;
        setColleagueId(colleague?.id ?? null);
      } catch (error) {
        console.error('Error in fetchUserRole:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserRole();
  }, [user, session, authLoading]);

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
