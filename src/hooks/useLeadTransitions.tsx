import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
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

// Type for raw database row
interface TransitionRow {
  id: string;
  lead_id: string;
  from_stage: string;
  to_stage: string;
  transition_value: number;
  confirmed_at: string;
  confirmed_by: string | null;
  created_at: string;
}

const SUPABASE_URL = "https://empndmpeyrdycjdesoxr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtcG5kbXBleXJkeWNqZGVzb3hyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1OTQ5NTUsImV4cCI6MjA4MTE3MDk1NX0.X3I3FU2QRZD16rLwePdC3C2r7UIlGQuvJ6wWZnzgGEQ";

export function useLeadTransitions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all transitions using direct REST API call
  const { data: transitions = [], isLoading } = useQuery({
    queryKey: ['lead-stage-transitions'],
    queryFn: async () => {
      try {
        const session = await supabase.auth.getSession();
        const response = await fetch(
          `${SUPABASE_URL}/rest/v1/lead_stage_transitions?order=confirmed_at.desc`,
          {
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${session.data.session?.access_token}`,
            },
          }
        );
        
        if (!response.ok) {
          // Table doesn't exist yet - return empty array
          return [] as LeadStageTransition[];
        }
        
        const rows = await response.json() as TransitionRow[];
        return rows.map(row => ({
          ...row,
          from_stage: row.from_stage as LeadStage,
          to_stage: row.to_stage as LeadStage,
        })) as LeadStageTransition[];
      } catch {
        return [] as LeadStageTransition[];
      }
    },
  });

  // Confirm a transition using direct REST API call
  const confirmTransitionMutation = useMutation({
    mutationFn: async ({
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
      const session = await supabase.auth.getSession();
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/lead_stage_transitions`,
        {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${session.data.session?.access_token}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify({
            lead_id: leadId,
            from_stage: fromStage,
            to_stage: toStage,
            transition_value: transitionValue,
            confirmed_by: user?.id,
          }),
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to confirm transition');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-stage-transitions'] });
    },
  });

  // Calculate conversion rates between consecutive stages
  const getConversionRates = (): StageConversionRate[] => {
    const rates: StageConversionRate[] = [];
    
    // Count entries to each stage
    const stageEntries: Record<LeadStage, number> = {} as Record<LeadStage, number>;
    STAGE_ORDER.forEach(stage => {
      stageEntries[stage] = 0;
    });
    
    transitions.forEach(t => {
      if (stageEntries[t.to_stage] !== undefined) {
        stageEntries[t.to_stage]++;
      }
    });
    
    // Count transitions between consecutive stages
    for (let i = 0; i < STAGE_ORDER.length - 1; i++) {
      const fromStage = STAGE_ORDER[i];
      const toStage = STAGE_ORDER[i + 1];
      
      const transitionCount = transitions.filter(
        t => t.from_stage === fromStage && t.to_stage === toStage
      ).length;
      
      const totalFromStage = stageEntries[fromStage] || 
        transitions.filter(t => t.to_stage === fromStage).length;
      
      rates.push({
        fromStage,
        toStage,
        fromLabel: STAGE_LABELS[fromStage],
        toLabel: STAGE_LABELS[toStage],
        rate: totalFromStage > 0 ? (transitionCount / Math.max(totalFromStage, transitionCount)) * 100 : 0,
        count: transitionCount,
        total: Math.max(totalFromStage, transitionCount),
      });
    }
    
    return rates;
  };

  // Calculate overall conversion (new_lead -> won)
  const getOverallConversion = (): number => {
    const newLeadEntries = transitions.filter(t => t.to_stage === 'new_lead').length;
    const wonCount = transitions.filter(t => t.to_stage === 'won').length;
    
    if (newLeadEntries === 0) return 0;
    return (wonCount / newLeadEntries) * 100;
  };

  // Get monthly trend for last N months
  const getMonthlyTrend = (months: number = 6) => {
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
      
      const newLeadEntries = monthTransitions.filter(t => t.to_stage === 'new_lead').length;
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
  };

  // Get full summary
  const getSummary = (): FunnelPassthroughSummary => {
    return {
      conversionRates: getConversionRates(),
      overallConversion: getOverallConversion(),
      totalTransitions: transitions.length,
      monthlyTrend: getMonthlyTrend(12),
    };
  };

  return {
    transitions,
    isLoading,
    confirmTransition: confirmTransitionMutation.mutate,
    confirmTransitionAsync: confirmTransitionMutation.mutateAsync,
    isConfirming: confirmTransitionMutation.isPending,
    getConversionRates,
    getOverallConversion,
    getMonthlyTrend,
    getSummary,
    stageLabels: STAGE_LABELS,
  };
}
