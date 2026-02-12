import { useQuery } from '@tanstack/react-query';

export type VatPayerStatus = 'reliable' | 'unreliable' | 'not_found' | null;

interface VatReliabilityResult {
  dic: string;
  nespolehlivyPlatce: 'ANO' | 'NE' | 'NENALEZEN';
  vatStatus: VatPayerStatus;
}

export function useVatReliability(dic: string | null | undefined) {
  return useQuery({
    queryKey: ['vat-reliability', dic],
    queryFn: async (): Promise<VatReliabilityResult> => {
      const url = `https://empndmpeyrdycjdesoxr.supabase.co/functions/v1/vat-reliability?dic=${encodeURIComponent(dic!)}`;
      const response = await fetch(url, {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtcG5kbXBleXJkeWNqZGVzb3hyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1OTQ5NTUsImV4cCI6MjA4MTE3MDk1NX0.X3I3FU2QRZD16rLwePdC3C2r7UIlGQuvJ6wWZnzgGEQ',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to check VAT reliability');
      }
      
      return response.json();
    },
    enabled: !!dic && dic.length >= 10,
    staleTime: 60 * 60 * 1000,
    retry: 1,
  });
}
