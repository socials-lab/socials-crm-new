import { History, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import type { CreativeBoostSettingsChange } from '@/types/creativeBoost';

interface SettingsHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientName: string;
  history: CreativeBoostSettingsChange[];
}

export function SettingsHistoryDialog({
  open,
  onOpenChange,
  clientName,
  history,
}: SettingsHistoryDialogProps) {
  const formatValue = (change: CreativeBoostSettingsChange, value: string | number) => {
    if (change.changeType === 'price_per_credit') {
      return `${Number(value).toLocaleString()} Kč`;
    }
    if (change.changeType === 'max_credits') {
      return `${value} kreditů`;
    }
    if (change.changeType === 'status') {
      const statusLabels: Record<string, string> = {
        active: 'Aktivní',
        inactive: 'Neaktivní',
      };
      return statusLabels[String(value)] || String(value);
    }
    return String(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historie změn – {clientName}
          </DialogTitle>
        </DialogHeader>
        
        {history.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Žádné změny k zobrazení</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-3">
              {history.map((change) => (
                <div 
                  key={change.id}
                  className="p-3 rounded-lg bg-muted/50 border space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {change.fieldName}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(change.changedAt), 'd. MMM yyyy, HH:mm', { locale: cs })}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground line-through">
                      {formatValue(change, change.oldValue)}
                    </span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium text-foreground">
                      {formatValue(change, change.newValue)}
                    </span>
                  </div>
                  
                  <p className="text-[10px] text-muted-foreground">
                    Změnil/a: {change.changedByName}
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
