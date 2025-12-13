import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { getCurrentCRMUser } from '@/data/mockData';
import type { AppPage } from '@/types/crm';
import { Loader2 } from 'lucide-react';

// Map URL paths to AppPage types
const pathToPageMap: Record<string, AppPage> = {
  '/': 'dashboard',
  '/my-work': 'dashboard', // My Work uses dashboard permission or requires colleague
  '/leads': 'leads',
  '/clients': 'clients',
  '/contacts': 'contacts',
  '/engagements': 'engagements',
  '/extra-work': 'extra_work',
  '/invoicing': 'invoicing',
  '/creative-boost': 'creative_boost',
  '/services': 'services',
  '/colleagues': 'colleagues',
  '/analytics': 'analytics',
  '/settings': 'settings',
};

interface RouteGuardProps {
  children: React.ReactNode;
}

export function RouteGuard({ children }: RouteGuardProps) {
  const location = useLocation();
  const { user, loading } = useAuth();
  const currentPath = location.pathname;

  // Show loading while checking auth
  if (loading) {
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

  // For now, use mock CRM user for permissions (will be replaced with real DB data later)
  const currentUser = getCurrentCRMUser();

  // If no CRM user profile, allow access (new user)
  if (!currentUser) {
    return <>{children}</>;
  }

  // Super admins have access to everything
  if (currentUser.is_super_admin) {
    return <>{children}</>;
  }

  // Special handling for /my-work - requires colleague_id
  if (currentPath === '/my-work') {
    if (!currentUser.colleague_id) {
      return <Navigate to="/" replace />;
    }
    return <>{children}</>;
  }

  // Get the required page permission for this path
  const requiredPage = pathToPageMap[currentPath];

  // If path not in map, allow access (unknown routes handled by NotFound)
  if (!requiredPage) {
    return <>{children}</>;
  }

  // Dashboard is always accessible
  if (requiredPage === 'dashboard') {
    return <>{children}</>;
  }

  // Check if user has permission to view this page
  const permission = currentUser.page_permissions.find(p => p.page === requiredPage);
  const canView = permission?.can_view === true;

  if (!canView) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
