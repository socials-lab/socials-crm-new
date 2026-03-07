import { createContext, useContext, ReactNode, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from './useUserRole';
import type { FeedbackIdea, FeedbackVote, FeedbackStatus, FeedbackCategory } from '@/types/feedback';

interface FeedbackDataContextType {
  ideas: FeedbackIdea[];
  votes: FeedbackVote[];
  isLoading: boolean;
  addIdea: (data: { title: string; description: string; category: FeedbackCategory }) => Promise<FeedbackIdea>;
  updateIdeaStatus: (id: string, status: FeedbackStatus) => Promise<void>;
  deleteIdea: (id: string) => Promise<void>;
  vote: (ideaId: string, voteType: 'up' | 'down') => Promise<void>;
  removeVote: (ideaId: string) => Promise<void>;
  getVoteCounts: (ideaId: string) => { up: number; down: number };
  getUserVote: (ideaId: string) => 'up' | 'down' | null;
  canManageStatus: boolean;
  canDeleteIdeas: boolean;
}

const FeedbackDataContext = createContext<FeedbackDataContextType | undefined>(undefined);

// Transformer functions
const transformIdea = (row: Record<string, unknown>): FeedbackIdea => ({
  id: row.id,
  title: row.title,
  description: row.description,
  category: row.category,
  author_id: row.author_id,
  status: row.status,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

const transformVote = (row: Record<string, unknown>): FeedbackVote => ({
  id: row.id,
  idea_id: row.idea_id,
  colleague_id: row.colleague_id,
  vote_type: row.vote_type,
  created_at: row.created_at,
});

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { colleagueId, isSuperAdmin, role } = useUserRole();

  // Queries
  const { data: ideas = [], isLoading: ideasLoading } = useQuery({
    queryKey: ['feedback_ideas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feedback_ideas')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(transformIdea);
    },
  });

  const { data: votes = [], isLoading: votesLoading } = useQuery({
    queryKey: ['feedback_votes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feedback_votes')
        .select('*');
      if (error) throw error;
      return (data || []).map(transformVote);
    },
  });

  const isLoading = ideasLoading || votesLoading;

  const canManageStatus = useMemo(() => {
    return isSuperAdmin || role === 'admin' || role === 'management';
  }, [isSuperAdmin, role]);

  const canDeleteIdeas = useMemo(() => {
    return isSuperAdmin || role === 'admin';
  }, [isSuperAdmin, role]);

  // Mutations
  const addIdeaMutation = useMutation({
    mutationFn: async (data: { title: string; description: string; category: FeedbackCategory }) => {
      if (!colleagueId) throw new Error('Must be logged in to add feedback idea');

      const { data: result, error } = await supabase
        .from('feedback_ideas')
        .insert({
          title: data.title,
          description: data.description,
          category: data.category,
          author_id: colleagueId,
          status: 'new',
        })
        .select()
        .single();
      if (error) throw error;
      return transformIdea(result);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback_ideas'] });
    },
  });

  const updateIdeaStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: FeedbackStatus }) => {
      const { data, error } = await supabase
        .from('feedback_ideas')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return transformIdea(data);
    },
    onSuccess: (updatedIdea) => {
      queryClient.setQueryData<FeedbackIdea[]>(['feedback_ideas'], (currentIdeas) => {
        if (!currentIdeas) return currentIdeas;
        return currentIdeas.map((idea) => (idea.id === updatedIdea.id ? updatedIdea : idea));
      });
      queryClient.invalidateQueries({ queryKey: ['feedback_ideas'] });
    },
  });

  const deleteIdeaMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!isSuperAdmin && role !== 'admin') {
        throw new Error('Only admins can delete feedback ideas');
      }

      const { data: deletedIdea, error } = await supabase
        .from('feedback_ideas')
        .delete()
        .eq('id', id)
        .select('id')
        .maybeSingle();

      if (error) throw error;

      if (!deletedIdea) {
        throw new Error('Feedback idea not found or permission denied');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback_ideas'] });
      queryClient.invalidateQueries({ queryKey: ['feedback_votes'] });
    },
  });

  const voteMutation = useMutation({
    mutationFn: async ({ ideaId, voteType }: { ideaId: string; voteType: 'up' | 'down' }) => {
      if (!colleagueId) throw new Error('Must be logged in to vote');

      // Delete existing vote (if any) - UNIQUE constraint ensures one vote per user per idea
      await supabase
        .from('feedback_votes')
        .delete()
        .eq('idea_id', ideaId)
        .eq('colleague_id', colleagueId);

      // Insert new vote
      const { error } = await supabase
        .from('feedback_votes')
        .insert({
          idea_id: ideaId,
          colleague_id: colleagueId,
          vote_type: voteType,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback_votes'] });
    },
  });

  const removeVoteMutation = useMutation({
    mutationFn: async (ideaId: string) => {
      if (!colleagueId) throw new Error('Must be logged in to remove vote');

      const { error } = await supabase
        .from('feedback_votes')
        .delete()
        .eq('idea_id', ideaId)
        .eq('colleague_id', colleagueId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback_votes'] });
    },
  });

  // Helper functions
  const getVoteCounts = useCallback(
    (ideaId: string) => {
      const ideaVotes = votes.filter(v => v.idea_id === ideaId);
      return {
        up: ideaVotes.filter(v => v.vote_type === 'up').length,
        down: ideaVotes.filter(v => v.vote_type === 'down').length,
      };
    },
    [votes]
  );

  const getUserVote = useCallback(
    (ideaId: string): 'up' | 'down' | null => {
      if (!colleagueId) return null;
      const userVote = votes.find(v => v.idea_id === ideaId && v.colleague_id === colleagueId);
      return userVote?.vote_type || null;
    },
    [votes, colleagueId]
  );

  // Wrapper functions
  const addIdea = useCallback(async (data: { title: string; description: string; category: FeedbackCategory }): Promise<FeedbackIdea> => {
    return addIdeaMutation.mutateAsync(data);
  }, [addIdeaMutation]);

  const updateIdeaStatus = useCallback(async (id: string, status: FeedbackStatus): Promise<void> => {
    await updateIdeaStatusMutation.mutateAsync({ id, status });
  }, [updateIdeaStatusMutation]);

  const vote = useCallback(async (ideaId: string, voteType: 'up' | 'down'): Promise<void> => {
    await voteMutation.mutateAsync({ ideaId, voteType });
  }, [voteMutation]);

  const deleteIdea = useCallback(async (id: string): Promise<void> => {
    await deleteIdeaMutation.mutateAsync(id);
  }, [deleteIdeaMutation]);

  const removeVote = useCallback(async (ideaId: string): Promise<void> => {
    await removeVoteMutation.mutateAsync(ideaId);
  }, [removeVoteMutation]);

  const value: FeedbackDataContextType = useMemo(
    () => ({
      ideas,
      votes,
      isLoading,
      addIdea,
      updateIdeaStatus,
      deleteIdea,
      vote,
      removeVote,
      getVoteCounts,
      getUserVote,
      canManageStatus,
      canDeleteIdeas,
    }),
    [ideas, votes, isLoading, addIdea, updateIdeaStatus, deleteIdea, vote, removeVote, getVoteCounts, getUserVote, canManageStatus, canDeleteIdeas]
  );

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
