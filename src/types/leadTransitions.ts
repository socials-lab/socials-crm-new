import type { LeadStage } from './crm';

// Lead Stage Transition - for confirmed funnel analytics
export interface LeadStageTransition {
  id: string;
  lead_id: string;
  from_stage: LeadStage;
  to_stage: LeadStage;
  transition_value: number;
  confirmed_at: string;
  confirmed_by: string | null;
  created_at: string;
}

// Pending transition that needs confirmation
export interface PendingTransition {
  leadId: string;
  leadName: string;
  fromStage: LeadStage;
  toStage: LeadStage;
  leadValue: number;
}

// Conversion rate between stages
export interface StageConversionRate {
  fromStage: LeadStage;
  toStage: LeadStage;
  fromLabel: string;
  toLabel: string;
  rate: number;
  count: number;
  total: number;
}

// Monthly conversion trend data point
export interface ConversionTrendPoint {
  month: string;
  fromStage: LeadStage;
  toStage: LeadStage;
  rate: number;
  count: number;
}

// Funnel passthrough summary
export interface FunnelPassthroughSummary {
  conversionRates: StageConversionRate[];
  overallConversion: number;
  totalTransitions: number;
  monthlyTrend: ConversionTrendPoint[];
}
