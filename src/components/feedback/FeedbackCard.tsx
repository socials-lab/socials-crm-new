import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useFeedbackData } from '@/hooks/useFeedbackData';
import { useCRMData } from '@/hooks/useCRMData';
import { 
  FEEDBACK_CATEGORY_CONFIG, 
  FEEDBACK_STATUS_CONFIG,
  type FeedbackIdea 
} from '@/types/feedback';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface FeedbackCardProps {
  idea: FeedbackIdea;
  onClick?: () => void;
}

export function FeedbackCard({ idea, onClick }: FeedbackCardProps) {
  const { getVoteCounts, getUserVote, vote, removeVote } = useFeedbackData();
  const { colleagues } = useCRMData();
  
  const voteCounts = getVoteCounts(idea.id);
  const userVote = getUserVote(idea.id);
  const categoryConfig = FEEDBACK_CATEGORY_CONFIG[idea.category];
  const statusConfig = FEEDBACK_STATUS_CONFIG[idea.status];
  
  const author = colleagues.find(c => c.id === idea.author_id);
  const authorName = author?.full_name || 'Neznámý';

  const handleVote = (e: React.MouseEvent, voteType: 'up' | 'down') => {
    e.stopPropagation();
    if (userVote === voteType) {
      removeVote(idea.id);
    } else {
      vote(idea.id, voteType);
    }
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base truncate">{idea.title}</h3>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <span>{authorName}</span>
              <span>•</span>
              <span>{format(new Date(idea.created_at), 'd. MMM yyyy', { locale: cs })}</span>
            </div>
          </div>
          <Badge className={cn(statusConfig.bgColor, statusConfig.color, 'border-0')}>
            {statusConfig.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="outline" className={cn(categoryConfig.bgColor, categoryConfig.color, 'border-0')}>
            {categoryConfig.icon} {categoryConfig.label}
          </Badge>
        </div>
        
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {idea.description}
        </p>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'gap-1',
              userVote === 'up' && 'text-emerald-600 bg-emerald-500/10'
            )}
            onClick={(e) => handleVote(e, 'up')}
          >
            <ThumbsUp className="h-4 w-4" />
            <span>{voteCounts.up}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'gap-1',
              userVote === 'down' && 'text-red-600 bg-red-500/10'
            )}
            onClick={(e) => handleVote(e, 'down')}
          >
            <ThumbsDown className="h-4 w-4" />
            <span>{voteCounts.down}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
