import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, UserPlus, ShieldCheck, ExternalLink, UserX, Pencil } from 'lucide-react';
import { TierBadge } from '@/components/shared/TierBadge';
import { useCRMData } from '@/hooks/useCRMData';
import { AddCRMUserDialog } from './AddCRMUserDialog';
import { EditUserRoleDialog } from './EditUserRoleDialog';
import { CreateColleagueForUserDialog } from './CreateColleagueForUserDialog';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import type { PagePermission } from '@/types/crm';

type AppRole = Database['public']['Enums']['app_role'];

interface UserRoleData {
  id: string;
  user_id: string;
  role: AppRole;
  is_super_admin: boolean;
  page_permissions?: PagePermission[];
  can_see_financials?: boolean;
  profile?: {
    id: string;
    email: string | null;
    full_name: string | null;
  } | null;
  colleague?: {
    id: string;
    full_name: string;
    position: string;
  } | null;
}

export function UserManagement() {
  const navigate = useNavigate();
  useCRMData(); // Ensure CRMDataProvider is initialized (needed for CreateColleagueForUserDialog)
  const [userRoles, setUserRoles] = useState<UserRoleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createColleagueDialogOpen, setCreateColleagueDialogOpen] = useState(false);
  const [createColleagueUser, setCreateColleagueUser] = useState<{
    profileId: string;
    email: string;
    fullName: string;
  } | null>(null);
  const [selectedUser, setSelectedUser] = useState<{
    id: string;
    user_id: string;
    role: AppRole;
    is_super_admin: boolean;
    displayName: string;
    email: string;
    page_permissions?: PagePermission[];
    can_see_financials?: boolean;
  } | null>(null);

  const fetchUserRoles = async () => {
    setLoading(true);
    try {
      // Fetch user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('is_active', true);
      
      if (rolesError) {
        throw rolesError;
      }
      
      if (!rolesData || rolesData.length === 0) {
        setUserRoles([]);
        setLoading(false);
        return;
      }

      // Fetch profiles
      const userIds = rolesData.map(r => r.user_id).filter(Boolean) as string[];
      
      const { data: profilesData = [], error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', userIds);
      
      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }

      // Fetch colleagues
      const { data: colleaguesData = [], error: colleaguesError } = await supabase
        .from('colleagues')
        .select('id, full_name, position, profile_id')
        .in('profile_id', userIds);
      
      if (colleaguesError) {
        console.error('Error fetching colleagues:', colleaguesError);
      }

      // Build lookup maps
      const profilesMap = new Map((profilesData || []).map(p => [p.id, p]));
      const colleaguesMap = new Map((colleaguesData || []).map(c => [c.profile_id, c]));

      // Enrich data
      const enrichedData = rolesData.map(role => ({
        ...role,
        profile: profilesMap.get(role.user_id) || null,
        colleague: colleaguesMap.get(role.user_id) || null,
      }));
      
      setUserRoles(enrichedData);
    } catch (err) {
      console.error('Error fetching user roles:', err);
      toast.error('Chyba při načítání uživatelů');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserRoles();
  }, []);

  const handleEditUser = (userRole: UserRoleData) => {
    const displayName = userRole.profile 
      ? (userRole.profile.full_name || userRole.profile.email || 'Neznámý')
      : 'Neznámý';
    
    setSelectedUser({
      id: userRole.id,
      user_id: userRole.user_id,
      role: userRole.role,
      is_super_admin: userRole.is_super_admin || false,
      displayName,
      email: userRole.profile?.email || '',
      page_permissions: userRole.page_permissions || [],
      can_see_financials: userRole.can_see_financials || false,
    });
    setEditDialogOpen(true);
  };

  const getRoleBadge = (role: AppRole, isSuperAdmin: boolean) => {
    if (isSuperAdmin) {
      return <TierBadge icon={<ShieldCheck className="h-3 w-3" />}>Super Admin</TierBadge>;
    }
    const roleLabels: Record<AppRole, string> = {
      admin: 'Admin',
      management: 'Management',
      project_manager: 'Project Manager',
      specialist: 'Specialista',
      finance: 'Finance',
      client: 'Klient',
    };
    return <Badge variant="secondary">{roleLabels[role] || role}</Badge>;
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
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userRoles.map(userRole => {
                const displayName = userRole.profile 
                  ? (userRole.profile.full_name || userRole.profile.email || 'Neznámý')
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
                          {userRole.profile && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 ml-2"
                              onClick={() => {
                                setCreateColleagueUser({
                                  profileId: userRole.profile!.id,
                                  email: userRole.profile!.email || '',
                                  fullName: userRole.profile!.full_name || userRole.profile!.email || 'Neznámý',
                                });
                                setCreateColleagueDialogOpen(true);
                              }}
                            >
                              <UserPlus className="h-3 w-3 mr-1" />
                              Vytvořit
                            </Button>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{getRoleBadge(userRole.role, userRole.is_super_admin || false)}</TableCell>
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
                          {!userRole.colleague && userRole.profile && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => {
                                setCreateColleagueUser({
                                  profileId: userRole.profile!.id,
                                  email: userRole.profile!.email || '',
                                  fullName: userRole.profile!.full_name || userRole.profile!.email || 'Neznámý',
                                });
                                setCreateColleagueDialogOpen(true);
                              }}>
                                <UserPlus className="h-4 w-4 mr-2" />
                                Vytvořit kolegu
                              </DropdownMenuItem>
                            </>
                          )}
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

      {createColleagueUser && (
        <CreateColleagueForUserDialog
          open={createColleagueDialogOpen}
          onOpenChange={setCreateColleagueDialogOpen}
          user={createColleagueUser}
          onSuccess={() => {
            fetchUserRoles();
            setCreateColleagueUser(null);
          }}
        />
      )}
    </div>
  );
}
