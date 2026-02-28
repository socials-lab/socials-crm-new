import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface RevenueTarget {
  id: string;
  year: number;
  month: number;
  target_revenue: number;
  created_at: string;
  updated_at: string;
}

interface RevenueTargetUpsertInput {
  year: number;
  month: number;
  target_revenue: number;
}

function normalizeTarget(row: Record<string, unknown>): RevenueTarget {
  if (typeof row.id !== 'string') {
    throw new Error('revenue_targets row is missing id');
  }

  return {
    id: row.id,
    year: Number(row.year ?? 0),
    month: Number(row.month ?? 0),
    target_revenue: Number(row.target_revenue ?? 0),
    created_at: String(row.created_at ?? ''),
    updated_at: String(row.updated_at ?? ''),
  };
}

export function useRevenueTargets() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['revenue_targets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('revenue_targets' as never)
        .select('*')
        .order('year', { ascending: true })
        .order('month', { ascending: true });

      if (error) throw error;
      return (data as Record<string, unknown>[]).map(normalizeTarget);
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (items: RevenueTargetUpsertInput[]) => {
      const { error } = await supabase
        .from('revenue_targets' as never)
        .upsert(items as never, { onConflict: 'year,month' });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revenue_targets'] });
      toast.success('Měsíční cíle byly uloženy');
    },
    onError: (error) => {
      console.error('Failed to upsert revenue targets', error);
      toast.error('Nepodařilo se uložit měsíční cíle');
    },
  });

  const getTargetForMonth = useCallback(
    (year: number, month: number): number | null => {
      const row = (query.data || []).find((item) => item.year === year && item.month === month);
      return row ? row.target_revenue : null;
    },
    [query.data]
  );

  return {
    targets: query.data || [],
    isLoading: query.isLoading,
    getTargetForMonth,
    upsertTargets: upsertMutation.mutateAsync,
  };
}
