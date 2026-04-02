import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, UserPlus, ShieldCheck, ExternalLink, UserX, Pencil, User, Clock, CheckCircle2, RefreshCw, XCircle, UserMinus, UserCheck, Loader2 } from 'lucide-react';
import { TierBadge } from '@/components/shared/TierBadge';
import { useCRMData } from '@/hooks/useCRMData';
import { AddCRMUserDialog } from './AddCRMUserDialog';
import { EditUserRoleDialog } from './EditUserRoleDialog';
import { EditUserNameDialog } from './EditUserNameDialog';
import { CreateColleagueForUserDialog } from './CreateColleagueForUserDialog';
import { ApproveUserDialog } from './ApproveUserDialog';
import { TerminateUserDialog, type LifecycleMode } from './TerminateUserDialog';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useImpersonation } from '@/hooks/useImpersonation';
import type { Database } from '@/integrations/supabase/types';
import type { PagePermission } from '@/types/crm';

type AppRole = Database['public']['Enums']['app_role'];

interface UserRoleData {
  id: string;
  user_id: string;
  role: AppRole;
  is_super_admin: boolean;
  is_active?: boolean | null;
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

interface PendingUser {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
}

export function UserManagement() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isSuperAdmin: isViewerSuperAdmin } = useUserRole();
  const { startImpersonation, impersonatedUserId, isImpersonationLoading } = useImpersonation();
  useCRMData(); // Ensure CRMDataProvider is initialized (needed for CreateColleagueForUserDialog)
  const [activeUserRoles, setActiveUserRoles] = useState<UserRoleData[]>([]);
  const [inactiveUserRoles, setInactiveUserRoles] = useState<UserRoleData[]>([]);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editNameDialogOpen, setEditNameDialogOpen] = useState(false);
  const [editNameUser, setEditNameUser] = useState<{
    userId: string;
    currentName: string;
    email: string;
  } | null>(null);
  const [createColleagueDialogOpen, setCreateColleagueDialogOpen] = useState(false);
  const [createColleagueUser, setCreateColleagueUser] = useState<{
    profileId: string;
    email: string;
    fullName: string;
  } | null>(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [approveUser, setApproveUser] = useState<PendingUser | null>(null);
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
  const [lifecycleDialogOpen, setLifecycleDialogOpen] = useState(false);
  const [lifecycleMode, setLifecycleMode] = useState<LifecycleMode>('terminate');
  const [lifecycleUser, setLifecycleUser] = useState<UserRoleData | null>(null);
  const [isStartingImpersonationFor, setIsStartingImpersonationFor] = useState<string | null>(null);

  const fetchUserRoles = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    // Create timeout promise
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout: načítání trvá příliš dlouho')), 15000)
    );

    const fetchData = async () => {
      // Fetch ALL user roles (active and inactive)
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) {
        throw rolesError;
      }

      const allUserIdsWithRole = (rolesData || []).map(r => r.user_id).filter(Boolean) as string[];

      // Fetch ALL profiles to find pending ones (no role at all)
      const { data: allProfiles = [], error: allProfilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, created_at');

      if (allProfilesError) {
        console.error('Error fetching all profiles:', allProfilesError);
      }

      const userIdsWithRoleSet = new Set(allUserIdsWithRole);
      const pending = (allProfiles || []).filter(p => !userIdsWithRoleSet.has(p.id));
      setPendingUsers(pending);

      if (!rolesData || rolesData.length === 0) {
        setActiveUserRoles([]);
        setInactiveUserRoles([]);
        return;
      }

      // Fetch profiles for users with roles
      const { data: profilesData = [], error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', allUserIdsWithRole);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }

      // Fetch colleagues
      const { data: colleaguesData = [], error: colleaguesError } = await supabase
        .from('colleagues')
        .select('id, full_name, position, profile_id')
        .in('profile_id', allUserIdsWithRole);

      if (colleaguesError) {
        console.error('Error fetching colleagues:', colleaguesError);
      }

      const profilesMap = new Map((profilesData || []).map(p => [p.id, p]));
      const colleaguesMap = new Map((colleaguesData || []).map(c => [c.profile_id, c]));

      const enrichedData = rolesData.map(role => ({
        ...role,
        profile: profilesMap.get(role.user_id) || null,
        colleague: colleaguesMap.get(role.user_id) || null,
      }));

      const active = enrichedData.filter(r => r.is_active !== false);
      const inactive = enrichedData.filter(r => r.is_active === false);
      setActiveUserRoles(active);
      setInactiveUserRoles(inactive);
    };

    try {
      await Promise.race([fetchData(), timeout]);
    } catch (err) {
      console.error('Error fetching user roles:', err);
      const errorMessage = err instanceof Error ? err.message : 'Nepodařilo se načíst uživatele';
      setLoadError(errorMessage);
      toast.error('Chyba při načítání uživatelů');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserRoles();

    const channel = supabase
      .channel('user-management-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'colleagues' }, () => {
        fetchUserRoles();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_roles' }, () => {
        fetchUserRoles();
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [fetchUserRoles]);

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

  function handleOpenColleagueCard(colleagueId: string) {
    if (!colleagueId) {
      toast.error('Chybí ID kolegy pro otevření karty');
      return;
    }

    const targetPath = `/colleagues?tab=team&highlight=${colleagueId}`;
    console.info('[UserManagement] Open colleague card requested', {
      colleagueId,
      from: `${window.location.pathname}${window.location.search}`,
      targetPath,
    });

    navigate(targetPath);

    // Debug + hard fallback if SPA navigation silently fails.
    window.setTimeout(() => {
      const currentPath = `${window.location.pathname}${window.location.search}`;
      if (currentPath !== targetPath) {
        console.warn('[UserManagement] SPA navigate did not reach target, using hard redirect', {
          currentPath,
          targetPath,
        });
        toast.error('Navigace selhala, otevírám kartu natvrdo');
        window.location.assign(targetPath);
      }
    }, 120);
  }

  async function handleStartImpersonation(targetUserId: string) {
    try {
      setIsStartingImpersonationFor(targetUserId);
      await startImpersonation(targetUserId);
      toast.success('Impersonace je aktivní.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nepodařilo se spustit impersonaci.';
      toast.error(message);
    } finally {
      setIsStartingImpersonationFor(null);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-8"><p className="text-muted-foreground">Načítání...</p></div>;
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        <XCircle className="h-10 w-10 text-destructive/50" />
        <p className="text-muted-foreground text-center">{loadError}</p>
        <Button variant="outline" onClick={fetchUserRoles}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Zkusit znovu
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Pending users section */}
      {pendingUsers.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-amber-200 dark:border-amber-900">
            <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              Čekají na schválení ({pendingUsers.length})
            </p>
          </div>
          <div className="divide-y divide-amber-200 dark:divide-amber-900">
            {pendingUsers.map(pending => (
              <div key={pending.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="font-medium text-sm">{pending.full_name || pending.email || 'Neznámý'}</p>
                  {pending.full_name && (
                    <p className="text-xs text-muted-foreground">{pending.email}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Registrace: {new Date(pending.created_at).toLocaleDateString('cs-CZ')}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    setApproveUser(pending);
                    setApproveDialogOpen(true);
                  }}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Schválit
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">Celkem {activeUserRoles.length} uživatelů s přístupem</p>
        <Button size="sm" onClick={() => setAddDialogOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Pozvat uživatele
        </Button>
      </div>

      {activeUserRoles.length === 0 ? (
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
              {activeUserRoles.map(userRole => {
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
                          {userRole.profile && (
                            <DropdownMenuItem onClick={() => {
                              setEditNameUser({
                                userId: userRole.user_id,
                                currentName: userRole.profile!.full_name || '',
                                email: userRole.profile!.email || '',
                              });
                              setEditNameDialogOpen(true);
                            }}>
                              <User className="h-4 w-4 mr-2" />
                              Upravit jméno
                            </DropdownMenuItem>
                          )}
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
                              <DropdownMenuItem onSelect={() => handleOpenColleagueCard(userRole.colleague!.id)}>
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Zobrazit kartu kolegy
                              </DropdownMenuItem>
                            </>
                          )}
                          {isViewerSuperAdmin && !userRole.is_super_admin && userRole.user_id !== user?.id && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                disabled={isStartingImpersonationFor === userRole.user_id || isImpersonationLoading}
                                onClick={() => handleStartImpersonation(userRole.user_id)}
                              >
                                {isStartingImpersonationFor === userRole.user_id || isImpersonationLoading ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <UserCheck className="h-4 w-4 mr-2" />
                                )}
                                {isStartingImpersonationFor === userRole.user_id || isImpersonationLoading
                                  ? 'Spouštím impersonaci...'
                                  : impersonatedUserId === userRole.user_id
                                    ? 'Aktuálně impersonujete'
                                    : 'Přihlásit se jako uživatel'}
                              </DropdownMenuItem>
                            </>
                          )}
                          {!userRole.is_super_admin && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => {
                                  setLifecycleUser(userRole);
                                  setLifecycleMode('terminate');
                                  setLifecycleDialogOpen(true);
                                }}
                              >
                                <UserMinus className="h-4 w-4 mr-2" />
                                Ukončit uživatele
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

      {/* Inactive users section */}
      {inactiveUserRoles.length > 0 && (
        <div className="rounded-lg border border-muted">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-muted bg-muted/30">
            <UserMinus className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium text-muted-foreground">
              Ukončení uživatelé ({inactiveUserRoles.length})
            </p>
          </div>
          <div className="divide-y divide-border">
            {inactiveUserRoles.map(userRole => {
              const displayName = userRole.profile
                ? (userRole.profile.full_name || userRole.profile.email || 'Neznámý')
                : 'Neznámý';
              return (
                <div key={userRole.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="font-medium text-sm">{displayName}</p>
                    <p className="text-xs text-muted-foreground">{userRole.profile?.email}</p>
                    {userRole.colleague && (
                      <p className="text-xs text-muted-foreground">
                        {userRole.colleague.full_name} ({userRole.colleague.position})
                      </p>
                    )}
                  </div>
                  {!userRole.is_super_admin && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setLifecycleUser(userRole);
                        setLifecycleMode('restore');
                        setLifecycleDialogOpen(true);
                      }}
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      Obnovit uživatele
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
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

      <EditUserNameDialog
        open={editNameDialogOpen}
        onOpenChange={setEditNameDialogOpen}
        user={editNameUser}
        onSuccess={() => {
          fetchUserRoles();
          setEditNameUser(null);
        }}
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

      <ApproveUserDialog
        open={approveDialogOpen}
        onOpenChange={setApproveDialogOpen}
        user={approveUser}
        onSuccess={() => {
          fetchUserRoles();
          setApproveUser(null);
        }}
      />

      <TerminateUserDialog
        open={lifecycleDialogOpen}
        onOpenChange={(open) => {
          setLifecycleDialogOpen(open);
          if (!open) setLifecycleUser(null);
        }}
        mode={lifecycleMode}
        user={
          lifecycleUser
            ? {
                id: lifecycleUser.id,
                user_id: lifecycleUser.user_id,
                displayName:
                  lifecycleUser.profile?.full_name || lifecycleUser.profile?.email || 'Neznámý',
                email: lifecycleUser.profile?.email || '',
                is_super_admin: lifecycleUser.is_super_admin || false,
                colleague: lifecycleUser.colleague || null,
              }
            : null
        }
        onConfirm={async () => {
          if (!lifecycleUser) return;
          const isTerminate = lifecycleMode === 'terminate';

          const { error: roleError } = await supabase
            .from('user_roles')
            .update({ is_active: !isTerminate })
            .eq('id', lifecycleUser.id);

          if (roleError) {
            toast.error('Chyba při aktualizaci přístupu');
            throw roleError;
          }

          if (lifecycleUser.colleague) {
            const { error: colleagueError } = await supabase
              .from('colleagues')
              .update({ status: isTerminate ? 'left' : 'active' })
              .eq('id', lifecycleUser.colleague.id);

            if (colleagueError) {
              toast.error('Chyba při aktualizaci kolegy');
              throw colleagueError;
            }
          }

          toast.success(isTerminate ? 'Uživatel byl ukončen' : 'Uživatel byl obnoven');
          fetchUserRoles();
        }}
      />
    </div>
  );
}
