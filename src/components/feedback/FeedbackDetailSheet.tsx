import { ThumbsUp, ThumbsDown } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useFeedbackData } from '@/hooks/useFeedbackData';
import { useCRMData } from '@/hooks/useCRMData';
import { 
  FEEDBACK_CATEGORY_CONFIG, 
  FEEDBACK_STATUS_CONFIG,
  type FeedbackIdea,
  type FeedbackStatus
} from '@/types/feedback';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface FeedbackDetailSheetProps {
  idea: FeedbackIdea | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FeedbackDetailSheet({ idea, open, onOpenChange }: FeedbackDetailSheetProps) {
  const { getVoteCounts, getUserVote, vote, removeVote, updateIdeaStatus, canManageStatus } = useFeedbackData();
  const { colleagues } = useCRMData();
  
  if (!idea) return null;
  
  const voteCounts = getVoteCounts(idea.id);
  const userVote = getUserVote(idea.id);
  const categoryConfig = FEEDBACK_CATEGORY_CONFIG[idea.category];
  const statusConfig = FEEDBACK_STATUS_CONFIG[idea.status];
  
  const author = colleagues.find(c => c.id === idea.author_id);
  const authorName = author?.full_name || 'Neznámý';

  const handleVote = (voteType: 'up' | 'down') => {
    if (userVote === voteType) {
      removeVote(idea.id);
    } else {
      vote(idea.id, voteType);
    }
  };

  const handleStatusChange = (status: FeedbackStatus) => {
    updateIdeaStatus(idea.id, status);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[500px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-left pr-8">{idea.title}</SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 space-y-6">
          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{authorName}</span>
            <span>•</span>
            <span>{format(new Date(idea.created_at), 'd. MMMM yyyy', { locale: cs })}</span>
          </div>
          
          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={cn(categoryConfig.bgColor, categoryConfig.color, 'border-0')}>
              {categoryConfig.icon} {categoryConfig.label}
            </Badge>
            <Badge className={cn(statusConfig.bgColor, statusConfig.color, 'border-0')}>
              {statusConfig.label}
            </Badge>
          </div>
          
          {/* Description */}
          <div>
            <h4 className="font-medium mb-2">Popis nápadu</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {idea.description}
            </p>
          </div>
          
          {/* Voting */}
          <div>
            <h4 className="font-medium mb-3">Hlasování</h4>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className={cn(
                  'gap-2',
                  userVote === 'up' && 'text-emerald-600 bg-emerald-500/10 border-emerald-500/30'
                )}
                onClick={() => handleVote('up')}
              >
                <ThumbsUp className="h-4 w-4" />
                <span>Líbí se mi ({voteCounts.up})</span>
              </Button>
              <Button
                variant="outline"
                className={cn(
                  'gap-2',
                  userVote === 'down' && 'text-red-600 bg-red-500/10 border-red-500/30'
                )}
                onClick={() => handleVote('down')}
              >
                <ThumbsDown className="h-4 w-4" />
                <span>Nelíbí se mi ({voteCounts.down})</span>
              </Button>
            </div>
          </div>
          
          {/* Status management (for admins) */}
          {canManageStatus && (
            <div>
              <Label className="mb-2 block">Změnit status</Label>
              <Select value={idea.status} onValueChange={(v) => handleStatusChange(v as FeedbackStatus)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(FEEDBACK_STATUS_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
