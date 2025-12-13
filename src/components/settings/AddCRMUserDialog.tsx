import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Mail, UserPlus } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface AddCRMUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: () => void;
}

export function AddCRMUserDialog({ open, onOpenChange, onAdd }: AddCRMUserDialogProps) {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<AppRole>('specialist');
  const [position, setPosition] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!email || !firstName || !lastName) {
      toast.error('Vyplňte všechna povinná pole');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Zadejte platný email');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: {
          email,
          firstName,
          lastName,
          role,
          position: position || undefined,
        },
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        toast.error(data.error);
        return;
      }

      toast.success(`Pozvánka odeslána na ${email}`);
      onAdd();
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Error inviting user:', error);
      toast.error('Chyba při odesílání pozvánky');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setFirstName('');
    setLastName('');
    setRole('specialist');
    setPosition('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Pozvat uživatele do CRM
          </DialogTitle>
          <DialogDescription>
            Uživatel obdrží email s odkazem pro přihlášení
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Jméno *</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Jan"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Příjmení *</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Novák"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jan.novak@socials.cz"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="position">Pozice</Label>
            <Input
              id="position"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="Marketing Specialist"
            />
          </div>

          <div className="space-y-2">
            <Label>Role v CRM</Label>
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
          <Button 
            onClick={handleSubmit} 
            disabled={!email || !firstName || !lastName || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Odesílám...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Odeslat pozvánku
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
