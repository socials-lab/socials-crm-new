import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSidebar } from '@/components/ui/sidebar';
import { useUserRole } from '@/hooks/useUserRole';

// Main navigation items for bottom bar (max 5 for usability)
const bottomNavItems = [
  { title: 'Přehled', emoji: '🏠', url: '/', page: 'dashboard' },
  { title: 'Leady', emoji: '🎯', url: '/leads', page: 'leads' },
  { title: 'Zakázky', emoji: '📋', url: '/engagements', page: 'engagements' },
  { title: 'Klienti', emoji: '🏢', url: '/clients', page: 'clients' },
];

export function MobileBottomNav() {
  const location = useLocation();
  const isMobile = useIsMobile();
  const { toggleSidebar } = useSidebar();
  const { isSuperAdmin } = useUserRole();
  
  // Only show on mobile
  if (!isMobile) return null;
  
  // For now, allow all pages (role-based permissions will be implemented later)
  const canViewPage = (_pageName: string): boolean => {
    return true;
  };
  
  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  // Filter items based on permissions
  const visibleItems = bottomNavItems.filter(item => canViewPage(item.page));

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t safe-area-bottom md:hidden">
      <div className="flex items-center justify-around h-16">
        {visibleItems.map((item) => {
          const active = isActive(item.url);
          
          return (
            <NavLink
              key={item.url}
              to={item.url}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full px-2 transition-colors touch-manipulation',
                active 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <span className="text-xl mb-0.5">{item.emoji}</span>
              <span className={cn(
                'text-[10px] font-medium truncate',
                active && 'text-primary'
              )}>
                {item.title}
              </span>
            </NavLink>
          );
        })}
        
        {/* More button to open sidebar */}
        <button
          onClick={toggleSidebar}
          className="flex flex-col items-center justify-center flex-1 h-full px-2 transition-colors touch-manipulation text-muted-foreground hover:text-foreground"
        >
          <span className="text-xl mb-0.5">☰</span>
          <span className="text-[10px] font-medium truncate">
            Více
          </span>
        </button>
      </div>
    </nav>
  );
}
