import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Service } from '@/types/crm';

interface DeleteServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: Service | null;
  activeClientCount: number;
  onConfirm: () => void;
}

export function DeleteServiceDialog({ open, onOpenChange, service, activeClientCount, onConfirm }: DeleteServiceDialogProps) {
  if (!service) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Smazat službu?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <span className="block">
              Opravdu chcete smazat službu <strong>{service.name}</strong>?
            </span>
            {activeClientCount > 0 && (
              <span className="block text-destructive font-medium">
                ⚠️ Tato služba je aktivní u {activeClientCount} klient{activeClientCount === 1 ? 'a' : activeClientCount < 5 ? 'ů' : 'ů'}. 
                Smazáním služby budou ovlivněny jejich zakázky.
              </span>
            )}
            <span className="block">Tuto akci nelze vrátit zpět.</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Zrušit</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Smazat
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
