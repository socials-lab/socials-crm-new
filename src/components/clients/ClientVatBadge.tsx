import { ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react';
import { useVatReliability } from '@/hooks/useVatReliability';

interface ClientVatBadgeProps {
  dic: string;
}

export function ClientVatBadge({ dic }: ClientVatBadgeProps) {
  const { data, isLoading } = useVatReliability(dic);

  if (isLoading) {
    return <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />;
  }

  if (!data || data.vatStatus === 'not_found') return null;

  if (data.vatStatus === 'reliable') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-green-600" title="Spolehlivý plátce DPH">
        <ShieldCheck className="h-3.5 w-3.5" />
        Spolehlivý
      </span>
    );
  }

  if (data.vatStatus === 'unreliable') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-destructive" title="Nespolehlivý plátce DPH">
        <ShieldAlert className="h-3.5 w-3.5" />
        Nespolehlivý
      </span>
    );
  }

  return null;
}
