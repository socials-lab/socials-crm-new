import { 
  Clock, 
  ArrowRight, 
  MessageSquare, 
  Pencil,
  UserCheck,
  ArrowRightLeft,
  Plus
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { LeadHistoryEntry, LeadChangeType } from '@/types/crm';
import { cn } from '@/lib/utils';

interface LeadHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  history: LeadHistoryEntry[];
  leadName: string;
}

const CHANGE_TYPE_CONFIG: Record<LeadChangeType, { label: string; icon: typeof Clock; color: string }> = {
  created: { label: 'Vytvořeno', icon: Plus, color: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30' },
  stage_change: { label: 'Změna stavu', icon: ArrowRightLeft, color: 'bg-blue-500/10 text-blue-700 border-blue-500/30' },
  field_update: { label: 'Úprava pole', icon: Pencil, color: 'bg-slate-500/10 text-slate-700 border-slate-500/30' },
  owner_change: { label: 'Změna vlastníka', icon: UserCheck, color: 'bg-purple-500/10 text-purple-700 border-purple-500/30' },
  note_added: { label: 'Poznámka', icon: MessageSquare, color: 'bg-amber-500/10 text-amber-700 border-amber-500/30' },
  converted: { label: 'Konverze', icon: ArrowRightLeft, color: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30' },
};

export function LeadHistoryDialog({ open, onOpenChange, history, leadName }: LeadHistoryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            Historie změn – {leadName}
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
                      {entry.field_label && (
                        <span className="text-xs text-muted-foreground">
                          {entry.field_label}
                        </span>
                      )}
                      
                      {entry.change_type === 'stage_change' && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">{entry.old_value}</span>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{entry.new_value}</span>
                        </div>
                      )}

                      {entry.change_type === 'field_update' && (
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

                      {entry.change_type === 'owner_change' && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">{entry.old_value}</span>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{entry.new_value}</span>
                        </div>
                      )}

                      {entry.change_type === 'note_added' && (
                        <p className="text-sm italic text-muted-foreground">
                          "{entry.new_value}"
                        </p>
                      )}

                      {entry.change_type === 'created' && (
                        <p className="text-sm">
                          Lead <span className="font-medium">{entry.new_value}</span> byl vytvořen
                        </p>
                      )}

                      {entry.change_type === 'converted' && (
                        <p className="text-sm font-medium text-emerald-700">
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