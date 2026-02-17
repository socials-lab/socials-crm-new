import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Briefcase, BarChart3, Users, Settings, Zap, FileText, Target, Palette } from 'lucide-react';
import type { SOPCategory, SOPArticle } from '@/hooks/useSOPData';

const iconMap: Record<string, React.ElementType> = {
  BookOpen, Briefcase, BarChart3, Users, Settings, Zap, FileText, Target, Palette,
};

interface SOPCategoryCardProps {
  category: SOPCategory;
  articleCount: number;
  onClick: () => void;
}

export function SOPCategoryCard({ category, articleCount, onClick }: SOPCategoryCardProps) {
  const Icon = iconMap[category.icon] || BookOpen;

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow border-border" onClick={onClick}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base">{category.title}</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {category.description && (
          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{category.description}</p>
        )}
        <p className="text-xs text-muted-foreground">{articleCount} {articleCount === 1 ? 'článek' : articleCount < 5 ? 'články' : 'článků'}</p>
      </CardContent>
    </Card>
  );
}
