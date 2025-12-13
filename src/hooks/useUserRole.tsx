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
  hasRole: (role: AppRole) => boolean;
}

const UserRoleContext = createContext<UserRoleContextType | undefined>(undefined);

export function UserRoleProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [colleagueId, setColleagueId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      setRole(null);
      setIsSuperAdmin(false);
      setColleagueId(null);
      setIsLoading(false);
      return;
    }

    const fetchUserRole = async () => {
      setIsLoading(true);
      try {
        // Fetch user role
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role, is_super_admin')
          .eq('user_id', user.id)
          .maybeSingle();

        if (roleError) {
          console.error('Error fetching user role:', roleError);
        }

        if (roleData) {
          setRole(roleData.role);
          setIsSuperAdmin(roleData.is_super_admin || false);
        } else {
          // User has no role assigned yet
          setRole(null);
          setIsSuperAdmin(false);
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

  const canSeeFinancials = isSuperAdmin || role === 'admin' || role === 'management' || role === 'finance';

  return (
    <UserRoleContext.Provider value={{ 
      role, 
      isSuperAdmin, 
      isLoading, 
      colleagueId,
      canSeeFinancials,
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
