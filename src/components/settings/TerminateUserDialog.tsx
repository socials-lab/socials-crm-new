import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, UserX, UserCheck } from 'lucide-react';

export type LifecycleMode = 'terminate' | 'restore';

interface UserRoleForLifecycle {
  id: string;
  user_id: string;
  displayName: string;
  email: string;
  is_super_admin: boolean;
  colleague?: {
    id: string;
    full_name: string;
    position: string;
  } | null;
}

interface TerminateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: LifecycleMode;
  user: UserRoleForLifecycle | null;
  onConfirm: () => Promise<void>;
}

export function TerminateUserDialog({
  open,
  onOpenChange,
  mode,
  user,
  onConfirm,
}: TerminateUserDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleConfirm() {
    if (!user) return;
    setIsSubmitting(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!user) return null;

  const isTerminate = mode === 'terminate';
  const title = isTerminate ? 'Ukončit uživatele' : 'Obnovit uživatele';
  const description = isTerminate
    ? 'Uživatel ztratí přístup do CRM a propojený kolega bude označen jako odešel/la.'
    : 'Uživatel získá zpět přístup do CRM a propojený kolega bude označen jako aktivní.';
  const confirmLabel = isTerminate ? 'Ukončit přístup' : 'Obnovit přístup';
  const Icon = isTerminate ? UserX : UserCheck;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div>
            <p className="font-medium">{user.displayName}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          {user.colleague && (
            <p className="text-sm text-muted-foreground">
              Propojený kolega: {user.colleague.full_name} ({user.colleague.position}) – bude
              označen jako {isTerminate ? 'odešel/la' : 'aktivní'}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Zrušit
          </Button>
          <Button
            variant={isTerminate ? 'destructive' : 'default'}
            onClick={handleConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Zpracovávám...
              </>
            ) : (
              confirmLabel
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
