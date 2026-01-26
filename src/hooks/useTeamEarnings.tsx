import { useMemo, useCallback } from 'react';
import { useCRMData } from '@/hooks/useCRMData';
import { useCreativeBoostData } from '@/hooks/useCreativeBoostData';
import { useUpsellApprovals } from '@/hooks/useUpsellApprovals';
import type { Colleague } from '@/types/crm';

const ACTIVITY_REWARDS_KEY = 'activity-rewards';

interface ActivityReward {
  id: string;
  colleague_id: string;
  description: string;
  billing_type: 'fixed' | 'hourly';
  amount: number;
  hours: number | null;
  hourly_rate: number | null;
  activity_date: string;
  created_at: string;
}

function getActivityRewards(): ActivityReward[] {
  try {
    const stored = localStorage.getItem(ACTIVITY_REWARDS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export interface ColleagueEarningsSummary {
  colleague: Colleague;
  engagementCount: number;
  fixedEarnings: number;
  creativeBoostReward: number;
  creativeBoostCredits: number;
  commissionsReward: number;
  activitiesReward: number;
  activitiesCount: number;
  totalEarnings: number;
}

export interface ColleagueMonthlyHistory {
  year: number;
  month: number;
  fixedEarnings: number;
  creativeBoostReward: number;
  creativeBoostCredits: number;
  commissionsReward: number;
  activitiesReward: number;
  activitiesCount: number;
  totalEarnings: number;
  activities: ActivityReward[];
}

export function useTeamEarnings() {
  const { colleagues, engagements, assignments, clients } = useCRMData();
  const { getColleagueCredits, getColleagueCreditsByClient } = useCreativeBoostData();
  const { getApprovedCommissionsForColleague } = useUpsellApprovals();

  const allActivityRewards = useMemo(() => getActivityRewards(), []);

  // Get earnings summary for a colleague in a specific month
  const getColleagueEarningsForMonth = useCallback((
    colleagueId: string,
    year: number,
    month: number
  ): ColleagueMonthlyHistory => {
    // Fixed earnings from assignments
    const colleagueAssignments = assignments.filter(
      a => a.colleague_id === colleagueId && !a.end_date
    );
    
    let fixedEarnings = 0;
    colleagueAssignments.forEach(assignment => {
      const engagement = engagements.find(e => e.id === assignment.engagement_id);
      if (engagement && engagement.status === 'active') {
        fixedEarnings += assignment.monthly_cost || 0;
      }
    });

    // Creative Boost
    const creditsByClient = getColleagueCreditsByClient(colleagueId, year, month);
    const creativeBoostReward = creditsByClient.reduce((sum, c) => sum + c.totalReward, 0);
    const creativeBoostCredits = creditsByClient.reduce((sum, c) => sum + c.totalCredits, 0);

    // Commissions
    const commissions = getApprovedCommissionsForColleague(colleagueId, year, month);
    const commissionsReward = commissions.reduce((sum, c) => sum + c.commissionAmount, 0);

    // Activity rewards
    const monthActivities = allActivityRewards.filter(r => {
      if (r.colleague_id !== colleagueId) return false;
      const date = new Date(r.activity_date);
      return date.getFullYear() === year && date.getMonth() + 1 === month;
    });
    const activitiesReward = monthActivities.reduce((sum, r) => sum + r.amount, 0);

    return {
      year,
      month,
      fixedEarnings,
      creativeBoostReward,
      creativeBoostCredits,
      commissionsReward,
      activitiesReward,
      activitiesCount: monthActivities.length,
      totalEarnings: fixedEarnings + creativeBoostReward + commissionsReward + activitiesReward,
      activities: monthActivities,
    };
  }, [assignments, engagements, getColleagueCreditsByClient, getApprovedCommissionsForColleague, allActivityRewards]);

  // Get all colleagues with current month earnings summary
  const getTeamEarningsSummary = useCallback((year: number, month: number): ColleagueEarningsSummary[] => {
    return colleagues
      .filter(c => c.status === 'active')
      .map(colleague => {
        const monthData = getColleagueEarningsForMonth(colleague.id, year, month);
        
        // Count active engagements
        const colleagueAssignments = assignments.filter(
          a => a.colleague_id === colleague.id && !a.end_date
        );
        const activeEngagements = colleagueAssignments.filter(a => {
          const engagement = engagements.find(e => e.id === a.engagement_id);
          return engagement && engagement.status === 'active';
        });

        return {
          colleague,
          engagementCount: activeEngagements.length,
          fixedEarnings: monthData.fixedEarnings,
          creativeBoostReward: monthData.creativeBoostReward,
          creativeBoostCredits: monthData.creativeBoostCredits,
          commissionsReward: monthData.commissionsReward,
          activitiesReward: monthData.activitiesReward,
          activitiesCount: monthData.activitiesCount,
          totalEarnings: monthData.totalEarnings,
        };
      })
      .sort((a, b) => b.totalEarnings - a.totalEarnings);
  }, [colleagues, assignments, engagements, getColleagueEarningsForMonth]);

  // Get monthly history for a colleague (last 12 months)
  const getColleagueMonthlyHistory = useCallback((colleagueId: string, monthsBack: number = 12): ColleagueMonthlyHistory[] => {
    const history: ColleagueMonthlyHistory[] = [];
    const now = new Date();
    
    for (let i = 0; i < monthsBack; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      history.push(getColleagueEarningsForMonth(colleagueId, year, month));
    }
    
    return history;
  }, [getColleagueEarningsForMonth]);

  // Get total team earnings for a month
  const getTeamTotalForMonth = useCallback((year: number, month: number) => {
    const summary = getTeamEarningsSummary(year, month);
    return summary.reduce((sum, s) => sum + s.totalEarnings, 0);
  }, [getTeamEarningsSummary]);

  // Get activity rewards for a colleague
  const getColleagueActivities = useCallback((colleagueId: string, year?: number, month?: number): ActivityReward[] => {
    return allActivityRewards.filter(r => {
      if (r.colleague_id !== colleagueId) return false;
      if (year && month) {
        const date = new Date(r.activity_date);
        return date.getFullYear() === year && date.getMonth() + 1 === month;
      }
      return true;
    }).sort((a, b) => new Date(b.activity_date).getTime() - new Date(a.activity_date).getTime());
  }, [allActivityRewards]);

  return {
    getTeamEarningsSummary,
    getColleagueEarningsForMonth,
    getColleagueMonthlyHistory,
    getTeamTotalForMonth,
    getColleagueActivities,
  };
}
