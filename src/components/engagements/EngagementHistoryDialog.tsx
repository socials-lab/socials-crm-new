import { 
  Clock, 
  ArrowRight, 
  Pencil,
  Plus,
  Minus,
  UserPlus,
  UserMinus,
  Calendar,
  Settings
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { EngagementHistoryEntry, EngagementChangeType } from '@/types/crm';
import { cn } from '@/lib/utils';

interface EngagementHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  history: EngagementHistoryEntry[];
  engagementName: string;
}

const CHANGE_TYPE_CONFIG: Record<EngagementChangeType, { label: string; icon: typeof Clock; color: string }> = {
  created: { label: 'Vytvořeno', icon: Plus, color: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30' },
  status_change: { label: 'Změna stavu', icon: Settings, color: 'bg-blue-500/10 text-blue-700 border-blue-500/30' },
  field_update: { label: 'Úprava', icon: Pencil, color: 'bg-slate-500/10 text-slate-700 border-slate-500/30' },
  service_added: { label: 'Přidána služba', icon: Plus, color: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30' },
  service_removed: { label: 'Odebrána služba', icon: Minus, color: 'bg-red-500/10 text-red-700 border-red-500/30' },
  service_updated: { label: 'Upravena služba', icon: Pencil, color: 'bg-amber-500/10 text-amber-700 border-amber-500/30' },
  colleague_assigned: { label: 'Přiřazen kolega', icon: UserPlus, color: 'bg-purple-500/10 text-purple-700 border-purple-500/30' },
  colleague_removed: { label: 'Odebrán kolega', icon: UserMinus, color: 'bg-red-500/10 text-red-700 border-red-500/30' },
  colleague_updated: { label: 'Upraven kolega', icon: Pencil, color: 'bg-amber-500/10 text-amber-700 border-amber-500/30' },
  end_date_set: { label: 'Nastaveno ukončení', icon: Calendar, color: 'bg-orange-500/10 text-orange-700 border-orange-500/30' },
};

export function EngagementHistoryDialog({ open, onOpenChange, history, engagementName }: EngagementHistoryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            Historie změn – {engagementName}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          {history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Zatím žádné změny k zobrazení
            </div>
          ) : (
            <div className="space-y-3 pr-4">
              {history.map((entry) => {
                const config = CHANGE_TYPE_CONFIG[entry.change_type];
                const Icon = config.icon;

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
                        {new Date(entry.created_at).toLocaleDateString('cs-CZ', {
                          day: 'numeric',
                          month: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>

                    <div className="space-y-1">
                      {entry.related_entity_name && (
                        <span className="text-xs font-medium text-primary">
                          {entry.related_entity_name}
                        </span>
                      )}
                      
                      {entry.field_label && (
                        <span className="text-xs text-muted-foreground block">
                          {entry.field_label}
                        </span>
                      )}
                      
                      {(entry.change_type === 'status_change' || entry.change_type === 'field_update') && (
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

                      {entry.change_type === 'service_added' && (
                        <p className="text-sm">
                          Přidána služba <span className="font-medium">{entry.new_value}</span>
                        </p>
                      )}

                      {entry.change_type === 'service_removed' && (
                        <p className="text-sm text-red-600">
                          Odebrána služba <span className="font-medium">{entry.old_value}</span>
                        </p>
                      )}

                      {entry.change_type === 'service_updated' && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">{entry.old_value}</span>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{entry.new_value}</span>
                        </div>
                      )}

                      {entry.change_type === 'colleague_assigned' && (
                        <p className="text-sm">
                          Přiřazen: <span className="font-medium">{entry.new_value}</span>
                        </p>
                      )}

                      {entry.change_type === 'colleague_removed' && (
                        <p className="text-sm text-red-600">
                          Odebrán: <span className="font-medium">{entry.old_value}</span>
                        </p>
                      )}

                      {entry.change_type === 'colleague_updated' && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">{entry.old_value}</span>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{entry.new_value}</span>
                        </div>
                      )}

                      {entry.change_type === 'created' && (
                        <p className="text-sm">
                          Zakázka <span className="font-medium">{entry.new_value}</span> byla vytvořena
                        </p>
                      )}

                      {entry.change_type === 'end_date_set' && (
                        <p className="text-sm">
                          Datum ukončení: <span className="font-medium">{entry.new_value}</span>
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