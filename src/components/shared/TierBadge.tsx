import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface TierBadgeProps {
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
}

export function TierBadge({ children, className, icon }: TierBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
        'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20',
        className
      )}
    >
      {icon && <span className="mr-1">{icon}</span>}
      {children}
    </span>
  );
}
