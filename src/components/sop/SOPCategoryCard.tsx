import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Briefcase, BarChart3, Users, Settings, Zap, FileText, Target, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SOPCategory } from '@/hooks/useSOPData';

const iconMap: Record<string, React.ElementType> = {
  BookOpen, Briefcase, BarChart3, Users, Settings, Zap, FileText, Target, Palette,
};

interface SOPCategoryCardProps {
  category: SOPCategory;
  articleCount: number;
  onClick: () => void;
  compact?: boolean;
  isActive?: boolean;
}

export function SOPCategoryCard({ category, articleCount, onClick, compact, isActive }: SOPCategoryCardProps) {
  const Icon = iconMap[category.icon] || BookOpen;

  if (compact) {
    return (
      <button
        onClick={onClick}
        className={cn(
          "w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-left text-sm transition-colors",
          isActive
            ? "bg-primary/10 text-primary font-medium"
            : "hover:bg-muted text-foreground"
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="flex-1 truncate">{category.title}</span>
        <span className="text-xs text-muted-foreground shrink-0">{articleCount}</span>
      </button>
    );
  }

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
        <p className="text-xs text-muted-foreground">{articleCount} SOP</p>
      </CardContent>
    </Card>
  );
}
