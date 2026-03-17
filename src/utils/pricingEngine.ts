import type { Engagement, EngagementService, EngagementAssignment } from '@/types/crm';

// ============= Types =============

export type PricingScenario = 'expand_country' | 'expand_shop' | 'add_addon';

export type MarginValidationStatus = 'green' | 'orange' | 'red';

export interface ServiceEconomics {
  id: string;
  name: string;
  price: number;
  internalCost: number;
  currency: string;
}

export interface ClientEconomics {
  totalRevenue: number;
  totalInternalCost: number;
  margin: number;
  marginPercent: number;
  services: ServiceEconomics[];
}

export interface NewClientData {
  company_name: string;
  brand_name?: string;
  ico?: string;
  dic?: string;
  note?: string;
}

export interface PricingSnapshot {
  scenario: PricingScenario;
  reference_service_id?: string;
  reference_service_name?: string;
  reference_price?: number;
  reference_internal_cost?: number;
  multiplier?: number;
  /** Price calculated from reference × multiplier */
  recommended_price?: number;
  /** User-edited final price (if different from recommended) */
  final_edited_price?: number;
  delta_revenue: number;
  delta_internal_cost: number;
  current_total_revenue: number;
  current_total_internal_cost: number;
  new_total_revenue: number;
  new_total_internal_cost: number;
  new_margin_percent: number;
  validation_status: MarginValidationStatus;
  requires_admin_approval: boolean;
  justification?: string;
  /** When expand_shop scenario requires a new legal entity (SRO) */
  new_client_data?: NewClientData;
  requires_new_client?: boolean;
  /** Colleague reward breakdown for this amendment */
  colleague_rewards?: ColleagueRewardEntry[];
}

export interface ColleagueRewardEntry {
  role: string;
  colleague_id?: string;
  colleague_name?: string;
  hours: number;
  reward: number;
  reward_type: 'fixed_monthly' | 'per_credit' | 'hourly';
}

export interface PricingScenarioResult {
  deltaRevenue: number;
  deltaInternalCost: number;
  newTotalRevenue: number;
  newTotalInternalCost: number;
  newMargin: number;
  newMarginPercent: number;
  validationStatus: MarginValidationStatus;
  requiresAdminApproval: boolean;
}

// ============= Constants =============

const TARGET_MARGIN = 66;
const WARNING_MARGIN = 63;

const DEFAULT_MULTIPLIERS: Record<string, number> = {
  expand_country: 0.5,
  expand_shop: 0.7,
};

// ============= Functions =============

/**
 * Calculate the internal cost for a single assignment.
 * For percentage model, we need the service price to calculate.
 */
function getAssignmentMonthlyCost(
  assignment: EngagementAssignment,
  servicePrice?: number
): number {
  if (assignment.cost_model === 'fixed_monthly') {
    return assignment.monthly_cost ?? 0;
  }
  if (assignment.cost_model === 'percentage' && assignment.percentage_of_revenue && servicePrice) {
    return (assignment.percentage_of_revenue / 100) * servicePrice;
  }
  if (assignment.cost_model === 'hourly') {
    // Use monthly_cost if set, otherwise estimate from hourly (fallback)
    return assignment.monthly_cost ?? 0;
  }
  return 0;
}

/**
 * Calculate current economics for a client across ALL active engagements.
 */
export function calculateClientEconomics(
  clientId: string,
  engagements: Engagement[],
  engagementServices: EngagementService[],
  assignments: EngagementAssignment[]
): ClientEconomics {
  // Get all active engagements for this client
  const clientEngagements = engagements.filter(
    e => e.client_id === clientId && e.status === 'active'
  );

  const services: ServiceEconomics[] = [];
  let totalRevenue = 0;
  let totalInternalCost = 0;

  for (const engagement of clientEngagements) {
    // Get active services for this engagement
    const engServices = engagementServices.filter(
      es => es.engagement_id === engagement.id && es.is_active && es.billing_type === 'monthly'
    );

    for (const es of engServices) {
      const serviceAssignments = assignments.filter(
        a => a.engagement_id === engagement.id &&
          (a.engagement_service_id === es.id || !a.engagement_service_id)
      );

      // For assignments not linked to a specific service, distribute evenly
      const unlinkedAssignments = assignments.filter(
        a => a.engagement_id === engagement.id && !a.engagement_service_id
      );
      const linkedAssignments = assignments.filter(
        a => a.engagement_id === engagement.id && a.engagement_service_id === es.id
      );

      let internalCost = 0;

      // Add linked assignment costs
      for (const a of linkedAssignments) {
        internalCost += getAssignmentMonthlyCost(a, es.price);
      }

      // Distribute unlinked assignment costs proportionally
      if (unlinkedAssignments.length > 0 && engServices.length > 0) {
        const totalEngRevenue = engServices.reduce((sum, s) => sum + s.price, 0);
        const serviceShare = totalEngRevenue > 0 ? es.price / totalEngRevenue : 1 / engServices.length;
        
        for (const a of unlinkedAssignments) {
          internalCost += getAssignmentMonthlyCost(a, es.price) * serviceShare;
        }
      }

      services.push({
        id: es.id,
        name: es.name,
        price: es.price,
        internalCost: Math.round(internalCost),
        currency: es.currency,
      });

      totalRevenue += es.price;
      totalInternalCost += internalCost;
    }
  }

  totalInternalCost = Math.round(totalInternalCost);
  const margin = totalRevenue - totalInternalCost;
  const marginPercent = totalRevenue > 0 ? (margin / totalRevenue) * 100 : 0;

  return {
    totalRevenue,
    totalInternalCost,
    margin,
    marginPercent: Math.round(marginPercent * 100) / 100,
    services,
  };
}

/**
 * Get the default multiplier for a pricing scenario.
 */
export function getDefaultMultiplier(scenario: PricingScenario): number | undefined {
  return DEFAULT_MULTIPLIERS[scenario];
}

/**
 * Calculate expansion price from a reference price.
 */
export function calculateExpansionPrice(referencePrice: number, multiplier: number): number {
  return Math.round(referencePrice * multiplier);
}

/**
 * Calculate expansion internal cost from a reference cost.
 */
export function calculateExpansionInternalCost(referenceInternalCost: number, multiplier: number): number {
  return Math.round(referenceInternalCost * multiplier);
}

/**
 * Get margin validation status.
 */
export function getMarginValidationStatus(marginPercent: number): MarginValidationStatus {
  if (marginPercent >= TARGET_MARGIN) return 'green';
  if (marginPercent >= WARNING_MARGIN) return 'orange';
  return 'red';
}

/**
 * Calculate the full amendment impact on client economics.
 */
export function calculateAmendmentImpact(
  currentEconomics: ClientEconomics,
  deltaRevenue: number,
  deltaInternalCost: number
): PricingScenarioResult {
  const newTotalRevenue = currentEconomics.totalRevenue + deltaRevenue;
  const newTotalInternalCost = currentEconomics.totalInternalCost + deltaInternalCost;
  const newMargin = newTotalRevenue - newTotalInternalCost;
  const newMarginPercent = newTotalRevenue > 0
    ? Math.round(((newMargin / newTotalRevenue) * 100) * 100) / 100
    : 0;

  const validationStatus = getMarginValidationStatus(newMarginPercent);

  return {
    deltaRevenue,
    deltaInternalCost,
    newTotalRevenue,
    newTotalInternalCost,
    newMargin,
    newMarginPercent,
    validationStatus,
    requiresAdminApproval: validationStatus !== 'green',
  };
}

/**
 * Format CZK amount for display.
 */
export function formatCZK(amount: number): string {
  return amount.toLocaleString('cs-CZ') + ' Kč';
}

/**
 * Get scenario label in Czech.
 */
export function getScenarioLabel(scenario: PricingScenario): string {
  const labels: Record<PricingScenario, string> = {
    expand_country: 'Nová země',
    expand_shop: 'Nový shop / značka',
    add_addon: 'Doplňková služba',
  };
  return labels[scenario];
}
