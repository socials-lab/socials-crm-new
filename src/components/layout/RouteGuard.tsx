import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ApprovalPending from '@/pages/ApprovalPending';

// Map routes to page IDs for permission checking
const ROUTE_TO_PAGE: Record<string, string> = {
  '/': 'dashboard',
  '/my-work': 'my-work',
  '/leads': 'leads',
  '/clients': 'clients',
  '/contacts': 'contacts',
  '/engagements': 'engagements',
  '/modifications': 'modifications',
  '/upsells': 'upsells',
  '/extra-work': 'extra-work',
  '/creative-boost': 'creative-boost',
  '/meetings': 'meetings',
  '/invoicing': 'invoicing',
  '/services': 'services',
  '/colleagues': 'colleagues',
  '/recruitment': 'recruitment',
  '/feedback': 'feedback',
  '/academy': 'academy',
  '/analytics': 'analytics',
  '/settings': 'settings',
};

// Pages that are always accessible (don't require permission)
const ALWAYS_ACCESSIBLE = ['/my-profile'];

interface RouteGuardProps {
  children: React.ReactNode;
}

export function RouteGuard({ children }: RouteGuardProps) {
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { isLoading: roleLoading, isSuperAdmin, colleagueId, role, canAccessPage } = useUserRole();
  const currentPath = location.pathname;

  // Track how long we've been loading
  const [loadingTooLong, setLoadingTooLong] = useState(false);
  const isLoading = authLoading || roleLoading;

  useEffect(() => {
    if (!isLoading) {
      setLoadingTooLong(false);
      return;
    }

    // If loading takes more than 10 seconds, show retry option
    const timeout = setTimeout(() => {
      setLoadingTooLong(true);
    }, 10000);

    return () => clearTimeout(timeout);
  }, [isLoading]);

  // Show loading while checking auth or role
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        {loadingTooLong && (
          <div className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">Načítání trvá déle než obvykle...</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Obnovit stránku
            </Button>
          </div>
        )}
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

  // Always accessible pages don't need permission checks
  if (ALWAYS_ACCESSIBLE.includes(currentPath)) {
    return <>{children}</>;
  }

  // Special handling for /my-work - requires colleague_id
  if (currentPath === '/my-work') {
    if (!colleagueId) {
      return <Navigate to="/my-profile" replace />;
    }
  }

  // Check page access based on allowed_pages
  const pageId = ROUTE_TO_PAGE[currentPath];
  if (pageId && !canAccessPage(pageId)) {
    // Redirect to my-profile if no access (avoids loop if dashboard is also blocked)
    return <Navigate to="/my-profile" replace />;
  }

  return <>{children}</>;
}
