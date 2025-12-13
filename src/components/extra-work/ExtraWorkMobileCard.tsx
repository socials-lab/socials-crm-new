import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { statusConfig } from './ExtraWorkStatusBadge';
import { MoreVertical, Trash2, Eye } from 'lucide-react';
import type { ExtraWork, ExtraWorkStatus } from '@/types/crm';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ExtraWorkMobileCardProps {
  work: ExtraWork;
  clientName?: string;
  engagementName?: string;
  colleagueName?: string;
  isSelected: boolean;
  onSelect: () => void;
  onStatusChange: (status: ExtraWorkStatus) => void;
  onDelete: () => void;
  onView?: () => void;
}

export function ExtraWorkMobileCard({
  work,
  clientName,
  engagementName,
  colleagueName,
  isSelected,
  onSelect,
  onStatusChange,
  onDelete,
  onView,
}: ExtraWorkMobileCardProps) {
  const config = statusConfig[work.status];
  const isInvoiced = work.status === 'invoiced';

  const formatCurrency = (amount: number, currency: string = 'CZK') => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatMonthLabel = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return format(date, 'LLL yyyy', { locale: cs });
  };

  return (
    <Card className={cn(
      'touch-manipulation',
      isSelected && 'ring-2 ring-primary',
      isInvoiced && 'opacity-60'
    )}>
      <CardContent className="p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <Checkbox
              checked={isSelected}
              onCheckedChange={onSelect}
              disabled={isInvoiced}
              className="mt-1"
            />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm truncate">{work.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {engagementName || '—'} • {clientName}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover">
              {onView && (
                <DropdownMenuItem onClick={onView}>
                  <Eye className="h-4 w-4 mr-2" />
                  Zobrazit
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                onClick={onDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Smazat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Details row */}
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="text-muted-foreground">{colleagueName}</span>
          <span className="font-medium">{formatCurrency(work.amount, work.currency)}</span>
        </div>

        {/* Hours calculation if available */}
        {work.hours_worked && work.hourly_rate && (
          <p className="text-xs text-muted-foreground">
            {work.hours_worked}h × {work.hourly_rate} {work.currency}/h
          </p>
        )}

        {/* Footer row */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t">
          <Badge variant="outline" className="text-xs">
            {formatMonthLabel(work.billing_period)}
          </Badge>
          
          <Select
            value={work.status}
            onValueChange={(val) => onStatusChange(val as ExtraWorkStatus)}
            disabled={isInvoiced}
          >
            <SelectTrigger className={cn(
              'h-8 w-auto min-w-[140px] text-xs',
              config.className
            )}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="pending_approval">Čeká na schválení</SelectItem>
              <SelectItem value="in_progress">V procesu</SelectItem>
              <SelectItem value="ready_to_invoice">K fakturaci</SelectItem>
              <SelectItem value="invoiced" disabled>Vyfakturováno</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
