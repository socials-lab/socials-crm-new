import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CRMUser, UserRole, PagePermission, AppPage } from '@/types/crm';
import { colleagues } from '@/data/mockData';

const ALL_PAGES: AppPage[] = [
  'dashboard', 'leads', 'clients', 'contacts', 'engagements',
  'extra_work', 'invoicing', 'creative_boost', 'services', 'colleagues', 'analytics', 'settings'
];

const ROLE_TEMPLATES: Record<UserRole, { can_view: AppPage[]; can_edit: AppPage[] }> = {
  admin: {
    can_view: ALL_PAGES,
    can_edit: ALL_PAGES,
  },
  management: {
    can_view: ALL_PAGES,
    can_edit: ['leads', 'clients', 'contacts', 'engagements', 'extra_work', 'creative_boost'],
  },
  project_manager: {
    can_view: ['dashboard', 'clients', 'contacts', 'engagements', 'extra_work', 'creative_boost', 'colleagues'],
    can_edit: ['extra_work', 'creative_boost'],
  },
  specialist: {
    can_view: ['dashboard', 'clients', 'creative_boost'],
    can_edit: ['creative_boost'],
  },
  finance: {
    can_view: ['dashboard', 'clients', 'engagements', 'invoicing', 'analytics'],
    can_edit: ['invoicing'],
  },
  client: {
    can_view: ['dashboard'],
    can_edit: [],
  },
};

function generatePermissions(role: UserRole): PagePermission[] {
  const template = ROLE_TEMPLATES[role];
  return ALL_PAGES.map(page => ({
    page,
    can_view: template.can_view.includes(page),
    can_edit: template.can_edit.includes(page),
  }));
}

interface AddCRMUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (user: CRMUser) => void;
}

export function AddCRMUserDialog({ open, onOpenChange, onAdd }: AddCRMUserDialogProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('specialist');
  const [colleagueId, setColleagueId] = useState<string>('none');

  const handleSubmit = () => {
    if (!fullName || !email) return;

    const newUser: CRMUser = {
      id: `crm-user-${Date.now()}`,
      colleague_id: colleagueId === 'none' ? null : colleagueId,
      full_name: fullName,
      email,
      role,
      is_super_admin: false,
      is_active: true,
      can_see_financials: ['admin', 'management', 'finance'].includes(role),
      page_permissions: generatePermissions(role),
      last_login: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    onAdd(newUser);
    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setFullName('');
    setEmail('');
    setRole('specialist');
    setColleagueId('none');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Přidat nového uživatele CRM</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Celé jméno *</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jan Novák"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jan@socials.cz"
            />
          </div>

          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
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
            <p className="text-xs text-muted-foreground">
              Oprávnění budou přednastavena podle role
            </p>
          </div>

          <div className="space-y-2">
            <Label>Propojit s kolegou (volitelné)</Label>
            <Select value={colleagueId} onValueChange={setColleagueId}>
              <SelectTrigger>
                <SelectValue placeholder="Vyberte kolegu..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Žádný</SelectItem>
                {colleagues.filter(c => c.status === 'active').map(col => (
                  <SelectItem key={col.id} value={col.id}>
                    {col.full_name} - {col.position}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Zrušit
          </Button>
          <Button onClick={handleSubmit} disabled={!fullName || !email}>
            Přidat uživatele
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
