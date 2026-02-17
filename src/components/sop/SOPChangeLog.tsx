import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { Clock, Plus, Edit, User } from 'lucide-react';
import { SOPArticle } from '@/hooks/useSOPData';
import { demoProfileNames } from '@/hooks/useSOPData';

interface SOPChangeLogProps {
  article: SOPArticle;
  colleagueNameMap?: Record<string, string>;
}

// Generate realistic demo edit history based on created_at and updated_at
function generateDemoHistory(article: SOPArticle): Array<{ date: string; action: string; user: string }> {
  const entries: Array<{ date: string; action: string; user: string }> = [];

  const creatorName = article.owner_id ? (demoProfileNames[article.owner_id] || 'Neznámý uživatel') : 'Neznámý uživatel';

  entries.push({
    date: article.created_at,
    action: 'Článek vytvořen',
    user: creatorName,
  });

  const created = new Date(article.created_at).getTime();
  const updated = new Date(article.updated_at).getTime();

  if (updated - created > 86400000) {
    // Add 1-2 intermediate edits
    const mid1 = new Date(created + (updated - created) * 0.4);
    const profileIds = Object.keys(demoProfileNames);
    const editorId = profileIds[(profileIds.indexOf(article.owner_id || '') + 1) % profileIds.length];

    entries.push({
      date: mid1.toISOString(),
      action: 'Obsah upraven',
      user: demoProfileNames[editorId] || creatorName,
    });

    if (updated - created > 86400000 * 30) {
      const mid2 = new Date(created + (updated - created) * 0.75);
      entries.push({
        date: mid2.toISOString(),
        action: 'Přílohy aktualizovány',
        user: creatorName,
      });
    }

    entries.push({
      date: article.updated_at,
      action: 'Poslední úprava',
      user: creatorName,
    });
  }

  return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function SOPChangeLog({ article }: SOPChangeLogProps) {
  const history = generateDemoHistory(article);

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
                {i === history.length - 1 ? (
                  <Plus className="h-3.5 w-3.5 text-green-500 mt-0.5" />
                ) : (
                  <Edit className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-foreground">{entry.action}</p>
                <p className="text-xs text-muted-foreground">
                  <User className="h-3 w-3 inline mr-0.5 -mt-0.5" />
                  {entry.user} · {format(new Date(entry.date), 'd. M. yyyy, HH:mm', { locale: cs })}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
