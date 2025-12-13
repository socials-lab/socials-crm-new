import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCRMData } from '@/hooks/useCRMData';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface AddCRMUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: () => void;
}

export function AddCRMUserDialog({ open, onOpenChange, onAdd }: AddCRMUserDialogProps) {
  const { colleagues } = useCRMData();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<AppRole>('specialist');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!email) {
      toast.error('Email je povinný');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // First, find the user by email in profiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      if (!profile) {
        toast.error('Uživatel s tímto emailem nebyl nalezen. Uživatel se musí nejdřív zaregistrovat.');
        setIsSubmitting(false);
        return;
      }

      // Check if user already has a role
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', profile.id)
        .maybeSingle();

      if (existingRole) {
        toast.error('Tento uživatel již má přiřazenou roli.');
        setIsSubmitting(false);
        return;
      }

      // Add the role
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({
          user_id: profile.id,
          role: role,
          is_super_admin: isSuperAdmin,
        });

      if (insertError) {
        throw insertError;
      }

      onAdd();
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding user role:', error);
      toast.error('Chyba při přidávání uživatele');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setRole('specialist');
    setIsSuperAdmin(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Přidat přístup do CRM</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email uživatele *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jan@socials.cz"
            />
            <p className="text-xs text-muted-foreground">
              Uživatel se musí nejdřív zaregistrovat
            </p>
          </div>

          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Zrušit
          </Button>
          <Button onClick={handleSubmit} disabled={!email || isSubmitting}>
            {isSubmitting ? 'Přidávám...' : 'Přidat uživatele'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
