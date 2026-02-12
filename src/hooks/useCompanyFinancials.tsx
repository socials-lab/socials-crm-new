import { useQuery } from '@tanstack/react-query';

export interface CompanyFinancialsData {
  ico: string;
  name: string | null;
  datoveSchranky: string[];
  zalozena: string | null;
  obrat: string | null;
  pocetZamestnancu: string | null;
  oborPodnikani: string | null;
  platceDPH: string | null;
  nespolehlivyPlatce: string | null;
  dluhVZP: string | null;
  rizika: string | null;
  profileUrl: string;
}

export function useCompanyFinancials(ico: string | null | undefined) {
  return useQuery({
    queryKey: ['company-financials', ico],
    queryFn: async (): Promise<CompanyFinancialsData> => {
      const response = await fetch(
        `https://empndmpeyrdycjdesoxr.supabase.co/functions/v1/company-financials?ico=${encodeURIComponent(ico!)}`,
        {
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtcG5kbXBleXJkeWNqZGVzb3hyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1OTQ5NTUsImV4cCI6MjA4MTE3MDk1NX0.X3I3FU2QRZD16rLwePdC3C2r7UIlGQuvJ6wWZnzgGEQ',
          },
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed to fetch financials: ${errText}`);
      }

      return response.json();
    },
    enabled: !!ico && ico.length >= 2,
    staleTime: 1000 * 60 * 60, // 1 hour cache
    retry: 1,
  });
}
