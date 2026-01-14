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
  // DEV BYPASS: Set super admin role directly
  const [role, setRole] = useState<AppRole | null>('admin');
  const [isSuperAdmin, setIsSuperAdmin] = useState(true);
  const [colleagueId, setColleagueId] = useState<string | null>('dev-colleague');
  const [isLoading, setIsLoading] = useState(false);
  const [canSeeFinancials, setCanSeeFinancials] = useState(true);
  const [allowedPages, setAllowedPages] = useState<string[]>([]);

  useEffect(() => {
    // Role check bypassed for development
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
