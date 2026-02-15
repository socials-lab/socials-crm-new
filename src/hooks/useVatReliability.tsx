import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type VatStatus = 'reliable' | 'unreliable' | 'not_found' | 'error';

interface VatReliabilityResponse {
  dic: string;
  status: VatStatus;
  message?: string;
}

export function useVatReliability(dic: string | null | undefined) {
  return useQuery({
    queryKey: ['vat-reliability', dic],
    queryFn: async (): Promise<VatReliabilityResponse> => {
      if (!dic || dic.length < 10) {
        return { dic: dic || '', status: 'not_found' };
      }

      const { data, error } = await supabase.functions.invoke('vat-reliability', {
        body: { dic },
      });

      if (error) {
        console.error('VAT reliability check failed:', error);
        return { dic, status: 'error', message: error.message };
      }

      return data as VatReliabilityResponse;
    },
    enabled: !!dic && dic.length >= 10,
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
    retry: 1,
  });
}
