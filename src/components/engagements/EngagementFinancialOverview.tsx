import { TrendingUp, TrendingDown, DollarSign, Receipt, Minus } from 'lucide-react';
import type { EngagementAssignment } from '@/types/crm';

interface EngagementFinancialOverviewProps {
  revenue: number;
  assignments: EngagementAssignment[];
  currency: string;
}

export function EngagementFinancialOverview({ revenue, assignments, currency }: EngagementFinancialOverviewProps) {
  const totalCost = assignments.reduce((sum, a) => sum + (a.monthly_cost || 0), 0);
  const margin = revenue - totalCost;
  const marginPercent = revenue > 0 ? ((margin / revenue) * 100) : 0;

  const getMarginColor = (pct: number) => {
    if (pct >= 40) return 'text-green-600 dark:text-green-400';
    if (pct >= 20) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getMarginBg = (pct: number) => {
    if (pct >= 40) return 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800';
    if (pct >= 20) return 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800';
    return 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800';
  };

  const MarginIcon = marginPercent >= 40 ? TrendingUp : marginPercent >= 20 ? Minus : TrendingDown;

  return (
    <div className={`mb-6 p-4 rounded-lg border ${getMarginBg(marginPercent)}`}>
      <h4 className="font-medium text-sm flex items-center gap-2 mb-3">
        <DollarSign className="h-4 w-4 text-muted-foreground" />
        Finanční přehled
      </h4>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Fakturace</p>
          <p className="text-sm font-semibold">
            {revenue.toLocaleString()} {currency}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Náklady</p>
          <p className="text-sm font-semibold">
            {totalCost.toLocaleString()} {currency}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Marže</p>
          <p className={`text-sm font-semibold flex items-center gap-1 ${getMarginColor(marginPercent)}`}>
            <MarginIcon className="h-3.5 w-3.5" />
            {margin.toLocaleString()} {currency}
            <span className="text-xs font-normal">
              ({marginPercent.toFixed(0)}%)
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
