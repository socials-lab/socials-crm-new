import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { Clock, Plus, Edit, User } from 'lucide-react';
import { SOPArticle } from '@/hooks/useSOPData';

interface SOPChangeLogProps {
  article: SOPArticle;
  colleagueNameMap?: Record<string, string>;
}

export function SOPChangeLog({ article, colleagueNameMap = {} }: SOPChangeLogProps) {
  // Build history from actual article data
  const history: Array<{ date: string; action: string; userId: string | null }> = [];

  // Add creation entry
  history.push({
    date: article.created_at,
    action: 'Článek vytvořen',
    userId: article.created_by,
  });

  // Add last update if different from creation
  const created = new Date(article.created_at).getTime();
  const updated = new Date(article.updated_at).getTime();

  if (updated - created > 60000) { // More than 1 minute difference
    history.push({
      date: article.updated_at,
      action: 'Poslední úprava',
      userId: article.updated_by,
    });
  }

  // Sort by date descending (newest first)
  history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getUserName = (userId: string | null) => {
    if (!userId) return 'Neznámý uživatel';
    return colleagueNameMap[userId] || 'Neznámý uživatel';
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
        <Clock className="h-4 w-4" />
        Historie změn
      </h3>
      <div className="relative pl-4 border-l-2 border-border space-y-3">
        {history.map((entry, i) => (
          <div key={i} className="relative">
            <div className="absolute -left-[calc(1rem+5px)] top-1 h-2.5 w-2.5 rounded-full bg-muted-foreground/40 border-2 border-background" />
            <div className="flex items-start gap-2 text-sm">
              <div className="shrink-0">
                {entry.action === 'Článek vytvořen' ? (
                  <Plus className="h-3.5 w-3.5 text-green-500 mt-0.5" />
                ) : (
                  <Edit className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-foreground">{entry.action}</p>
                <p className="text-xs text-muted-foreground">
                  <User className="h-3 w-3 inline mr-0.5 -mt-0.5" />
                  {getUserName(entry.userId)} · {format(new Date(entry.date), 'd. M. yyyy, HH:mm', { locale: cs })}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
