import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, UserPlus, ShieldCheck, ExternalLink, UserX, Pencil } from 'lucide-react';
import { useCRMData } from '@/hooks/useCRMData';
import { supabase } from '@/integrations/supabase/client';
import { AddCRMUserDialog } from './AddCRMUserDialog';
import { EditUserRoleDialog } from './EditUserRoleDialog';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface UserRoleData {
  id: string;
  user_id: string;
  role: AppRole;
  is_super_admin: boolean;
  allowed_pages?: string[];
  can_see_financials?: boolean;
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

export function UserManagement() {
  const navigate = useNavigate();
  const { colleagues } = useCRMData();
  const [userRoles, setUserRoles] = useState<UserRoleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{
    id: string;
    user_id: string;
    role: AppRole;
    is_super_admin: boolean;
    displayName: string;
    email: string;
    allowed_pages?: string[];
    can_see_financials?: boolean;
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
    });
    setEditDialogOpen(true);
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
    </div>
  );
}
