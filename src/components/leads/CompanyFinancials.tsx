import { ExternalLink, Banknote, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useCompanyFinancials } from '@/hooks/useCompanyFinancials';

interface CompanyFinancialsProps {
  ico: string;
}

export function CompanyFinancials({ ico }: CompanyFinancialsProps) {
  const { data, isLoading, isError } = useCompanyFinancials(ico);

  if (isLoading) {
    return (
      <div className="space-y-2 pt-1">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="text-xs text-muted-foreground pt-1">
        <a
          href={`https://www.hlidacstatu.cz/subjekt/${ico}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline inline-flex items-center gap-1"
        >
          Zobrazit na Hlídači státu
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-2.5 pt-1">
      {/* Subsidies */}
      {data.dotace && data.dotace !== 'žádné' && (
        <div className="flex items-center gap-1.5 text-xs text-amber-600">
          <Banknote className="h-3 w-3" />
          <span>Dotace: {data.dotace}</span>
        </div>
      )}

      {/* Insolvency warning */}
      {data.insolvence && (
        <div className="flex items-center gap-1.5 text-xs text-destructive">
          <AlertTriangle className="h-3 w-3" />
          <span>Insolvence: {data.insolvence}</span>
        </div>
      )}
    </div>
  );
}
