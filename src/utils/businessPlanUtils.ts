import { startOfMonth, endOfMonth } from 'date-fns';

const STORAGE_KEY = 'crm-business-plan';

// Default targets for 2026: 1.6M → 2.6M with total ~25.4M
export const DEFAULT_TARGETS_2026: Record<number, number> = {
  1: 1600000,   // Leden
  2: 1700000,   // Únor
  3: 1850000,   // Březen
  4: 1950000,   // Duben
  5: 2050000,   // Květen
  6: 2100000,   // Červen
  7: 2150000,   // Červenec
  8: 2200000,   // Srpen
  9: 2300000,   // Září
  10: 2400000,  // Říjen
  11: 2500000,  // Listopad
  12: 2600000,  // Prosinec
};

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
