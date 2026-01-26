import { useState, useCallback, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';

export type ActivityCategory = 'marketing' | 'overhead';

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
  created_at: string;
}

export const CATEGORY_LABELS: Record<ActivityCategory, string> = {
  marketing: 'Marketing',
  overhead: 'Režijní služby',
};

export function generateInvoiceItemName(category: ActivityCategory, description: string): string {
  return `${CATEGORY_LABELS[category]} – ${description}`;
}

const STORAGE_KEY = 'activity-rewards';

function getStoredRewards(): ActivityReward[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    // Migrate old data without category
    const rewards = JSON.parse(stored) as ActivityReward[];
    return rewards.map(r => {
      if (!r.category) {
        return {
          ...r,
          category: 'overhead' as ActivityCategory,
          invoice_item_name: generateInvoiceItemName('overhead', r.description),
        };
      }
      return r;
    });
  } catch {
    return [];
  }
}

function saveRewards(rewards: ActivityReward[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rewards));
}

export function useActivityRewards(colleagueId: string | null) {
  const [allRewards, setAllRewards] = useState<ActivityReward[]>(getStoredRewards);

  const rewards = useMemo(() => {
    if (!colleagueId) return [];
    return allRewards
      .filter(r => r.colleague_id === colleagueId)
      .sort((a, b) => new Date(b.activity_date).getTime() - new Date(a.activity_date).getTime());
  }, [allRewards, colleagueId]);

  const getRewardsByMonth = useCallback((year: number, month: number) => {
    if (!colleagueId) return [];
    const start = startOfMonth(new Date(year, month - 1));
    const end = endOfMonth(new Date(year, month - 1));
    
    return rewards.filter(r => {
      const date = parseISO(r.activity_date);
      return isWithinInterval(date, { start, end });
    });
  }, [rewards, colleagueId]);

  const getRewardsByCategory = useCallback((year: number, month: number) => {
    const monthRewards = getRewardsByMonth(year, month);
    return {
      marketing: monthRewards.filter(r => r.category === 'marketing'),
      overhead: monthRewards.filter(r => r.category === 'overhead'),
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

  const addReward = useCallback((reward: Omit<ActivityReward, 'id' | 'created_at' | 'invoice_item_name'> & { invoice_item_name?: string }) => {
    const invoiceItemName = reward.invoice_item_name || generateInvoiceItemName(reward.category, reward.description);
    
    const newReward: ActivityReward = {
      ...reward,
      invoice_item_name: invoiceItemName,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };

    const updated = [newReward, ...allRewards];
    setAllRewards(updated);
    saveRewards(updated);
    return newReward;
  }, [allRewards]);

  const deleteReward = useCallback((rewardId: string) => {
    const updated = allRewards.filter(r => r.id !== rewardId);
    setAllRewards(updated);
    saveRewards(updated);
  }, [allRewards]);

  const currentMonthTotal = useMemo(() => {
    const now = new Date();
    const monthRewards = getRewardsByMonth(now.getFullYear(), now.getMonth() + 1);
    return monthRewards.reduce((sum, r) => sum + r.amount, 0);
  }, [getRewardsByMonth]);

  return {
    rewards,
    currentMonthTotal,
    getRewardsByMonth,
    getRewardsByCategory,
    getMonthlyTotals,
    addReward,
    deleteReward,
  };
}
