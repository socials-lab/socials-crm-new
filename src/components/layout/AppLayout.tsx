import { SidebarProvider, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { DemoUserSwitcher } from './DemoUserSwitcher';
import { MobileBottomNav } from './MobileBottomNav';
import { NotificationsDropdown } from '@/components/notifications/NotificationsDropdown';
import { Outlet } from 'react-router-dom';
import { Menu, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

function MobileMenuButton() {
  const { toggleSidebar, isMobile } = useSidebar();
  
  if (!isMobile) return null;
  
  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className="h-9 w-9 md:hidden"
      onClick={toggleSidebar}
    >
      <Menu className="h-5 w-5" />
      <span className="sr-only">Otevřít menu</span>
    </Button>
  );
}

function UserMenu() {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    toast.success('Odhlášeno');
  };

  const getInitials = () => {
    if (!user) return '?';
    const meta = user.user_metadata;
    if (meta?.first_name && meta?.last_name) {
      return `${meta.first_name[0]}${meta.last_name[0]}`.toUpperCase();
    }
    return user.email?.[0]?.toUpperCase() || '?';
  };

  const getDisplayName = () => {
    if (!user) return '';
    const meta = user.user_metadata;
    if (meta?.first_name && meta?.last_name) {
      return `${meta.first_name} ${meta.last_name}`;
    }
    return user.email || '';
  };

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-popover" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{getDisplayName()}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          🚪 Odhlásit se
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppLayout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top header bar */}
          <header className="flex h-12 shrink-0 items-center justify-between border-b bg-background px-3 md:px-4">
            <div className="flex items-center gap-2">
              <MobileMenuButton />
              <span className="text-sm text-muted-foreground hidden sm:inline">
                Demo mód
              </span>
            </div>
            <div className="flex items-center gap-2">
              <NotificationsDropdown />
              <DemoUserSwitcher />
              <UserMenu />
            </div>
          </header>
          
          {/* Main content - add bottom padding on mobile for bottom nav */}
          <main className="flex-1 overflow-auto bg-background pb-16 md:pb-0">
            <Outlet />
          </main>
          
          {/* Mobile bottom navigation */}
          <MobileBottomNav />
        </div>
      </div>
    </SidebarProvider>
  );
}
