import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/shared/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnalyticsOverview } from '@/components/analytics/AnalyticsOverview';
import { LeadsAnalytics } from '@/components/analytics/LeadsAnalytics';
import { ClientsEngagementsAnalytics } from '@/components/analytics/ClientsEngagementsAnalytics';
import { FinanceAnalytics } from '@/components/analytics/FinanceAnalytics';
import { CreativeBoostAnalytics } from '@/components/analytics/CreativeBoostAnalytics';
import { TeamCapacityAnalytics } from '@/components/analytics/TeamCapacityAnalytics';
import { RevenuePlanForecast } from '@/components/analytics/RevenuePlanForecast';
import { TeamCapacityForecast } from '@/components/analytics/TeamCapacityForecast';
import { LongTermAnalytics } from '@/components/analytics/LongTermAnalytics';
import { ExtraWorkMarginSection } from '@/components/analytics/ExtraWorkMarginSection';
import { UpsellCommissionsAnalytics } from '@/components/analytics/UpsellCommissionsAnalytics';
import { PeriodSelector, type PeriodMode } from '@/components/analytics/PeriodSelector';
import { useCRMData } from '@/hooks/useCRMData';
import { useLeadsData } from '@/hooks/useLeadsData';
import { useCreativeBoostData } from '@/hooks/useCreativeBoostData';
import { useUserRole } from '@/hooks/useUserRole';
import { getEngagementMonthlyRevenue } from '@/utils/engagementRevenueUtils';
import { getExchangeRate, getExchangeRateForDate } from '@/lib/currency';

import { format, subMonths, startOfMonth, endOfMonth, differenceInDays } from 'date-fns';
import { cs } from 'date-fns/locale';

const monthNames = [
  'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
  'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'
];

const SOURCE_LABELS: Record<string, string> = {
  'referral': 'Doporučení',
  'inbound': 'Inbound',
  'cold_outreach': 'Cold outreach',
  'event': 'Event',
  'linkedin': 'LinkedIn',
  'website': 'Web',
};

interface YearMonthKey {
  year: number;
  month: number;
}

function getMonthKeysBetween(start: Date, end: Date): YearMonthKey[] {
  const keys: YearMonthKey[] = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const endKey = new Date(end.getFullYear(), end.getMonth(), 1);

  while (cursor <= endKey) {
    keys.push({ year: cursor.getFullYear(), month: cursor.getMonth() + 1 });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return keys;
}

function toYearMonthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

const BANNER_OUTPUT_CATEGORIES = ['banner', 'banner_translation', 'banner_revision', 'ai_photo'] as const;
const VIDEO_OUTPUT_CATEGORIES = ['video', 'video_translation', 'video_revision'] as const;

export default function Analytics() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth() + 1);
  const [periodMode, setPeriodMode] = useState<PeriodMode>('month');
  const [selectedQuarter, setSelectedQuarter] = useState(() => Math.ceil((new Date().getMonth() + 1) / 3));

  const { leads } = useLeadsData();
  const { getClientMonthSummaries, outputTypes, outputs, clientMonths, calculateOutputCredits } = useCreativeBoostData();
  const {
    clients,
    engagements,
    engagementServices,
    extraWorks,
    colleagues,
    assignments,
    engagementMetrics,
    issuedInvoices,
    getClientById,
  } = useCRMData();
  const { canAccessPage } = useUserRole();
  
  // Check permissions
  const canSeeAnalytics = canAccessPage('analytics');

  const { periodStart, periodEnd, periodLabel, comparisonStart, comparisonEnd } = useMemo(() => {
    const today = new Date();
    const currentYear = today.getFullYear();

    switch (periodMode) {
      case 'month': {
        const monthStart = new Date(selectedYear, selectedMonth - 1, 1);
        const monthEnd = endOfMonth(monthStart);
        const prevMonthStart = subMonths(monthStart, 1);
        return {
          periodStart: monthStart,
          periodEnd: monthEnd,
          periodLabel: `${monthNames[selectedMonth - 1]} ${selectedYear}`,
          comparisonStart: prevMonthStart,
          comparisonEnd: endOfMonth(prevMonthStart),
        };
      }
      case 'quarter': {
        const qStart = (selectedQuarter - 1) * 3;
        const quarterStart = new Date(selectedYear, qStart, 1);
        const quarterEnd = endOfMonth(new Date(selectedYear, qStart + 2, 1));
        const prevQuarterStart = subMonths(quarterStart, 3);
        return {
          periodStart: quarterStart,
          periodEnd: quarterEnd,
          periodLabel: `Q${selectedQuarter} ${selectedYear}`,
          comparisonStart: prevQuarterStart,
          comparisonEnd: endOfMonth(subMonths(quarterEnd, 3)),
        };
      }
      case 'ytd': {
        const ytdStart = new Date(selectedYear, 0, 1);
        const ytdEnd = selectedYear === currentYear ? today : new Date(selectedYear, 11, 31);
        const prevYtdStart = new Date(selectedYear - 1, 0, 1);
        const prevYtdEnd = selectedYear === currentYear
          ? new Date(selectedYear - 1, today.getMonth(), today.getDate())
          : new Date(selectedYear - 1, 11, 31);
        return {
          periodStart: ytdStart,
          periodEnd: ytdEnd,
          periodLabel: `YTD ${selectedYear}`,
          comparisonStart: prevYtdStart,
          comparisonEnd: prevYtdEnd,
        };
      }
      case 'year': {
        return {
          periodStart: new Date(selectedYear, 0, 1),
          periodEnd: new Date(selectedYear, 11, 31),
          periodLabel: `Rok ${selectedYear}`,
          comparisonStart: new Date(selectedYear - 1, 0, 1),
          comparisonEnd: new Date(selectedYear - 1, 11, 31),
        };
      }
      case 'last_year': {
        const lastYear = currentYear - 1;
        return {
          periodStart: new Date(lastYear, 0, 1),
          periodEnd: new Date(lastYear, 11, 31),
          periodLabel: `Rok ${lastYear}`,
          comparisonStart: new Date(lastYear - 1, 0, 1),
          comparisonEnd: new Date(lastYear - 1, 11, 31),
        };
      }
      default:
        throw new Error(`Unsupported period mode: ${periodMode}`);
    }
  }, [periodMode, selectedMonth, selectedQuarter, selectedYear]);

  const currentPeriodMonthKeys = useMemo(
    () => getMonthKeysBetween(periodStart, periodEnd),
    [periodStart, periodEnd]
  );

  const comparisonPeriodMonthKeys = useMemo(
    () => getMonthKeysBetween(comparisonStart, comparisonEnd),
    [comparisonStart, comparisonEnd]
  );

  const financeRateMonthKeys = useMemo(() => {
    const unique = new Map<string, YearMonthKey>();
    [...currentPeriodMonthKeys, ...comparisonPeriodMonthKeys].forEach((key) => {
      unique.set(toYearMonthKey(key.year, key.month), key);
    });
    return Array.from(unique.values());
  }, [comparisonPeriodMonthKeys, currentPeriodMonthKeys]);

  const { data: eurToCzkRatesByMonth = {} } = useQuery({
    queryKey: ['analytics', 'eur-to-czk-by-month', financeRateMonthKeys],
    enabled: financeRateMonthKeys.length > 0,
    queryFn: async () => {
      const entries = await Promise.all(
        financeRateMonthKeys.map(async (key) => {
          const monthEnd = endOfMonth(new Date(key.year, key.month - 1, 1));
          const dateLabel = format(monthEnd, 'yyyy-MM-dd');
          const rate = await getExchangeRateForDate('EUR', 'CZK', dateLabel);
          return [toYearMonthKey(key.year, key.month), rate.rate] as const;
        }),
      );
      return Object.fromEntries(entries) as Record<string, number>;
    },
    staleTime: 1000 * 60 * 60 * 12,
  });

  const { data: eurToCzkCurrent } = useQuery({
    queryKey: ['analytics', 'eur-to-czk-current'],
    queryFn: () => getExchangeRate('EUR', 'CZK'),
    staleTime: 1000 * 60 * 30,
  });

  const allTimeRateMonthKeys = useMemo(() => {
    const unique = new Map<string, YearMonthKey>();
    issuedInvoices.forEach((invoice) => {
      if ((invoice.currency || '').toUpperCase() !== 'EUR') return;
      unique.set(toYearMonthKey(invoice.year, invoice.month), { year: invoice.year, month: invoice.month });
    });
    return Array.from(unique.values());
  }, [issuedInvoices]);

  const { data: eurToCzkAllTimeRatesByMonth = {} } = useQuery({
    queryKey: ['analytics', 'eur-to-czk-all-time-by-month', allTimeRateMonthKeys],
    enabled: allTimeRateMonthKeys.length > 0,
    queryFn: async () => {
      const entries = await Promise.all(
        allTimeRateMonthKeys.map(async (key) => {
          const monthEnd = endOfMonth(new Date(key.year, key.month - 1, 1));
          const dateLabel = format(monthEnd, 'yyyy-MM-dd');
          const rate = await getExchangeRateForDate('EUR', 'CZK', dateLabel);
          return [toYearMonthKey(key.year, key.month), rate.rate] as const;
        }),
      );
      return Object.fromEntries(entries) as Record<string, number>;
    },
    staleTime: 1000 * 60 * 60 * 12,
  });

  // =====================================================
  // OVERVIEW DATA
  // =====================================================
  const overviewData = useMemo(() => {
    const prevPeriodStart = comparisonStart;
    const prevPeriodEnd = comparisonEnd;

    // Active clients for current period
    const activeClientsForPeriod = clients.filter(c => {
      const start = new Date(c.start_date);
      const end = c.end_date ? new Date(c.end_date) : null;
      return start <= periodEnd && (!end || end >= periodStart);
    });

    // Active clients for previous period
    const prevActiveClients = clients.filter(c => {
      const start = new Date(c.start_date);
      const end = c.end_date ? new Date(c.end_date) : null;
      return start <= prevPeriodEnd && (!end || end >= prevPeriodStart);
    });

    // Active engagements
    const activeEngs = engagements.filter(e => {
      const start = new Date(e.start_date);
      const end = e.end_date ? new Date(e.end_date) : null;
      return e.status === 'active' && start <= periodEnd && (!end || end >= periodStart);
    });

    // MRR calculation
    const mrr = activeEngs.reduce(
      (sum, e) => sum + getEngagementMonthlyRevenue(e.id, e.monthly_fee, engagementServices || []),
      0,
    );
    const prevMrr = engagements
      .filter(e => {
        const start = new Date(e.start_date);
        const end = e.end_date ? new Date(e.end_date) : null;
        return e.status === 'active' && start <= prevPeriodEnd && (!end || end >= prevPeriodStart);
      })
      .reduce((sum, e) => sum + getEngagementMonthlyRevenue(e.id, e.monthly_fee, engagementServices || []), 0);

    // Average margin
    const metrics = engagementMetrics.filter((m) =>
      currentPeriodMonthKeys.some((key) => key.year === m.year && key.month === m.month)
    );
    const avgMargin = metrics.length > 0 
      ? metrics.reduce((sum, m) => sum + m.margin_percent, 0) / metrics.length 
      : 0;

    // MRR trend (last 12 months)
    const mrrTrend = Array.from({ length: 12 }, (_, i) => {
      const date = subMonths(periodStart, 11 - i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      
      const monthMrr = engagements
        .filter(e => {
          const start = new Date(e.start_date);
          const end = e.end_date ? new Date(e.end_date) : null;
          return e.status === 'active' && start <= monthEnd && (!end || end >= monthStart);
        })
        .reduce((sum, e) => sum + getEngagementMonthlyRevenue(e.id, e.monthly_fee, engagementServices || []), 0);

      return {
        month: format(date, 'MMM', { locale: cs }),
        value: monthMrr,
      };
    });

    // Revenue breakdown - calculate from actual data
    const retainerRevenue = activeEngs
      .filter(e => e.type === 'retainer')
      .reduce((sum, e) => sum + getEngagementMonthlyRevenue(e.id, e.monthly_fee, engagementServices || []), 0);
    
    const oneOffRevenue = activeEngs
      .filter(e => e.type === 'one_off')
      .reduce((sum, e) => sum + e.one_off_fee, 0);
    
    const periodExtraWorks = extraWorks.filter(ew => {
      const date = new Date(ew.work_date);
      return date >= periodStart && date <= periodEnd && ew.status === 'invoiced';
    });
    const extraWorkRevenue = periodExtraWorks.reduce((sum, ew) => sum + ew.amount, 0);
    
    const creativeBoostRevenue = currentPeriodMonthKeys.reduce((sum, key) => {
      const cbSummaries = getClientMonthSummaries(key.year, key.month);
      return sum + cbSummaries.reduce((monthSum, summary) => monthSum + summary.estimatedInvoice, 0);
    }, 0);
    
    const revenueBreakdown = [
      { name: 'Retainery', value: retainerRevenue },
      { name: 'Vícepráce', value: extraWorkRevenue },
      { name: 'Jednorázové', value: oneOffRevenue },
      { name: 'Creative Boost', value: creativeBoostRevenue },
    ].filter(item => item.value > 0); // Only show non-zero items

    // Alerts
    const lowMarginEngagements = activeEngs
      .map(e => {
        const metric = metrics.find(m => m.engagement_id === e.id);
        const client = getClientById(e.client_id);
        return {
          name: e.name,
          client: client?.brand_name || '',
          margin: metric?.margin_percent || 0,
        };
      })
      .filter(e => e.margin > 0 && e.margin < 30)
      .sort((a, b) => a.margin - b.margin);

    const currentDate = new Date();
    const overdueLeads = leads
      .filter(l => l.stage !== 'won' && l.stage !== 'lost')
      .map(l => {
        const days = differenceInDays(currentDate, new Date(l.updated_at));
        return { company: l.company_name, daysOverdue: days };
      })
      .filter(l => l.daysOverdue > 14)
      .sort((a, b) => b.daysOverdue - a.daysOverdue);

    const pendingExtraWork = extraWorks.filter(ew => ew.status === 'pending_approval').length;

    return {
      activeClients: activeClientsForPeriod.length,
      activeEngagements: activeEngs.length,
      mrr,
      avgMargin,
      mrrChange: prevMrr > 0 ? ((mrr - prevMrr) / prevMrr) * 100 : 0,
      clientChange: activeClientsForPeriod.length - prevActiveClients.length,
      mrrTrend,
      revenueBreakdown,
      alerts: {
        lowMarginEngagements,
        overdueLeads,
        pendingExtraWork,
      },
    };
  }, [comparisonEnd, comparisonStart, currentPeriodMonthKeys, periodEnd, periodStart, clients, engagements, engagementMetrics, engagementServices, getClientById, extraWorks, leads, getClientMonthSummaries]);

  // =====================================================
  // LEADS DATA
  // =====================================================
  const leadsData = useMemo(() => {
    const prevPeriodStart = comparisonStart;
    const prevPeriodEnd = comparisonEnd;

    // Leads for current period
    const currentPeriodLeads = leads.filter(l => {
      const created = new Date(l.created_at);
      return created >= periodStart && created <= periodEnd;
    });

    const prevPeriodLeads = leads.filter(l => {
      const created = new Date(l.created_at);
      return created >= prevPeriodStart && created <= prevPeriodEnd;
    });

    // All active leads
    const activeLeads = leads.filter(l => l.stage !== 'won' && l.stage !== 'lost');
    const wonLeads = leads.filter(l => l.stage === 'won');
    
    // Lead to client rate
    const leadToClientRate = leads.length > 0 ? (wonLeads.length / leads.length) * 100 : 0;

    // Average conversion days
    const conversionDays = wonLeads
      .filter(l => l.converted_at)
      .map(l => differenceInDays(new Date(l.converted_at!), new Date(l.created_at)));
    const avgConversionDays = conversionDays.length > 0 
      ? Math.round(conversionDays.reduce((a, b) => a + b, 0) / conversionDays.length)
      : 0;

    // Expected value
    const expectedValue = activeLeads.reduce(
      (sum, l) => sum + (l.estimated_price * l.probability_percent / 100), 
      0
    );

    // Lead trend
    const leadTrend = Array.from({ length: 12 }, (_, i) => {
      const date = subMonths(periodStart, 11 - i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);

      const newLeads = leads.filter(l => {
        const created = new Date(l.created_at);
        return created >= monthStart && created <= monthEnd;
      }).length;

      const activeInMonth = leads.filter(l => {
        const created = new Date(l.created_at);
        return created <= monthEnd && l.stage !== 'won' && l.stage !== 'lost';
      }).length;

      const closedInMonth = leads.filter(l => {
        if (!l.converted_at && l.stage !== 'lost') return false;
        const closedDate = l.converted_at ? new Date(l.converted_at) : new Date(l.updated_at);
        return closedDate >= monthStart && closedDate <= monthEnd;
      }).length;

      return {
        month: format(date, 'MMM', { locale: cs }),
        new: newLeads,
        active: activeInMonth,
        closed: closedInMonth,
      };
    });

    // Funnel data
    const stages = ['new_lead', 'meeting_done', 'waiting_access', 'access_received', 'preparing_offer', 'offer_sent', 'won', 'lost', 'postponed'] as const;
    const funnelData = stages.map(stage => ({
      stage,
      count: leads.filter(l => l.stage === stage).length,
    }));

    // Leads by source
    const sources = ['referral', 'inbound', 'cold_outreach', 'event', 'linkedin', 'website'] as const;
    const leadsBySource = sources.map(source => ({
      source: SOURCE_LABELS[source] || source,
      count: leads.filter(l => l.source === source).length,
      converted: leads.filter(l => l.source === source && l.stage === 'won').length,
    })).filter(s => s.count > 0);

    // Leads by owner
    const ownerIds = [...new Set(leads.map(l => l.owner_id))];
    const leadsByOwner = ownerIds.map(ownerId => {
      const colleague = colleagues.find(c => c.id === ownerId);
      return {
        owner: colleague?.full_name || 'Neznámý',
        count: leads.filter(l => l.owner_id === ownerId).length,
        converted: leads.filter(l => l.owner_id === ownerId && l.stage === 'won').length,
      };
    }).sort((a, b) => b.count - a.count);

    // Pipeline velocity - average days in each stage
    const pipelineStages = ['new_lead', 'meeting_done', 'waiting_access', 'access_received', 'preparing_offer', 'offer_sent'];
    const pipelineVelocity = pipelineStages.map(stage => {
      const stageLeads = leads.filter(l => l.stage === stage);
      const totalDays = stageLeads.reduce((sum, l) => {
        const created = new Date(l.created_at);
        const updated = new Date(l.updated_at);
        return sum + differenceInDays(updated, created);
      }, 0);
      return {
        stage,
        avgDays: stageLeads.length > 0 ? totalDays / stageLeads.length : 0,
      };
    });

    // Source performance with extended metrics
    const sourcePerformance = sources.map(source => {
      const sourceLeads = leads.filter(l => l.source === source);
      const convertedLeads = sourceLeads.filter(l => l.stage === 'won');
      const totalValue = convertedLeads.reduce((sum, l) => sum + (l.estimated_price || 0), 0);
      return {
        source: SOURCE_LABELS[source] || source,
        count: sourceLeads.length,
        converted: convertedLeads.length,
        conversionRate: sourceLeads.length > 0 ? (convertedLeads.length / sourceLeads.length) * 100 : 0,
        avgDealSize: convertedLeads.length > 0 ? totalValue / convertedLeads.length : 0,
      };
    }).filter(s => s.count > 0).sort((a, b) => b.conversionRate - a.conversionRate);

    // Owner performance with extended metrics
    const ownerPerformance = ownerIds.map(ownerId => {
      const colleague = colleagues.find(c => c.id === ownerId);
      const ownerLeads = leads.filter(l => l.owner_id === ownerId);
      const convertedLeads = ownerLeads.filter(l => l.stage === 'won');
      return {
        owner: colleague?.full_name || 'Neznámý',
        count: ownerLeads.length,
        converted: convertedLeads.length,
        conversionRate: ownerLeads.length > 0 ? (convertedLeads.length / ownerLeads.length) * 100 : 0,
      };
    }).sort((a, b) => b.conversionRate - a.conversionRate);

    // Monthly win/loss trends
    const monthlyWinLoss = Array.from({ length: 12 }, (_, i) => {
      const date = subMonths(periodStart, 11 - i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);

      const won = leads.filter(l => {
        if (l.stage !== 'won' || !l.converted_at) return false;
        const convertedDate = new Date(l.converted_at);
        return convertedDate >= monthStart && convertedDate <= monthEnd;
      }).length;

      const lost = leads.filter(l => {
        if (l.stage !== 'lost') return false;
        const updated = new Date(l.updated_at);
        return updated >= monthStart && updated <= monthEnd;
      }).length;

      return {
        month: format(date, 'MMM', { locale: cs }),
        won,
        lost,
      };
    });

    // Won deals list
    const wonDeals = wonLeads.map(l => {
      const colleague = colleagues.find(c => c.id === l.owner_id);
      return {
        id: l.id,
        companyName: l.company_name,
        value: l.estimated_price || 0,
        source: SOURCE_LABELS[l.source as keyof typeof SOURCE_LABELS] || l.source,
        owner: colleague?.full_name || 'Neznámý',
        conversionDays: l.converted_at ? differenceInDays(new Date(l.converted_at), new Date(l.created_at)) : 0,
        convertedAt: l.converted_at || l.updated_at,
      };
    }).sort((a, b) => new Date(b.convertedAt).getTime() - new Date(a.convertedAt).getTime());

    // Total won value and count
    const totalWonValue = wonLeads.reduce((sum, l) => sum + (l.estimated_price || 0), 0);
    const wonDealsCount = wonLeads.length;
    const avgDealSize = wonDealsCount > 0 ? totalWonValue / wonDealsCount : 0;

    return {
      totalLeads: leads.length,
      newLeadsThisMonth: currentPeriodLeads.length,
      leadToClientRate,
      avgConversionDays,
      expectedValue,
      avgDealSize,
      leadChange: currentPeriodLeads.length - prevPeriodLeads.length,
      leadTrend,
      funnelData,
      leadsBySource,
      leadsByOwner,
      pipelineVelocity,
      sourcePerformance,
      ownerPerformance,
      monthlyWinLoss,
      wonDeals,
      totalWonValue,
      wonDealsCount,
    };
  }, [comparisonEnd, comparisonStart, periodEnd, periodStart, leads, colleagues]);

  // =====================================================
  // CLIENTS & ENGAGEMENTS DATA
  // =====================================================
  const clientsEngagementsData = useMemo(() => {
    const prevPeriodStart = comparisonStart;
    const prevPeriodEnd = comparisonEnd;

    // Active clients
    const activeClientsForPeriod = clients.filter(c => {
      const start = new Date(c.start_date);
      const end = c.end_date ? new Date(c.end_date) : null;
      return start <= periodEnd && (!end || end >= periodStart);
    });

    const prevActiveClients = clients.filter(c => {
      const start = new Date(c.start_date);
      const end = c.end_date ? new Date(c.end_date) : null;
      return start <= prevPeriodEnd && (!end || end >= prevPeriodStart);
    });

    // New clients
    const newClients = clients
      .filter(c => {
        const start = new Date(c.start_date);
        return start >= periodStart && start <= periodEnd;
      })
      .map(c => ({ id: c.id, name: c.brand_name, startDate: c.start_date }));

    // Lost clients
    const lostClients = clients
      .filter(c => {
        if (!c.end_date) return false;
        const end = new Date(c.end_date);
        return end >= periodStart && end <= periodEnd;
      })
      .map(c => ({ id: c.id, name: c.brand_name, endDate: c.end_date! }));

    // Churn rate
    const startOfPeriodClients = clients.filter(c => {
      const start = new Date(c.start_date);
      const end = c.end_date ? new Date(c.end_date) : null;
      return start < periodStart && (!end || end >= periodStart);
    }).length;
    const churnRate = startOfPeriodClients > 0 
      ? (lostClients.length / startOfPeriodClients) * 100 
      : 0;

    // Active engagements
    const activeEngs = engagements.filter(e => {
      const start = new Date(e.start_date);
      const end = e.end_date ? new Date(e.end_date) : null;
      return e.status === 'active' && start <= periodEnd && (!end || end >= periodStart);
    });

    // Total invoicing
    const totalInvoicing = activeEngs.reduce(
      (sum, e) => sum + getEngagementMonthlyRevenue(e.id, e.monthly_fee, engagementServices || []),
      0,
    );
    const prevInvoicing = engagements
      .filter(e => {
        const start = new Date(e.start_date);
        const end = e.end_date ? new Date(e.end_date) : null;
        return e.status === 'active' && start <= prevPeriodEnd && (!end || end >= prevPeriodStart);
      })
      .reduce((sum, e) => sum + getEngagementMonthlyRevenue(e.id, e.monthly_fee, engagementServices || []), 0);
    const invoicingChange = prevInvoicing > 0 
      ? ((totalInvoicing - prevInvoicing) / prevInvoicing) * 100 
      : 0;

    // Client trend
    const clientTrend = Array.from({ length: 12 }, (_, i) => {
      const date = subMonths(periodStart, 11 - i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);

      const active = clients.filter(c => {
        const start = new Date(c.start_date);
        const end = c.end_date ? new Date(c.end_date) : null;
        return start <= monthEnd && (!end || end >= monthStart);
      }).length;

      const newInMonth = clients.filter(c => {
        const start = new Date(c.start_date);
        return start >= monthStart && start <= monthEnd;
      }).length;

      const lostInMonth = clients.filter(c => {
        if (!c.end_date) return false;
        const end = new Date(c.end_date);
        return end >= monthStart && end <= monthEnd;
      }).length;

      return {
        month: format(date, 'MMM', { locale: cs }),
        active,
        new: newInMonth,
        lost: lostInMonth,
      };
    });

    // Top clients by revenue
    const topClientsByRevenue = activeClientsForPeriod
      .map(c => {
        const clientEngs = activeEngs.filter(e => e.client_id === c.id);
        const revenue = clientEngs.reduce(
          (sum, e) => sum + getEngagementMonthlyRevenue(e.id, e.monthly_fee, engagementServices || []),
          0,
        );
        return { name: c.brand_name, revenue };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Top clients by margin
    const metrics = engagementMetrics.filter((m) =>
      currentPeriodMonthKeys.some((key) => key.year === m.year && key.month === m.month)
    );
    const topClientsByMargin = activeClientsForPeriod
      .map(c => {
        const clientEngs = activeEngs.filter(e => e.client_id === c.id);
        const clientMetrics = clientEngs.flatMap(e => metrics.filter(m => m.engagement_id === e.id));
        const avgMargin = clientMetrics.length > 0 
          ? clientMetrics.reduce((sum, m) => sum + m.margin_percent, 0) / clientMetrics.length
          : 0;
        return { name: c.brand_name, margin: avgMargin };
      })
      .filter(c => c.margin > 0)
      .sort((a, b) => b.margin - a.margin)
      .slice(0, 10);

    // Clients by tier
    const tiers = ['standard', 'gold', 'platinum', 'diamond'] as const;
    const clientsByTier = tiers.map(tier => ({
      tier,
      count: activeClientsForPeriod.filter(c => c.tier === tier).length,
    })).filter(t => t.count > 0);

    return {
      activeClients: activeClientsForPeriod.length,
      newClients,
      lostClients,
      churnRate,
      activeEngagements: activeEngs.length,
      totalInvoicing,
      invoicingChange,
      clientChange: activeClientsForPeriod.length - prevActiveClients.length,
      clientTrend,
      topClientsByRevenue,
      topClientsByMargin,
      clientsByTier,
    };
  }, [comparisonEnd, comparisonStart, currentPeriodMonthKeys, periodEnd, periodStart, clients, engagements, engagementMetrics, engagementServices]);

  // =====================================================
  // FINANCE DATA
  // =====================================================
  const financeData = useMemo(() => {
    const currentPeriodMonthKeySet = new Set(
      currentPeriodMonthKeys.map((key) => toYearMonthKey(key.year, key.month)),
    );
    const comparisonPeriodMonthKeySet = new Set(
      comparisonPeriodMonthKeys.map((key) => toYearMonthKey(key.year, key.month)),
    );

    const convertToCzk = (amount: number, currency: string, year: number, month: number) => {
      const normalizedCurrency = (currency || 'CZK').toUpperCase();
      if (normalizedCurrency === 'CZK') return amount;
      if (normalizedCurrency === 'EUR') {
        const rate =
          eurToCzkCurrent?.rate ??
          eurToCzkRatesByMonth[toYearMonthKey(year, month)] ??
          1;
        return amount * rate;
      }
      return amount;
    };

    const latestInvoicesByGeneratedId = new Map<string, (typeof issuedInvoices)[number]>();
    issuedInvoices.forEach((invoice) => {
      const generatedId = `inv-${invoice.engagement_id}-${invoice.year}-${invoice.month}`;
      const existing = latestInvoicesByGeneratedId.get(generatedId);
      if (!existing) {
        latestInvoicesByGeneratedId.set(generatedId, invoice);
        return;
      }
      const existingTime = new Date(existing.created_at || existing.issued_at).getTime();
      const invoiceTime = new Date(invoice.created_at || invoice.issued_at).getTime();
      if (!Number.isFinite(existingTime) || (Number.isFinite(invoiceTime) && invoiceTime > existingTime)) {
        latestInvoicesByGeneratedId.set(generatedId, invoice);
      }
    });

    const canonicalIssuedInvoices = Array.from(latestInvoicesByGeneratedId.values());

    const MIN_INVOICES_FOR_FINANCE_STATS = 3;
    const normalizeEntityKeyFinance = (value: string) => value.toLowerCase().replace(/\s+/g, ' ').trim();

    const latestInvoicesByExternalKeyFinance = new Map<string, (typeof issuedInvoices)[number]>();
    issuedInvoices.forEach((invoice) => {
      const externalKey = invoice.fakturoid_id
        ? `f-${invoice.fakturoid_id}`
        : `n-${invoice.invoice_number}`;
      const existing = latestInvoicesByExternalKeyFinance.get(externalKey);
      if (!existing) {
        latestInvoicesByExternalKeyFinance.set(externalKey, invoice);
        return;
      }
      const existingTime = new Date(existing.created_at || existing.issued_at).getTime();
      const invoiceTime = new Date(invoice.created_at || invoice.issued_at).getTime();
      if (!Number.isFinite(existingTime) || (Number.isFinite(invoiceTime) && invoiceTime > existingTime)) {
        latestInvoicesByExternalKeyFinance.set(externalKey, invoice);
      }
    });
    const allFakturoidInvoicesForFinanceCount = Array.from(latestInvoicesByExternalKeyFinance.values()).filter(
      (invoice) => Boolean(invoice.fakturoid_id || invoice.fakturoid_url),
    );
    const invoiceCountByClientKeyFinance = new Map<string, number>();
    allFakturoidInvoicesForFinanceCount.forEach((invoice) => {
      const legalClientName = invoice.client_id ? (getClientById(invoice.client_id)?.name || null) : null;
      const clientName = (invoice.client_name || legalClientName || 'Neznámý klient').trim();
      const clientKey = normalizeEntityKeyFinance(clientName);
      invoiceCountByClientKeyFinance.set(clientKey, (invoiceCountByClientKeyFinance.get(clientKey) || 0) + 1);
    });
    const isInvoiceFromFinanceEligibleClient = (invoice: (typeof issuedInvoices)[number]) => {
      const legalClientName = invoice.client_id ? (getClientById(invoice.client_id)?.name || null) : null;
      const clientName = (invoice.client_name || legalClientName || 'Neznámý klient').trim();
      const clientKey = normalizeEntityKeyFinance(clientName);
      return (invoiceCountByClientKeyFinance.get(clientKey) || 0) >= MIN_INVOICES_FOR_FINANCE_STATS;
    };

    const periodInvoices = canonicalIssuedInvoices
      .filter((invoice) => currentPeriodMonthKeySet.has(toYearMonthKey(invoice.year, invoice.month)))
      .filter(isInvoiceFromFinanceEligibleClient);
    const prevPeriodInvoices = canonicalIssuedInvoices
      .filter((invoice) => comparisonPeriodMonthKeySet.has(toYearMonthKey(invoice.year, invoice.month)))
      .filter(isInvoiceFromFinanceEligibleClient);

    const totalInvoicing = periodInvoices.reduce(
      (sum, invoice) => sum + convertToCzk(invoice.total_amount, invoice.currency, invoice.year, invoice.month),
      0,
    );
    const prevInvoicing = prevPeriodInvoices.reduce(
      (sum, invoice) => sum + convertToCzk(invoice.total_amount, invoice.currency, invoice.year, invoice.month),
      0,
    );
    const invoicingChange = prevInvoicing > 0
      ? ((totalInvoicing - prevInvoicing) / prevInvoicing) * 100
      : 0;

    const engagementRevenueByMonth = new Map<string, number>();
    const engagementRevenueTotals = new Map<string, number>();
    const engagementEurRevenueTotals = new Map<string, number>();
    periodInvoices.forEach((invoice) => {
      const monthKey = toYearMonthKey(invoice.year, invoice.month);
      const engagementMonthKey = `${invoice.engagement_id}::${monthKey}`;
      const convertedAmount = convertToCzk(invoice.total_amount, invoice.currency, invoice.year, invoice.month);
      engagementRevenueByMonth.set(
        engagementMonthKey,
        (engagementRevenueByMonth.get(engagementMonthKey) || 0) + convertedAmount,
      );
      engagementRevenueTotals.set(
        invoice.engagement_id,
        (engagementRevenueTotals.get(invoice.engagement_id) || 0) + convertedAmount,
      );
      if ((invoice.currency || '').toUpperCase() === 'EUR') {
        engagementEurRevenueTotals.set(
          invoice.engagement_id,
          (engagementEurRevenueTotals.get(invoice.engagement_id) || 0) + invoice.total_amount,
        );
      }
    });

    const isAssignmentActiveInMonth = (assignmentStart: Date, assignmentEnd: Date | null, year: number, month: number) => {
      const monthStart = startOfMonth(new Date(year, month - 1, 1));
      const monthEnd = endOfMonth(monthStart);
      return assignmentStart <= monthEnd && (!assignmentEnd || assignmentEnd >= monthStart);
    };

    const preferredClientMonthByClientPeriod = new Map<string, (typeof clientMonths)[number]>();
    clientMonths.forEach((clientMonth) => {
      const key = `${clientMonth.clientId}::${toYearMonthKey(clientMonth.year, clientMonth.month)}`;
      const existing = preferredClientMonthByClientPeriod.get(key);
      if (!existing) {
        preferredClientMonthByClientPeriod.set(key, clientMonth);
        return;
      }

      const existingHasService = !!existing.engagementServiceId;
      const currentHasService = !!clientMonth.engagementServiceId;
      if (!existingHasService && currentHasService) {
        preferredClientMonthByClientPeriod.set(key, clientMonth);
        return;
      }

      if (existingHasService === currentHasService) {
        const existingUpdated = new Date(existing.updatedAt).getTime();
        const currentUpdated = new Date(clientMonth.updatedAt).getTime();
        if (Number.isFinite(currentUpdated) && currentUpdated > existingUpdated) {
          preferredClientMonthByClientPeriod.set(key, clientMonth);
        }
      }
    });

    const creativeBoostCostByEngagementMonth = new Map<string, number>();
    preferredClientMonthByClientPeriod.forEach((clientMonth) => {
      const engagementId = clientMonth.engagementId;
      if (!engagementId) return;

      const outputsForClientMonth = outputs.filter(
        (output) =>
          output.clientId === clientMonth.clientId &&
          output.year === clientMonth.year &&
          output.month === clientMonth.month,
      );
      if (outputsForClientMonth.length === 0) return;

      const service =
        (clientMonth.engagementServiceId
          ? engagementServices.find((item) => item.id === clientMonth.engagementServiceId)
          : undefined) ||
        engagementServices.find(
          (item) =>
            item.engagement_id === engagementId &&
            item.is_active &&
            item.creative_boost_price_per_credit !== null,
        );
      if (!service) return;

      const bannerRewardPerCredit = service.creative_boost_reward_per_credit_banner ?? 150;
      const videoRewardPerCredit = service.creative_boost_reward_per_credit_video ?? 100;

      let bannerCredits = 0;
      let videoCredits = 0;
      outputsForClientMonth.forEach((output) => {
        const outputType = outputTypes.find((type) => type.id === output.outputTypeId);
        if (!outputType) return;
        const credits = calculateOutputCredits(output.outputTypeId, output.normalCount, output.expressCount);
        if (BANNER_OUTPUT_CATEGORIES.includes(outputType.category as (typeof BANNER_OUTPUT_CATEGORIES)[number])) {
          bannerCredits += credits.totalCredits;
          return;
        }
        if (VIDEO_OUTPUT_CATEGORIES.includes(outputType.category as (typeof VIDEO_OUTPUT_CATEGORIES)[number])) {
          videoCredits += credits.totalCredits;
        }
      });

      const creativeBoostCost = (bannerCredits * bannerRewardPerCredit) + (videoCredits * videoRewardPerCredit);
      if (creativeBoostCost <= 0) return;

      const engagementMonthKey = `${engagementId}::${toYearMonthKey(clientMonth.year, clientMonth.month)}`;
      creativeBoostCostByEngagementMonth.set(
        engagementMonthKey,
        (creativeBoostCostByEngagementMonth.get(engagementMonthKey) || 0) + creativeBoostCost,
      );
    });

    const engagementMargins = Array.from(engagementRevenueTotals.entries()).map(([engagementId, revenue]) => {
      const engagement = engagements.find((item) => item.id === engagementId);
      const client = engagement ? getClientById(engagement.client_id) : undefined;

      let cost = 0;
      currentPeriodMonthKeys.forEach((periodMonth) => {
        const monthKey = toYearMonthKey(periodMonth.year, periodMonth.month);
        const monthRevenue = engagementRevenueByMonth.get(`${engagementId}::${monthKey}`) || 0;
        if (monthRevenue <= 0) return;

        cost += assignments
          .filter((assignment) => assignment.engagement_id === engagementId)
          .reduce((sum, assignment) => {
            const assignmentStart = new Date(assignment.start_date);
            const assignmentEnd = assignment.end_date ? new Date(assignment.end_date) : null;
            if (!isAssignmentActiveInMonth(assignmentStart, assignmentEnd, periodMonth.year, periodMonth.month)) {
              return sum;
            }
            if (assignment.cost_model === 'percentage') {
              return sum + (monthRevenue * (assignment.percentage_of_revenue || 0)) / 100;
            }
            return sum + (assignment.monthly_cost || 0);
          }, 0);

        cost += creativeBoostCostByEngagementMonth.get(`${engagementId}::${monthKey}`) || 0;
      });

      const marginAbsolute = revenue - cost;
      const marginPercent = revenue > 0 ? (marginAbsolute / revenue) * 100 : 0;

      return {
        id: engagementId,
        name: engagement?.name || 'Neznámá zakázka',
        client: client?.brand_name || '',
        revenue,
        revenueEurOriginal: engagementEurRevenueTotals.get(engagementId) || 0,
        cost,
        marginAbsolute,
        marginPercent,
      };
    }).sort((a, b) => b.marginPercent - a.marginPercent);

    const marginAbsolute = engagementMargins.reduce((sum, engagement) => sum + engagement.marginAbsolute, 0);
    const avgMarginPercent = totalInvoicing > 0 ? (marginAbsolute / totalInvoicing) * 100 : 0;

    const periodExtraWorks = extraWorks.filter((item) => {
      const date = new Date(item.work_date);
      return date >= periodStart && date <= periodEnd;
    });
    const extraWorkCount = periodExtraWorks.length;
    const extraWorkAmount = periodExtraWorks.reduce((sum, item) => {
      const workDate = new Date(item.work_date);
      return sum + convertToCzk(item.amount, item.currency, workDate.getFullYear(), workDate.getMonth() + 1);
    }, 0);

    const marginTrend = Array.from({ length: 12 }, (_, i) => {
      const date = subMonths(periodStart, 11 - i);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      const monthInvoices = canonicalIssuedInvoices
        .filter((invoice) => invoice.year === year && invoice.month === month)
        .filter(isInvoiceFromFinanceEligibleClient);
      const monthRevenue = monthInvoices.reduce(
        (sum, invoice) => sum + convertToCzk(invoice.total_amount, invoice.currency, invoice.year, invoice.month),
        0,
      );

      const monthEngagementRevenue = new Map<string, number>();
      monthInvoices.forEach((invoice) => {
        const convertedAmount = convertToCzk(invoice.total_amount, invoice.currency, invoice.year, invoice.month);
        monthEngagementRevenue.set(
          invoice.engagement_id,
          (monthEngagementRevenue.get(invoice.engagement_id) || 0) + convertedAmount,
        );
      });

      const monthCost = assignments.reduce((sum, assignment) => {
        const engagementRevenue = monthEngagementRevenue.get(assignment.engagement_id) || 0;
        if (engagementRevenue <= 0) return sum;
        const assignmentStart = new Date(assignment.start_date);
        const assignmentEnd = assignment.end_date ? new Date(assignment.end_date) : null;
        if (!isAssignmentActiveInMonth(assignmentStart, assignmentEnd, year, month)) return sum;
        if (assignment.cost_model === 'percentage') {
          return sum + (engagementRevenue * (assignment.percentage_of_revenue || 0)) / 100;
        }
        return sum + (assignment.monthly_cost || 0);
      }, 0);

      const monthCreativeBoostCost = Array.from(monthEngagementRevenue.keys()).reduce((sum, engagementId) => {
        return sum + (creativeBoostCostByEngagementMonth.get(`${engagementId}::${toYearMonthKey(year, month)}`) || 0);
      }, 0);

      const absolute = monthRevenue - (monthCost + monthCreativeBoostCost);
      const percent = monthRevenue > 0 ? (absolute / monthRevenue) * 100 : 0;

      return {
        month: format(date, 'MMM', { locale: cs }),
        percent,
        absolute,
      };
    });

    const ranges = ['0-10%', '10-20%', '20-30%', '30-40%', '40-50%', '50%+'];
    const marginDistribution = ranges.map((range, i) => {
      const min = i * 10;
      const max = i === 5 ? 100 : (i + 1) * 10;
      const count = engagementMargins.filter((item) => item.marginPercent >= min && item.marginPercent < max).length;
      return { range, count };
    });

    const extraWorkTrend = Array.from({ length: 12 }, (_, i) => {
      const date = subMonths(periodStart, 11 - i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);

      const monthWorks = extraWorks.filter((item) => {
        const workDate = new Date(item.work_date);
        return workDate >= monthStart && workDate <= monthEnd;
      });

      const monthAmount = monthWorks.reduce((sum, item) => {
        const workDate = new Date(item.work_date);
        return sum + convertToCzk(item.amount, item.currency, workDate.getFullYear(), workDate.getMonth() + 1);
      }, 0);

      return {
        month: format(date, 'MMM', { locale: cs }),
        count: monthWorks.length,
        amount: monthAmount,
      };
    });

    // Creative Boost stats
    const totalCredits = currentPeriodMonthKeys.reduce((sum, key) => {
      const monthSummaries = getClientMonthSummaries(key.year, key.month);
      return sum + monthSummaries.reduce((monthSum, summary) => monthSum + summary.usedCredits, 0);
    }, 0);

    // Credits by type - calculate from actual outputs
    const periodOutputs = outputs.filter((output) =>
      currentPeriodMonthKeys.some((key) => key.year === output.year && key.month === output.month)
    );
    const creditsByTypeMap = new Map<string, number>();
    
    periodOutputs.forEach(output => {
      const credits = calculateOutputCredits(output.outputTypeId, output.normalCount, output.expressCount);
      const outputType = outputTypes.find(t => t.id === output.outputTypeId);
      const typeName = outputType?.name || 'Neznámý typ';
      const currentCredits = creditsByTypeMap.get(typeName) || 0;
      creditsByTypeMap.set(typeName, currentCredits + credits.totalCredits);
    });
    
    const creditsByType = Array.from(creditsByTypeMap.entries())
      .map(([type, credits]) => ({ type, credits }))
      .sort((a, b) => b.credits - a.credits);

    // Credits by colleague - calculate from actual outputs
    const creditsByColleagueMap = new Map<string, number>();
    
    periodOutputs.forEach(output => {
      if (!output.colleagueId) return;
      const credits = calculateOutputCredits(output.outputTypeId, output.normalCount, output.expressCount);
      const colleague = colleagues.find(c => c.id === output.colleagueId);
      const colleagueName = colleague?.full_name?.split(' ')[0] || 'Neznámý';
      const currentCredits = creditsByColleagueMap.get(colleagueName) || 0;
      creditsByColleagueMap.set(colleagueName, currentCredits + credits.totalCredits);
    });
    
    const creditsByColleague = Array.from(creditsByColleagueMap.entries())
      .map(([name, credits]) => ({ name, credits }))
      .sort((a, b) => b.credits - a.credits)
      .slice(0, 5);

    // Credits trend
    const creditsTrend = Array.from({ length: 12 }, (_, i) => {
      const date = subMonths(periodStart, 11 - i);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      const monthSummaries = getClientMonthSummaries(year, month);
      const monthCredits = monthSummaries.reduce((sum, s) => sum + s.usedCredits, 0);

      return {
        month: format(date, 'MMM', { locale: cs }),
        credits: monthCredits,
      };
    });

    return {
      totalInvoicing,
      avgMarginPercent,
      marginAbsolute,
      extraWorkCount,
      extraWorkAmount,
      invoicingChange,
      marginChange: 0, // Would need historical margin data
      engagementMargins,
      marginTrend,
      marginDistribution,
      extraWorkTrend,
      creativeBoostStats: {
        totalCredits,
        creditsByType,
        creditsByColleague,
        creditsTrend,
      },
      eurConversionRate: eurToCzkCurrent?.rate ?? null,
      eurConversionDate: eurToCzkCurrent?.providerDate ?? null,
    };
  }, [
    currentPeriodMonthKeys,
    comparisonPeriodMonthKeys,
    periodStart,
    periodEnd,
    engagements,
    issuedInvoices,
    extraWorks,
    assignments,
    engagementServices,
    eurToCzkRatesByMonth,
    clientMonths,
    getClientById,
    colleagues,
    getClientMonthSummaries,
    outputTypes,
    outputs,
    calculateOutputCredits,
    eurToCzkCurrent,
  ]);

  const longTermData = useMemo(() => {
    const MIN_INVOICES_FOR_LONG_TERM_STATS = 3;
    const normalizeEntityKey = (value: string) => value.toLowerCase().replace(/\s+/g, ' ').trim();

    const convertToCzkAllTime = (amount: number, currency: string, year: number, month: number) => {
      const normalizedCurrency = (currency || 'CZK').toUpperCase();
      if (normalizedCurrency === 'CZK') return amount;
      if (normalizedCurrency === 'EUR') {
        const rate =
          eurToCzkAllTimeRatesByMonth[toYearMonthKey(year, month)] ??
          eurToCzkCurrent?.rate ??
          1;
        return amount * rate;
      }
      return amount;
    };

    const latestInvoicesByExternalKey = new Map<string, (typeof issuedInvoices)[number]>();
    issuedInvoices.forEach((invoice) => {
      const externalKey = invoice.fakturoid_id
        ? `f-${invoice.fakturoid_id}`
        : `n-${invoice.invoice_number}`;
      const existing = latestInvoicesByExternalKey.get(externalKey);
      if (!existing) {
        latestInvoicesByExternalKey.set(externalKey, invoice);
        return;
      }
      const existingTime = new Date(existing.created_at || existing.issued_at).getTime();
      const invoiceTime = new Date(invoice.created_at || invoice.issued_at).getTime();
      if (!Number.isFinite(existingTime) || (Number.isFinite(invoiceTime) && invoiceTime > existingTime)) {
        latestInvoicesByExternalKey.set(externalKey, invoice);
      }
    });

    const canonicalInvoices = Array.from(latestInvoicesByExternalKey.values());
    const allFakturoidInvoices = canonicalInvoices.filter((invoice) => Boolean(invoice.fakturoid_id || invoice.fakturoid_url));

    const clientKeyForInvoice = (invoice: (typeof allFakturoidInvoices)[number]) => {
      const legalClientName = invoice.client_id ? (getClientById(invoice.client_id)?.name || null) : null;
      const clientName = (invoice.client_name || legalClientName || 'Neznámý klient').trim();
      return normalizeEntityKey(clientName);
    };

    const invoiceCountByClientKey = new Map<string, number>();
    allFakturoidInvoices.forEach((invoice) => {
      const clientKey = clientKeyForInvoice(invoice);
      invoiceCountByClientKey.set(clientKey, (invoiceCountByClientKey.get(clientKey) || 0) + 1);
    });

    const isLongTermEligibleClient = (clientKey: string) =>
      (invoiceCountByClientKey.get(clientKey) || 0) >= MIN_INVOICES_FOR_LONG_TERM_STATS;

    const paidInvoicesAllTime = allFakturoidInvoices.filter((invoice) => {
      const normalizedStatus = String(invoice.status || '').toLowerCase();
      return normalizedStatus === 'paid' || !!invoice.paid_at;
    });

    const paidClientMap = new Map<string, {
      clientId: string;
      clientName: string;
      paidTotalCzk: number;
      paidTotalEurOriginal: number;
      paidInvoiceCount: number;
      lastPaidAt: string | null;
    }>();

    paidInvoicesAllTime.forEach((invoice) => {
      const clientKey = clientKeyForInvoice(invoice);
      if (!isLongTermEligibleClient(clientKey)) return;

      const legalClientName = invoice.client_id ? (getClientById(invoice.client_id)?.name || null) : null;
      const clientName = (invoice.client_name || legalClientName || 'Neznámý klient').trim();
      const converted = convertToCzkAllTime(invoice.total_amount, invoice.currency, invoice.year, invoice.month);
      const existing = paidClientMap.get(clientKey) || {
        clientId: clientKey,
        clientName,
        paidTotalCzk: 0,
        paidTotalEurOriginal: 0,
        paidInvoiceCount: 0,
        lastPaidAt: null,
      };

      existing.paidTotalCzk += converted;
      existing.paidInvoiceCount += 1;
      if ((invoice.currency || '').toUpperCase() === 'EUR') {
        existing.paidTotalEurOriginal += invoice.total_amount;
      }
      if (invoice.paid_at) {
        if (!existing.lastPaidAt || new Date(invoice.paid_at).getTime() > new Date(existing.lastPaidAt).getTime()) {
          existing.lastPaidAt = invoice.paid_at;
        }
      }
      paidClientMap.set(clientKey, existing);
    });

    const longTermScopeInvoices = allFakturoidInvoices.filter((invoice) =>
      isLongTermEligibleClient(clientKeyForInvoice(invoice))
    );

    const firstInvoiceDate = longTermScopeInvoices.reduce<string | null>((minDate, invoice) => {
      if (!invoice.issued_at) return minDate;
      if (!minDate) return invoice.issued_at;
      return new Date(invoice.issued_at).getTime() < new Date(minDate).getTime() ? invoice.issued_at : minDate;
    }, null);

    const lastInvoiceDate = longTermScopeInvoices.reduce<string | null>((maxDate, invoice) => {
      if (!invoice.issued_at) return maxDate;
      if (!maxDate) return invoice.issued_at;
      return new Date(invoice.issued_at).getTime() > new Date(maxDate).getTime() ? invoice.issued_at : maxDate;
    }, null);

    const LONG_TERM_ASSUMED_MARGIN = 0.63;

    const clientTotalsFromAllInvoices = new Map<string, {
      clientName: string;
      totalCzk: number;
      firstIssuedAt: string | null;
      lastIssuedAt: string | null;
    }>();

    allFakturoidInvoices.forEach((invoice) => {
      const clientKey = clientKeyForInvoice(invoice);
      if (!isLongTermEligibleClient(clientKey)) return;

      const legalClientName = invoice.client_id ? (getClientById(invoice.client_id)?.name || null) : null;
      const clientName = (invoice.client_name || legalClientName || 'Neznámý klient').trim();
      const converted = convertToCzkAllTime(invoice.total_amount, invoice.currency, invoice.year, invoice.month);
      const existing = clientTotalsFromAllInvoices.get(clientKey) || {
        clientName,
        totalCzk: 0,
        firstIssuedAt: null,
        lastIssuedAt: null,
      };
      if (!existing.clientName && clientName) existing.clientName = clientName;
      existing.totalCzk += converted;
      if (invoice.issued_at) {
        if (!existing.firstIssuedAt || new Date(invoice.issued_at).getTime() < new Date(existing.firstIssuedAt).getTime()) {
          existing.firstIssuedAt = invoice.issued_at;
        }
        if (!existing.lastIssuedAt || new Date(invoice.issued_at).getTime() > new Date(existing.lastIssuedAt).getTime()) {
          existing.lastIssuedAt = invoice.issued_at;
        }
      }
      clientTotalsFromAllInvoices.set(clientKey, existing);
    });

    const clientTotalsArray = Array.from(clientTotalsFromAllInvoices.values()).map((item) => {
      if (!item.firstIssuedAt || !item.lastIssuedAt) {
        return { ...item, monthsActive: 1 };
      }
      const first = new Date(item.firstIssuedAt);
      const last = new Date(item.lastIssuedAt);
      const monthsActive = Math.max(1, differenceInDays(last, first) / 30.4375);
      return { ...item, monthsActive };
    });
    const allFakturoidClientsCount = clientTotalsArray.length;

    const totalRetentionMonths = clientTotalsArray.reduce((sum, item) => sum + item.monthsActive, 0);
    const totalInvoicedCzk = clientTotalsArray.reduce((sum, item) => sum + item.totalCzk, 0);

    const avgClientRetentionMonths = allFakturoidClientsCount > 0
      ? totalRetentionMonths / allFakturoidClientsCount
      : 0;
    const avgClientLtvCzk = allFakturoidClientsCount > 0
      ? totalInvoicedCzk / allFakturoidClientsCount
      : 0;
    const avgInvoicesPerClient = allFakturoidClientsCount > 0
      ? longTermScopeInvoices.length / allFakturoidClientsCount
      : 0;
    const avgEstimatedProfitPerClientCzk = avgClientLtvCzk * LONG_TERM_ASSUMED_MARGIN;

    return {
      topPaidClientsAllTime: Array.from(paidClientMap.values())
        .sort((a, b) => b.paidTotalCzk - a.paidTotalCzk),
      avgClientRetentionMonths,
      avgClientLtvCzk,
      avgInvoicesPerClient,
      clientsWithInvoicesCount: allFakturoidClientsCount,
      firstInvoiceDate,
      lastInvoiceDate,
      totalInvoicesInScope: longTermScopeInvoices.length,
      assumedMarginPercent: LONG_TERM_ASSUMED_MARGIN * 100,
      avgEstimatedProfitPerClientCzk,
    };
  }, [issuedInvoices, eurToCzkAllTimeRatesByMonth, eurToCzkCurrent, getClientById]);

  const creativeBoostData = useMemo(() => {
    const allSummaries = currentPeriodMonthKeys.flatMap((key) =>
      getClientMonthSummaries(key.year, key.month)
    );
    const prevSummaries = comparisonPeriodMonthKeys.flatMap((key) =>
      getClientMonthSummaries(key.year, key.month)
    );

    const totalCredits = allSummaries.reduce((sum, s) => sum + s.usedCredits, 0);
    const prevTotalCredits = prevSummaries.reduce((sum, s) => sum + s.usedCredits, 0);
    const creditsChange = prevTotalCredits > 0
      ? ((totalCredits - prevTotalCredits) / prevTotalCredits) * 100
      : 0;

    const totalRevenue = allSummaries.reduce((sum, s) => sum + s.estimatedInvoice, 0);
    const prevTotalRevenue = prevSummaries.reduce((sum, s) => sum + s.estimatedInvoice, 0);
    const revenueChange = prevTotalRevenue > 0
      ? ((totalRevenue - prevTotalRevenue) / prevTotalRevenue) * 100
      : 0;

    const totalMaxCredits = allSummaries.reduce((sum, s) => sum + s.maxCredits, 0);
    const avgUtilization = totalMaxCredits > 0 ? (totalCredits / totalMaxCredits) * 100 : 0;
    const activeClients = new Set(allSummaries.map((summary) => summary.clientId)).size;
    const avgPricePerCredit = allSummaries.length > 0
      ? allSummaries.reduce((sum, s) => sum + s.pricePerCredit, 0) / allSummaries.length
      : 0;

    const creditsTrend = Array.from({ length: 12 }, (_, i) => {
      const date = subMonths(periodStart, 11 - i);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      const monthSummaries = getClientMonthSummaries(year, month);
      const monthCredits = monthSummaries.reduce((sum, s) => sum + s.usedCredits, 0);
      const monthRevenue = monthSummaries.reduce((sum, s) => sum + s.estimatedInvoice, 0);
      const maxCredits = monthSummaries.reduce((sum, s) => sum + s.maxCredits, 0);
      const utilization = maxCredits > 0 ? (monthCredits / maxCredits) * 100 : 0;

      return {
        month: format(date, 'MMM', { locale: cs }),
        credits: monthCredits,
        revenue: monthRevenue,
        utilization,
      };
    });

    const periodOutputs = outputs.filter((output) =>
      currentPeriodMonthKeys.some((key) => key.year === output.year && key.month === output.month)
    );

    const creditsByTypeMap = new Map<string, number>();
    periodOutputs.forEach((output) => {
      const credits = calculateOutputCredits(output.outputTypeId, output.normalCount, output.expressCount);
      const outputType = outputTypes.find((t) => t.id === output.outputTypeId);
      const typeName = outputType?.name || 'Neznámý typ';
      creditsByTypeMap.set(typeName, (creditsByTypeMap.get(typeName) || 0) + credits.totalCredits);
    });
    const creditsByType = Array.from(creditsByTypeMap.entries())
      .map(([type, credits]) => ({ type, credits }))
      .sort((a, b) => b.credits - a.credits);

    const creditsByColleagueMap = new Map<string, number>();
    periodOutputs.forEach((output) => {
      if (!output.colleagueId) return;
      const credits = calculateOutputCredits(output.outputTypeId, output.normalCount, output.expressCount);
      const colleague = colleagues.find((c) => c.id === output.colleagueId);
      const name = colleague?.full_name || 'Neznámý';
      creditsByColleagueMap.set(name, (creditsByColleagueMap.get(name) || 0) + credits.totalCredits);
    });
    const creditsByColleague = Array.from(creditsByColleagueMap.entries())
      .map(([name, credits]) => ({ name, credits }))
      .sort((a, b) => b.credits - a.credits)
      .slice(0, 8);

    const clientTotals = new Map<string, {
      clientId: string;
      clientName: string;
      brandName: string;
      usedCredits: number;
      maxCredits: number;
      pricePerCreditTotal: number;
      pricePerCreditSamples: number;
      revenue: number;
    }>();

    allSummaries.forEach((summary) => {
      const existing = clientTotals.get(summary.clientId) || {
        clientId: summary.clientId,
        clientName: summary.clientName,
        brandName: summary.brandName,
        usedCredits: 0,
        maxCredits: 0,
        pricePerCreditTotal: 0,
        pricePerCreditSamples: 0,
        revenue: 0,
      };

      existing.usedCredits += summary.usedCredits;
      existing.maxCredits += summary.maxCredits;
      existing.pricePerCreditTotal += summary.pricePerCredit;
      existing.pricePerCreditSamples += 1;
      existing.revenue += summary.estimatedInvoice;
      clientTotals.set(summary.clientId, existing);
    });

    const creditsByClient = Array.from(clientTotals.values())
      .map((client) => ({
        clientId: client.clientId,
        clientName: client.clientName,
        brandName: client.brandName,
        usedCredits: client.usedCredits,
        maxCredits: client.maxCredits,
        utilizationPercent: client.maxCredits > 0 ? (client.usedCredits / client.maxCredits) * 100 : 0,
        pricePerCredit: client.pricePerCreditSamples > 0 ? client.pricePerCreditTotal / client.pricePerCreditSamples : 0,
        revenue: client.revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    return {
      totalCredits,
      totalRevenue,
      avgUtilization,
      activeClients,
      avgPricePerCredit,
      creditsTrend: creditsTrend.map(({ month, credits, revenue }) => ({ month, credits, revenue })),
      utilizationTrend: creditsTrend.map(({ month, utilization }) => ({ month, percent: utilization })),
      creditsByType,
      creditsByColleague,
      creditsByClient,
      creditsChange,
      revenueChange,
    };
  }, [calculateOutputCredits, colleagues, comparisonPeriodMonthKeys, currentPeriodMonthKeys, getClientMonthSummaries, outputTypes, outputs, periodStart]);

  const teamData = useMemo(() => {
    const activeColleaguesList = colleagues.filter((c) => c.status === 'active');
    const activeColleagues = activeColleaguesList.length;

    const activeEngs = engagements.filter((e) => {
      const start = new Date(e.start_date);
      const end = e.end_date ? new Date(e.end_date) : null;
      return e.status === 'active' && start <= periodEnd && (!end || end >= periodStart);
    });

    const mrr = activeEngs.reduce(
      (sum, e) => sum + getEngagementMonthlyRevenue(e.id, e.monthly_fee, engagementServices || []),
      0,
    );
    const totalTeamCost = assignments
      .filter((a) => activeEngs.some((e) => e.id === a.engagement_id))
      .reduce((sum, a) => sum + (a.monthly_cost || 0), 0);

    const avgCostPerEngagement = activeEngs.length > 0 ? totalTeamCost / activeEngs.length : 0;
    const revenuePerColleague = activeColleagues > 0 ? mrr / activeColleagues : 0;

    const colleagueWorkload = activeColleaguesList.map((c) => {
      const colleagueAssignments = assignments.filter((a) =>
        a.colleague_id === c.id && activeEngs.some((e) => e.id === a.engagement_id)
      );
      const revenue = colleagueAssignments.reduce((sum, a) => {
        const eng = activeEngs.find((e) => e.id === a.engagement_id);
        if (!eng) return sum;
        return sum + getEngagementMonthlyRevenue(eng.id, eng.monthly_fee, engagementServices || []);
      }, 0);
      return {
        name: c.full_name.split(' ')[0] || c.full_name,
        assignments: colleagueAssignments.length,
        revenue,
      };
    }).sort((a, b) => b.assignments - a.assignments).slice(0, 10);

    const costModels = ['hourly', 'fixed_monthly', 'percentage'] as const;
    const costBreakdown = costModels.map((model) => {
      const modelAssignments = assignments.filter((a) =>
        a.cost_model === model && activeEngs.some((e) => e.id === a.engagement_id)
      );
      return {
        costModel: model,
        amount: modelAssignments.reduce((sum, a) => sum + (a.monthly_cost || 0), 0),
        count: modelAssignments.length,
      };
    }).filter((c) => c.count > 0);

    const topRevenueGenerators = activeColleaguesList.map((c) => {
      const colleagueAssignments = assignments.filter((a) =>
        a.colleague_id === c.id && activeEngs.some((e) => e.id === a.engagement_id)
      );
      const engagementCount = new Set(colleagueAssignments.map((a) => a.engagement_id)).size;
      const revenue = colleagueAssignments.reduce((sum, a) => {
        const eng = activeEngs.find((e) => e.id === a.engagement_id);
        if (!eng) return sum;
        return sum + getEngagementMonthlyRevenue(eng.id, eng.monthly_fee, engagementServices || []);
      }, 0);
      return {
        name: c.full_name,
        revenue,
        engagements: engagementCount,
      };
    }).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

    const employees = activeColleaguesList.filter((c) => !c.is_freelancer);
    const freelancers = activeColleaguesList.filter((c) => c.is_freelancer);

    const employeeCost = assignments
      .filter((a) => employees.some((e) => e.id === a.colleague_id) && activeEngs.some((e) => e.id === a.engagement_id))
      .reduce((sum, a) => sum + (a.monthly_cost || 0), 0);
    const freelancerCost = assignments
      .filter((a) => freelancers.some((f) => f.id === a.colleague_id) && activeEngs.some((e) => e.id === a.engagement_id))
      .reduce((sum, a) => sum + (a.monthly_cost || 0), 0);

    const freelancerVsEmployee = [
      { type: 'Interní', count: employees.length, cost: employeeCost },
      { type: 'Freelanceři', count: freelancers.length, cost: freelancerCost },
    ];

    return {
      activeColleagues,
      totalTeamCost,
      avgCostPerEngagement,
      revenuePerColleague,
      colleagueWorkload,
      costBreakdown,
      topRevenueGenerators,
      freelancerVsEmployee,
    };
  }, [assignments, colleagues, engagements, engagementServices, periodEnd, periodStart]);

  if (!canSeeAnalytics) {
    return (
      <div className="p-4 md:p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Přístup odepřen</h2>
          <p className="text-muted-foreground">Nemáte oprávnění k zobrazení analytiky.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in p-4 sm:space-y-6 sm:p-6">
      <PageHeader 
        title="📊 Analytika"
        titleAccent="agentury"
        description="Kompletní přehled výkonu agentury"
      />

      <PeriodSelector
        periodMode={periodMode}
        setPeriodMode={setPeriodMode}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        selectedQuarter={selectedQuarter}
        setSelectedQuarter={setSelectedQuarter}
        periodLabel={periodLabel}
        periodStart={periodStart}
        periodEnd={periodEnd}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto -mx-2 px-2 pb-2 sm:overflow-visible sm:mx-0 sm:px-0 sm:pb-0">
          <TabsList className="inline-flex w-max sm:w-auto sm:grid sm:grid-cols-4 lg:inline-flex gap-1">
            <TabsTrigger value="overview" className="text-xs sm:text-sm px-2 sm:px-3">Přehled</TabsTrigger>
            <TabsTrigger value="leads" className="text-xs sm:text-sm px-2 sm:px-3">Leady</TabsTrigger>
            <TabsTrigger value="clients" className="text-xs sm:text-sm px-2 sm:px-3">Klienti</TabsTrigger>
            <TabsTrigger value="finance" className="text-xs sm:text-sm px-2 sm:px-3">Finance</TabsTrigger>
            <TabsTrigger value="upsells" className="text-xs sm:text-sm px-2 sm:px-3">Upselly</TabsTrigger>
            <TabsTrigger value="creative-boost" className="text-xs sm:text-sm px-2 sm:px-3">CB</TabsTrigger>
            <TabsTrigger value="team" className="text-xs sm:text-sm px-2 sm:px-3">Tým</TabsTrigger>
            <TabsTrigger value="long-term" className="text-xs sm:text-sm px-2 sm:px-3">Dlouhodobě</TabsTrigger>
            <TabsTrigger value="plan-forecast" className="text-xs sm:text-sm px-2 sm:px-3">Forecast</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="mt-6">
          <AnalyticsOverview
            year={selectedYear}
            month={selectedMonth}
            {...overviewData}
          />
        </TabsContent>

        <TabsContent value="leads" className="mt-6">
          <LeadsAnalytics
            year={selectedYear}
            month={selectedMonth}
            {...leadsData}
          />
        </TabsContent>

        <TabsContent value="clients" className="mt-6">
          <ClientsEngagementsAnalytics
            year={selectedYear}
            month={selectedMonth}
            {...clientsEngagementsData}
          />
        </TabsContent>

        <TabsContent value="finance" className="mt-6">
          <div className="space-y-8">
            <FinanceAnalytics
              year={selectedYear}
              month={selectedMonth}
              {...financeData}
            />
            <div className="pt-4 border-t">
              <h2 className="text-lg font-semibold mb-4">📊 Marže víceprací</h2>
              <ExtraWorkMarginSection
                periodStart={periodStart}
                periodEnd={periodEnd}
                periodLabel={periodLabel}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="upsells" className="mt-6">
          <UpsellCommissionsAnalytics
            periodStart={periodStart}
            periodEnd={periodEnd}
            comparisonStart={comparisonStart}
            comparisonEnd={comparisonEnd}
            periodLabel={periodLabel}
          />
        </TabsContent>

        <TabsContent value="creative-boost" className="mt-6">
          <CreativeBoostAnalytics
            year={selectedYear}
            month={selectedMonth}
            {...creativeBoostData}
          />
        </TabsContent>

        <TabsContent value="team" className="mt-6">
          <TeamCapacityAnalytics {...teamData} />
        </TabsContent>

        <TabsContent value="long-term" className="mt-6">
          <LongTermAnalytics {...longTermData} />
        </TabsContent>

        <TabsContent value="plan-forecast" className="mt-6">
          <div className="space-y-6">
            <RevenuePlanForecast
              selectedYear={selectedYear}
              selectedMonth={selectedMonth}
            />
            <TeamCapacityForecast
              engagements={engagements}
              colleagues={colleagues}
              assignments={assignments}
              selectedYear={selectedYear}
              selectedMonth={selectedMonth}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
