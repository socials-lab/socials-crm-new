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
import socialsLogo from '@/assets/socials-logo.svg';
import {
  LayoutDashboard,
  User,
  Target,
  Building2,
  Contact,
  ClipboardList,
  FilePenLine,
  Send,
  Wrench,
  Coins,
  Palette,
  CalendarDays,
  Package,
  Receipt,
  Users,
  GraduationCap,
  Lightbulb,
  BookOpen,
  FileText,
  Bug,
  UserSearch,
  BarChart3,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import { useBugReports } from '@/hooks/useBugReports';

interface NavItem {
  title: string;
  url: string;
  page: string;
  icon: LucideIcon;
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
      { title: 'Přehled', url: '/', page: 'dashboard', icon: LayoutDashboard },
      { title: 'Můj přehled', url: '/my-work', page: 'my-work', icon: User, requiresColleague: true },
      { title: 'Můj profil', url: '/my-profile', page: 'my-profile', icon: User },
    ],
  },
  {
    label: 'Obchod',
    items: [
      { title: 'Leady', url: '/leads', page: 'leads', icon: Target },
      { title: 'Zájemci', url: '/prospects', page: 'prospects', icon: UserSearch },
      { title: 'Klienti', url: '/clients', page: 'clients', icon: Building2 },
      { title: 'Kontakty', url: '/contacts', page: 'contacts', icon: Contact },
      { title: 'Zakázky', url: '/engagements', page: 'engagements', icon: ClipboardList },
      { title: 'Návrhy změn', url: '/modifications', page: 'modifications', icon: FilePenLine },
      { title: 'Rozesílky', url: '/broadcasts', page: 'broadcasts', icon: Send },
    ],
  },
  {
    label: 'Práce & dodávka',
    items: [
      { title: 'Vícepráce', url: '/extra-work', page: 'extra-work', icon: Wrench },
      { title: 'Provize', url: '/upsells', page: 'upsells', icon: Coins },
      { title: 'Creative Boost', url: '/creative-boost', page: 'creative-boost', icon: Palette },
      { title: 'Meetingy', url: '/meetings', page: 'meetings', icon: CalendarDays },
      { title: 'Služby', url: '/services', page: 'services', icon: Package },
    ],
  },
  {
    label: 'Finance',
    items: [
      { title: 'Fakturace', url: '/invoicing', page: 'invoicing', icon: Receipt },
    ],
  },
  {
    label: 'Tým & interní',
    items: [
      { title: 'Kolegové', url: '/colleagues', page: 'colleagues', icon: Users },
      { title: 'Nábor', url: '/recruitment', page: 'recruitment', icon: GraduationCap },
      { title: 'Feedback Zone', url: '/feedback', page: 'feedback', icon: Lightbulb },
      { title: 'Akademie', url: '/academy', page: 'academy', icon: BookOpen },
      { title: 'SOP Databáze', url: '/sop', page: 'sop', icon: FileText },
      { title: 'Bug Reports', url: '/bug-reports', page: 'bug-reports', icon: Bug },
    ],
  },
  {
    label: 'Reporting',
    items: [
      { title: 'Analytika', url: '/analytics', page: 'analytics', icon: BarChart3 },
    ],
  },
];

const managementNavItems: NavItem[] = [
  { title: 'Nastavení', url: '/settings', page: 'settings', icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();
  const { colleagueId, canAccessPage } = useUserRole();
  const { setOpenMobile } = useSidebar();
  const { unresolvedCount } = useBugReports();

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
      if (item.requiresColleague && !hasColleagueId) return false;
      if (item.page === 'my-profile') return true;
      return canAccessPage(item.page);
    });

  const visibleManagementItems = managementNavItems.filter(item => canAccessPage(item.page));

  const renderNavItem = (item: NavItem) => {
    const Icon = item.icon;
    const showBadge = item.page === 'bug-reports' && unresolvedCount > 0;

    return (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
          <NavLink
            to={item.url}
            onClick={handleNavClick}
            className={cn(
              'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-all touch-manipulation',
              isActive(item.url)
                ? 'bg-white/10 font-medium [&>svg]:text-[hsl(82,100%,45%)] text-white'
                : 'text-white/60 hover:bg-white/5 hover:text-white/90'
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="flex-1">{item.title}</span>
            {showBadge && (
              <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                {unresolvedCount}
              </span>
            )}
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar collapsible="offcanvas" className="border-r border-white/10 !bg-[#1a1a1a]">
      <SidebarHeader className="px-4 py-4">
        <div className="flex items-center gap-2">
          <img src={socialsLogo} alt="Socials" className="h-7 w-auto max-w-[110px] object-contain" />
          <span className="text-[10px] font-semibold text-white/40 uppercase tracking-widest">CRM</span>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 [&_*]:!bg-transparent">
        {navGroups.map((group, idx) => {
          const visibleItems = getVisibleItems(group.items);
          if (visibleItems.length === 0) return null;

          return (
            <SidebarGroup key={group.label ?? idx} className={idx > 0 ? 'pt-3 mt-1 border-t border-white/[0.06]' : ''}>
              {group.label && (
                <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-white/30 px-2.5 pb-1 font-medium">
                  {group.label}
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu className="gap-0.5">
                  {visibleItems.map(renderNavItem)}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}

        {visibleManagementItems.length > 0 && (
          <SidebarGroup className="mt-auto pt-3 border-t border-white/[0.06]">
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {visibleManagementItems.map(renderNavItem)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
