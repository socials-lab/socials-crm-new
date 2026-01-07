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
  allowedPages: string[];
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
  const [allowedPages, setAllowedPages] = useState<string[]>([]);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      setRole(null);
      setIsSuperAdmin(false);
      setColleagueId(null);
      setCanSeeFinancials(false);
      setAllowedPages([]);
      setIsLoading(false);
      return;
    }

    const fetchUserRole = async () => {
      setIsLoading(true);
      try {
        // Fetch user role - use raw query to handle both old and new schema
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', user.id)
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
          setAllowedPages((data.allowed_pages as string[]) || []);
        } else {
          // User has no role assigned yet
          setRole(null);
          setIsSuperAdmin(false);
          setCanSeeFinancials(false);
          setAllowedPages([]);
        }

        // Fetch linked colleague
        const { data: colleagueData, error: colleagueError } = await supabase
          .from('colleagues')
          .select('id')
          .eq('profile_id', user.id)
          .maybeSingle();

        if (colleagueError) {
          console.error('Error fetching colleague:', colleagueError);
        }

        setColleagueId(colleagueData?.id || null);
      } catch (error) {
        console.error('Error in fetchUserRole:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserRole();
  }, [user, authLoading]);

  const hasRole = (checkRole: AppRole): boolean => {
    if (isSuperAdmin) return true;
    return role === checkRole;
  };

  const canAccessPage = (page: string): boolean => {
    // Super admin has access to everything
    if (isSuperAdmin) return true;
    // If no allowed_pages defined, allow access (backward compatibility)
    if (allowedPages.length === 0) return true;
    // Check if page is in allowed pages
    return allowedPages.includes(page);
  };

  return (
    <UserRoleContext.Provider value={{ 
      role, 
      isSuperAdmin, 
      isLoading, 
      colleagueId,
      canSeeFinancials,
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
