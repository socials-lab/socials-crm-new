import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CheckCircle, 
  Calendar, 
  Mail, 
  Package, 
  DollarSign, 
  X as XIcon,
  User,
} from 'lucide-react';
import { getHistoryByEngagementId, type AppliedModificationHistory } from '@/data/appliedModificationsHistory';

interface ModificationHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  engagementId: string;
  engagementName: string;
}

const REQUEST_TYPE_LABELS: Record<string, string> = {
  add_service: 'Přidání služby',
  update_service_price: 'Změna ceny',
  deactivate_service: 'Ukončení služby',
  add_assignment: 'Přiřazení kolegy',
  update_assignment: 'Změna odměny',
  remove_assignment: 'Odebrání kolegy',
};

const REQUEST_TYPE_ICONS: Record<string, typeof Package> = {
  add_service: Package,
  update_service_price: DollarSign,
  deactivate_service: XIcon,
};

export function ModificationHistoryDialog({
  open,
  onOpenChange,
  engagementId,
  engagementName,
}: ModificationHistoryDialogProps) {
  const history = getHistoryByEngagementId(engagementId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            Historie změn zakázky
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{engagementName}</p>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          {history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Žádné záznamy o změnách</p>
              <p className="text-sm">Historie se zobrazí po aktivaci návrhů změn</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((entry) => (
                <HistoryEntry key={entry.id} entry={entry} />
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function HistoryEntry({ entry }: { entry: AppliedModificationHistory }) {
  const Icon = REQUEST_TYPE_ICONS[entry.request_type] || Package;
  const typeLabel = REQUEST_TYPE_LABELS[entry.request_type] || entry.request_type;

  return (
    <div className="border rounded-lg p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-primary/10">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <div>
            <Badge variant="outline">{typeLabel}</Badge>
            <p className="text-sm text-muted-foreground mt-0.5">
              {format(new Date(entry.applied_at), 'd. MMMM yyyy v H:mm', { locale: cs })}
            </p>
          </div>
        </div>
      </div>

      {/* Changes */}
      <div className="bg-muted/50 rounded-md p-3 text-sm space-y-1">
        {entry.request_type === 'add_service' && (
          <>
            <p><span className="text-muted-foreground">Služba:</span> {(entry.proposed_changes as any).name}</p>
            <p><span className="text-muted-foreground">Cena:</span> {((entry.proposed_changes as any).price || 0).toLocaleString('cs-CZ')} {(entry.proposed_changes as any).currency}/{(entry.proposed_changes as any).billing_type === 'monthly' ? 'měs' : 'jednorázově'}</p>
          </>
        )}
        {entry.request_type === 'update_service_price' && (
          <p>
            <span className="text-muted-foreground">Cena:</span>{' '}
            <span className="line-through">{((entry.proposed_changes as any).old_price || 0).toLocaleString('cs-CZ')}</span>
            {' → '}
            <span className="font-medium text-primary">{((entry.proposed_changes as any).new_price || 0).toLocaleString('cs-CZ')}</span>
            {' '}{(entry.proposed_changes as any).currency}
          </p>
        )}
        {entry.request_type === 'deactivate_service' && (
          <p><span className="text-muted-foreground">Služba deaktivována:</span> {(entry.proposed_changes as any).service_name}</p>
        )}
        {entry.effective_from && (
          <p className="text-muted-foreground">
            <Calendar className="h-3 w-3 inline mr-1" />
            Účinnost od: {format(new Date(entry.effective_from), 'd. M. yyyy')}
          </p>
        )}
      </div>

      {/* Client confirmation */}
      {entry.client_email && entry.client_approved_at && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-3 text-sm">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-medium mb-2">
            <CheckCircle className="h-4 w-4" />
            Potvrzeno klientem
          </div>
          <div className="space-y-1 text-green-600 dark:text-green-300">
            <div className="flex items-center gap-2">
              <Mail className="h-3 w-3" />
              <span>{entry.client_email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-3 w-3" />
              <span>{format(new Date(entry.client_approved_at), 'd. M. yyyy v H:mm', { locale: cs })}</span>
            </div>
          </div>
        </div>
      )}

      {/* Commission info */}
      {entry.upsold_by_name && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <User className="h-3 w-3" />
          <span>Upsell provize: {entry.upsold_by_name} ({entry.upsell_commission_percent}%)</span>
        </div>
      )}

      {/* Note */}
      {entry.note && (
        <p className="text-xs text-muted-foreground italic border-l-2 pl-2">
          „{entry.note}"
        </p>
      )}
    </div>
  );
}
