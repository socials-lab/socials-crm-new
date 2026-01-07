import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { Loader2 } from 'lucide-react';
import ApprovalPending from '@/pages/ApprovalPending';

// Map routes to page IDs for permission checking
const ROUTE_TO_PAGE: Record<string, string> = {
  '/': 'dashboard',
  '/my-work': 'my-work',
  '/leads': 'leads',
  '/clients': 'clients',
  '/contacts': 'contacts',
  '/engagements': 'engagements',
  '/extra-work': 'extra-work',
  '/creative-boost': 'creative-boost',
  '/meetings': 'meetings',
  '/invoicing': 'invoicing',
  '/services': 'services',
  '/colleagues': 'colleagues',
  '/recruitment': 'recruitment',
  '/feedback': 'feedback',
  '/analytics': 'analytics',
  '/settings': 'settings',
  '/notifications': 'notifications',
};

interface RouteGuardProps {
  children: React.ReactNode;
}

export function RouteGuard({ children }: RouteGuardProps) {
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { isLoading: roleLoading, isSuperAdmin, colleagueId, role, canAccessPage } = useUserRole();
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

  // If authenticated but no role assigned, show approval pending page
  if (!role && !isSuperAdmin) {
    return <ApprovalPending />;
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
  }

  // Check page access based on allowed_pages
  const pageId = ROUTE_TO_PAGE[currentPath];
  if (pageId && !canAccessPage(pageId)) {
    // Redirect to dashboard if no access to this page
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
