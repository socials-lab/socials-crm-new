import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { LeadStage } from '@/types/crm';
import type {
  LeadStageTransition,
  StageConversionRate,
  FunnelPassthroughSummary
} from '@/types/leadTransitions';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

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

// Map Czech labels back to stage keys (lead_history stores labels)
const LABEL_TO_STAGE: Record<string, LeadStage> = {
  'Nový lead': 'new_lead',
  'Schůzka proběhla': 'meeting_done',
  'Čekáme na přístupy': 'waiting_access',
  'Přístupy přijaty': 'access_received',
  'Příprava nabídky': 'preparing_offer',
  'Nabídka odeslána': 'offer_sent',
  'Vyhráno': 'won',
  'Prohráno': 'lost',
  'Odloženo': 'postponed',
};

interface LeadHistoryRecord {
  id: string;
  lead_id: string;
  change_type: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
  changed_by: string | null;
}

interface LeadRecord {
  id: string;
  source: string;
  stage: LeadStage;
  estimated_price: number | null;
  created_at: string;
}

export function useLeadTransitions() {
  // Fetch stage transitions from lead_history
  const { data: historyData = [] } = useQuery({
    queryKey: ['lead_transitions_history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lead_history')
        .select('id, lead_id, change_type, old_value, new_value, created_at, changed_by')
        .eq('change_type', 'stage_change')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as LeadHistoryRecord[];
    },
  });

  // Fetch all leads for total counts and source analysis
  const { data: leadsData = [] } = useQuery({
    queryKey: ['lead_transitions_leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('id, source, stage, estimated_price, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as LeadRecord[];
    },
  });

  // Transform history records to transitions format
  const transitions = useMemo((): LeadStageTransition[] => {
    return historyData.map(h => ({
      id: h.id,
      lead_id: h.lead_id,
      from_stage: LABEL_TO_STAGE[h.old_value || ''] || 'new_lead',
      to_stage: LABEL_TO_STAGE[h.new_value || ''] || 'new_lead',
      transition_value: 0, // Not tracked in history, would need lead lookup
      confirmed_at: h.created_at,
      confirmed_by: h.changed_by,
      created_at: h.created_at,
    }));
  }, [historyData]);

  // Create new lead entries from leads data (for qualification rate)
  const newLeadEntries = useMemo(() => {
    return leadsData.map(lead => ({
      id: lead.id,
      lead_id: lead.id,
      source: lead.source || 'other',
      entered_at: lead.created_at,
      value: lead.estimated_price || 0,
      is_qualified: !['lost', 'postponed'].includes(lead.stage) || lead.stage === 'won',
      is_won: lead.stage === 'won',
    }));
  }, [leadsData]);

  // Get qualification rate
  const getQualificationRate = useCallback(() => {
    const totalLeads = newLeadEntries.length;
    const qualifiedLeads = newLeadEntries.filter(e => e.is_qualified).length;
    const badFitLeads = totalLeads - qualifiedLeads;
    const qualificationRate = totalLeads > 0 ? (qualifiedLeads / totalLeads) * 100 : 0;

    return { totalLeads, qualifiedLeads, badFitLeads, qualificationRate };
  }, [newLeadEntries]);

  // Get performance by source
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
    const totalNewLeads = newLeadEntries.length;

    // Count transitions TO each stage
    const stageEntries: Record<string, number> = {};
    STAGE_ORDER.forEach(stage => {
      stageEntries[stage] = transitions.filter(t => t.to_stage === stage).length;
    });

    // Count transitions between consecutive stages
    for (let i = 0; i < STAGE_ORDER.length - 1; i++) {
      const fromStage = STAGE_ORDER[i];
      const toStage = STAGE_ORDER[i + 1];

      const transitionCount = transitions.filter(
        t => t.from_stage === fromStage && t.to_stage === toStage
      ).length;

      const totalFromStage = fromStage === 'new_lead'
        ? totalNewLeads
        : stageEntries[fromStage] || 0;

      const rate = totalFromStage > 0
        ? (transitionCount / totalFromStage) * 100
        : 0;

      rates.push({
        fromStage,
        toStage,
        fromLabel: STAGE_LABELS[fromStage],
        toLabel: STAGE_LABELS[toStage],
        rate: Math.min(rate, 100),
        count: transitionCount,
        total: totalFromStage,
      });
    }

    return rates;
  }, [transitions, newLeadEntries]);

  // Calculate overall conversion (new_lead -> won)
  const getOverallConversion = useCallback((): number => {
    const totalNewLeads = newLeadEntries.length;
    const wonCount = transitions.filter(t => t.to_stage === 'won').length;

    if (totalNewLeads === 0) return 0;
    return (wonCount / totalNewLeads) * 100;
  }, [transitions, newLeadEntries]);

  // Get monthly trend
  const getMonthlyTrend = useCallback((months: number = 12) => {
    const trend: { month: string; fromStage: LeadStage; toStage: LeadStage; rate: number; count: number }[] = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      const monthLabel = format(monthDate, 'MMM yy');

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

  // These are no-ops now since data comes from lead_history automatically
  const confirmTransition = useCallback(() => {
    // No-op - transitions are auto-tracked via lead_history
  }, []);

  const confirmTransitionAsync = useCallback(async () => {
    // No-op - transitions are auto-tracked via lead_history
    return Promise.resolve();
  }, []);

  const refreshTransitions = useCallback(() => {
    // No-op - React Query handles refetching
  }, []);

  return {
    transitions,
    newLeadEntries,
    isLoading: false,
    confirmTransition,
    confirmTransitionAsync,
    isConfirming: false,
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
