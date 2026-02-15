import { ExternalLink } from 'lucide-react';

interface CompanyFinancialsProps {
  ico: string;
}

export function CompanyFinancials({ ico }: CompanyFinancialsProps) {
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
