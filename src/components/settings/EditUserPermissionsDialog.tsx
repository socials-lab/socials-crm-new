import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { CRMUser, UserRole, PagePermission, AppPage } from '@/types/crm';
import { useCRMData } from '@/hooks/useCRMData';
import { Eye, Pencil, Wallet } from 'lucide-react';

const PAGE_LABELS: Record<AppPage, string> = {
  dashboard: 'Přehled',
  leads: 'Leady',
  clients: 'Klienti',
  contacts: 'Kontakty',
  engagements: 'Engagementy',
  extra_work: 'Vícepráce',
  invoicing: 'Fakturace',
  creative_boost: 'Creative Boost',
  services: 'Služby',
  colleagues: 'Kolegové',
  analytics: 'Analytika',
  settings: 'Nastavení',
};

const ALL_PAGES: AppPage[] = Object.keys(PAGE_LABELS) as AppPage[];

interface EditUserPermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: CRMUser;
  onSave: (user: CRMUser) => void;
}

export function EditUserPermissionsDialog({ open, onOpenChange, user, onSave }: EditUserPermissionsDialogProps) {
  const { colleagues } = useCRMData();
  const [fullName, setFullName] = useState(user.full_name);
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState<UserRole>(user.role);
  const [colleagueId, setColleagueId] = useState<string>(user.colleague_id || 'none');
  const [permissions, setPermissions] = useState<PagePermission[]>(user.page_permissions);
  const [canSeeFinancials, setCanSeeFinancials] = useState(user.can_see_financials);

  useEffect(() => {
    setFullName(user.full_name);
    setEmail(user.email);
    setRole(user.role);
    setColleagueId(user.colleague_id || 'none');
    setPermissions(user.page_permissions);
    setCanSeeFinancials(user.can_see_financials);
  }, [user]);

  const handlePermissionChange = (page: AppPage, field: 'can_view' | 'can_edit', value: boolean) => {
    setPermissions(prev => prev.map(p => {
      if (p.page !== page) return p;
      
      if (field === 'can_edit' && value) {
        return { ...p, can_view: true, can_edit: true };
      }
      if (field === 'can_view' && !value) {
        return { ...p, can_view: false, can_edit: false };
      }
      return { ...p, [field]: value };
    }));
  };

  const handleSave = () => {
    const updatedUser: CRMUser = {
      ...user,
      full_name: fullName,
      email,
      role,
      colleague_id: colleagueId === 'none' ? null : colleagueId,
      can_see_financials: user.is_super_admin ? true : canSeeFinancials,
      page_permissions: permissions,
      updated_at: new Date().toISOString(),
    };
    onSave(updatedUser);
    onOpenChange(false);
  };

  const getPermission = (page: AppPage): PagePermission => {
    return permissions.find(p => p.page === page) || { page, can_view: false, can_edit: false };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upravit uživatele</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="editFullName">Celé jméno</Label>
              <Input
                id="editFullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={user.is_super_admin}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editEmail">Email</Label>
              <Input
                id="editEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={user.is_super_admin}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as UserRole)} disabled={user.is_super_admin}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="management">Management</SelectItem>
                  <SelectItem value="project_manager">Project Manager</SelectItem>
                  <SelectItem value="specialist">Specialista</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Propojený kolega</Label>
              <Select value={colleagueId} onValueChange={setColleagueId} disabled={user.is_super_admin}>
                <SelectTrigger>
                  <SelectValue placeholder="Žádný" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Žádný</SelectItem>
                  {colleagues.filter(c => c.status === 'active').map(col => (
                    <SelectItem key={col.id} value={col.id}>
                      {col.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Financial access */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label className="text-sm">Přístup k financím</Label>
                <p className="text-xs text-muted-foreground">Může vidět ceny zakázek, marže a náklady</p>
              </div>
            </div>
            <Switch 
              checked={user.is_super_admin ? true : canSeeFinancials}
              onCheckedChange={setCanSeeFinancials}
              disabled={user.is_super_admin}
            />
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Oprávnění ke stránkám</Label>
              <div className="flex gap-6 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> Zobrazit</span>
                <span className="flex items-center gap-1"><Pencil className="h-3 w-3" /> Editovat</span>
              </div>
            </div>

            {user.is_super_admin ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Super admin má automaticky plný přístup ke všem stránkám.
              </p>
            ) : (
              <div className="space-y-2 max-h-[280px] overflow-y-auto">
                {ALL_PAGES.map(page => {
                  const perm = getPermission(page);
                  return (
                    <div key={page} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50">
                      <span className="text-sm">{PAGE_LABELS[page]}</span>
                      <div className="flex gap-6">
                        <Checkbox
                          checked={perm.can_view}
                          onCheckedChange={(checked) => handlePermissionChange(page, 'can_view', !!checked)}
                        />
                        <Checkbox
                          checked={perm.can_edit}
                          onCheckedChange={(checked) => handlePermissionChange(page, 'can_edit', !!checked)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Zrušit
          </Button>
          <Button onClick={handleSave}>
            Uložit změny
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
