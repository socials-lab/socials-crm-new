import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, UserPlus, ShieldCheck, ExternalLink, UserX, Pencil, History } from 'lucide-react';
import { useCRMData } from '@/hooks/useCRMData';
import { supabase } from '@/integrations/supabase/client';
import { AddCRMUserDialog } from './AddCRMUserDialog';
import { EditUserRoleDialog } from './EditUserRoleDialog';
import { UserActivityLogSheet } from './UserActivityLogSheet';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface UserRoleData {
  id: string;
  user_id: string;
  role: AppRole;
  is_super_admin: boolean;
  allowed_pages?: string[];
  can_see_financials?: boolean;
  can_edit_academy?: boolean;
  profile?: {
    id: string;
    email: string | null;
    first_name: string | null;
    last_name: string | null;
  } | null;
  colleague?: {
    id: string;
    full_name: string;
    position: string;
  } | null;
}

interface AuthInfo {
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  created_at: string;
}

export function UserManagement() {
  const navigate = useNavigate();
  const { colleagues } = useCRMData();
  const [userRoles, setUserRoles] = useState<UserRoleData[]>([]);
  const [authInfoMap, setAuthInfoMap] = useState<Record<string, AuthInfo>>({});
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [activityLogOpen, setActivityLogOpen] = useState(false);
  const [activityLogUser, setActivityLogUser] = useState<{ userId: string; name: string } | null>(null);
  const [selectedUser, setSelectedUser] = useState<{
    id: string;
    user_id: string;
    role: AppRole;
    is_super_admin: boolean;
    displayName: string;
    email: string;
    allowed_pages?: string[];
    can_see_financials?: boolean;
    can_edit_academy?: boolean;
  } | null>(null);

  const fetchUserRoles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('user_roles')
      .select('*');
    
    if (error) {
      console.error('Error fetching user roles:', error);
      toast.error('Chyba při načítání uživatelů');
      setLoading(false);
      return;
    }

    const enrichedData = await Promise.all((data || []).map(async (role) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name')
        .eq('id', role.user_id)
        .single();
      
      const { data: colleague } = await supabase
        .from('colleagues')
        .select('id, full_name, position')
        .eq('profile_id', role.user_id)
        .maybeSingle();
      
      return { ...role, profile, colleague };
    }));
    setUserRoles(enrichedData);

    // Fetch auth info via edge function
    const userIds = enrichedData.map(r => r.user_id);
    if (userIds.length > 0) {
      try {
        const { data: authData, error: authError } = await supabase.functions.invoke('get-users-auth-info', {
          body: { user_ids: userIds },
        });
        if (!authError && authData) {
          setAuthInfoMap(authData);
        }
      } catch (e) {
        console.error('Error fetching auth info:', e);
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchUserRoles();
  }, []);

  const handleEditUser = (userRole: UserRoleData) => {
    const displayName = userRole.profile 
      ? `${userRole.profile.first_name || ''} ${userRole.profile.last_name || ''}`.trim() || userRole.profile.email || 'Neznámý'
      : 'Neznámý';
    
    setSelectedUser({
      id: userRole.id,
      user_id: userRole.user_id,
      role: userRole.role,
      is_super_admin: userRole.is_super_admin || false,
      displayName,
      email: userRole.profile?.email || '',
      allowed_pages: userRole.allowed_pages || [],
      can_see_financials: userRole.can_see_financials || false,
      can_edit_academy: userRole.can_edit_academy || false,
    });
    setEditDialogOpen(true);
  };

  const handleOpenActivityLog = (userRole: UserRoleData) => {
    const displayName = userRole.profile 
      ? `${userRole.profile.first_name || ''} ${userRole.profile.last_name || ''}`.trim() || userRole.profile.email || 'Neznámý'
      : 'Neznámý';
    setActivityLogUser({ userId: userRole.user_id, name: displayName });
    setActivityLogOpen(true);
  };

  const getRoleBadge = (role: AppRole, isSuperAdmin: boolean) => {
    if (isSuperAdmin) {
      return <Badge className="bg-primary/10 text-primary border-primary/20"><ShieldCheck className="h-3 w-3 mr-1" />Super Admin</Badge>;
    }
    const roleLabels: Record<AppRole, string> = {
      admin: 'Admin',
      management: 'Management',
      project_manager: 'Project Manager',
      specialist: 'Specialista',
      finance: 'Finance',
    };
    return <Badge variant="secondary">{roleLabels[role] || role}</Badge>;
  };

  const getLoginStatusBadge = (userId: string) => {
    const info = authInfoMap[userId];
    if (!info) return <Badge variant="outline" className="text-xs">—</Badge>;
    if (info.last_sign_in_at) {
      return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs">Aktivní</Badge>;
    }
    return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs">Čeká na přijetí</Badge>;
  };

  const getLastLoginText = (userId: string) => {
    const info = authInfoMap[userId];
    if (!info?.last_sign_in_at) return '—';
    return format(new Date(info.last_sign_in_at), 'd. M. yyyy HH:mm', { locale: cs });
  };

  if (loading) {
    return <div className="flex items-center justify-center py-8"><p className="text-muted-foreground">Načítání...</p></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">Celkem {userRoles.length} uživatelů s přístupem</p>
        <Button size="sm" onClick={() => setAddDialogOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Pozvat uživatele
        </Button>
      </div>

      {userRoles.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>Žádní uživatelé s rolí.</p>
          <p className="text-sm">Přidejte prvního uživatele pomocí tlačítka výše.</p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Uživatel</TableHead>
                <TableHead>Propojený kolega</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Poslední přihlášení</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userRoles.map(userRole => {
                const displayName = userRole.profile 
                  ? `${userRole.profile.first_name || ''} ${userRole.profile.last_name || ''}`.trim() || userRole.profile.email 
                  : 'Neznámý';
                
                return (
                  <TableRow key={userRole.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{displayName}</p>
                        <p className="text-xs text-muted-foreground">{userRole.profile?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {userRole.colleague ? (
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs">
                            {userRole.colleague.full_name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span className="text-sm">{userRole.colleague.full_name}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                          <UserX className="h-4 w-4" />
                          <span>Nepropojeno</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{getRoleBadge(userRole.role, userRole.is_super_admin || false)}</TableCell>
                    <TableCell>{getLoginStatusBadge(userRole.user_id)}</TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{getLastLoginText(userRole.user_id)}</span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditUser(userRole)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Upravit roli
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOpenActivityLog(userRole)}>
                            <History className="h-4 w-4 mr-2" />
                            Log aktivity
                          </DropdownMenuItem>
                          {userRole.colleague && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => navigate(`/colleagues?tab=team&highlight=${userRole.colleague!.id}`)}>
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Zobrazit kartu kolegy
                              </DropdownMenuItem>
                            </>
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
      )}

      <AddCRMUserDialog 
        open={addDialogOpen} 
        onOpenChange={setAddDialogOpen}
        onAdd={() => {
          toast.success('Pozvánka odeslána');
          setAddDialogOpen(false);
          fetchUserRoles();
        }}
      />

      <EditUserRoleDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        user={selectedUser}
        onSave={fetchUserRoles}
      />

      {activityLogUser && (
        <UserActivityLogSheet
          open={activityLogOpen}
          onOpenChange={setActivityLogOpen}
          userId={activityLogUser.userId}
          userName={activityLogUser.name}
        />
      )}
    </div>
  );
}
