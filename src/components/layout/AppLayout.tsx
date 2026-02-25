import { useEffect, useState } from 'react';
import { SidebarProvider, useSidebar } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { NotificationsDropdown } from '@/components/notifications/NotificationsDropdown';
import { Outlet } from 'react-router-dom';
import { Menu, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/components/ui/sonner';

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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const loadAvatar = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Failed to load user avatar:', error);
        return;
      }

      setAvatarUrl(data?.avatar_url ?? null);
    };

    loadAvatar();
  }, [user?.id]);

  if (!user) return null;

  const nameForInitials =
    user.user_metadata?.full_name || user.email?.split('@')[0] || 'Uživatel';

  const initials = nameForInitials
    .split(' ')
    .map((part: string) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleSignOut = async () => {
    await signOut();
    toast.success('Úspěšně odhlášeno');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            {avatarUrl ? <AvatarImage src={avatarUrl} alt="Profilová fotka" /> : null}
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">Můj účet</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Odhlásit se
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
            </div>
            <div className="flex items-center gap-2">
              <NotificationsDropdown />
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
