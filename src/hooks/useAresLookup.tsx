import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useAresLookup() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookupCompany = async (ico: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('ares-lookup', {
        body: { ico },
      });

      if (error) throw error;
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Chyba při vyhledávání';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { lookupCompany, isLoading, error };
}
