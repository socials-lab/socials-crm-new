import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { withAbortTimeout, withTimeout } from '@/utils/asyncUtils';

type AppRole = Database['public']['Enums']['app_role'];

interface UserRoleContextType {
  role: AppRole | null;
  isSuperAdmin: boolean;
  isLoading: boolean;
  error: string | null;
  colleagueId: string | null;
  isColleagueLoading: boolean;
  canSeeFinancials: boolean;
  canEditAcademy: boolean;
  allowedPages: string[];
  canAccessPage: (page: string) => boolean;
  hasRole: (role: AppRole) => boolean;
  retry: () => void;
}

const UserRoleContext = createContext<UserRoleContextType | undefined>(undefined);

const DEFAULT_PAGES_WITHOUT_EXPLICIT_PERMISSIONS = ['my-work'];

export function UserRoleProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [colleagueId, setColleagueId] = useState<string | null>(null);
  const [isColleagueLoading, setIsColleagueLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [canSeeFinancials, setCanSeeFinancials] = useState(false);
  const [canEditAcademy, setCanEditAcademy] = useState(false);
  const [allowedPages, setAllowedPages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchedUserId, setLastFetchedUserId] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);

  // Use user.id as dependency instead of user object to prevent refetching on token refresh
  const userId = user?.id ?? null;

  useEffect(() => {
    if (authLoading) return;

    if (!userId) {
      setRole(null);
      setIsSuperAdmin(false);
      setColleagueId(null);
      setIsColleagueLoading(false);
      setCanSeeFinancials(false);
      setCanEditAcademy(false);
      setAllowedPages([]);
      setError(null);
      setIsLoading(false);
      setLastFetchedUserId(null);
      return;
    }

    // Skip refetch if we already loaded data for this user
    if (lastFetchedUserId === userId) {
      return;
    }

    const fetchUserRole = async () => {
      function isTimeoutOrAuthError(error: unknown): boolean {
        const message = String((error as { message?: string })?.message ?? '').toLowerCase();
        return (
          message.includes('timeout') ||
          message.includes('abort') ||
          message.includes('jwt') ||
          message.includes('refresh token') ||
          message.includes('session')
        );
      }

      async function ensureSessionReady() {
        const { data: sessionData, error: sessionError } = await withTimeout(
          supabase.auth.getSession(),
          4000,
          'Timeout while checking auth session'
        );

        if (sessionError) {
          throw sessionError;
        }

        if (!sessionData.session) {
          const { data: refreshed, error: refreshError } = await withTimeout(
            supabase.auth.refreshSession(),
            6000,
            'Timeout while refreshing auth session'
          );
          if (refreshError || !refreshed.session) {
            throw refreshError || new Error('Session expired. Please sign in again.');
          }
          return;
        }

        const sessionExpiresAt = sessionData.session.expires_at ?? 0;
        const nowSec = Math.floor(Date.now() / 1000);
        if (sessionExpiresAt - nowSec < 120) {
          const { data: refreshed, error: refreshError } = await withTimeout(
            supabase.auth.refreshSession(),
            6000,
            'Timeout while refreshing auth session'
          );
          if (refreshError || !refreshed.session) {
            throw refreshError || new Error('Session refresh failed');
          }
        }
      }

      async function runWithSessionRecovery<T>(
        queryFactory: (signal: AbortSignal) => Promise<{ data: T | null; error: unknown }>,
        timeoutMs: number,
        timeoutMessage: string
      ): Promise<{ data: T | null; error: unknown }> {
        try {
          return await withAbortTimeout(
            (signal) => queryFactory(signal),
            timeoutMs,
            timeoutMessage
          );
        } catch (error) {
          if (!isTimeoutOrAuthError(error)) {
            throw error;
          }

          await ensureSessionReady();

          return withAbortTimeout(
            (signal) => queryFactory(signal),
            timeoutMs,
            timeoutMessage
          );
        }
      }

      setIsLoading(true);
      setError(null);
      setIsColleagueLoading(true);
      setColleagueId(null);

      // Colleague link is not critical for most routes - load it in background.
      const fetchColleagueLink = async () => {
        try {
          const { data: colleagueData, error: colleagueError } = await runWithSessionRecovery(
            (signal) =>
              supabase
                .from('colleagues')
                .select('id')
                .eq('profile_id', userId)
                .maybeSingle()
                .abortSignal(signal),
            8000,
            'Timeout while loading colleague link'
          );

          if (colleagueError) {
            console.error('Error fetching colleague:', colleagueError);
          }

          setColleagueId(colleagueData?.id || null);
        } catch (error) {
          console.error('Error fetching colleague:', error);
          setColleagueId(null);
        } finally {
          setIsColleagueLoading(false);
        }
      };

      void fetchColleagueLink();

      try {
        await ensureSessionReady();

        // Fetch user role - use raw query to handle both old and new schema
        const { data: roleData, error: roleError } = await runWithSessionRecovery(
          (signal) =>
            supabase
              .from('user_roles')
              .select('*')
              .eq('user_id', userId)
              .maybeSingle()
              .abortSignal(signal),
          8000,
          'Timeout while loading user role'
        );

        if (roleError) {
          const message = (roleError as { message?: string })?.message || 'Failed to load role';
          console.error('Error fetching user role:', roleError);
          setError(message);
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

        setLastFetchedUserId(userId);
      } catch (error) {
        console.error('Error in fetchUserRole:', error);
        setError((error as { message?: string })?.message || 'Failed to load user role');
        setRole(null);
        setIsSuperAdmin(false);
        setCanSeeFinancials(false);
        setCanEditAcademy(false);
        setAllowedPages([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserRole();
  }, [userId, authLoading, lastFetchedUserId, reloadNonce]);

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

  const retry = () => {
    setLastFetchedUserId(null);
    setReloadNonce((prev) => prev + 1);
  };

  return (
    <UserRoleContext.Provider value={{ 
      role, 
      isSuperAdmin, 
      isLoading,
      error,
      colleagueId,
      isColleagueLoading,
      canSeeFinancials,
      canEditAcademy,
      allowedPages,
      canAccessPage,
      hasRole,
      retry
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
