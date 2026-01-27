import { useState, useCallback, useMemo } from 'react';
import type { LeadStage } from '@/types/crm';
import type { 
  LeadStageTransition, 
  StageConversionRate, 
  FunnelPassthroughSummary 
} from '@/types/leadTransitions';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { 
  initializeTransitions, 
  addTransition, 
  STORAGE_KEY,
  type MockTransition 
} from '@/data/leadTransitionsMockData';

const STAGE_ORDER: LeadStage[] = [
  'new_lead',
  'meeting_done',
  'waiting_access',
  'access_received',
  'preparing_offer',
  'offer_sent',
  'won',
];

const STAGE_LABELS: Record<LeadStage, string> = {
  new_lead: 'Nový lead',
  meeting_done: 'Schůzka',
  waiting_access: 'Čekáme přístupy',
  access_received: 'Přístupy',
  preparing_offer: 'Nabídka',
  offer_sent: 'Odesláno',
  won: 'Won',
  lost: 'Lost',
  postponed: 'Odloženo',
};

export function useLeadTransitions() {
  // Initialize transitions from localStorage (with mock data if needed)
  const [transitions, setTransitions] = useState<MockTransition[]>(() => 
    initializeTransitions()
  );
  const [isConfirming, setIsConfirming] = useState(false);

  // Refresh transitions from localStorage
  const refreshTransitions = useCallback(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setTransitions(JSON.parse(stored));
      } catch {
        // Keep current state if parse fails
      }
    }
  }, []);

  // Confirm a transition (save to localStorage)
  const confirmTransition = useCallback(({
    leadId,
    fromStage,
    toStage,
    transitionValue,
  }: {
    leadId: string;
    fromStage: LeadStage;
    toStage: LeadStage;
    transitionValue: number;
  }) => {
    setIsConfirming(true);
    
    try {
      const newTransition = addTransition({
        lead_id: leadId,
        from_stage: fromStage,
        to_stage: toStage,
        transition_value: transitionValue,
        confirmed_at: new Date().toISOString(),
        confirmed_by: null,
      });
      
      setTransitions(prev => [newTransition, ...prev]);
    } finally {
      setIsConfirming(false);
    }
  }, []);

  const confirmTransitionAsync = useCallback(async ({
    leadId,
    fromStage,
    toStage,
    transitionValue,
  }: {
    leadId: string;
    fromStage: LeadStage;
    toStage: LeadStage;
    transitionValue: number;
  }) => {
    confirmTransition({ leadId, fromStage, toStage, transitionValue });
    return Promise.resolve();
  }, [confirmTransition]);

  // Calculate conversion rates between consecutive stages
  const getConversionRates = useCallback((): StageConversionRate[] => {
    const rates: StageConversionRate[] = [];
    
    // Count transitions TO each stage (entries into stage)
    const stageEntries: Record<string, number> = {};
    STAGE_ORDER.forEach(stage => {
      stageEntries[stage] = transitions.filter(t => t.to_stage === stage).length;
    });
    
    // Count transitions between consecutive stages
    for (let i = 0; i < STAGE_ORDER.length - 1; i++) {
      const fromStage = STAGE_ORDER[i];
      const toStage = STAGE_ORDER[i + 1];
      
      // Count how many went from this stage to the next
      const transitionCount = transitions.filter(
        t => t.from_stage === fromStage && t.to_stage === toStage
      ).length;
      
      // Total that entered this stage
      const totalFromStage = stageEntries[fromStage] || 0;
      
      // Calculate rate (if there were entries to this stage)
      const rate = totalFromStage > 0 
        ? (transitionCount / totalFromStage) * 100 
        : 0;
      
      rates.push({
        fromStage,
        toStage,
        fromLabel: STAGE_LABELS[fromStage],
        toLabel: STAGE_LABELS[toStage],
        rate: Math.min(rate, 100), // Cap at 100%
        count: transitionCount,
        total: totalFromStage,
      });
    }
    
    return rates;
  }, [transitions]);

  // Calculate overall conversion (new_lead -> won)
  const getOverallConversion = useCallback((): number => {
    const newLeadEntries = transitions.filter(t => t.to_stage === 'meeting_done').length;
    const wonCount = transitions.filter(t => t.to_stage === 'won').length;
    
    if (newLeadEntries === 0) return 0;
    return (wonCount / newLeadEntries) * 100;
  }, [transitions]);

  // Get monthly trend for last N months
  const getMonthlyTrend = useCallback((months: number = 12) => {
    const trend: { month: string; fromStage: LeadStage; toStage: LeadStage; rate: number; count: number }[] = [];
    const now = new Date();
    
    for (let i = months - 1; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      const monthLabel = format(monthDate, 'MMM yy');
      
      const monthTransitions = transitions.filter(t => {
        const date = new Date(t.confirmed_at);
        return date >= monthStart && date <= monthEnd;
      });
      
      // Count leads that entered funnel (new_lead -> meeting_done)
      const newLeadEntries = monthTransitions.filter(t => t.to_stage === 'meeting_done').length;
      const wonCount = monthTransitions.filter(t => t.to_stage === 'won').length;
      
      trend.push({
        month: monthLabel,
        fromStage: 'new_lead',
        toStage: 'won',
        rate: newLeadEntries > 0 ? (wonCount / newLeadEntries) * 100 : 0,
        count: wonCount,
      });
    }
    
    return trend;
  }, [transitions]);

  // Get full summary
  const getSummary = useCallback((): FunnelPassthroughSummary => {
    return {
      conversionRates: getConversionRates(),
      overallConversion: getOverallConversion(),
      totalTransitions: transitions.length,
      monthlyTrend: getMonthlyTrend(12),
    };
  }, [getConversionRates, getOverallConversion, getMonthlyTrend, transitions.length]);

  return {
    transitions: transitions as LeadStageTransition[],
    isLoading: false,
    confirmTransition,
    confirmTransitionAsync,
    isConfirming,
    getConversionRates,
    getOverallConversion,
    getMonthlyTrend,
    getSummary,
    stageLabels: STAGE_LABELS,
    refreshTransitions,
  };
}
