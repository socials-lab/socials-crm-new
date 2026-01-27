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
  initializeNewLeadEntries,
  addTransition, 
  STORAGE_KEY,
  NEW_LEADS_STORAGE_KEY,
  type MockTransition,
  type NewLeadEntry 
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
  
  // Initialize new lead entries (all leads including bad fits)
  const [newLeadEntries, setNewLeadEntries] = useState<NewLeadEntry[]>(() =>
    initializeNewLeadEntries()
  );
  
  const [isConfirming, setIsConfirming] = useState(false);

  // Refresh transitions from localStorage
  const refreshTransitions = useCallback(() => {
    const storedTransitions = localStorage.getItem(STORAGE_KEY);
    if (storedTransitions) {
      try {
        setTransitions(JSON.parse(storedTransitions));
      } catch {
        // Keep current state if parse fails
      }
    }
    
    const storedEntries = localStorage.getItem(NEW_LEADS_STORAGE_KEY);
    if (storedEntries) {
      try {
        setNewLeadEntries(JSON.parse(storedEntries));
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

  // Get qualification rate (% of leads that are qualified vs bad fit)
  const getQualificationRate = useCallback((): { 
    totalLeads: number; 
    qualifiedLeads: number; 
    badFitLeads: number; 
    qualificationRate: number; 
  } => {
    const totalLeads = newLeadEntries.length;
    const qualifiedLeads = newLeadEntries.filter(e => e.is_qualified).length;
    const badFitLeads = totalLeads - qualifiedLeads;
    const qualificationRate = totalLeads > 0 ? (qualifiedLeads / totalLeads) * 100 : 0;
    
    return { totalLeads, qualifiedLeads, badFitLeads, qualificationRate };
  }, [newLeadEntries]);

  // Get performance by source - which channels bring the best leads
  const getSourcePerformance = useCallback(() => {
    const sourceStats: Record<string, { 
      total: number; 
      qualified: number; 
      won: number;
      totalValue: number;
      wonValue: number;
    }> = {};
    
    newLeadEntries.forEach(entry => {
      if (!sourceStats[entry.source]) {
        sourceStats[entry.source] = { total: 0, qualified: 0, won: 0, totalValue: 0, wonValue: 0 };
      }
      sourceStats[entry.source].total++;
      sourceStats[entry.source].totalValue += entry.value;
      if (entry.is_qualified) sourceStats[entry.source].qualified++;
      if (entry.is_won) {
        sourceStats[entry.source].won++;
        sourceStats[entry.source].wonValue += entry.value;
      }
    });
    
    return Object.entries(sourceStats).map(([source, stats]) => ({
      source,
      total: stats.total,
      qualified: stats.qualified,
      won: stats.won,
      qualificationRate: stats.total > 0 ? (stats.qualified / stats.total) * 100 : 0,
      conversionRate: stats.total > 0 ? (stats.won / stats.total) * 100 : 0,
      avgValue: stats.total > 0 ? stats.totalValue / stats.total : 0,
      wonValue: stats.wonValue,
    })).sort((a, b) => b.conversionRate - a.conversionRate);
  }, [newLeadEntries]);

  // Calculate conversion rates between consecutive stages
  const getConversionRates = useCallback((): StageConversionRate[] => {
    const rates: StageConversionRate[] = [];
    
    // Total new leads that came in (including bad fits)
    const totalNewLeads = newLeadEntries.length;
    
    // Count transitions TO each stage (entries into stage) - for calculating base
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
      
      // For new_lead stage, use TOTAL new leads (including bad fits) as base
      // This gives the real picture: new_lead -> meeting = ~30% (70% are bad fit)
      // For other stages, use entries into that stage
      const totalFromStage = fromStage === 'new_lead' 
        ? totalNewLeads
        : stageEntries[fromStage] || 0;
      
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
  }, [transitions, newLeadEntries]);

  // Calculate overall conversion (new_lead -> won) based on ALL leads
  const getOverallConversion = useCallback((): number => {
    const totalNewLeads = newLeadEntries.length;
    const wonCount = transitions.filter(t => t.to_stage === 'won').length;
    
    if (totalNewLeads === 0) return 0;
    return (wonCount / totalNewLeads) * 100;
  }, [transitions, newLeadEntries]);

  // Get monthly trend for last N months
  const getMonthlyTrend = useCallback((months: number = 12) => {
    const trend: { month: string; fromStage: LeadStage; toStage: LeadStage; rate: number; count: number }[] = [];
    const now = new Date();
    
    for (let i = months - 1; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      const monthLabel = format(monthDate, 'MMM yy');
      
      // Count ALL new leads in this month (including bad fits)
      const monthNewLeads = newLeadEntries.filter(e => {
        const date = new Date(e.entered_at);
        return date >= monthStart && date <= monthEnd;
      }).length;
      
      const monthTransitions = transitions.filter(t => {
        const date = new Date(t.confirmed_at);
        return date >= monthStart && date <= monthEnd;
      });
      
      const wonCount = monthTransitions.filter(t => t.to_stage === 'won').length;
      
      trend.push({
        month: monthLabel,
        fromStage: 'new_lead',
        toStage: 'won',
        rate: monthNewLeads > 0 ? (wonCount / monthNewLeads) * 100 : 0,
        count: wonCount,
      });
    }
    
    return trend;
  }, [transitions, newLeadEntries]);

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
    newLeadEntries,
    isLoading: false,
    confirmTransition,
    confirmTransitionAsync,
    isConfirming,
    getConversionRates,
    getOverallConversion,
    getQualificationRate,
    getSourcePerformance,
    getMonthlyTrend,
    getSummary,
    stageLabels: STAGE_LABELS,
    refreshTransitions,
  };
}
