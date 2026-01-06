import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import type { FeedbackIdea, FeedbackVote, FeedbackStatus, FeedbackCategory } from '@/types/feedback';
import { useUserRole } from '@/hooks/useUserRole';

// Dummy data
const initialIdeas: FeedbackIdea[] = [
  {
    id: 'idea-1',
    title: 'Automatické připomínky pro faktury',
    description: 'Bylo by skvělé mít automatické připomínky, které by upozornily na blížící se splatnost faktur. Mohlo by to být formou emailu nebo notifikace v CRM. Tím bychom předešli pozdním platbám a zlepšili cash flow.',
    category: 'system',
    author_id: 'col-1',
    created_at: '2024-01-10T09:00:00Z',
    updated_at: '2024-01-10T09:00:00Z',
    status: 'accepted',
  },
  {
    id: 'idea-2',
    title: 'Týdenní stand-up meeting online',
    description: 'Navrhuji zavést krátký 15-minutový online stand-up každé pondělí ráno. Každý by řekl, na čem pracuje a jestli má nějaké bloky. Zlepšilo by to komunikaci mezi týmy.',
    category: 'communication',
    author_id: 'col-2',
    created_at: '2024-01-08T14:30:00Z',
    updated_at: '2024-01-08T14:30:00Z',
    status: 'in_review',
  },
  {
    id: 'idea-3',
    title: 'Šablony pro nabídky',
    description: 'Připravit sadu šablon pro různé typy nabídek (performance, creative, consulting). Ušetří to čas při přípravě a zajistí konzistentní kvalitu.',
    category: 'process',
    author_id: 'col-3',
    created_at: '2024-01-05T11:00:00Z',
    updated_at: '2024-01-05T11:00:00Z',
    status: 'implemented',
  },
  {
    id: 'idea-4',
    title: 'Rozšíření služeb o TikTok reklamy',
    description: 'TikTok roste a klienti se na to ptají. Měli bychom přidat TikTok Ads do našeho portfolia služeb a proškolit tým.',
    category: 'service',
    author_id: 'col-1',
    created_at: '2024-01-03T16:00:00Z',
    updated_at: '2024-01-03T16:00:00Z',
    status: 'new',
  },
];

const initialVotes: FeedbackVote[] = [
  { id: 'vote-1', idea_id: 'idea-1', colleague_id: 'col-2', vote_type: 'up', created_at: '2024-01-10T10:00:00Z' },
  { id: 'vote-2', idea_id: 'idea-1', colleague_id: 'col-3', vote_type: 'up', created_at: '2024-01-10T11:00:00Z' },
  { id: 'vote-3', idea_id: 'idea-2', colleague_id: 'col-1', vote_type: 'up', created_at: '2024-01-08T15:00:00Z' },
  { id: 'vote-4', idea_id: 'idea-2', colleague_id: 'col-3', vote_type: 'down', created_at: '2024-01-08T16:00:00Z' },
  { id: 'vote-5', idea_id: 'idea-3', colleague_id: 'col-1', vote_type: 'up', created_at: '2024-01-05T12:00:00Z' },
  { id: 'vote-6', idea_id: 'idea-3', colleague_id: 'col-2', vote_type: 'up', created_at: '2024-01-05T13:00:00Z' },
  { id: 'vote-7', idea_id: 'idea-4', colleague_id: 'col-2', vote_type: 'up', created_at: '2024-01-03T17:00:00Z' },
];

interface FeedbackDataContextType {
  ideas: FeedbackIdea[];
  votes: FeedbackVote[];
  addIdea: (data: { title: string; description: string; category: FeedbackCategory }) => FeedbackIdea;
  updateIdeaStatus: (id: string, status: FeedbackStatus) => void;
  vote: (ideaId: string, voteType: 'up' | 'down') => void;
  removeVote: (ideaId: string) => void;
  getVoteCounts: (ideaId: string) => { up: number; down: number };
  getUserVote: (ideaId: string) => 'up' | 'down' | null;
  canManageStatus: boolean;
}

const FeedbackDataContext = createContext<FeedbackDataContextType | undefined>(undefined);

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [ideas, setIdeas] = useState<FeedbackIdea[]>(initialIdeas);
  const [votes, setVotes] = useState<FeedbackVote[]>(initialVotes);
  const { colleagueId, isSuperAdmin, role } = useUserRole();

  const canManageStatus = useMemo(() => {
    return isSuperAdmin || role === 'admin' || role === 'management';
  }, [isSuperAdmin, role]);

  const addIdea = useCallback((data: { title: string; description: string; category: FeedbackCategory }) => {
    const newIdea: FeedbackIdea = {
      id: `idea-${Date.now()}`,
      title: data.title,
      description: data.description,
      category: data.category,
      author_id: colleagueId || 'unknown',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'new',
    };
    setIdeas(prev => [newIdea, ...prev]);
    return newIdea;
  }, [colleagueId]);

  const updateIdeaStatus = useCallback((id: string, status: FeedbackStatus) => {
    setIdeas(prev => prev.map(idea => 
      idea.id === id 
        ? { ...idea, status, updated_at: new Date().toISOString() }
        : idea
    ));
  }, []);

  const vote = useCallback((ideaId: string, voteType: 'up' | 'down') => {
    if (!colleagueId) return;

    setVotes(prev => {
      // Remove existing vote from this user for this idea
      const filtered = prev.filter(v => !(v.idea_id === ideaId && v.colleague_id === colleagueId));
      
      // Add new vote
      const newVote: FeedbackVote = {
        id: `vote-${Date.now()}`,
        idea_id: ideaId,
        colleague_id: colleagueId,
        vote_type: voteType,
        created_at: new Date().toISOString(),
      };
      
      return [...filtered, newVote];
    });
  }, [colleagueId]);

  const removeVote = useCallback((ideaId: string) => {
    if (!colleagueId) return;
    setVotes(prev => prev.filter(v => !(v.idea_id === ideaId && v.colleague_id === colleagueId)));
  }, [colleagueId]);

  const getVoteCounts = useCallback((ideaId: string) => {
    const ideaVotes = votes.filter(v => v.idea_id === ideaId);
    return {
      up: ideaVotes.filter(v => v.vote_type === 'up').length,
      down: ideaVotes.filter(v => v.vote_type === 'down').length,
    };
  }, [votes]);

  const getUserVote = useCallback((ideaId: string): 'up' | 'down' | null => {
    if (!colleagueId) return null;
    const userVote = votes.find(v => v.idea_id === ideaId && v.colleague_id === colleagueId);
    return userVote?.vote_type || null;
  }, [votes, colleagueId]);

  const value = useMemo(() => ({
    ideas,
    votes,
    addIdea,
    updateIdeaStatus,
    vote,
    removeVote,
    getVoteCounts,
    getUserVote,
    canManageStatus,
  }), [ideas, votes, addIdea, updateIdeaStatus, vote, removeVote, getVoteCounts, getUserVote, canManageStatus]);

  return (
    <FeedbackDataContext.Provider value={value}>
      {children}
    </FeedbackDataContext.Provider>
  );
}

export function useFeedbackData() {
  const context = useContext(FeedbackDataContext);
  if (!context) {
    throw new Error('useFeedbackData must be used within a FeedbackProvider');
  }
  return context;
}
