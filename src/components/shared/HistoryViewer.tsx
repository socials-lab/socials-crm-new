import { 
  Clock, 
  ArrowRight, 
  MessageSquare, 
  Pencil,
  UserCheck,
  ArrowRightLeft,
  Plus,
  X,
  History
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';

export interface HistoryEntry {
  id: string;
  change_type: string;
  field_name?: string | null;
  field_label?: string | null;
  old_value?: string | null;
  new_value?: string | null;
  changed_by: string;
  changed_by_name: string;
  created_at: string;
}

interface HistoryViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  history: HistoryEntry[];
  entityName: string;
  changeTypeConfig?: Record<string, { label: string; icon: typeof Clock; color: string }>;
}

const DEFAULT_CHANGE_TYPE_CONFIG: Record<string, { label: string; icon: typeof Clock; color: string }> = {
  created: { label: 'Vytvořeno', icon: Plus, color: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30' },
  status_change: { label: 'Změna stavu', icon: ArrowRightLeft, color: 'bg-blue-500/10 text-blue-700 border-blue-500/30' },
  tier_change: { label: 'Změna tieru', icon: ArrowRightLeft, color: 'bg-purple-500/10 text-purple-700 border-purple-500/30' },
  stage_change: { label: 'Změna stavu', icon: ArrowRightLeft, color: 'bg-blue-500/10 text-blue-700 border-blue-500/30' },
  field_update: { label: 'Úprava pole', icon: Pencil, color: 'bg-slate-500/10 text-slate-700 border-slate-500/30' },
  owner_change: { label: 'Změna vlastníka', icon: UserCheck, color: 'bg-purple-500/10 text-purple-700 border-purple-500/30' },
  note_added: { label: 'Poznámka', icon: MessageSquare, color: 'bg-amber-500/10 text-amber-700 border-amber-500/30' },
  converted: { label: 'Konverze', icon: ArrowRightLeft, color: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30' },
  invoiced: { label: 'Vyfakturováno', icon: ArrowRightLeft, color: 'bg-green-500/10 text-green-700 border-green-500/30' },
  rescheduled: { label: 'Přeplánováno', icon: Clock, color: 'bg-orange-500/10 text-orange-700 border-orange-500/30' },
  cancelled: { label: 'Zrušeno', icon: X, color: 'bg-red-500/10 text-red-700 border-red-500/30' },
  deleted: { label: 'Smazáno', icon: X, color: 'bg-red-500/10 text-red-700 border-red-500/30' },
  contact_added: { label: 'Kontakt přidán', icon: Plus, color: 'bg-blue-500/10 text-blue-700 border-blue-500/30' },
  contact_removed: { label: 'Kontakt odebrán', icon: X, color: 'bg-red-500/10 text-red-700 border-red-500/30' },
};

export function HistoryViewer({ 
  open, 
  onOpenChange, 
  history, 
  entityName,
  changeTypeConfig = DEFAULT_CHANGE_TYPE_CONFIG 
}: HistoryViewerProps) {
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'd. M. yyyy, HH:mm', { locale: cs });
  };

  const getConfig = (changeType: string) => {
    return changeTypeConfig[changeType] || {
      label: changeType,
      icon: Clock,
      color: 'bg-slate-500/10 text-slate-700 border-slate-500/30'
    };
  };

  const shouldShowOldNewValues = (changeType: string) => {
    return ['status_change', 'stage_change', 'tier_change', 'field_update', 'owner_change'].includes(changeType);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-muted-foreground" />
            Historie změn – {entityName}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          {history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Zatím žádné změny k zobrazení</p>
            </div>
          ) : (
            <div className="space-y-3 pr-4">
              {history.map((entry) => {
                const config = getConfig(entry.change_type);
                const Icon = config.icon;
                const showOldNew = shouldShowOldNewValues(entry.change_type);

                return (
                  <div 
                    key={entry.id} 
                    className="p-3 rounded-lg border bg-card"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Badge 
                        variant="outline" 
                        className={cn("text-xs", config.color)}
                      >
                        <Icon className="h-3 w-3 mr-1" />
                        {config.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(entry.created_at)}
                      </span>
                    </div>

                    <div className="space-y-1">
                      {entry.field_label && (
                        <span className="text-xs text-muted-foreground">
                          {entry.field_label}
                        </span>
                      )}
                      
                      {showOldNew && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground line-through">
                            {entry.old_value || '(prázdné)'}
                          </span>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {entry.new_value || '(prázdné)'}
                          </span>
                        </div>
                      )}

                      {entry.change_type === 'note_added' && (
                        <p className="text-sm italic text-muted-foreground">
                          "{entry.new_value}"
                        </p>
                      )}

                      {entry.change_type === 'created' && entry.new_value && (
                        <p className="text-sm">
                          <span className="font-medium">{entry.new_value}</span> byl/a vytvořen/a
                        </p>
                      )}

                      {entry.change_type === 'converted' && (
                        <p className="text-sm font-medium text-emerald-700">
                          {entry.new_value}
                        </p>
                      )}

                      {entry.change_type === 'invoiced' && (
                        <p className="text-sm font-medium text-green-700">
                          Vyfakturováno: {entry.new_value}
                        </p>
                      )}

                      {entry.change_type === 'cancelled' && (
                        <p className="text-sm font-medium text-red-700">
                          Zrušeno
                        </p>
                      )}

                      {entry.change_type === 'deleted' && (
                        <p className="text-sm font-medium text-red-700">
                          Smazáno
                        </p>
                      )}

                      {!showOldNew && !['note_added', 'created', 'converted', 'invoiced', 'cancelled', 'deleted'].includes(entry.change_type) && entry.new_value && (
                        <p className="text-sm">
                          {entry.new_value}
                        </p>
                      )}
                    </div>

                    <div className="mt-2 text-xs text-muted-foreground">
                      {entry.changed_by_name}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
