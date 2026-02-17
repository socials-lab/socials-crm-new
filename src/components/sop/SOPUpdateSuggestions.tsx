import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';

export interface SOPSuggestion {
  id: string;
  article_id: string;
  suggested_by: string;
  suggested_by_name?: string;
  reason: string;
  status: 'pending' | 'accepted' | 'dismissed';
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
}

interface SOPUpdateSuggestionsProps {
  suggestions: SOPSuggestion[];
  onResolve: (id: string, status: 'accepted' | 'dismissed') => Promise<void>;
}

export function SOPUpdateSuggestions({ suggestions, onResolve }: SOPUpdateSuggestionsProps) {
  const pending = suggestions.filter(s => s.status === 'pending');
  const resolved = suggestions.filter(s => s.status !== 'pending');

  if (suggestions.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">
        Návrhy na úpravu {pending.length > 0 && <Badge variant="destructive" className="ml-1.5 text-[10px]">{pending.length}</Badge>}
      </h3>
      <div className="space-y-2">
        {pending.map(s => (
          <Card key={s.id} className="border-orange-200 dark:border-orange-800/50">
            <CardContent className="p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{s.reason}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {s.suggested_by_name || 'Neznámý uživatel'} · {s.created_at ? format(new Date(s.created_at), 'd. M. yyyy', { locale: cs }) : ''}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600" onClick={() => onResolve(s.id, 'accepted')}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => onResolve(s.id, 'dismissed')}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {resolved.length > 0 && (
          <details className="text-sm">
            <summary className="text-muted-foreground cursor-pointer hover:text-foreground">
              Vyřešené návrhy ({resolved.length})
            </summary>
            <div className="space-y-2 mt-2">
              {resolved.map(s => (
                <Card key={s.id} className="opacity-60">
                  <CardContent className="p-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={s.status === 'accepted' ? 'default' : 'secondary'} className="text-[10px]">
                        {s.status === 'accepted' ? 'Přijato' : 'Zamítnuto'}
                      </Badge>
                      <span className="text-xs">{s.reason.substring(0, 80)}{s.reason.length > 80 ? '...' : ''}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Navrhl/a: {s.suggested_by_name || 'Neznámý uživatel'} · {s.created_at ? format(new Date(s.created_at), 'd. M. yyyy', { locale: cs }) : ''}
                      {s.resolved_at && <> · Vyřešeno: {format(new Date(s.resolved_at), 'd. M. yyyy', { locale: cs })}</>}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
