import { useState, useEffect } from 'react';
import { User, Shield, Briefcase, Calculator, Palette, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { crmUsers, getCurrentCRMUser, setCurrentDemoUser } from '@/data/mockData';
import type { CRMUser } from '@/types/crm';
import { cn } from '@/lib/utils';

const roleIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  admin: Shield,
  management: Briefcase,
  project_manager: User,
  specialist: Palette,
  finance: Calculator,
};

const roleLabels: Record<string, string> = {
  admin: 'Admin',
  management: 'Management',
  project_manager: 'Project Manager',
  specialist: 'Specialista',
  finance: 'Finance',
};

const roleColors: Record<string, string> = {
  admin: 'bg-red-500/10 text-red-600 border-red-500/20',
  management: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  project_manager: 'bg-green-500/10 text-green-600 border-green-500/20',
  specialist: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  finance: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
};

interface DemoUserSwitcherProps {
  onUserChange?: () => void;
}

export function DemoUserSwitcher({ onUserChange }: DemoUserSwitcherProps) {
  const [currentUser, setCurrentUser] = useState<CRMUser | null>(getCurrentCRMUser());
  
  const handleUserChange = (userId: string) => {
    setCurrentDemoUser(userId);
    setCurrentUser(getCurrentCRMUser());
    onUserChange?.();
    // Force page reload to apply new permissions
    window.location.reload();
  };

  const activeUsers = crmUsers.filter(u => u.is_active);
  const RoleIcon = currentUser ? roleIcons[currentUser.role] || User : User;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 h-9">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium">
            {currentUser?.full_name.split(' ').map(n => n[0]).join('') || '?'}
          </div>
          <div className="hidden sm:flex flex-col items-start">
            <span className="text-xs font-medium leading-none">{currentUser?.full_name || 'Nepřihlášen'}</span>
            <span className="text-[10px] text-muted-foreground leading-none mt-0.5">
              {currentUser?.is_super_admin ? 'Super Admin' : roleLabels[currentUser?.role || '']}
            </span>
          </div>
          <ChevronDown className="h-3.5 w-3.5 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-2">
          <User className="h-4 w-4" />
          Demo přepínač uživatelů
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {activeUsers.map((user) => {
          const Icon = roleIcons[user.role] || User;
          const isSelected = currentUser?.id === user.id;
          
          return (
            <DropdownMenuItem
              key={user.id}
              onClick={() => handleUserChange(user.id)}
              className={cn(
                "flex items-center gap-3 cursor-pointer",
                isSelected && "bg-muted"
              )}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium shrink-0">
                {user.full_name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">{user.full_name}</span>
                  {user.is_super_admin && (
                    <Badge variant="outline" className="text-[10px] h-4 px-1 bg-red-500/10 text-red-600 border-red-500/20">
                      Super
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Icon className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{roleLabels[user.role]}</span>
                </div>
              </div>
              {isSelected && (
                <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
              )}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5 text-[10px] text-muted-foreground">
          Přepnutí uživatele obnoví stránku pro aplikaci oprávnění
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
