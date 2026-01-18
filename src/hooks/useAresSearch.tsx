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

export function useAresSearch() {
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<CompanySearchResult[]>([]);
  
  // Cache for recent searches
  const cacheRef = useRef<Map<string, CompanySearchResult[]>>(new Map());
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const searchCompanies = useCallback(async (query: string): Promise<CompanySearchResult[]> => {
    // Clear previous debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Check cache first
    const cacheKey = query.trim().toLowerCase();
    if (cacheRef.current.has(cacheKey)) {
      const cachedResults = cacheRef.current.get(cacheKey)!;
      setResults(cachedResults);
      return cachedResults;
    }

    // Validate query length
    if (query.trim().length < 3) {
      setResults([]);
      setError(null);
      return [];
    }

    setIsSearching(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('ares-search', {
        body: { query: query.trim() },
      });

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
      const errorMessage = err instanceof Error ? err.message : 'Chyba při vyhledávání';
      setError(errorMessage);
      setResults([]);
      return [];
    } finally {
      setIsSearching(false);
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
      onStart?.();
      searchCompanies(query);
    }, delay);
  }, [searchCompanies]);

  // Clear results
  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
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
