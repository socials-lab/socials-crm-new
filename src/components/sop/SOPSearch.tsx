import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface SOPSearchProps {
  value: string;
  onChange: (value: string) => void;
  allTags: string[];
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
}

export function SOPSearch({ value, onChange, allTags, selectedTags, onToggleTag }: SOPSearchProps) {
  return (
    <div className="space-y-3">
      <div className="relative max-w-lg w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Hledat v SOP..."
          className="pl-10 pr-8"
        />
        {value && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
            onClick={() => onChange('')}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
      {allTags.length > 0 && (
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-1.5 pb-1">
            {allTags.map(tag => (
              <Badge
                key={tag}
                variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                className="cursor-pointer text-xs shrink-0 select-none"
                onClick={() => onToggleTag(tag)}
              >
                {tag}
              </Badge>
            ))}
            {selectedTags.length > 0 && (
              <Button variant="ghost" size="sm" className="h-5 text-xs px-2 text-muted-foreground" onClick={() => selectedTags.forEach(t => onToggleTag(t))}>
                Zrušit filtry
              </Button>
            )}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}
    </div>
  );
}
