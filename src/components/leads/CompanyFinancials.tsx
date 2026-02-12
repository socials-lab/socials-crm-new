import { ExternalLink, Building2, Users, Banknote, Shield, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useCompanyFinancials } from '@/hooks/useCompanyFinancials';
import { cn } from '@/lib/utils';

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

  const hasFinancialData = data.obrat || data.pocetZamestnancu;

  return (
    <div className="space-y-2 pt-1">
      {/* Company name confirmation */}
      {data.name && (
        <div className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{data.name}</span>
          {data.datoveSchranky?.length > 0 && (
            <span className="ml-2">DS: {data.datoveSchranky.join(', ')}</span>
          )}
        </div>
      )}

      {/* Financial data (if available from premium API) */}
      {hasFinancialData && (
        <div className="grid grid-cols-2 gap-2">
          {data.obrat && (
            <div className="rounded-lg border bg-card p-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <Banknote className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Obrat</span>
              </div>
              <p className="text-sm font-semibold">{data.obrat}</p>
            </div>
          )}
          {data.pocetZamestnancu && (
            <div className="rounded-lg border bg-card p-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Zaměstnanci</span>
              </div>
              <p className="text-sm font-semibold">{data.pocetZamestnancu}</p>
            </div>
          )}
        </div>
      )}

      {/* Risk info */}
      {data.rizika && (
        <div className="flex items-center gap-1.5 text-xs text-amber-600">
          <AlertTriangle className="h-3 w-3" />
          <span>{data.rizika}</span>
        </div>
      )}

      {/* DPH info */}
      {data.nespolehlivyPlatce && data.nespolehlivyPlatce !== '0' && (
        <div className="flex items-center gap-1.5 text-xs text-destructive">
          <Shield className="h-3 w-3" />
          <span>Nespolehlivý plátce DPH</span>
        </div>
      )}

      {/* VZP debt */}
      {data.dluhVZP && data.dluhVZP !== 'ne' && data.dluhVZP !== '0' && (
        <div className="flex items-center gap-1.5 text-xs text-destructive">
          <AlertTriangle className="h-3 w-3" />
          <span>Dluh VZP: {data.dluhVZP}</span>
        </div>
      )}

      {/* Link to full profile */}
      <a
        href={data.profileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline inline-flex items-center gap-1 text-xs"
      >
        Zobrazit na Hlídači státu
        <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}
