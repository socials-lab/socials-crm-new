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

// Sample data for testing - uses a fixed colleague ID for demo
const SAMPLE_REWARDS: ActivityReward[] = [
  {
    id: 'sample-1',
    colleague_id: 'demo-colleague',
    category: 'marketing',
    description: 'tvorba video obsahu pro sociální sítě',
    invoice_item_name: 'Marketing – tvorba video obsahu pro sociální sítě',
    billing_type: 'hourly',
    amount: 4000,
    hours: 8,
    hourly_rate: 500,
    activity_date: '2026-01-05',
    created_at: '2026-01-05T10:00:00Z',
  },
  {
    id: 'sample-2',
    colleague_id: 'demo-colleague',
    category: 'marketing',
    description: 'správa contentu Socials',
    invoice_item_name: 'Marketing – správa contentu Socials',
    billing_type: 'hourly',
    amount: 3000,
    hours: 6,
    hourly_rate: 500,
    activity_date: '2026-01-12',
    created_at: '2026-01-12T14:00:00Z',
  },
  {
    id: 'sample-3',
    colleague_id: 'demo-colleague',
    category: 'overhead',
    description: 'interní reportingová šablona',
    invoice_item_name: 'Režijní služby – interní reportingová šablona',
    billing_type: 'fixed',
    amount: 8000,
    hours: null,
    hourly_rate: null,
    activity_date: '2026-01-10',
    created_at: '2026-01-10T09:00:00Z',
  },
  {
    id: 'sample-4',
    colleague_id: 'demo-colleague',
    category: 'overhead',
    description: 'sales aktivity a příprava nabídek',
    invoice_item_name: 'Režijní služby – sales aktivity a příprava nabídek',
    billing_type: 'hourly',
    amount: 2500,
    hours: 5,
    hourly_rate: 500,
    activity_date: '2026-01-18',
    created_at: '2026-01-18T11:00:00Z',
  },
  {
    id: 'sample-5',
    colleague_id: 'demo-colleague',
    category: 'marketing',
    description: 'podcast Socials Insider',
    invoice_item_name: 'Marketing – podcast Socials Insider',
    billing_type: 'fixed',
    amount: 5000,
    hours: null,
    hourly_rate: null,
    activity_date: '2025-12-15',
    created_at: '2025-12-15T16:00:00Z',
  },
  {
    id: 'sample-6',
    colleague_id: 'demo-colleague',
    category: 'overhead',
    description: 'automatizace interních procesů',
    invoice_item_name: 'Režijní služby – automatizace interních procesů',
    billing_type: 'hourly',
    amount: 6000,
    hours: 12,
    hourly_rate: 500,
    activity_date: '2025-12-20',
    created_at: '2025-12-20T10:00:00Z',
  },
];

function getStoredRewards(): ActivityReward[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [...SAMPLE_REWARDS]; // Return sample data if nothing stored
    
    // Migrate old data without category
    const rewards = JSON.parse(stored) as ActivityReward[];
    const migratedRewards = rewards.map(r => {
      if (!r.category) {
        return {
          ...r,
          category: 'overhead' as ActivityCategory,
          invoice_item_name: generateInvoiceItemName('overhead', r.description),
        };
      }
      return r;
    });
    
    // Merge with sample data if not already present
    const existingIds = new Set(migratedRewards.map(r => r.id));
    const samplesToAdd = SAMPLE_REWARDS.filter(s => !existingIds.has(s.id));
    
    return [...migratedRewards, ...samplesToAdd];
  } catch {
    return [...SAMPLE_REWARDS];
  }
}

function saveRewards(rewards: ActivityReward[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rewards));
}

export function useActivityRewards(colleagueId: string | null) {
  const [allRewards, setAllRewards] = useState<ActivityReward[]>(getStoredRewards);

  const rewards = useMemo(() => {
    if (!colleagueId) return [];
    // Zahrnout jak položky přihlášeného kolegy, tak vzorová data s 'demo-colleague'
    return allRewards
      .filter(r => r.colleague_id === colleagueId || r.colleague_id === 'demo-colleague')
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

  const updateReward = useCallback((rewardId: string, updates: Partial<Omit<ActivityReward, 'id' | 'created_at'>>) => {
    const updated = allRewards.map(r => {
      if (r.id !== rewardId) return r;
      
      const updatedReward = { ...r, ...updates };
      // Regenerate invoice_item_name if category or description changed
      if (updates.category || updates.description) {
        updatedReward.invoice_item_name = generateInvoiceItemName(
          updates.category || r.category,
          updates.description || r.description
        );
      }
      return updatedReward;
    });
    setAllRewards(updated);
    saveRewards(updated);
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
    updateReward,
    deleteReward,
  };
}
