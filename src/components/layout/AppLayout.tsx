import { SidebarProvider, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { DemoUserSwitcher } from './DemoUserSwitcher';
import { MobileBottomNav } from './MobileBottomNav';
import { NotificationsDropdown } from '@/components/notifications/NotificationsDropdown';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
// TEMPORARILY DISABLED - Supabase dependencies
// import { useAuth } from '@/hooks/useAuth';
// import { LogOut } from 'lucide-react';
// import { Avatar, AvatarFallback } from '@/components/ui/avatar';
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuLabel,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from '@/components/ui/dropdown-menu';
// import { toast } from 'sonner';

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

// TEMPORARILY DISABLED - UserMenu component (requires Supabase auth)
// function UserMenu() {
//   const { user, signOut } = useAuth();
//   ...
// }

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
              {/* TEMPORARILY DISABLED - UserMenu */}
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
