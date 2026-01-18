import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface EditUserNameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    userId: string;
    currentName: string;
    email: string;
  } | null;
  onSuccess: () => void;
}

export function EditUserNameDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
}: EditUserNameDialogProps) {
  const [fullName, setFullName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open && user) {
      setFullName(user.currentName || '');
    }
  }, [open, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast.error('Jméno je povinné');
      return;
    }

    if (!user) return;

    setIsSubmitting(true);

    try {
      // Update the profile (auth.users metadata)
      const { error: updateError } = await supabase.auth.updateUser({
        data: { full_name: fullName.trim() }
      });

      if (updateError) {
        throw updateError;
      }

      // Also update the profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: fullName.trim() })
        .eq('id', user.userId);

      if (profileError) {
        throw profileError;
      }

      toast.success('Jméno uživatele bylo aktualizováno');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating user name:', error);
      const message = error instanceof Error ? error.message : 'Nepodařilo se aktualizovat jméno';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upravit jméno uživatele</DialogTitle>
          <DialogDescription>
            Email: {user.email}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Celé jméno</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jan Novák"
                disabled={isSubmitting}
                autoFocus
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Zrušit
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Ukládám...
                </>
              ) : (
                'Uložit'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
