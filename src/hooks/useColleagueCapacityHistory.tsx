import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ColleagueCapacityRecord } from '@/types/crm';

export function useColleagueCapacityHistory(colleagueId: string | null) {
  const queryClient = useQueryClient();

  const { data: history = [], isLoading, error } = useQuery({
    queryKey: ['colleague-capacity-history', colleagueId],
    queryFn: async (): Promise<ColleagueCapacityRecord[]> => {
      if (!colleagueId) return [];

      // Direct query - table may not be in generated types yet
      const { data, error } = await (supabase as any)
        .from('colleague_capacity_history')
        .select('*')
        .eq('colleague_id', colleagueId)
        .order('effective_from', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as ColleagueCapacityRecord[];
    },
    enabled: !!colleagueId,
  });

  const addHistoryRecord = useMutation({
    mutationFn: async (record: {
      colleague_id: string;
      capacity_hours: number;
      previous_capacity_hours: number | null;
      effective_from: string;
      reason: string;
    }) => {
      const { data, error } = await (supabase as any)
        .from('colleague_capacity_history')
        .insert(record)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['colleague-capacity-history', colleagueId] });
    },
  });

  return {
    history,
    isLoading,
    error,
    addHistoryRecord,
  };
}
