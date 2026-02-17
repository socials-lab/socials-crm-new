import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';
import type { SOPArticle } from '@/hooks/useSOPData';

interface SOPArticleCardProps {
  article: SOPArticle;
  onClick: () => void;
  highlightQuery?: string;
  categoryName?: string;
}

function highlightText(text: string, query: string) {
  if (!query) return text;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5">{part}</mark>
      : part
  );
}

export function SOPArticleCard({ article, onClick, highlightQuery, categoryName }: SOPArticleCardProps) {
  return (
    <Card className="cursor-pointer hover:shadow-sm transition-shadow border-border" onClick={onClick}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <FileText className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-sm">
                {highlightQuery ? highlightText(article.title, highlightQuery) : article.title}
              </h3>
              {categoryName && (
                <Badge variant="outline" className="text-[10px] shrink-0">{categoryName}</Badge>
              )}
            </div>
            {article.search_text && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {highlightQuery ? highlightText(article.search_text.substring(0, 150), highlightQuery) : article.search_text.substring(0, 150)}
              </p>
            )}
            {article.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {article.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
