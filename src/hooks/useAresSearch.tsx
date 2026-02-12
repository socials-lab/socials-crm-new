import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CompanySearchResult {
  ico: string;
  name: string;
  dic: string | null;
  address: string;
  billing_street: string;
  billing_city: string;
  billing_zip: string;
  billing_country: string;
  legal_form: string | null;
}

interface SearchResponse {
  companies: CompanySearchResult[];
  error?: string;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Časový limit vypršel')), ms)
    ),
  ]);
}

export function useAresSearch() {
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<CompanySearchResult[]>([]);

  // Cache for recent searches
  const cacheRef = useRef<Map<string, CompanySearchResult[]>>(new Map());
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  // Tracks the latest request - stale requests are ignored
  const requestIdRef = useRef(0);

  const searchCompanies = useCallback(async (query: string): Promise<CompanySearchResult[]> => {
    const requestId = ++requestIdRef.current;

    // Check cache first
    const cacheKey = query.trim().toLowerCase();
    if (cacheRef.current.has(cacheKey)) {
      const cachedResults = cacheRef.current.get(cacheKey)!;
      if (requestId === requestIdRef.current) {
        setResults(cachedResults);
      }
      return cachedResults;
    }

    // Validate query length
    if (query.trim().length < 3) {
      if (requestId === requestIdRef.current) {
        setResults([]);
        setError(null);
      }
      return [];
    }

    if (requestId === requestIdRef.current) {
      setIsSearching(true);
      setError(null);
    }

    try {
      const { data, error: invokeError } = await withTimeout(
        supabase.functions.invoke('ares-search', {
          body: { query: query.trim() },
        }),
        15000
      );

      // Stale request - ignore
      if (requestId !== requestIdRef.current) return [];

      if (invokeError) throw invokeError;

      const response = data as SearchResponse;

      if (response.error) {
        throw new Error(response.error);
      }

      const companies = response.companies || [];

      // Cache results
      cacheRef.current.set(cacheKey, companies);

      // Limit cache size to 50 entries
      if (cacheRef.current.size > 50) {
        const firstKey = cacheRef.current.keys().next().value;
        if (firstKey !== undefined) {
          cacheRef.current.delete(firstKey);
        }
      }

      setResults(companies);
      return companies;
    } catch (err) {
      // Stale request - ignore
      if (requestId !== requestIdRef.current) return [];
      const errorMessage = err instanceof Error ? err.message : 'Chyba při vyhledávání';
      setError(errorMessage);
      setResults([]);
      return [];
    } finally {
      // Only the latest request controls loading state
      if (requestId === requestIdRef.current) {
        setIsSearching(false);
      }
    }
  }, []);

  // Debounced search function
  const debouncedSearch = useCallback((query: string, delay: number = 300, onStart?: () => void) => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null;
      onStart?.();
      searchCompanies(query);
    }, delay);
  }, [searchCompanies]);

  // Clear results and cancel any in-flight requests
  const clearResults = useCallback(() => {
    // Bump request ID so any in-flight request is ignored when it resolves
    requestIdRef.current++;
    setResults([]);
    setError(null);
    setIsSearching(false);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      requestIdRef.current++;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    searchCompanies,
    debouncedSearch,
    clearResults,
    results,
    isSearching,
    error,
  };
}
