import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PlannedEngagement {
  id: string;
  name: string;
  client_name: string;
  lead_id: string | null;
  monthly_fee: number;
  start_date: string;
  assigned_colleague_ids: string[];
  notes: string;
  probability_percent: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

interface PlannedEngagementInsert {
  name: string;
  client_name: string;
  lead_id?: string | null;
  monthly_fee: number;
  start_date: string;
  assigned_colleague_ids: string[];
  notes: string;
  probability_percent: number;
}

function normalizeRow(row: Record<string, unknown>): PlannedEngagement {
  if (typeof row.id !== 'string') {
    throw new Error('planned_engagements row is missing id');
  }

  return {
    id: row.id,
    name: String(row.name ?? ''),
    client_name: String(row.client_name ?? ''),
    lead_id: (row.lead_id as string | null) ?? null,
    monthly_fee: Number(row.monthly_fee ?? 0),
    start_date: String(row.start_date ?? ''),
    assigned_colleague_ids: Array.isArray(row.assigned_colleague_ids)
      ? row.assigned_colleague_ids.map(String)
      : [],
    notes: String(row.notes ?? ''),
    probability_percent: Number(row.probability_percent ?? 100),
    created_at: String(row.created_at ?? ''),
    updated_at: String(row.updated_at ?? ''),
    created_by: (row.created_by as string | null) ?? null,
  };
}

export function usePlannedEngagements() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['planned_engagements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('planned_engagements' as never)
        .select('*')
        .order('start_date', { ascending: true });

      if (error) throw error;
      return (data as Record<string, unknown>[]).map(normalizeRow);
    },
  });

  const addMutation = useMutation({
    mutationFn: async (payload: PlannedEngagementInsert) => {
      const { data, error } = await supabase
        .from('planned_engagements' as never)
        .insert(payload as never)
        .select('*')
        .single();

      if (error) throw error;
      return normalizeRow(data as unknown as Record<string, unknown>);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planned_engagements'] });
      toast.success('Plánovaná zakázka byla přidána');
    },
    onError: (error) => {
      console.error('Failed to add planned engagement', error);
      toast.error('Nepodařilo se přidat plánovanou zakázku');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PlannedEngagementInsert> }) => {
      const { error } = await supabase
        .from('planned_engagements' as never)
        .update(data as never)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planned_engagements'] });
      toast.success('Plánovaná zakázka byla upravena');
    },
    onError: (error) => {
      console.error('Failed to update planned engagement', error);
      toast.error('Nepodařilo se upravit plánovanou zakázku');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('planned_engagements' as never)
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planned_engagements'] });
      toast.success('Plánovaná zakázka byla smazána');
    },
    onError: (error) => {
      console.error('Failed to delete planned engagement', error);
      toast.error('Nepodařilo se smazat plánovanou zakázku');
    },
  });

  const getPlannedForMonth = useCallback(
    (year: number, month: number) => {
      return (query.data || []).filter((item) => {
        const date = new Date(item.start_date);
        return date.getFullYear() === year && date.getMonth() + 1 === month;
      });
    },
    [query.data]
  );

  return {
    plannedEngagements: query.data || [],
    isLoading: query.isLoading,
    addPlannedEngagement: addMutation.mutateAsync,
    updatePlannedEngagement: updateMutation.mutateAsync,
    deletePlannedEngagement: deleteMutation.mutateAsync,
    getPlannedForMonth,
  };
}
