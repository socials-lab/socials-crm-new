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
import { ArrowRight, BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { PendingTransition } from '@/types/leadTransitions';
import type { LeadStage } from '@/types/crm';

const STAGE_LABELS: Record<LeadStage, string> = {
  new_lead: 'Nový lead',
  meeting_done: 'Schůzka proběhla',
  waiting_access: 'Čekáme na přístupy',
  access_received: 'Přístupy přijaty',
  preparing_offer: 'Příprava nabídky',
  offer_sent: 'Nabídka odeslána',
  won: 'Vyhráno',
  lost: 'Prohráno',
  postponed: 'Odloženo',
};

interface ConfirmStageTransitionDialogProps {
  pendingTransition: PendingTransition | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onSkip: () => void;
  isConfirming?: boolean;
}

export function ConfirmStageTransitionDialog({
  pendingTransition,
  open,
  onOpenChange,
  onConfirm,
  onSkip,
  isConfirming = false,
}: ConfirmStageTransitionDialogProps) {
  if (!pendingTransition) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Potvrdit pro funnel analytiku?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Lead <span className="font-medium text-foreground">{pendingTransition.leadName}</span> byl přesunut:
              </p>
              
              <div className="flex items-center justify-center gap-3 py-3 px-4 bg-muted/50 rounded-lg">
                <Badge variant="outline" className="text-sm">
                  {STAGE_LABELS[pendingTransition.fromStage]}
                </Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <Badge variant="default" className="text-sm">
                  {STAGE_LABELS[pendingTransition.toStage]}
                </Badge>
              </div>

              {pendingTransition.leadValue > 0 && (
                <p className="text-xs text-muted-foreground text-center">
                  Hodnota: {formatCurrency(pendingTransition.leadValue)} Kč
                </p>
              )}
              
              <p className="text-sm text-muted-foreground">
                Chcete tento přechod započítat do funnel analytiky? 
                Toto vám pomůže trackovat průchodnost jednotlivými fázemi pipeline.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onSkip} disabled={isConfirming}>
            Přeskočit
          </AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isConfirming}>
            {isConfirming ? 'Ukládám...' : 'Potvrdit pro analytiku'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
