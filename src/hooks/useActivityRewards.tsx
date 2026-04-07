import { useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { getErrorMessage } from '@/lib/errorUtils';

export type ActivityCategory = 'marketing' | 'overhead' | 'client_work';

export interface ActivityReward {
  id: string;
  colleague_id: string;
  category: ActivityCategory;
  description: string;
  invoice_item_name: string;
  billing_type: 'fixed' | 'hourly';
  amount: number;
  hours: number | null;
  hourly_rate: number | null;
  activity_date: string;
  is_recurring: boolean;
  created_at: string;
  client_name?: string | null;
  marketing_work_log_id?: string | null;
}

export const CATEGORY_LABELS: Record<ActivityCategory, string> = {
  marketing: 'Marketing',
  overhead: 'Režijní služby',
  client_work: 'Klientská práce',
};

export function generateInvoiceItemName(category: ActivityCategory, description: string, clientName?: string): string {
  if (category === 'client_work' && clientName) {
    return `${clientName} – ${description}`;
  }
  return `${CATEGORY_LABELS[category]} – ${description}`;
}

export function useActivityRewards(colleagueId: string | null) {
  const queryClient = useQueryClient();

  const { data: rewards = [], isLoading, error, refetch } = useQuery({
    queryKey: ['activity_rewards', colleagueId],
    queryFn: async () => {
      if (!colleagueId) return [];

      // Add timeout protection
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout: načítání trvá příliš dlouho')), 15000)
      );

      const fetchData = async () => {
        const { data, error } = await supabase
          .from('activity_rewards')
          .select('*')
          .eq('colleague_id', colleagueId)
          .order('activity_date', { ascending: false });
        if (error) throw error;
        return (data || []) as ActivityReward[];
      };

      return Promise.race([fetchData(), timeout]);
    },
    enabled: !!colleagueId,
    staleTime: 30000, // Consider data fresh for 30 seconds
    retry: 2,
    retryDelay: 1000,
  });

  const addMutation = useMutation({
    mutationFn: async (reward: Omit<ActivityReward, 'id' | 'created_at'>) => {
      const { error } = await supabase
        .from('activity_rewards')
        .insert(reward);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity_rewards', colleagueId] });
      toast.success('Položka byla přidána');
    },
    onError: (error) => {
      console.error('Failed to add activity reward:', error);
      toast.error(getErrorMessage(error, 'Nepodařilo se přidat položku'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Omit<ActivityReward, 'id' | 'created_at'>> }) => {
      const { error } = await supabase
        .from('activity_rewards')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity_rewards', colleagueId] });
      toast.success('Položka byla upravena');
    },
    onError: (error) => {
      console.error('Failed to update activity reward:', error);
      toast.error('Nepodařilo se upravit položku');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('activity_rewards')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity_rewards', colleagueId] });
      toast.success('Položka byla smazána');
    },
    onError: (error) => {
      console.error('Failed to delete activity reward:', error);
      toast.error('Nepodařilo se smazat položku');
    },
  });

  const getRewardsByMonth = useCallback((year: number, month: number) => {
    if (!colleagueId) return [];
    const start = startOfMonth(new Date(year, month - 1));
    const end = endOfMonth(new Date(year, month - 1));

    const directMatches = rewards.filter(r => {
      const date = parseISO(r.activity_date);
      return isWithinInterval(date, { start, end });
    });

    // Include recurring items from previous months that started before or in this month
    const recurringFromPast = rewards.filter(r => {
      if (!r.is_recurring) return false;
      const date = parseISO(r.activity_date);
      // Already included as direct match
      if (isWithinInterval(date, { start, end })) return false;
      // Only include if the recurring item started before this month's end
      return date <= end;
    });

    return [...directMatches, ...recurringFromPast];
  }, [rewards, colleagueId]);

  const getRewardsByCategory = useCallback((year: number, month: number) => {
    const monthRewards = getRewardsByMonth(year, month);
    return {
      marketing: monthRewards.filter(r => r.category === 'marketing'),
      overhead: monthRewards.filter(r => r.category === 'overhead'),
      client_work: monthRewards.filter(r => r.category === 'client_work'),
    };
  }, [getRewardsByMonth]);

  const getMonthlyTotals = useCallback(() => {
    if (!colleagueId) return [];

    const totals: Record<string, { year: number; month: number; total: number; count: number }> = {};

    rewards.forEach(r => {
      const date = parseISO(r.activity_date);
      const key = format(date, 'yyyy-MM');
      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      if (!totals[key]) {
        totals[key] = { year, month, total: 0, count: 0 };
      }
      totals[key].total += r.amount;
      totals[key].count += 1;
    });

    return Object.values(totals).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
  }, [rewards, colleagueId]);

  const addReward = (reward: Omit<ActivityReward, 'id' | 'created_at' | 'invoice_item_name'> & { invoice_item_name?: string }) => {
    if (reward.category === 'client_work' && !reward.client_name?.trim()) {
      throw new Error('U klientské položky je nutné vybrat klienta.');
    }
    const invoiceItemName = reward.invoice_item_name || generateInvoiceItemName(
      reward.category,
      reward.description,
      reward.category === 'client_work' ? reward.client_name || undefined : undefined
    );
    return addMutation.mutateAsync({ ...reward, invoice_item_name: invoiceItemName });
  };

  const updateReward = (rewardId: string, updates: Partial<Omit<ActivityReward, 'id' | 'created_at'>>) => {
    if (updates.category === 'client_work' && updates.client_name !== undefined && !updates.client_name?.trim()) {
      throw new Error('U klientské položky je nutné vybrat klienta.');
    }
    if (updates.category || updates.description || updates.client_name !== undefined) {
      const existingReward = rewards.find(r => r.id === rewardId);
      if (existingReward) {
        const category = updates.category || existingReward.category;
        const clientName = updates.client_name !== undefined ? updates.client_name : existingReward.client_name;
        updates.invoice_item_name = generateInvoiceItemName(
          category,
          updates.description || existingReward.description,
          category === 'client_work' ? clientName || undefined : undefined
        );
      }
    }
    return updateMutation.mutateAsync({ id: rewardId, updates });
  };

  const deleteReward = (rewardId: string) => deleteMutation.mutateAsync(rewardId);

  const currentMonthTotal = useMemo(() => {
    const now = new Date();
    const monthRewards = getRewardsByMonth(now.getFullYear(), now.getMonth() + 1);
    return monthRewards.reduce((sum, r) => sum + r.amount, 0);
  }, [getRewardsByMonth]);

  return {
    rewards,
    isLoading,
    error,
    refetch,
    currentMonthTotal,
    getRewardsByMonth,
    getRewardsByCategory,
    getMonthlyTotals,
    addReward,
    updateReward,
    deleteReward,
  };
}
