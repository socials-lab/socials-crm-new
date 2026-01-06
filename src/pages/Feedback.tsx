import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { AddFeedbackDialog } from '@/components/feedback/AddFeedbackDialog';
import { FeedbackCard } from '@/components/feedback/FeedbackCard';
import { FeedbackDetailSheet } from '@/components/feedback/FeedbackDetailSheet';
import { useFeedbackData } from '@/hooks/useFeedbackData';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FEEDBACK_CATEGORY_CONFIG, FEEDBACK_STATUS_CONFIG, type FeedbackIdea, type FeedbackCategory, type FeedbackStatus } from '@/types/feedback';
import { Lightbulb } from 'lucide-react';

type SortOption = 'newest' | 'most_votes' | 'least_votes';

export default function Feedback() {
  const { ideas, getVoteCounts } = useFeedbackData();
  const [selectedIdea, setSelectedIdea] = useState<FeedbackIdea | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<FeedbackCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<FeedbackStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  const filteredAndSortedIdeas = useMemo(() => {
    let result = [...ideas];

    // Filter by category
    if (categoryFilter !== 'all') {
      result = result.filter(idea => idea.category === categoryFilter);
    }

    // Filter by status
    if (statusFilter !== 'all') {
      result = result.filter(idea => idea.status === statusFilter);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      
      const aVotes = getVoteCounts(a.id);
      const bVotes = getVoteCounts(b.id);
      const aScore = aVotes.up - aVotes.down;
      const bScore = bVotes.up - bVotes.down;
      
      if (sortBy === 'most_votes') {
        return bScore - aScore;
      }
      
      return aScore - bScore;
    });

    return result;
  }, [ideas, categoryFilter, statusFilter, sortBy, getVoteCounts]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="💡 Feedback Zone"
        description="Nápady od kolegů na vylepšení firmy"
        actions={<AddFeedbackDialog />}
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as FeedbackCategory | 'all')}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Kategorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Všechny kategorie</SelectItem>
            {Object.entries(FEEDBACK_CATEGORY_CONFIG).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                {config.icon} {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as FeedbackStatus | 'all')}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Všechny statusy</SelectItem>
            {Object.entries(FEEDBACK_STATUS_CONFIG).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Řadit podle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Nejnovější</SelectItem>
            <SelectItem value="most_votes">Nejvíce hlasů</SelectItem>
            <SelectItem value="least_votes">Nejméně hlasů</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Ideas grid */}
      {filteredAndSortedIdeas.length === 0 ? (
        <div className="text-center py-12">
          <Lightbulb className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium mb-2">Zatím žádné nápady</h3>
          <p className="text-muted-foreground mb-4">
            Buďte první, kdo přidá nápad na vylepšení!
          </p>
          <AddFeedbackDialog>
            <Button>Přidat první nápad</Button>
          </AddFeedbackDialog>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAndSortedIdeas.map((idea) => (
            <FeedbackCard
              key={idea.id}
              idea={idea}
              onClick={() => setSelectedIdea(idea)}
            />
          ))}
        </div>
      )}

      {/* Detail sheet */}
      <FeedbackDetailSheet
        idea={selectedIdea}
        open={!!selectedIdea}
        onOpenChange={(open) => !open && setSelectedIdea(null)}
      />
    </div>
  );
}
