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
      'rounded-xl border bg-card p-4 md:p-5 shadow-sm transition-all duration-200 hover:shadow-lg hover:scale-[1.02] hover:border-primary/30 cursor-default min-w-[160px] md:min-w-0', 
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-0.5 md:space-y-1 min-w-0 flex-1">
          <p className="text-xs md:text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-xl md:text-2xl font-semibold tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
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
          <div className="rounded-lg bg-primary/10 p-2 md:p-2.5 shrink-0 ml-2">
            <Icon className="h-4 w-4 md:h-5 md:w-5 text-primary" />
          </div>
        )}
      </div>
    </div>
  );
}