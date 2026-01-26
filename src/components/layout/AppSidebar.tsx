import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useUserRole } from '@/hooks/useUserRole';
import socialsLogo from '@/assets/socials-logo.png';

const mainNavItems = [
  // Osobní přehledy
  { title: '🏠 Přehled', url: '/', page: 'dashboard' },
  { title: '👤 Můj přehled', url: '/my-work', page: 'my-work', requiresColleague: true },
  // Obchodní proces
  { title: '🎯 Leady', url: '/leads', page: 'leads' },
  { title: '🏢 Klienti', url: '/clients', page: 'clients' },
  { title: '📇 Kontakty', url: '/contacts', page: 'contacts' },
  { title: '📋 Zakázky', url: '/engagements', page: 'engagements' },
  { title: '✏️ Úpravy zakázek', url: '/modifications', page: 'modifications' },
  // Práce & dodávka
  { title: '🔧 Vícepráce', url: '/extra-work', page: 'extra-work' },
  { title: '💰 Provize', url: '/upsells', page: 'upsells' },
  { title: '🎨 Creative Boost', url: '/creative-boost', page: 'creative-boost' },
  { title: '📅 Meetingy', url: '/meetings', page: 'meetings' },
  // Finance & služby
  { title: '🧾 Fakturace', url: '/invoicing', page: 'invoicing' },
  { title: '📦 Služby', url: '/services', page: 'services' },
  // Tým & interní
  { title: '👥 Kolegové', url: '/colleagues', page: 'colleagues' },
  { title: '🎓 Nábor', url: '/recruitment', page: 'recruitment' },
  { title: '💡 Feedback Zone', url: '/feedback', page: 'feedback' },
  // Reporting
  { title: '📊 Analytika', url: '/analytics', page: 'analytics' },
];

const managementNavItems = [
  { title: '⚙️ Nastavení', url: '/settings', page: 'settings' },
];

export function AppSidebar() {
  const location = useLocation();
  const { isSuperAdmin, colleagueId, canAccessPage } = useUserRole();
  const { setOpenMobile } = useSidebar();
  
  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };
  
  // Close mobile menu when navigating
  const handleNavClick = () => {
    setOpenMobile(false);
  };

  const hasColleagueId = !!colleagueId;
  
  // Check if user can view a specific page based on allowed_pages
  const canViewPage = (pageName: string): boolean => {
    return canAccessPage(pageName);
  };
  
  // Filter nav items based on user permissions
  const visibleNavItems = mainNavItems.filter(item => {
    // "Můj přehled" is always visible for users with colleague_id (no permission check needed)
    if ('requiresColleague' in item && item.requiresColleague) {
      return hasColleagueId;
    }
    // Check page permission for other pages
    return canViewPage(item.page);
  });
  
  // Filter management items based on permissions
  const visibleManagementItems = managementNavItems.filter(item => canViewPage(item.page));

  return (
    <Sidebar collapsible="offcanvas" className="border-r border-sidebar-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <img 
            src={socialsLogo} 
            alt="Socials" 
            className="h-8 w-auto max-w-[120px] object-contain"
          />
          <span className="text-xs font-medium text-sidebar-foreground/60 uppercase tracking-wider">CRM</span>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <NavLink
                      to={item.url}
                      onClick={handleNavClick}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-3 md:py-2.5 text-sidebar-foreground/80 transition-all hover:bg-sidebar-accent hover:text-sidebar-foreground touch-manipulation',
                        isActive(item.url) && 'bg-sidebar-accent text-sidebar-foreground font-medium'
                      )}
                    >
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {visibleManagementItems.length > 0 && (
          <SidebarGroup className="mt-auto">
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleManagementItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.url)}
                      tooltip={item.title}
                    >
                      <NavLink
                        to={item.url}
                        onClick={handleNavClick}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-3 md:py-2.5 text-sidebar-foreground/80 transition-all hover:bg-sidebar-accent hover:text-sidebar-foreground touch-manipulation',
                          isActive(item.url) && 'bg-sidebar-accent text-sidebar-foreground font-medium'
                        )}
                      >
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

    </Sidebar>
  );
}
