import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ShieldCheck, Wallet } from 'lucide-react';
import { ALL_PAGES, PAGE_GROUPS } from '@/constants/permissions';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface UserData {
  id: string;
  user_id: string;
  role: AppRole;
  is_super_admin: boolean;
  displayName: string;
  email: string;
  allowed_pages?: string[];
  can_see_financials?: boolean;
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
  const [allowedPages, setAllowedPages] = useState<string[]>([]);
  const [canSeeFinancials, setCanSeeFinancials] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setRole(user.role);
      setAllowedPages(user.allowed_pages || []);
      setCanSeeFinancials(user.can_see_financials || false);
    }
  }, [user]);

  const handlePageToggle = (pageId: string, checked: boolean) => {
    if (checked) {
      setAllowedPages(prev => [...prev, pageId]);
    } else {
      setAllowedPages(prev => prev.filter(p => p !== pageId));
    }
  };

  const handleSelectAll = () => {
    setAllowedPages(ALL_PAGES.map(p => p.id));
  };

  const handleDeselectAll = () => {
    setAllowedPages([]);
  };

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    const { error } = await supabase
      .from('user_roles')
      .update({ 
        role,
        allowed_pages: allowedPages,
        can_see_financials: canSeeFinancials,
      } as Record<string, unknown>)
      .eq('id', user.id);

    setIsSaving(false);

    if (error) {
      console.error('Error updating role:', error);
      toast.error('Chyba při ukládání oprávnění');
      return;
    }

    toast.success('Oprávnění byla úspěšně aktualizována');
    onSave();
    onOpenChange(false);
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upravit oprávnění uživatele</DialogTitle>
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
                  Tento uživatel je super admin a má přístup ke všemu.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Role selection */}
              <div className="space-y-3">
                <Label>Role</Label>
                <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        <span>{label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {ROLE_DESCRIPTIONS[role]}
                </p>
              </div>

              <Separator />

              {/* Financial visibility */}
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <Wallet className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">Může vidět finanční data</p>
                    <p className="text-xs text-muted-foreground">
                      Částky v zakázkách, fakturách a analytice
                    </p>
                  </div>
                </div>
                <Switch
                  checked={canSeeFinancials}
                  onCheckedChange={setCanSeeFinancials}
                />
              </div>

              <Separator />

              {/* Page access */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Přístup ke stránkám</Label>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleSelectAll}>
                      Vybrat vše
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDeselectAll}>
                      Odznačit vše
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  {PAGE_GROUPS.map((group) => (
                    <div key={group.label} className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {group.label}
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {group.pages.map((pageId) => {
                          const page = ALL_PAGES.find(p => p.id === pageId);
                          if (!page) return null;
                          return (
                            <label
                              key={page.id}
                              className="flex items-center gap-2 p-2 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                            >
                              <Checkbox
                                checked={allowedPages.includes(page.id)}
                                onCheckedChange={(checked) => 
                                  handlePageToggle(page.id, checked === true)
                                }
                              />
                              <span className="text-sm">
                                {page.emoji} {page.label}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-muted-foreground mt-2">
                  Vybráno {allowedPages.length} z {ALL_PAGES.length} stránek
                </p>
              </div>
            </>
          )}
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
