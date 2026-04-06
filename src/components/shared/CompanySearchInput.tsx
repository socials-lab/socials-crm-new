import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Loader2, Building2, MapPin } from 'lucide-react';
import { useAresSearch, type CompanySearchResult } from '@/hooks/useAresSearch';
import { cn } from '@/lib/utils';

interface CompanySearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (company: CompanySearchResult) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  selectValueField?: 'name' | 'ico';
}

export function CompanySearchInput({
  value,
  onChange,
  onSelect,
  placeholder = 'Zadejte název firmy...',
  disabled = false,
  className,
  selectValueField = 'name',
}: CompanySearchInputProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [isPending, setIsPending] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const pointerSelectionRef = useRef(false);
  const { debouncedSearch, results, isSearching, error, clearResults } = useAresSearch();

  // Sync input value with prop value
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Handle input change
  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    onChange(newValue);

    if (newValue.trim().length >= 3) {
      setOpen(true);
      setIsPending(true);
      debouncedSearch(newValue, 300, () => setIsPending(false));
    } else {
      setOpen(false);
      setIsPending(false);
      clearResults();
    }
  };

  // Handle company selection
  const handleSelect = (company: CompanySearchResult) => {
    console.debug('[CompanySearchInput] company selected', {
      ico: company.ico,
      name: company.name,
    });

    const selectedValue = selectValueField === 'ico' ? company.ico : company.name;
    setInputValue(selectedValue);
    onChange(selectedValue);
    setOpen(false);
    setIsPending(false);
    clearResults();
    onSelect?.(company);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showLoading = isPending || isSearching;

  return (
    <div className={cn('relative', className)} ref={containerRef}>
      <div className="relative">
        <Input
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            if (inputValue.trim().length >= 3 && results.length > 0) {
              setOpen(true);
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full"
        />
        {showLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {open && inputValue.trim().length >= 3 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md">
          <div className="max-h-[300px] overflow-y-auto overscroll-contain">
            {error && (
              <div className="py-4 px-3 text-center text-sm text-destructive">
                {error}
              </div>
            )}
            {!error && showLoading && results.length === 0 && (
              <div className="py-4 px-3 text-center text-sm text-muted-foreground">
                Vyhledávám...
              </div>
            )}
            {!error && !showLoading && results.length === 0 && (
              <div className="py-4 px-3 text-center text-sm text-muted-foreground">
                Žádné výsledky
              </div>
            )}
            {!error && results.length > 0 && (
              <div className="p-1">
                {results.map((company) => (
                  <button
                    key={company.ico}
                    type="button"
                    onPointerDown={(event) => {
                      // Pointer down is the most reliable in dialogs/focus traps.
                      pointerSelectionRef.current = true;
                      event.preventDefault();
                      event.stopPropagation();
                      handleSelect(company);
                    }}
                    onClick={(event) => {
                      // Fallback for keyboard activation (Enter/Space).
                      event.preventDefault();
                      event.stopPropagation();

                      if (pointerSelectionRef.current) {
                        pointerSelectionRef.current = false;
                        return;
                      }

                      handleSelect(company);
                    }}
                    className="flex flex-col gap-1 w-full p-2 rounded-sm cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="font-medium text-sm">{company.name}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground ml-6">
                      <span>IČO: {company.ico}</span>
                      {company.dic && <span>DIČ: {company.dic}</span>}
                    </div>
                    {company.address && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground ml-6">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{company.address}</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
