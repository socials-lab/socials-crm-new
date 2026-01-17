import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

type BadgeColor = 'green' | 'red' | 'yellow' | 'amber' | 'blue' | 'purple' | 'emerald';

interface ColorBadgeProps {
  color: BadgeColor;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
}

const colorConfig: Record<BadgeColor, string> = {
  green: 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200',
  red: 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200',
  yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200',
  amber: 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200',
  blue: 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200',
  purple: 'bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200',
  emerald: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20',
};

export function ColorBadge({ color, children, className, icon }: ColorBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
        colorConfig[color],
        className
      )}
    >
      {icon && <span className="mr-1">{icon}</span>}
      {children}
    </span>
  );
}
