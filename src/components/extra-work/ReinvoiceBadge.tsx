import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { ClientReinvoiceStatus } from '@/types/crm';
import { ArrowRightLeft, CheckCircle2, MinusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReinvoiceBadgeProps {
  status: ClientReinvoiceStatus;
  note?: string | null;
  className?: string;
}

const CONFIG: Record<ClientReinvoiceStatus, {
  label: string;
  icon: typeof CheckCircle2;
  className: string;
}> = {
  expected: {
    label: 'Čeká na přefakturaci',
    icon: ArrowRightLeft,
    className: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  },
  reinvoiced: {
    label: 'Přefakturováno',
    icon: CheckCircle2,
    className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  },
  not_expected: {
    label: 'Bez přefakturace',
    icon: MinusCircle,
    className: 'bg-muted text-muted-foreground border-muted-foreground/20',
  },
};

export function ReinvoiceBadge({ status, note, className }: ReinvoiceBadgeProps) {
  const { label, icon: Icon, className: statusClassName } = CONFIG[status];

  const badge = (
    <Badge
      variant="outline"
      className={cn('gap-1 font-medium text-[10px] px-1.5 py-0', statusClassName, className)}
    >
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );

  if (note) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{badge}</TooltipTrigger>
          <TooltipContent><p className="text-xs max-w-[200px]">{note}</p></TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badge;
}
