import { useState } from 'react';

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
      // Use direct fetch to avoid Supabase auth issues
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await withTimeout(
        fetch(`${supabaseUrl}/functions/v1/ares-lookup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({ ico }),
        }),
        20000
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      console.error('ARES lookup error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Chyba při vyhledávání';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }

  return { lookupCompany, isLoading, error };
}
