import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { Loader2 } from 'lucide-react';

interface RouteGuardProps {
  children: React.ReactNode;
}

export function RouteGuard({ children }: RouteGuardProps) {
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { isLoading: roleLoading, isSuperAdmin, colleagueId } = useUserRole();
  const currentPath = location.pathname;

  // Show loading while checking auth or role
  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If not authenticated, redirect to auth page
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Super admins have access to everything
  if (isSuperAdmin) {
    return <>{children}</>;
  }

  // Special handling for /my-work - requires colleague_id
  if (currentPath === '/my-work') {
    if (!colleagueId) {
      return <Navigate to="/" replace />;
    }
    return <>{children}</>;
  }

  // For now, allow all authenticated users access to all pages
  // Role-based page permissions will be implemented later
  return <>{children}</>;
}
