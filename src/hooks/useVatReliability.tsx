import { useQuery } from '@tanstack/react-query';
import { invokeWithTimeout } from '@/lib/supabaseUtils';

export type VatStatus = 'reliable' | 'unreliable' | 'not_found' | 'error';

interface VatReliabilityResponse {
  dic: string;
  status: VatStatus;
  message?: string;
  requestId?: string;
  elapsedMs?: number;
  upstreamStatus?: number;
}

export function useVatReliability(dic: string | null | undefined) {
  return useQuery({
    queryKey: ['vat-reliability', dic],
    queryFn: async (): Promise<VatReliabilityResponse> => {
      if (!dic || dic.length < 10) {
        return { dic: dic || '', status: 'not_found' };
      }

      const startedAt = performance.now();
      const { data, error } = await invokeWithTimeout<VatReliabilityResponse>(
        'vat-reliability',
        { body: { dic } },
        12000
      );
      const elapsedMs = Math.round(performance.now() - startedAt);

      if (error) {
        const isTimeout = error.message?.includes('Požadavek vypršel');
        console.error('VAT reliability check failed:', {
          dic,
          elapsedMs,
          timeout: isTimeout,
          error: error.message,
        });

        return {
          dic,
          status: 'error',
          message: error.message,
          elapsedMs,
        };
      }

      const result = data as VatReliabilityResponse;

      // Keep noisy logs only for failures / suspicious responses
      if (!result || result.status === 'error') {
        console.error('VAT reliability check returned error response:', {
          dic,
          elapsedMs,
          response: result,
        });
      }

      return result;
    },
    enabled: !!dic && dic.length >= 10,
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
    retry: 1,
  });
}
