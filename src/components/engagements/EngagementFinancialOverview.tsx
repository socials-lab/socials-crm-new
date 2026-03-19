import { useEffect, useMemo, useState } from 'react';
import { DollarSign, Info, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import type { EngagementAssignment } from '@/types/crm';
import { convertCurrencyAmount } from '@/lib/currency';

interface EngagementFinancialOverviewProps {
  revenue: number;
  assignments: EngagementAssignment[];
  currency: string;
  estimatedCbCost: number;
}

export function EngagementFinancialOverview({
  revenue,
  assignments,
  currency,
  estimatedCbCost,
}: EngagementFinancialOverviewProps) {
  const [normalizedRevenueCZK, setNormalizedRevenueCZK] = useState<number>(0);
  const [conversionRate, setConversionRate] = useState<number | null>(null);
  const [conversionDate, setConversionDate] = useState<string | null>(null);
  const [conversionError, setConversionError] = useState<string | null>(null);
  const [isLoadingConversion, setIsLoadingConversion] = useState<boolean>(false);

  const assignmentCostCZK = useMemo(
    () => assignments.reduce((sum, assignment) => sum + (assignment.monthly_cost || 0), 0),
    [assignments],
  );
  const totalCostCZK = assignmentCostCZK + estimatedCbCost;

  useEffect(() => {
    let cancelled = false;
    setConversionError(null);
    setIsLoadingConversion(currency !== 'CZK');

    async function normalizeRevenue() {
      if (currency === 'CZK') {
        if (cancelled) return;
        setNormalizedRevenueCZK(revenue);
        setConversionRate(1);
        setConversionDate(null);
        setIsLoadingConversion(false);
        return;
      }

      const conversion = await convertCurrencyAmount(revenue, currency, 'CZK');
      if (cancelled) return;
      setNormalizedRevenueCZK(conversion.amount);
      setConversionRate(conversion.rate);
      setConversionDate(conversion.providerDate);
      setIsLoadingConversion(false);
    }

    normalizeRevenue().catch((error) => {
      if (cancelled) return;
      const message = error instanceof Error ? error.message : 'Nepodařilo se přepočítat tržby do CZK';
      setConversionError(message);
      setIsLoadingConversion(false);
    });

    return () => {
      cancelled = true;
    };
  }, [revenue, currency]);

  if (conversionError) {
    return (
      <div className="mb-6 p-4 rounded-lg border bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800">
        <h4 className="font-medium text-sm flex items-center gap-2 mb-1">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          Finanční přehled
        </h4>
        <p className="text-sm text-destructive">
          Přepočet měny selhal: {conversionError}
        </p>
      </div>
    );
  }

  if (isLoadingConversion) {
    return (
      <div className="mb-6 p-4 rounded-lg border bg-muted/30">
        <h4 className="font-medium text-sm flex items-center gap-2 mb-1">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          Finanční přehled
        </h4>
        <p className="text-sm text-muted-foreground">Načítám kurz pro přepočet do CZK...</p>
      </div>
    );
  }

  const totalCost = totalCostCZK;
  const margin = normalizedRevenueCZK - totalCost;
  const marginPercent = normalizedRevenueCZK > 0 ? (margin / normalizedRevenueCZK) * 100 : 0;
  const hasEstimate = estimatedCbCost > 0;

  function getMarginColor(percent: number): string {
    if (percent >= 40) return 'text-green-600 dark:text-green-400';
    if (percent >= 20) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  }

  function getMarginBackground(percent: number): string {
    if (percent >= 40) return 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800';
    if (percent >= 20) return 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800';
    return 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800';
  }

  const MarginIcon = marginPercent >= 40 ? TrendingUp : marginPercent >= 20 ? Minus : TrendingDown;

  return (
    <div className={`mb-6 p-4 rounded-lg border ${getMarginBackground(marginPercent)}`}>
      <h4 className="font-medium text-sm flex items-center gap-2 mb-3">
        <DollarSign className="h-4 w-4 text-muted-foreground" />
        Finanční přehled
        {hasEstimate && (
          <span className="text-[10px] font-normal text-muted-foreground flex items-center gap-1">
            <Info className="h-3 w-3" />
            vč. odhadu CB při 100% čerpání
          </span>
        )}
      </h4>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Fakturace (vizuálně CZK)</p>
          <p className="text-sm font-semibold">
            {normalizedRevenueCZK.toLocaleString()} CZK
          </p>
          {currency !== 'CZK' && conversionRate && (
            <p className="text-[11px] text-muted-foreground mt-1">
              Právní měna: {revenue.toLocaleString()} {currency} (kurz {conversionRate.toFixed(4)}{conversionDate ? `, ${conversionDate}` : ''})
            </p>
          )}
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Náklady {hasEstimate ? '(odhad, CZK)' : '(CZK)'}</p>
          <p className="text-sm font-semibold">
            {totalCost.toLocaleString()} CZK
          </p>
          {hasEstimate && (
            <p className="text-[11px] text-muted-foreground mt-1">
              Fixní: {assignmentCostCZK.toLocaleString()} + CB: ~{estimatedCbCost.toLocaleString()} CZK
            </p>
          )}
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Marže {hasEstimate ? '(odhad, CZK)' : '(CZK)'}</p>
          <p className={`text-sm font-semibold flex items-center gap-1 ${getMarginColor(marginPercent)}`}>
            <MarginIcon className="h-3.5 w-3.5" />
            {margin.toLocaleString()} CZK
            <span className="text-xs font-normal">({marginPercent.toFixed(0)}%)</span>
          </p>
        </div>
      </div>
    </div>
  );
}
