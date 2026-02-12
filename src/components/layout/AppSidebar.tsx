import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useUserRole } from '@/hooks/useUserRole';
import socialsLogo from '@/assets/socials-logo.png';

interface NavItem {
  title: string;
  url: string;
  page: string;
  requiresColleague?: boolean;
}

interface NavGroup {
  label: string | null;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: null,
    items: [
      { title: '🏠 Přehled', url: '/', page: 'dashboard' },
      { title: '👤 Můj přehled', url: '/my-work', page: 'my-work', requiresColleague: true },
    ],
  },
  {
    label: 'Obchod',
    items: [
      { title: '🎯 Leady', url: '/leads', page: 'leads' },
      { title: '🏢 Klienti', url: '/clients', page: 'clients' },
      { title: '📇 Kontakty', url: '/contacts', page: 'contacts' },
      { title: '📋 Zakázky', url: '/engagements', page: 'engagements' },
      { title: '📝 Návrhy změn', url: '/modifications', page: 'modifications' },
    ],
  },
  {
    label: 'Práce & dodávka',
    items: [
      { title: '🔧 Vícepráce', url: '/extra-work', page: 'extra-work' },
      { title: '💰 Provize', url: '/upsells', page: 'upsells' },
      { title: '🎨 Creative Boost', url: '/creative-boost', page: 'creative-boost' },
      { title: '📅 Meetingy', url: '/meetings', page: 'meetings' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { title: '🧾 Fakturace', url: '/invoicing', page: 'invoicing' },
      { title: '📦 Služby', url: '/services', page: 'services' },
    ],
  },
  {
    label: 'Tým & interní',
    items: [
      { title: '👥 Kolegové', url: '/colleagues', page: 'colleagues' },
      { title: '🎓 Nábor', url: '/recruitment', page: 'recruitment' },
      { title: '💡 Feedback Zone', url: '/feedback', page: 'feedback' },
      { title: '📚 Akademie', url: '/academy', page: 'academy' },
    ],
  },
  {
    label: 'Reporting',
    items: [
      { title: '📊 Analytika', url: '/analytics', page: 'analytics' },
    ],
  },
];

const managementNavItems = [
  { title: '⚙️ Nastavení', url: '/settings', page: 'settings' },
];

export function AppSidebar() {
  const location = useLocation();
  const { colleagueId, canAccessPage } = useUserRole();
  const { setOpenMobile } = useSidebar();
  
  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };
  
  const handleNavClick = () => {
    setOpenMobile(false);
  };

  const hasColleagueId = !!colleagueId;

  const getVisibleItems = (items: NavItem[]) =>
    items.filter(item => {
      if (item.requiresColleague) return hasColleagueId;
      return canAccessPage(item.page);
    });

  const visibleManagementItems = managementNavItems.filter(item => canAccessPage(item.page));

  const renderNavItem = (item: NavItem) => (
    <SidebarMenuItem key={item.title}>
      <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
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
  );

  return (
    <Sidebar collapsible="offcanvas" className="border-r border-sidebar-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <img src={socialsLogo} alt="Socials" className="h-8 w-auto max-w-[120px] object-contain" />
          <span className="text-xs font-medium text-sidebar-foreground/60 uppercase tracking-wider">CRM</span>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        {navGroups.map((group, idx) => {
          const visibleItems = getVisibleItems(group.items);
          if (visibleItems.length === 0) return null;

          return (
            <SidebarGroup key={group.label ?? idx} className={idx > 0 ? 'pt-2 border-t border-sidebar-border/50' : ''}>
              {group.label && (
                <SidebarGroupLabel className="text-[11px] uppercase tracking-wider text-sidebar-foreground/50 px-3 pb-1">
                  {group.label}
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleItems.map(renderNavItem)}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}

        {visibleManagementItems.length > 0 && (
          <SidebarGroup className="mt-auto pt-2 border-t border-sidebar-border/50">
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleManagementItems.map(renderNavItem)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
