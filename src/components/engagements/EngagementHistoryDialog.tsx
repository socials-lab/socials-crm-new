import { 
  Clock, 
  ArrowRight, 
  Pencil,
  Plus,
  Minus,
  UserPlus,
  UserMinus,
  Settings,
  Package,
  Loader2
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEngagementHistory, getFieldLabel, formatHistoryValue } from '@/hooks/useEngagementHistory';
import type { EngagementHistoryRecord } from '@/types/crm';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';

interface EngagementHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  engagementId: string | null;
  engagementName: string;
}

function getChangeConfig(record: EngagementHistoryRecord) {
  const { entity_type, change_type, field_name } = record;
  
  if (entity_type === 'assignment') {
    if (change_type === 'created') {
      return { label: 'Přiřazen kolega', icon: UserPlus, color: 'bg-purple-500/10 text-purple-700 border-purple-500/30' };
    }
    if (change_type === 'deleted') {
      return { label: 'Odebrán kolega', icon: UserMinus, color: 'bg-red-500/10 text-red-700 border-red-500/30' };
    }
    if (field_name === 'end_date') {
      return { label: 'Ukončení přiřazení', icon: UserMinus, color: 'bg-orange-500/10 text-orange-700 border-orange-500/30' };
    }
    return { label: 'Změna odměny', icon: Pencil, color: 'bg-amber-500/10 text-amber-700 border-amber-500/30' };
  }
  
  if (entity_type === 'service') {
    if (change_type === 'created') {
      return { label: 'Přidána služba', icon: Plus, color: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30' };
    }
    if (change_type === 'deleted') {
      return { label: 'Odebrána služba', icon: Minus, color: 'bg-red-500/10 text-red-700 border-red-500/30' };
    }
    if (field_name === 'is_active' && record.new_value === 'false') {
      return { label: 'Služba deaktivována', icon: Minus, color: 'bg-orange-500/10 text-orange-700 border-orange-500/30' };
    }
    return { label: 'Změna služby', icon: Package, color: 'bg-blue-500/10 text-blue-700 border-blue-500/30' };
  }
  
  return { label: 'Změna', icon: Settings, color: 'bg-slate-500/10 text-slate-700 border-slate-500/30' };
}

function HistoryItem({ record }: { record: EngagementHistoryRecord }) {
  const config = getChangeConfig(record);
  const Icon = config.icon;
  const metadata = record.metadata || {};
  
  const entityName = metadata.colleague_name || metadata.service_name || '';
  
  return (
    <div className="p-3 rounded-lg border bg-card">
      <div className="flex items-start justify-between gap-2 mb-2">
        <Badge 
          variant="outline" 
          className={cn("text-xs", config.color)}
        >
          <Icon className="h-3 w-3 mr-1" />
          {config.label}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {format(new Date(record.changed_at), 'd. M. yyyy HH:mm', { locale: cs })}
        </span>
      </div>

      <div className="space-y-1">
        {entityName && (
          <span className="text-xs font-medium text-primary block">
            {entityName}
          </span>
        )}
        
        {record.change_type === 'created' && record.entity_type === 'assignment' && (
          <div className="text-sm space-y-0.5">
            <p>Kolega <span className="font-medium">{metadata.colleague_name}</span> byl přiřazen</p>
            {metadata.cost_model && (
              <p className="text-xs text-muted-foreground">
                Model: {formatHistoryValue('cost_model', metadata.cost_model)} 
                {metadata.monthly_cost && ` • ${metadata.monthly_cost.toLocaleString('cs-CZ')} Kč/měs`}
                {metadata.hourly_cost && ` • ${metadata.hourly_cost.toLocaleString('cs-CZ')} Kč/h`}
                {metadata.percentage_of_revenue && ` • ${metadata.percentage_of_revenue}%`}
              </p>
            )}
          </div>
        )}

        {record.change_type === 'created' && record.entity_type === 'service' && (
          <div className="text-sm space-y-0.5">
            <p>Přidána služba <span className="font-medium">{metadata.service_name}</span></p>
            {metadata.price !== undefined && (
              <p className="text-xs text-muted-foreground">
                Cena: {metadata.price.toLocaleString('cs-CZ')} {metadata.currency || 'CZK'}
                {metadata.billing_type && ` • ${formatHistoryValue('billing_type', metadata.billing_type)}`}
              </p>
            )}
          </div>
        )}

        {record.change_type === 'deleted' && (
          <p className="text-sm text-red-600">
            {record.entity_type === 'assignment' 
              ? `Kolega ${metadata.colleague_name} byl odebrán`
              : `Služba ${metadata.service_name} byla odebrána`
            }
          </p>
        )}

        {record.change_type === 'updated' && record.field_name && (
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground block">
              {getFieldLabel(record.field_name)}
            </span>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground line-through">
                {formatHistoryValue(record.field_name, record.old_value)}
              </span>
              <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="font-medium">
                {formatHistoryValue(record.field_name, record.new_value)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function EngagementHistoryDialog({ open, onOpenChange, engagementId, engagementName }: EngagementHistoryDialogProps) {
  const { data: history, isLoading } = useEngagementHistory(open ? engagementId : null);
  
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
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !history || history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Zatím žádné změny k zobrazení</p>
              <p className="text-xs mt-1">Změny se začnou zaznamenávat od teď</p>
            </div>
          ) : (
            <div className="space-y-3 pr-4">
              {history.map((record) => (
                <HistoryItem key={record.id} record={record} />
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
