import { useState, useMemo } from 'react';
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
import { ExtraWorkMarginSection } from '@/components/analytics/ExtraWorkMarginSection';
import { UpsellCommissionsAnalytics } from '@/components/analytics/UpsellCommissionsAnalytics';
import { PeriodSelector, type PeriodMode } from '@/components/analytics/PeriodSelector';
import { useCRMData } from '@/hooks/useCRMData';
import { useLeadsData } from '@/hooks/useLeadsData';
import { useCreativeBoostData } from '@/hooks/useCreativeBoostData';
import { useUserRole } from '@/hooks/useUserRole';

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

export default function Analytics() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth() + 1);
  const [periodMode, setPeriodMode] = useState<PeriodMode>('month');
  const [selectedQuarter, setSelectedQuarter] = useState(() => Math.ceil((new Date().getMonth() + 1) / 3));

  const { leads } = useLeadsData();
  const { getClientMonthSummaries, outputTypes, outputs, calculateOutputCredits } = useCreativeBoostData();
  const { clients, engagements, extraWorks, colleagues, assignments, engagementMetrics, getClientById } = useCRMData();
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
    const mrr = activeEngs.reduce((sum, e) => sum + e.monthly_fee, 0);
    const prevMrr = engagements
      .filter(e => {
        const start = new Date(e.start_date);
        const end = e.end_date ? new Date(e.end_date) : null;
        return e.status === 'active' && start <= prevPeriodEnd && (!end || end >= prevPeriodStart);
      })
      .reduce((sum, e) => sum + e.monthly_fee, 0);

    // Average margin
    const metrics = engagementMetrics.filter(m => m.year === selectedYear && m.month === selectedMonth);
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
        .reduce((sum, e) => sum + e.monthly_fee, 0);

      return {
        month: format(date, 'MMM', { locale: cs }),
        value: monthMrr,
      };
    });

    // Revenue breakdown - calculate from actual data
    const retainerRevenue = activeEngs
      .filter(e => e.type === 'retainer')
      .reduce((sum, e) => sum + e.monthly_fee, 0);
    
    const oneOffRevenue = activeEngs
      .filter(e => e.type === 'one_off')
      .reduce((sum, e) => sum + e.one_off_fee, 0);
    
    const periodExtraWorks = extraWorks.filter(ew => {
      const date = new Date(ew.work_date);
      return date >= periodStart && date <= periodEnd && ew.status === 'invoiced';
    });
    const extraWorkRevenue = periodExtraWorks.reduce((sum, ew) => sum + ew.amount, 0);
    
    const cbSummaries = getClientMonthSummaries(selectedYear, selectedMonth);
    const creativeBoostRevenue = cbSummaries.reduce((sum, s) => sum + s.estimatedInvoice, 0);
    
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
  }, [comparisonEnd, comparisonStart, periodEnd, periodStart, selectedMonth, selectedYear, clients, engagements, engagementMetrics, getClientById, extraWorks, leads, getClientMonthSummaries]);

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
    const stages = ['new_lead', 'contacted', 'in_progress', 'offer_sent', 'won', 'lost'] as const;
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
    const totalInvoicing = activeEngs.reduce((sum, e) => sum + e.monthly_fee, 0);
    const prevInvoicing = engagements
      .filter(e => {
        const start = new Date(e.start_date);
        const end = e.end_date ? new Date(e.end_date) : null;
        return e.status === 'active' && start <= prevPeriodEnd && (!end || end >= prevPeriodStart);
      })
      .reduce((sum, e) => sum + e.monthly_fee, 0);
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
        const revenue = clientEngs.reduce((sum, e) => sum + e.monthly_fee, 0);
        return { name: c.brand_name, revenue };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Top clients by margin
    const metrics = engagementMetrics.filter(m => m.year === selectedYear && m.month === selectedMonth);
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
  }, [comparisonEnd, comparisonStart, periodEnd, periodStart, selectedMonth, selectedYear, clients, engagements, engagementMetrics]);

  // =====================================================
  // FINANCE DATA
  // =====================================================
  const financeData = useMemo(() => {
    const prevPeriodStart = comparisonStart;
    const prevPeriodEnd = comparisonEnd;

    // Active engagements
    const activeEngs = engagements.filter(e => {
      const start = new Date(e.start_date);
      const end = e.end_date ? new Date(e.end_date) : null;
      return e.status === 'active' && start <= periodEnd && (!end || end >= periodStart);
    });

    // Total invoicing
    const totalInvoicing = activeEngs.reduce((sum, e) => sum + e.monthly_fee, 0);
    const prevInvoicing = engagements
      .filter(e => {
        const start = new Date(e.start_date);
        const end = e.end_date ? new Date(e.end_date) : null;
        return e.status === 'active' && start <= prevPeriodEnd && (!end || end >= prevPeriodStart);
      })
      .reduce((sum, e) => sum + e.monthly_fee, 0);
    const invoicingChange = prevInvoicing > 0 
      ? ((totalInvoicing - prevInvoicing) / prevInvoicing) * 100 
      : 0;

    // Metrics
    const metrics = engagementMetrics.filter(m => m.year === selectedYear && m.month === selectedMonth);
    const avgMarginPercent = metrics.length > 0 
      ? metrics.reduce((sum, m) => sum + m.margin_percent, 0) / metrics.length 
      : 0;
    const marginAbsolute = metrics.reduce((sum, m) => sum + m.margin_amount, 0);

    // Extra work
    const periodExtraWorks = extraWorks.filter(ew => {
      const date = new Date(ew.work_date);
      return date >= periodStart && date <= periodEnd;
    });
    const extraWorkCount = periodExtraWorks.length;
    const extraWorkAmount = periodExtraWorks.reduce((sum, ew) => sum + ew.amount, 0);

    // Engagement margins
    const engagementMargins = activeEngs.map(e => {
      const client = getClientById(e.client_id);
      const metric = metrics.find(m => m.engagement_id === e.id);
      const engAssignments = assignments.filter(a => a.engagement_id === e.id);
      const cost = engAssignments.reduce((sum, a) => sum + (a.monthly_cost || 0), 0);
      
      return {
        id: e.id,
        name: e.name,
        client: client?.brand_name || '',
        revenue: e.monthly_fee,
        cost,
        marginAbsolute: metric?.margin_amount || (e.monthly_fee - cost),
        marginPercent: metric?.margin_percent || (e.monthly_fee > 0 ? ((e.monthly_fee - cost) / e.monthly_fee) * 100 : 0),
      };
    }).sort((a, b) => b.marginPercent - a.marginPercent);

    // Margin trend
    const marginTrend = Array.from({ length: 12 }, (_, i) => {
      const date = subMonths(periodStart, 11 - i);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      const monthMetrics = engagementMetrics.filter(m => m.year === year && m.month === month);
      const avgPercent = monthMetrics.length > 0 
        ? monthMetrics.reduce((sum, m) => sum + m.margin_percent, 0) / monthMetrics.length
        : 0;
      const totalAbsolute = monthMetrics.reduce((sum, m) => sum + m.margin_amount, 0);

      return {
        month: format(date, 'MMM', { locale: cs }),
        percent: avgPercent,
        absolute: totalAbsolute,
      };
    });

    // Margin distribution
    const ranges = ['0-10%', '10-20%', '20-30%', '30-40%', '40-50%', '50%+'];
    const marginDistribution = ranges.map((range, i) => {
      const min = i * 10;
      const max = i === 5 ? 100 : (i + 1) * 10;
      const count = engagementMargins.filter(e => e.marginPercent >= min && e.marginPercent < max).length;
      return { range, count };
    });

    // Extra work trend
    const extraWorkTrend = Array.from({ length: 12 }, (_, i) => {
      const date = subMonths(periodStart, 11 - i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);

      const monthWorks = extraWorks.filter(ew => {
        const workDate = new Date(ew.work_date);
        return workDate >= monthStart && workDate <= monthEnd;
      });

      return {
        month: format(date, 'MMM', { locale: cs }),
        count: monthWorks.length,
        amount: monthWorks.reduce((sum, ew) => sum + ew.amount, 0),
      };
    });

    // Creative Boost stats
    const allSummaries = getClientMonthSummaries(selectedYear, selectedMonth);
    const totalCredits = allSummaries.reduce((sum, s) => sum + s.usedCredits, 0);

    // Credits by type - calculate from actual outputs
    const periodOutputs = outputs.filter(o => o.year === selectedYear && o.month === selectedMonth);
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
    };
  }, [comparisonEnd, comparisonStart, periodEnd, periodStart, selectedMonth, selectedYear, engagements, engagementMetrics, extraWorks, assignments, getClientById, colleagues, getClientMonthSummaries, outputTypes, outputs, calculateOutputCredits]);

  const creativeBoostData = useMemo(() => {
    const allSummaries = getClientMonthSummaries(selectedYear, selectedMonth);
    const prevSummaries = getClientMonthSummaries(
      selectedMonth === 1 ? selectedYear - 1 : selectedYear,
      selectedMonth === 1 ? 12 : selectedMonth - 1
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
    const activeClients = allSummaries.length;
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

    const periodOutputs = outputs.filter((o) => o.year === selectedYear && o.month === selectedMonth);

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

    const creditsByClient = allSummaries.map((s) => ({
      clientId: s.clientId,
      clientName: s.clientName,
      brandName: s.brandName,
      usedCredits: s.usedCredits,
      maxCredits: s.maxCredits,
      utilizationPercent: s.maxCredits > 0 ? (s.usedCredits / s.maxCredits) * 100 : 0,
      pricePerCredit: s.pricePerCredit,
      revenue: s.estimatedInvoice,
    })).sort((a, b) => b.revenue - a.revenue);

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
  }, [calculateOutputCredits, colleagues, getClientMonthSummaries, outputTypes, outputs, periodStart, selectedMonth, selectedYear]);

  const teamData = useMemo(() => {
    const activeColleaguesList = colleagues.filter((c) => c.status === 'active');
    const activeColleagues = activeColleaguesList.length;

    const activeEngs = engagements.filter((e) => {
      const start = new Date(e.start_date);
      const end = e.end_date ? new Date(e.end_date) : null;
      return e.status === 'active' && start <= periodEnd && (!end || end >= periodStart);
    });

    const mrr = activeEngs.reduce((sum, e) => sum + (e.monthly_fee || 0), 0);
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
        return sum + (eng?.monthly_fee || 0);
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
        return sum + (eng?.monthly_fee || 0);
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
  }, [assignments, colleagues, engagements, periodEnd, periodStart]);

  if (!canSeeAnalytics) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Přístup odepřen</h2>
          <p className="text-muted-foreground">Nemáte oprávnění k zobrazení analytiky.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 animate-fade-in">
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
                year={selectedYear}
                month={selectedMonth}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="upsells" className="mt-6">
          <UpsellCommissionsAnalytics
            year={selectedYear}
            month={selectedMonth}
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
