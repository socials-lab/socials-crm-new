import { startOfMonth, endOfMonth } from 'date-fns';

const STORAGE_KEY = 'crm-business-plan';

// Default targets for 2026: gradual growth to reach 25.4M total
// Starting at 1.8M, growing to 2.5M (approx 3% monthly growth)
export const DEFAULT_TARGETS_2026: Record<number, number> = {
  1: 1800000,   // Leden
  2: 1855000,   // Únor
  3: 1910000,   // Březen
  4: 1970000,   // Duben
  5: 2030000,   // Květen
  6: 2090000,   // Červen
  7: 2155000,   // Červenec
  8: 2220000,   // Srpen
  9: 2290000,   // Září
  10: 2360000,  // Říjen
  11: 2435000,  // Listopad
  12: 2285000,  // Prosinec (adjusted to hit 25.4M exactly)
};
// Total: 25,400,000 Kč

interface MonthlyPlan {
  year: number;
  month: number;
  targetRevenue: number;
}

interface IssuedInvoice {
  year: number;
  month: number;
  total_amount: number | null;
}

interface Engagement {
  id: string;
  status: string | null;
  type: string;
  start_date: string | null;
  end_date: string | null;
  monthly_fee: number | null;
}

interface ExtraWork {
  billing_period: string;
  status: string | null;
  amount: number;
}

interface EngagementService {
  billing_type: string | null;
  invoiced_in_period: string | null;
  price: number | null;
}

export type RevenueSource = 'invoiced' | 'estimated';

export function getStoredPlans(): MonthlyPlan[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function getTargetForMonth(year: number, month: number): number {
  // First check localStorage (user-edited)
  const plans = getStoredPlans();
  const userPlan = plans.find(p => p.year === year && p.month === month);
  if (userPlan) return userPlan.targetRevenue;
  
  // Fallback to default targets for 2026
  if (year === 2026 && DEFAULT_TARGETS_2026[month]) {
    return DEFAULT_TARGETS_2026[month];
  }
  
  return 0;
}

export function calculateActualRevenue(
  year: number,
  month: number,
  issuedInvoices: IssuedInvoice[],
  engagements: Engagement[],
  extraWorks: ExtraWork[],
  engagementServices: EngagementService[]
): { actual: number; source: RevenueSource } {
  // 1. Check issued invoices for this month
  const invoicedRevenue = issuedInvoices
    .filter(inv => inv.year === year && inv.month === month)
    .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
  
  if (invoicedRevenue > 0) {
    return { actual: invoicedRevenue, source: 'invoiced' };
  }
  
  // 2. Fallback: estimate from active engagements and approved extra works
  const periodStart = startOfMonth(new Date(year, month - 1));
  const periodEnd = endOfMonth(new Date(year, month - 1));
  
  // Retainers
  const retainerRevenue = engagements
    .filter(e => {
      if (e.status !== 'active' || e.type !== 'retainer') return false;
      const start = e.start_date ? new Date(e.start_date) : null;
      const end = e.end_date ? new Date(e.end_date) : null;
      if (!start) return false;
      return start <= periodEnd && (!end || end >= periodStart);
    })
    .reduce((sum, e) => sum + (e.monthly_fee || 0), 0);
  
  // Extra works ready to invoice or invoiced
  const expectedPeriod = `${year}-${String(month).padStart(2, '0')}`;
  const extraWorksRevenue = (extraWorks || [])
    .filter(ew => {
      return ew.billing_period === expectedPeriod && 
             (ew.status === 'ready_to_invoice' || ew.status === 'invoiced');
    })
    .reduce((sum, ew) => sum + (ew.amount || 0), 0);
  
  // One-off services
  const oneOffRevenue = (engagementServices || [])
    .filter(es => {
      return es.billing_type === 'one_off' && 
             es.invoiced_in_period === expectedPeriod;
    })
    .reduce((sum, es) => sum + (es.price || 0), 0);
  
  return { 
    actual: retainerRevenue + extraWorksRevenue + oneOffRevenue, 
    source: 'estimated'
  };
}

export function formatCurrencyShort(amount: number): string {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M`;
  }
  return `${(amount / 1000).toFixed(0)}k`;
}
