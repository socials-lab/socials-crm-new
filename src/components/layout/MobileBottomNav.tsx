import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSidebar } from '@/components/ui/sidebar';
import { useUserRole } from '@/hooks/useUserRole';
import { LayoutDashboard, Magnet, ClipboardList, Building2, Menu } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const bottomNavItems: { title: string; icon: LucideIcon; url: string; page: string }[] = [
  { title: 'Přehled', icon: LayoutDashboard, url: '/', page: 'dashboard' },
  { title: 'Leady', icon: Magnet, url: '/leads', page: 'leads' },
  { title: 'Zakázky', icon: ClipboardList, url: '/engagements', page: 'engagements' },
  { title: 'Klienti', icon: Building2, url: '/clients', page: 'clients' },
];

export function MobileBottomNav() {
  const location = useLocation();
  const isMobile = useIsMobile();
  const { toggleSidebar } = useSidebar();
  const { canAccessPage } = useUserRole();
  
  if (!isMobile) return null;

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const visibleItems = bottomNavItems.filter(item => canAccessPage(item.page));

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t safe-area-bottom md:hidden">
      <div className="flex items-center justify-around h-14">
        {visibleItems.map((item) => {
          const active = isActive(item.url);
          const Icon = item.icon;

          return (
            <NavLink
              key={item.url}
              to={item.url}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full px-2 transition-colors touch-manipulation',
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-5 w-5 mb-0.5" />
              <span className={cn('text-[10px] font-medium truncate', active && 'text-primary')}>
                {item.title}
              </span>
            </NavLink>
          );
        })}

        <button
          onClick={toggleSidebar}
          className="flex flex-col items-center justify-center flex-1 h-full px-2 transition-colors touch-manipulation text-muted-foreground hover:text-foreground"
        >
          <Menu className="h-5 w-5 mb-0.5" />
          <span className="text-[10px] font-medium truncate">Více</span>
        </button>
      </div>
    </nav>
  );
}
