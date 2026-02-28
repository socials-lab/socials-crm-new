import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: ReactNode;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function KPICard({ title, value, subtitle, icon: Icon, trend, className }: KPICardProps) {
  return (
    <div className={cn(
      'rounded-xl border bg-card p-4 sm:p-5 shadow-sm transition-all duration-200 hover:shadow-lg hover:scale-[1.02] hover:border-primary/30 cursor-default',
      className
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 min-w-0 flex-1">
          <p className="text-xs sm:text-sm font-medium text-muted-foreground leading-tight">{title}</p>
          <p className="text-xl sm:text-2xl font-semibold tracking-tight">{value}</p>
          {subtitle && (
            <div className="text-xs text-muted-foreground leading-tight">{subtitle}</div>
          )}
          {trend && (
            <p className={cn(
              'text-xs font-medium',
              trend.isPositive ? 'text-status-active' : 'text-status-lost'
            )}>
              {trend.isPositive ? '+' : ''}{trend.value}% vs minulý měsíc
            </p>
          )}
        </div>
        {Icon && (
          <div className="rounded-lg bg-primary/10 p-2 sm:p-2.5 shrink-0">
            <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </div>
        )}
      </div>
    </div>
  );
}