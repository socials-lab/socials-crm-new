import { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { LeadStage } from '@/types/crm';
import type {
  LeadStageTransition,
  StageConversionRate,
  FunnelPassthroughSummary,
} from '@/types/leadTransitions';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

const STAGE_ORDER: LeadStage[] = [
  'new_lead',
  'meeting_done',
  'waiting_access',
  'access_received',
  'preparing_offer',
  'offer_sent',
  'waiting_contract_signature',
  'won',
];

const STAGE_LABELS: Record<LeadStage, string> = {
  new_lead: 'Nový lead',
  meeting_done: 'Schůzka',
  waiting_access: 'Čekáme přístupy',
  access_received: 'Přístupy',
  preparing_offer: 'Nabídka',
  offer_sent: 'Odesláno',
  waiting_contract_signature: 'Čeká na podpis',
  won: 'Won',
  lost: 'Lost',
  postponed: 'Odloženo',
  bad_fit: 'Bad Fit',
};

const LABEL_TO_STAGE: Record<string, LeadStage> = {
  'Nový lead': 'new_lead',
  Schůzka: 'meeting_done',
  'Schůzka proběhla': 'meeting_done',
  'Čekáme přístupy': 'waiting_access',
  'Čekáme na přístupy': 'waiting_access',
  Přístupy: 'access_received',
  'Přístupy přijaty': 'access_received',
  Nabídka: 'preparing_offer',
  'Příprava nabídky': 'preparing_offer',
  Odesláno: 'offer_sent',
  'Nabídka odeslána': 'offer_sent',
  'Čeká na podpis': 'waiting_contract_signature',
  'Čeká na podpis smlouvy': 'waiting_contract_signature',
  Won: 'won',
  'Vyhráno': 'won',
  Lost: 'lost',
  'Prohráno': 'lost',
  Odloženo: 'postponed',
  'Bad Fit': 'bad_fit',
};

export function useLeadTransitions() {
  const queryClient = useQueryClient();
  const [isConfirming, setIsConfirming] = useState(false);

  interface LeadHistoryRecord {
    id: string;
    lead_id: string;
    old_value: string | null;
    new_value: string | null;
    created_at: string;
    changed_by: string | null;
  }
  interface LeadRecord {
    id: string;
    source: string | null;
    stage: LeadStage;
    estimated_price: number | null;
    created_at: string;
  }
  interface NewLeadEntry {
    id: string;
    lead_id: string;
    source: string;
    entered_at: string;
    value: number;
    is_qualified: boolean;
    is_won: boolean;
  }

  const isMissingDeletedAtColumnError = (error: unknown) => {
    if (!error || typeof error !== 'object') return false;
    const err = error as { code?: string; message?: string };
    return err.code === '42703' || err.message?.includes('deleted_at') === true;
  };

  const { data: historyData = [], isLoading: historyLoading } = useQuery({
    queryKey: ['lead_transitions_history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lead_history')
        .select('id, lead_id, old_value, new_value, created_at, changed_by')
        .eq('change_type', 'stage_change')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as LeadHistoryRecord[];
    },
  });

  const { data: leadsData = [], isLoading: leadsLoading } = useQuery({
    queryKey: ['lead_transitions_leads'],
    queryFn: async () => {
      let { data, error } = await supabase
        .from('leads')
        .select('id, source, stage, estimated_price, created_at')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error && isMissingDeletedAtColumnError(error)) {
        const fallback = await supabase
          .from('leads')
          .select('id, source, stage, estimated_price, created_at')
          .order('created_at', { ascending: false });
        data = fallback.data;
        error = fallback.error;
      }

      if (error) throw error;
      return (data || []) as LeadRecord[];
    },
  });

  const transitions = useMemo<LeadStageTransition[]>(
    () =>
      historyData.map((record) => ({
        id: record.id,
        lead_id: record.lead_id,
        from_stage: LABEL_TO_STAGE[record.old_value || ''] || 'new_lead',
        to_stage: LABEL_TO_STAGE[record.new_value || ''] || 'new_lead',
        transition_value: 0,
        confirmed_at: record.created_at,
        confirmed_by: record.changed_by,
        created_at: record.created_at,
      })),
    [historyData]
  );

  const newLeadEntries = useMemo<NewLeadEntry[]>(
    () =>
      leadsData.map((lead) => ({
        id: lead.id,
        lead_id: lead.id,
        source: lead.source || 'other',
        entered_at: lead.created_at,
        value: lead.estimated_price || 0,
        is_qualified: !['lost', 'postponed', 'bad_fit'].includes(lead.stage) || lead.stage === 'won',
        is_won: lead.stage === 'won',
      })),
    [leadsData]
  );

  const refreshTransitions = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['lead_transitions_history'] });
    queryClient.invalidateQueries({ queryKey: ['lead_transitions_leads'] });
  }, [queryClient]);

  const confirmTransition = useCallback(() => {
    setIsConfirming(true);
    refreshTransitions();
    setIsConfirming(false);
  }, [refreshTransitions]);

  const confirmTransitionAsync = useCallback(async ({
    leadId: _leadId,
    fromStage: _fromStage,
    toStage: _toStage,
    transitionValue: _transitionValue,
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
    transitions,
    newLeadEntries,
    isLoading: historyLoading || leadsLoading,
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
