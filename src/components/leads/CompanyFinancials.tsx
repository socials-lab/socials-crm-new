import { ExternalLink, Building2, Calendar, FileText, Banknote, Shield, AlertTriangle, Landmark } from 'lucide-react';
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
      {/* Company name */}
      {data.name && (
        <div className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{data.name}</span>
          {data.datoveSchranky?.length > 0 && (
            <span className="ml-2">DS: {data.datoveSchranky.join(', ')}</span>
          )}
        </div>
      )}

      {/* Key info grid */}
      <div className="grid grid-cols-2 gap-2">
        {data.zalozena && (
          <div className="rounded-lg border bg-card p-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Založeno</span>
            </div>
            <p className="text-sm font-semibold">{data.zalozena}</p>
          </div>
        )}
        {data.zakladniKapital && (
          <div className="rounded-lg border bg-card p-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <Landmark className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Základní kapitál</span>
            </div>
            <p className="text-sm font-semibold">{data.zakladniKapital}</p>
          </div>
        )}
      </div>

      {/* Contracts summary */}
      {data.smlouvyCount !== null && data.smlouvyCount !== undefined && (
        <div className="rounded-lg border bg-card p-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Registr smluv</span>
          </div>
          <p className="text-sm font-semibold">
            {data.smlouvyCount} smluv
            {data.smlouvyTotal && data.smlouvyTotal !== '0' && ` za ${data.smlouvyTotal} Kč`}
          </p>
          {data.smlouvyRok && data.smlouvyRokCount !== null && (
            <p className="text-xs text-muted-foreground mt-0.5">
              V {data.smlouvyRok}: {data.smlouvyRokCount} smluv
              {data.smlouvyRokTotal && data.smlouvyRokTotal !== '0' && ` za ${data.smlouvyRokTotal} Kč`}
            </p>
          )}
        </div>
      )}

      {/* DPH info */}
      {data.dic && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Shield className="h-3 w-3" />
          <span>DIČ: {data.dic} · Plátce DPH</span>
        </div>
      )}

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

      {/* Links */}
      <div className="flex flex-wrap gap-3">
        <a
          href={data.profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline inline-flex items-center gap-1 text-xs"
        >
          Hlídač státu
          <ExternalLink className="h-3 w-3" />
        </a>
        <a
          href={data.kurzyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline inline-flex items-center gap-1 text-xs"
        >
          Kurzy.cz
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
