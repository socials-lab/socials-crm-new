import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  MoreHorizontal, UserPlus, ShieldCheck, Pencil, Trash2, ExternalLink, UserX, Link2, Unlink,
  LayoutDashboard, Target, Building2, Users, Briefcase, ClipboardList, 
  FileText, Sparkles, Settings, BarChart3, Layers, ChevronDown, Wallet
} from 'lucide-react';
import { crmUsers, colleagues } from '@/data/mockData';
import { CRMUser, AppPage } from '@/types/crm';
import { AddCRMUserDialog } from './AddCRMUserDialog';
import { EditUserPermissionsDialog } from './EditUserPermissionsDialog';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Page icon mapping
const pageIcons: Record<AppPage, React.ElementType> = {
  dashboard: LayoutDashboard,
  leads: Target,
  clients: Building2,
  contacts: Users,
  engagements: Briefcase,
  extra_work: ClipboardList,
  invoicing: FileText,
  creative_boost: Sparkles,
  services: Layers,
  colleagues: Users,
  analytics: BarChart3,
  settings: Settings,
};

const pageLabels: Record<AppPage, string> = {
  dashboard: 'Přehled',
  leads: 'Leady',
  clients: 'Klienti',
  contacts: 'Kontakty',
  engagements: 'Zakázky',
  extra_work: 'Vícepráce',
  invoicing: 'Fakturace',
  creative_boost: 'Creative Boost',
  services: 'Služby',
  colleagues: 'Kolegové',
  analytics: 'Analytika',
  settings: 'Nastavení',
};

export function UserManagement() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<CRMUser[]>(crmUsers);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<CRMUser>(crmUsers[0]);

  const getLinkedColleague = (colleagueId: string | null) => {
    if (!colleagueId) return null;
    return colleagues.find(c => c.id === colleagueId) || null;
  };

  // Get colleagues that are not already linked to any user
  const getAvailableColleagues = (currentUserId: string) => {
    const linkedColleagueIds = users
      .filter(u => u.id !== currentUserId && u.colleague_id)
      .map(u => u.colleague_id);
    return colleagues.filter(c => !linkedColleagueIds.includes(c.id) && c.status === 'active');
  };

  const handleLinkColleague = (userId: string, colleagueId: string) => {
    const colleague = colleagues.find(c => c.id === colleagueId);
    setUsers(prev => prev.map(user => 
      user.id === userId ? { ...user, colleague_id: colleagueId } : user
    ));
    toast.success(`Kolega ${colleague?.full_name} byl propojen`);
  };

  const handleUnlinkColleague = (userId: string) => {
    setUsers(prev => prev.map(user => 
      user.id === userId ? { ...user, colleague_id: null } : user
    ));
    toast.success('Propojení s kolegou bylo zrušeno');
  };

  const handleToggleActive = (userId: string) => {
    setUsers(prev => prev.map(user => 
      user.id === userId ? { ...user, is_active: !user.is_active } : user
    ));
    toast.success('Status uživatele byl změněn');
  };

  const handleEditUser = (user: CRMUser) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  };

  const handleDeleteUser = (userId: string) => {
    setUsers(prev => prev.filter(user => user.id !== userId));
    toast.success('Uživatel byl odstraněn');
  };

  const handleAddUser = (newUser: CRMUser) => {
    setUsers(prev => [...prev, newUser]);
    toast.success('Uživatel byl přidán');
  };

  const handleUpdateUser = (updatedUser: CRMUser) => {
    setUsers(prev => prev.map(user => 
      user.id === updatedUser.id ? updatedUser : user
    ));
    toast.success('Oprávnění byla aktualizována');
  };

  const getRoleBadge = (role: string, isSuperAdmin: boolean) => {
    if (isSuperAdmin) {
      return <Badge className="bg-primary/10 text-primary border-primary/20"><ShieldCheck className="h-3 w-3 mr-1" />Super Admin</Badge>;
    }
    const roleLabels: Record<string, string> = {
      admin: 'Admin',
      management: 'Management',
      project_manager: 'Project Manager',
      specialist: 'Specialista',
      finance: 'Finance',
    };
    return <Badge variant="secondary">{roleLabels[role] || role}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Celkem {users.length} uživatelů, {users.filter(u => u.is_active).length} aktivních
        </p>
        <Button size="sm" onClick={() => setAddDialogOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Přidat uživatele
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Uživatel</TableHead>
              <TableHead>Propojený kolega</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="w-[60px]">Finance</TableHead>
              <TableHead>Oprávnění</TableHead>
              <TableHead>Aktivní</TableHead>
              <TableHead>Poslední přihlášení</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map(user => {
              const linkedColleague = getLinkedColleague(user.colleague_id);
              return (
              <TableRow key={user.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{user.full_name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-2 hover:bg-muted/50 rounded-md px-2 py-1 -ml-2 transition-colors group">
                        {linkedColleague ? (
                          <>
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs">
                              {linkedColleague.full_name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <span className="text-sm text-primary flex items-center gap-1">
                              {linkedColleague.full_name}
                              <ChevronDown className="h-3 w-3 opacity-50" />
                            </span>
                          </>
                        ) : (
                          <div className="flex items-center gap-2 text-muted-foreground text-sm">
                            <UserX className="h-4 w-4" />
                            <span>Nepropojeno</span>
                            <ChevronDown className="h-3 w-3 opacity-50" />
                          </div>
                        )}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56 bg-popover">
                      {linkedColleague && (
                        <>
                          <DropdownMenuItem 
                            onClick={() => navigate(`/colleagues?tab=team&highlight=${linkedColleague.id}`)}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Zobrazit kartu kolegy
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleUnlinkColleague(user.id)}
                            className="text-destructive"
                          >
                            <Unlink className="h-4 w-4 mr-2" />
                            Zrušit propojení
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      <DropdownMenuLabel className="text-xs text-muted-foreground">
                        {linkedColleague ? 'Změnit na:' : 'Propojit s:'}
                      </DropdownMenuLabel>
                      {getAvailableColleagues(user.id).map(colleague => (
                        <DropdownMenuItem 
                          key={colleague.id}
                          onClick={() => handleLinkColleague(user.id, colleague.id)}
                        >
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs mr-2">
                            {colleague.full_name.split(' ').map(n => n[0]).join('')}
                          </div>
                          {colleague.full_name}
                        </DropdownMenuItem>
                      ))}
                      {getAvailableColleagues(user.id).length === 0 && (
                        <div className="px-2 py-1.5 text-xs text-muted-foreground">
                          Žádní dostupní kolegové
                        </div>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
                <TableCell>{getRoleBadge(user.role, user.is_super_admin)}</TableCell>
                <TableCell>
                  {(user.is_super_admin || user.can_see_financials) && (
                    <TooltipProvider delayDuration={100}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="p-1.5 rounded bg-amber-500/10 text-amber-600 inline-flex">
                            <Wallet className="h-4 w-4" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          Má přístup k finančním údajům
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </TableCell>
                <TableCell>
                  <TooltipProvider delayDuration={100}>
                    <div className="flex items-center gap-0.5 flex-wrap max-w-[200px]">
                      {user.is_super_admin ? (
                        <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                          Plný přístup
                        </Badge>
                      ) : (
                        (Object.keys(pageIcons) as AppPage[]).map(page => {
                          const permission = user.page_permissions.find(p => p.page === page);
                          const canView = permission?.can_view || false;
                          const canEdit = permission?.can_edit || false;
                          const Icon = pageIcons[page];
                          
                          if (!canView) return null;
                          
                          return (
                            <Tooltip key={page}>
                              <TooltipTrigger asChild>
                                <div 
                                  className={cn(
                                    "p-1 rounded transition-colors cursor-default",
                                    canEdit 
                                      ? "bg-emerald-500/10 text-emerald-600" 
                                      : "bg-muted text-muted-foreground"
                                  )}
                                >
                                  <Icon className="h-3.5 w-3.5" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs">
                                <p className="font-medium">{pageLabels[page]}</p>
                                <p className="text-muted-foreground">
                                  {canEdit ? 'Může zobrazit a upravovat' : 'Pouze zobrazení'}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          );
                        })
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-6 w-6 ml-1"
                        onClick={() => handleEditUser(user)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                    </div>
                  </TooltipProvider>
                </TableCell>
                <TableCell>
                  <Switch 
                    checked={user.is_active} 
                    onCheckedChange={() => handleToggleActive(user.id)}
                    disabled={user.is_super_admin}
                  />
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {user.last_login 
                    ? format(new Date(user.last_login), 'd. M. yyyy HH:mm', { locale: cs })
                    : 'Nikdy'
                  }
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditUser(user)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Upravit oprávnění
                      </DropdownMenuItem>
                      {!user.is_super_admin && (
                        <DropdownMenuItem 
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Odstranit
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Permission legend */}
      <div className="flex items-center gap-6 text-xs text-muted-foreground pt-2">
        <span className="font-medium">Legenda oprávnění:</span>
        <div className="flex items-center gap-1.5">
          <div className="p-1 rounded bg-emerald-500/10">
            <LayoutDashboard className="h-3 w-3 text-emerald-600" />
          </div>
          <span>Může zobrazit a upravovat</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="p-1 rounded bg-muted">
            <LayoutDashboard className="h-3 w-3 text-muted-foreground" />
          </div>
          <span>Pouze zobrazení</span>
        </div>
      </div>

      <AddCRMUserDialog 
        open={addDialogOpen} 
        onOpenChange={setAddDialogOpen}
        onAdd={handleAddUser}
      />

      <EditUserPermissionsDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        user={selectedUser}
        onSave={handleUpdateUser}
      />
    </div>
  );
}
