import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Časový limit vypršel')), ms)
    ),
  ]);
}

export function useAresLookup() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function lookupCompany(ico: string) {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await withTimeout(
        supabase.functions.invoke('ares-lookup', {
          body: { ico },
        }),
        15000
      );

      if (error) throw error;
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Chyba při vyhledávání';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }

  return { lookupCompany, isLoading, error };
}
