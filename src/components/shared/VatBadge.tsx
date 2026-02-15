import { ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useVatReliability, type VatStatus } from '@/hooks/useVatReliability';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface VatBadgeProps {
  dic: string | null | undefined;
  className?: string;
}

export function VatBadge({ dic, className }: VatBadgeProps) {
  const { data, isLoading, isError } = useVatReliability(dic);

  if (!dic || dic.length < 10) {
    return null;
  }

  if (isLoading) {
    return (
      <Badge variant="outline" className={className}>
        <Loader2 className="h-3 w-3 animate-spin mr-1" />
        Ověřuji...
      </Badge>
    );
  }

  if (isError || !data || data.status === 'error' || data.status === 'not_found') {
    return null;
  }

  const isReliable = data.status === 'reliable';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant={isReliable ? 'default' : 'destructive'}
            className={className}
          >
            {isReliable ? (
              <>
                <ShieldCheck className="h-3 w-3 mr-1" />
                Spolehlivý
              </>
            ) : (
              <>
                <ShieldAlert className="h-3 w-3 mr-1" />
                Nespolehlivý
              </>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          {isReliable
            ? 'Spolehlivý plátce DPH dle MFČR'
            : 'Nespolehlivý plátce DPH dle MFČR - pozor na riziko ručení!'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
