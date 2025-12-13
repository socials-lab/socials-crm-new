import { Badge } from '@/components/ui/badge';
import type { ExtraWorkStatus } from '@/types/crm';
import { Clock, Loader2, FileText, Receipt } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExtraWorkStatusBadgeProps {
  status: ExtraWorkStatus;
  className?: string;
}

export const statusConfig: Record<ExtraWorkStatus, {
  label: string;
  icon: typeof Clock;
  className: string;
}> = {
  pending_approval: {
    label: 'Čeká na schválení',
    icon: Clock,
    className: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  },
  in_progress: {
    label: 'V procesu',
    icon: Loader2,
    className: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  },
  ready_to_invoice: {
    label: 'K fakturaci',
    icon: FileText,
    className: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  },
  invoiced: {
    label: 'Vyfakturováno',
    icon: Receipt,
    className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  },
};

export function ExtraWorkStatusBadge({ status, className }: ExtraWorkStatusBadgeProps) {
  const { label, icon: Icon, className: statusClassName } = statusConfig[status];

  return (
    <Badge 
      variant="outline" 
      className={cn('gap-1 font-medium', statusClassName, className)}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </Badge>
  );
}