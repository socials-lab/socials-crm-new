import { TrendingUp, TrendingDown, DollarSign, Minus, Palette } from 'lucide-react';
import type { EngagementAssignment, EngagementService } from '@/types/crm';

interface EngagementFinancialOverviewProps {
  revenue: number;
  assignments: EngagementAssignment[];
  currency: string;
  engagementServices?: EngagementService[];
}

export function EngagementFinancialOverview({ revenue, assignments, currency, engagementServices = [] }: EngagementFinancialOverviewProps) {
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

  // Find Creative Boost services for breakdown
  const cbServices = engagementServices.filter(s => s.is_active && s.creative_boost_max_credits);
  const cbTotal = cbServices.reduce((sum, s) => {
    const maxCredits = s.creative_boost_max_credits || 0;
    const pricePerCredit = s.creative_boost_price_per_credit || 400;
    return sum + (maxCredits * pricePerCredit);
  }, 0);
  const otherTotal = revenue - cbTotal;

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
          {cbServices.length > 0 && (
            <div className="mt-1.5 space-y-0.5">
              {otherTotal > 0 && (
                <p className="text-[10px] text-muted-foreground">
                  Služby: {otherTotal.toLocaleString()} {currency}
                </p>
              )}
              {cbServices.map(s => (
                <p key={s.id} className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Palette className="h-2.5 w-2.5" />
                  {s.name}: {((s.creative_boost_max_credits || 0) * (s.creative_boost_price_per_credit || 0)).toLocaleString()} {currency}
                  <span className="opacity-70">
                    ({s.creative_boost_max_credits} kr × {s.creative_boost_price_per_credit} {currency})
                  </span>
                </p>
              ))}
            </div>
          )}
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
