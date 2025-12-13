import { cn } from '@/lib/utils';
import type { ClientStatus, EngagementStatus, ColleagueStatus } from '@/types/crm';

type StatusType = ClientStatus | EngagementStatus | ColleagueStatus;

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  // Client statuses
  active: { label: 'Aktivní', className: 'bg-status-active/10 text-status-active border-status-active/20' },
  paused: { label: 'Pozastaveno', className: 'bg-status-paused/10 text-status-paused border-status-paused/20' },
  lead: { label: 'Lead', className: 'bg-status-lead/10 text-status-lead border-status-lead/20' },
  lost: { label: 'Ztraceno', className: 'bg-status-lost/10 text-status-lost border-status-lost/20' },
  potential: { label: 'Potenciální', className: 'bg-status-potential/10 text-status-potential border-status-potential/20' },
  // Engagement statuses
  planned: { label: 'Plánováno', className: 'bg-status-lead/10 text-status-lead border-status-lead/20' },
  completed: { label: 'Dokončeno', className: 'bg-muted text-muted-foreground border-border' },
  cancelled: { label: 'Zrušeno', className: 'bg-status-lost/10 text-status-lost border-status-lost/20' },
  // Colleague statuses
  on_hold: { label: 'Pozastaveno', className: 'bg-status-paused/10 text-status-paused border-status-paused/20' },
  left: { label: 'Odešel/la', className: 'bg-muted text-muted-foreground border-border' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  if (!config) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}