import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getExchangeRate } from '@/lib/currency';

export function useCzkEurRate() {
  const query = useQuery({
    queryKey: ['exchange-rate', 'CZK', 'EUR'],
    queryFn: () => getExchangeRate('CZK', 'EUR'),
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 2,
    retry: 1,
  });

  const eurRate = query.data?.rate ?? null;
  const rateDate = query.data?.providerDate ?? null;

  const convertCzkToEur = useMemo(
    () => (amountCzk: number): number | null => {
      if (!eurRate || !Number.isFinite(amountCzk)) return null;
      return Number((amountCzk * eurRate).toFixed(2));
    },
    [eurRate],
  );

  return {
    eurRate,
    rateDate,
    convertCzkToEur,
    isLoadingRate: query.isLoading,
    rateError: query.error instanceof Error ? query.error.message : null,
  };
}
