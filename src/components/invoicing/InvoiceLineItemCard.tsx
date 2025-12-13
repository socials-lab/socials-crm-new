import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { FileText, AlertTriangle, Trash2, Plus, CheckCircle2, Copy, MessageSquare, Clock, ArrowRightLeft } from 'lucide-react';
import type { InvoiceLineItem } from '@/types/crm';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { cs } from 'date-fns/locale';

interface InvoiceLineItemCardProps {
  item: InvoiceLineItem;
  currency: string;
  onUpdate: (updates: Partial<InvoiceLineItem>) => void;
  onRemove?: () => void;
  onDuplicate?: () => void;
}

export function InvoiceLineItemCard({ item, currency, onUpdate, onRemove, onDuplicate }: InvoiceLineItemCardProps) {
  const isProrated = item.prorated_days < item.total_days_in_month;
  const isManual = item.source === 'manual';
  const hasNote = item.note && item.note.trim().length > 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'd.M.yyyy', { locale: cs });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className={cn(
      "border rounded-lg p-3 space-y-3",
      isManual ? "border-dashed border-primary/50 bg-primary/5" : "bg-muted/30",
      isProrated && !isManual && "border-amber-300 bg-amber-50/50",
      item.is_approved && "border-green-300 bg-green-50/30",
      hasNote && "ring-1 ring-amber-400"
    )}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          {isManual ? (
            <Plus className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          ) : (
            <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-medium text-sm">
                {isManual ? 'Extra položka' : item.source_description}
              </span>
              {item.source === 'extra_work' && (
                <Badge variant="outline" className="text-xs h-5 bg-purple-100 text-purple-800 border-purple-300">
                  Vícepráce
                </Badge>
              )}
              {isProrated && !isManual && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs">
                  <AlertTriangle className="h-3 w-3" />
                  Poměrně
                </span>
              )}
              {item.is_approved && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 text-xs">
                  <CheckCircle2 className="h-3 w-3" />
                </span>
              )}
            </div>
            {!isManual && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatDate(item.period_start)} - {formatDate(item.period_end)} 
                ({item.prorated_days}/{item.total_days_in_month} dnů)
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5">
            <Switch
              id={`approve-${item.id}`}
              checked={item.is_approved}
              onCheckedChange={(checked) => onUpdate({ is_approved: checked })}
              className="scale-90"
            />
            <Label htmlFor={`approve-${item.id}`} className="text-xs cursor-pointer">
              Schválit
            </Label>
          </div>
          <div className="text-right min-w-[70px]">
            <p className="font-semibold text-sm">{formatCurrency(item.final_amount)}</p>
          </div>
        </div>
      </div>

      {/* Editable fields - always visible */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div className="col-span-2">
          <Label htmlFor={`desc-${item.id}`} className="text-xs text-muted-foreground">Popis</Label>
          <Input
            id={`desc-${item.id}`}
            value={item.line_description}
            onChange={(e) => onUpdate({ line_description: e.target.value })}
            className="mt-0.5 h-8 text-sm"
          />
        </div>

        <div>
          <Label htmlFor={`price-${item.id}`} className="text-xs text-muted-foreground">Cena</Label>
          <Input
            id={`price-${item.id}`}
            type="number"
            value={item.unit_price}
            onChange={(e) => onUpdate({ unit_price: Number(e.target.value) })}
            className="mt-0.5 h-8 text-sm"
          />
        </div>

        <div>
          <Label htmlFor={`qty-${item.id}`} className="text-xs text-muted-foreground">Množství</Label>
          <Input
            id={`qty-${item.id}`}
            type="number"
            min={1}
            value={item.quantity}
            onChange={(e) => onUpdate({ quantity: Number(e.target.value) })}
            className="mt-0.5 h-8 text-sm"
          />
        </div>
      </div>

      {/* Extra work hours and hourly rate - only for extra_work items */}
      {item.source === 'extra_work' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-2 bg-purple-50/50 rounded-md border border-purple-200">
          <div>
            <Label htmlFor={`hours-${item.id}`} className="text-xs text-muted-foreground h-4 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Počet hodin
            </Label>
            <Input
              id={`hours-${item.id}`}
              type="number"
              step="0.5"
              min="0"
              value={item.hours || ''}
              onChange={(e) => onUpdate({ hours: e.target.value ? Number(e.target.value) : null })}
              className="mt-0.5 h-8 text-sm"
              placeholder="0"
            />
          </div>

          <div>
            <Label htmlFor={`hourly-rate-${item.id}`} className="text-xs text-muted-foreground h-4 flex items-center">
              Hodinová sazba
            </Label>
            <Input
              id={`hourly-rate-${item.id}`}
              type="number"
              min="0"
              value={item.hourly_rate || ''}
              onChange={(e) => onUpdate({ hourly_rate: e.target.value ? Number(e.target.value) : null })}
              className="mt-0.5 h-8 text-sm"
              placeholder="0"
            />
          </div>

          <div className="col-span-2 flex items-end pb-1">
            <p className="text-xs text-muted-foreground h-4 flex items-center">
              {item.hours && item.hourly_rate ? (
                <span className="font-medium text-purple-700">
                  = {(item.hours * item.hourly_rate).toLocaleString('cs-CZ')} Kč
                </span>
              ) : (
                'Vyplňte hodiny a sazbu pro výpočet'
              )}
            </p>
          </div>
        </div>
      )}

      {/* Note and adjustment row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div className="col-span-2">
          <Label htmlFor={`note-${item.id}`} className="text-xs text-muted-foreground h-4 flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            Poznámka
          </Label>
          <Textarea
            id={`note-${item.id}`}
            value={item.note || ''}
            onChange={(e) => onUpdate({ note: e.target.value })}
            placeholder="Poznámka pro fakturantku..."
            className="mt-0.5 min-h-[32px] h-8 text-sm resize-none py-1.5"
          />
        </div>

        <div>
          <Label htmlFor={`adj-${item.id}`} className="text-xs text-muted-foreground h-4 flex items-center">Úprava (+/-)</Label>
          <Input
            id={`adj-${item.id}`}
            type="number"
            value={item.adjustment_amount}
            onChange={(e) => onUpdate({ adjustment_amount: Number(e.target.value) })}
            className="mt-0.5 h-8 text-sm"
          />
        </div>

        <div>
          <Label htmlFor={`reason-${item.id}`} className="text-xs text-muted-foreground h-4 flex items-center">Důvod</Label>
          <Input
            id={`reason-${item.id}`}
            value={item.adjustment_reason}
            onChange={(e) => onUpdate({ adjustment_reason: e.target.value })}
            placeholder="Volitelný"
            className="mt-0.5 h-8 text-sm"
          />
        </div>
      </div>

      {/* Footer with calculation, badges and actions */}
      <div className="flex items-center justify-between pt-1 border-t border-dashed">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="text-xs text-muted-foreground">
            {item.hours && item.hourly_rate && (
              <span className="inline-flex items-center gap-1 mr-2">
                <Clock className="h-3 w-3" />
                {item.hours}h × {item.hourly_rate.toLocaleString('cs-CZ')} Kč/h
              </span>
            )}
            {formatCurrency(item.unit_price)} × {item.quantity}
            {item.adjustment_amount !== 0 && (
              <> {item.adjustment_amount > 0 ? '+' : ''}{formatCurrency(item.adjustment_amount)}</>
            )}
            {' = '}<span className="font-medium text-foreground">{formatCurrency(item.final_amount)}</span>
          </div>
          
          {item.currency && item.currency !== currency && (
            <Badge variant="outline" className="text-xs h-5">
              {item.currency}
            </Badge>
          )}
          
          {item.is_reverse_charge && (
            <Badge variant="secondary" className="text-xs h-5 bg-amber-100 text-amber-800 border-amber-300">
              <ArrowRightLeft className="h-3 w-3 mr-1" />
              Přenesená DPH
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          {onDuplicate && (
            <Button variant="ghost" size="sm" onClick={onDuplicate} className="h-6 text-xs px-2">
              <Copy className="h-3 w-3 mr-1" />
              Duplikovat
            </Button>
          )}
          {onRemove && (
            <Button variant="ghost" size="sm" className="text-destructive h-6 text-xs px-2" onClick={onRemove}>
              <Trash2 className="h-3 w-3 mr-1" />
              Odstranit
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
