import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Wallet, ShieldCheck } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface UserData {
  id: string;
  user_id: string;
  role: AppRole;
  is_super_admin: boolean;
  displayName: string;
  email: string;
}

interface EditUserRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserData | null;
  onSave: () => void;
}

const ROLE_LABELS: Record<AppRole, string> = {
  admin: 'Admin',
  management: 'Management',
  project_manager: 'Project Manager',
  specialist: 'Specialista',
  finance: 'Finance',
};

const ROLE_DESCRIPTIONS: Record<AppRole, string> = {
  admin: 'Plný přístup ke všem funkcím a nastavení',
  management: 'Přístup k přehledům, analytice a správě klientů',
  project_manager: 'Správa projektů, engagementů a kolegů',
  specialist: 'Základní přístup k přiřazeným úkolům',
  finance: 'Přístup k fakturaci a finančním přehledům',
};

export function EditUserRoleDialog({ open, onOpenChange, user, onSave }: EditUserRoleDialogProps) {
  const [role, setRole] = useState<AppRole>('specialist');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setRole(user.role);
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    const { error } = await supabase
      .from('user_roles')
      .update({ role })
      .eq('id', user.id);

    setIsSaving(false);

    if (error) {
      console.error('Error updating role:', error);
      toast.error('Chyba při ukládání role');
      return;
    }

    toast.success('Role byla úspěšně aktualizována');
    onSave();
    onOpenChange(false);
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upravit roli uživatele</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <p className="font-medium">{user.displayName}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>

          <Separator />

          {user.is_super_admin ? (
            <div className="flex items-center gap-3 py-4 px-3 bg-primary/5 rounded-lg border border-primary/20">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-sm">Super Admin</p>
                <p className="text-xs text-muted-foreground">
                  Tento uživatel je super admin a jeho role nelze změnit.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <Label>Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      <div>
                        <span>{label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {ROLE_DESCRIPTIONS[role]}
              </p>
            </div>
          )}

          <Separator />

          <div className="space-y-2">
            <p className="text-sm font-medium">Přístupová práva podle role:</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• <strong>Admin</strong> - Vše včetně nastavení a správy uživatelů</li>
              <li>• <strong>Management</strong> - Vše kromě nastavení systému</li>
              <li>• <strong>Project Manager</strong> - Klienti, engagementy, kolegové</li>
              <li>• <strong>Specialist</strong> - Přehled a přiřazené úkoly</li>
              <li>• <strong>Finance</strong> - Fakturace a finanční přehledy</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Zrušit
          </Button>
          <Button onClick={handleSave} disabled={isSaving || user.is_super_admin}>
            {isSaving ? 'Ukládám...' : 'Uložit změny'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
