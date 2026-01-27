import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnalyticsOverview } from '@/components/analytics/AnalyticsOverview';
import { LeadsAnalytics } from '@/components/analytics/LeadsAnalytics';
import { ClientsEngagementsAnalytics } from '@/components/analytics/ClientsEngagementsAnalytics';
import { FinanceAnalytics } from '@/components/analytics/FinanceAnalytics';
import { TeamCapacityAnalytics } from '@/components/analytics/TeamCapacityAnalytics';
import { BusinessPlanTab } from '@/components/analytics/BusinessPlanTab';
import { ForecastTab } from '@/components/analytics/ForecastTab';
import { PeriodSelector, type PeriodMode } from '@/components/analytics/PeriodSelector';
import { useCRMData } from '@/hooks/useCRMData';
import { useLeadsData } from '@/hooks/useLeadsData';
import { useCreativeBoostData } from '@/hooks/useCreativeBoostData';

import { format, subMonths, startOfMonth, endOfMonth, differenceInDays, differenceInMonths } from 'date-fns';
import { cs } from 'date-fns/locale';

const canSeeAnalytics = true;

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
  'other': 'Ostatní',
};

export default function Analytics() {
  const [activeTab, setActiveTab] = useState('overview');
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [periodMode, setPeriodMode] = useState<PeriodMode>('month');
  const [selectedQuarter, setSelectedQuarter] = useState(Math.ceil((now.getMonth() + 1) / 3));
  
  const { leads } = useLeadsData();
  const { getClientMonthSummaries } = useCreativeBoostData();
  const { clients, engagements, extraWorks, colleagues, assignments, getClientById, engagementServices } = useCRMData();
  
  const engagementMonthlyMetrics: any[] = [];

  // =====================================================
  // CENTRAL PERIOD CALCULATION
  // =====================================================
  const { periodStart, periodEnd, periodLabel, comparisonStart, comparisonEnd } = useMemo(() => {
    const currentYear = now.getFullYear();
    
    switch (periodMode) {
      case 'month':
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
      
      case 'quarter':
        const qStart = (selectedQuarter - 1) * 3;
        const quarterStart = new Date(selectedYear, qStart, 1);
        const quarterEnd = endOfMonth(new Date(selectedYear, qStart + 2));
        const prevQuarterStart = subMonths(quarterStart, 3);
        return {
          periodStart: quarterStart,
          periodEnd: quarterEnd,
          periodLabel: `Q${selectedQuarter} ${selectedYear}`,
          comparisonStart: prevQuarterStart,
          comparisonEnd: endOfMonth(subMonths(quarterEnd, 3)),
        };
      
      case 'ytd':
        const ytdStart = new Date(selectedYear, 0, 1);
        const ytdEnd = selectedYear === currentYear ? now : new Date(selectedYear, 11, 31);
        const prevYtdStart = new Date(selectedYear - 1, 0, 1);
        const prevYtdEnd = selectedYear === currentYear 
          ? new Date(selectedYear - 1, now.getMonth(), now.getDate())
          : new Date(selectedYear - 1, 11, 31);
        return {
          periodStart: ytdStart,
          periodEnd: ytdEnd,
          periodLabel: `YTD ${selectedYear}`,
          comparisonStart: prevYtdStart,
          comparisonEnd: prevYtdEnd,
        };
      
      case 'year':
        const yearStart = new Date(selectedYear, 0, 1);
        const yearEnd = new Date(selectedYear, 11, 31);
        const prevYearStart = new Date(selectedYear - 1, 0, 1);
        return {
          periodStart: yearStart,
          periodEnd: yearEnd,
          periodLabel: `Rok ${selectedYear}`,
          comparisonStart: prevYearStart,
          comparisonEnd: new Date(selectedYear - 1, 11, 31),
        };
      
      case 'last_year':
        const lastYear = currentYear - 1;
        const lastYearStart = new Date(lastYear, 0, 1);
        const lastYearEnd = new Date(lastYear, 11, 31);
        const prevLastYearStart = new Date(lastYear - 1, 0, 1);
        return {
          periodStart: lastYearStart,
          periodEnd: lastYearEnd,
          periodLabel: `Rok ${lastYear}`,
          comparisonStart: prevLastYearStart,
          comparisonEnd: new Date(lastYear - 1, 11, 31),
        };
      
      default:
        const defaultStart = new Date(selectedYear, selectedMonth - 1, 1);
        const defaultEnd = endOfMonth(defaultStart);
        return {
          periodStart: defaultStart,
          periodEnd: defaultEnd,
          periodLabel: `${monthNames[selectedMonth - 1]} ${selectedYear}`,
          comparisonStart: subMonths(defaultStart, 1),
          comparisonEnd: endOfMonth(subMonths(defaultStart, 1)),
        };
    }
  }, [periodMode, selectedYear, selectedMonth, selectedQuarter, now]);

  // =====================================================
  // OVERVIEW DATA
  // =====================================================
  const overviewData = useMemo(() => {
    // Use central period values
    const prevPeriodStart = comparisonStart;
    const prevPeriodEnd = comparisonEnd;

    // Active clients for current period
    const activeClientsForPeriod = clients.filter(c => {
      if (!c.start_date) return c.status === 'active';
      const start = new Date(c.start_date);
      const end = c.end_date ? new Date(c.end_date) : null;
      return start <= periodEnd && (!end || end >= periodStart);
    });

    // Active clients for previous period
    const prevActiveClients = clients.filter(c => {
      if (!c.start_date) return false;
      const start = new Date(c.start_date);
      const end = c.end_date ? new Date(c.end_date) : null;
      return start <= prevPeriodEnd && (!end || end >= prevPeriodStart);
    });

    // Active engagements
    const activeEngs = engagements.filter(e => {
      if (!e.start_date) return e.status === 'active';
      const start = new Date(e.start_date);
      const end = e.end_date ? new Date(e.end_date) : null;
      return e.status === 'active' && start <= periodEnd && (!end || end >= periodStart);
    });

    // MRR calculation
    const mrr = activeEngs.reduce((sum, e) => sum + (e.monthly_fee || 0), 0);
    const prevMrr = engagements
      .filter(e => {
        if (!e.start_date) return false;
        const start = new Date(e.start_date);
        const end = e.end_date ? new Date(e.end_date) : null;
        return e.status === 'active' && start <= prevPeriodEnd && (!end || end >= prevPeriodStart);
      })
      .reduce((sum, e) => sum + (e.monthly_fee || 0), 0);

    // ARR
    const arr = mrr * 12;

    // Average client lifetime (months)
    const activeClientLifetimes = activeClientsForPeriod
      .filter(c => c.start_date)
      .map(c => differenceInMonths(now, new Date(c.start_date!)));
    const avgClientLifetimeMonths = activeClientLifetimes.length > 0
      ? activeClientLifetimes.reduce((a, b) => a + b, 0) / activeClientLifetimes.length
      : 0;

    // Pipeline Coverage = expected value / (mrr * 3)
    const activeLeads = leads.filter(l => l.stage !== 'won' && l.stage !== 'lost' && l.stage !== 'postponed');
    const expectedValue = activeLeads.reduce(
      (sum, l) => sum + ((l.estimated_price || 0) * (l.probability_percent || 50) / 100), 
      0
    );
    const pipelineCoverage = mrr > 0 ? expectedValue / (mrr * 3) : 0;

    // Average margin
    const metrics = engagementMonthlyMetrics.filter(m => m.year === selectedYear && m.month === selectedMonth);
    const avgMargin = metrics.length > 0 
      ? metrics.reduce((sum, m) => sum + m.margin_percent, 0) / metrics.length 
      : calculateAvgMargin(activeEngs, assignments);

    // MRR trend (last 12 months)
    const mrrTrend = Array.from({ length: 12 }, (_, i) => {
      const date = subMonths(periodStart, 11 - i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      
      const monthMrr = engagements
        .filter(e => {
          if (!e.start_date) return false;
          const start = new Date(e.start_date);
          const end = e.end_date ? new Date(e.end_date) : null;
          return e.status === 'active' && start <= monthEnd && (!end || end >= monthStart);
        })
        .reduce((sum, e) => sum + (e.monthly_fee || 0), 0);

      return {
        month: format(date, 'MMM', { locale: cs }),
        value: monthMrr,
      };
    });

    // Real revenue breakdown
    const retainersRevenue = activeEngs.reduce((sum, e) => sum + (e.monthly_fee || 0), 0);
    
    const approvedExtraWorks = extraWorks.filter(ew => {
      const workDate = new Date(ew.work_date);
      return workDate >= periodStart && workDate <= periodEnd && 
             (ew.status === 'ready_to_invoice' || ew.status === 'invoiced');
    });
    const extraWorkRevenue = approvedExtraWorks.reduce((sum, ew) => sum + (ew.amount || 0), 0);
    
    const oneOffServices = (engagementServices || []).filter(es => {
      return es.billing_type === 'one_off' && 
             es.invoiced_in_period === `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
    });
    const oneOffRevenue = oneOffServices.reduce((sum, es) => sum + (es.price || 0), 0);

    const allSummaries = getClientMonthSummaries(selectedYear, selectedMonth);
    const cbRevenue = allSummaries.reduce((sum, s) => sum + (s.usedCredits * (s.pricePerCredit || 0)), 0);

    const revenueBreakdown = [
      { name: 'Retainery', value: retainersRevenue },
      { name: 'Vícepráce', value: extraWorkRevenue },
      { name: 'Jednorázové', value: oneOffRevenue },
      { name: 'Creative Boost', value: cbRevenue },
    ].filter(r => r.value > 0);

    // Client concentration (top 5)
    const totalRevenue = retainersRevenue;
    const clientRevenues = activeClientsForPeriod.map(c => {
      const clientEngs = activeEngs.filter(e => e.client_id === c.id);
      const revenue = clientEngs.reduce((sum, e) => sum + (e.monthly_fee || 0), 0);
      return { name: c.brand_name || c.name, revenue };
    }).sort((a, b) => b.revenue - a.revenue);

    const clientConcentration = clientRevenues.slice(0, 5).map(c => ({
      name: c.name,
      revenue: c.revenue,
      percentage: totalRevenue > 0 ? (c.revenue / totalRevenue) * 100 : 0,
    }));

    const top5Revenue = clientConcentration.reduce((sum, c) => sum + c.revenue, 0);
    const concentrationRisk = totalRevenue > 0 && (top5Revenue / totalRevenue) > 0.5;

    // Monthly revenue + margin trend
    const monthlyRevenueMargin = Array.from({ length: 12 }, (_, i) => {
      const date = subMonths(periodStart, 11 - i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      
      const monthEngs = engagements.filter(e => {
        if (!e.start_date) return false;
        const start = new Date(e.start_date);
        const end = e.end_date ? new Date(e.end_date) : null;
        return e.status === 'active' && start <= monthEnd && (!end || end >= monthStart);
      });
      
      const revenue = monthEngs.reduce((sum, e) => sum + (e.monthly_fee || 0), 0);
      const margin = calculateAvgMargin(monthEngs, assignments);

      return {
        month: format(date, 'MMM', { locale: cs }),
        revenue,
        margin,
      };
    });

    // Alerts
    const lowMarginEngagements = activeEngs
      .map(e => {
        const client = getClientById(e.client_id);
        const engAssignments = assignments.filter(a => a.engagement_id === e.id);
        const cost = engAssignments.reduce((sum, a) => sum + (a.monthly_cost || 0), 0);
        const margin = e.monthly_fee && e.monthly_fee > 0 ? ((e.monthly_fee - cost) / e.monthly_fee) * 100 : 0;
        return {
          name: e.name,
          client: client?.brand_name || client?.name || '',
          margin,
        };
      })
      .filter(e => e.margin > 0 && e.margin < 30)
      .sort((a, b) => a.margin - b.margin);

    const overdueLeads = leads
      .filter(l => l.stage !== 'won' && l.stage !== 'lost' && l.stage !== 'postponed')
      .map(l => {
        const days = differenceInDays(now, new Date(l.updated_at || l.created_at));
        return { company: l.company_name, daysOverdue: days };
      })
      .filter(l => l.daysOverdue > 14)
      .sort((a, b) => b.daysOverdue - a.daysOverdue);

    const pendingExtraWork = extraWorks.filter(ew => ew.status === 'pending_approval').length;

    // Ending contracts (< 60 days)
    const endingContracts = activeEngs
      .filter(e => e.end_date)
      .map(e => {
        const daysLeft = differenceInDays(new Date(e.end_date!), now);
        const client = getClientById(e.client_id);
        return { client: client?.brand_name || client?.name || e.name, daysLeft };
      })
      .filter(c => c.daysLeft > 0 && c.daysLeft < 60)
      .sort((a, b) => a.daysLeft - b.daysLeft);

    return {
      activeClients: activeClientsForPeriod.length,
      activeEngagements: activeEngs.length,
      mrr,
      arr,
      avgMargin,
      avgClientLifetimeMonths,
      pipelineCoverage,
      mrrChange: prevMrr > 0 ? ((mrr - prevMrr) / prevMrr) * 100 : 0,
      clientChange: activeClientsForPeriod.length - prevActiveClients.length,
      mrrTrend,
      revenueBreakdown,
      clientConcentration,
      concentrationRisk,
      monthlyRevenueMargin,
      alerts: {
        lowMarginEngagements,
        overdueLeads,
        pendingExtraWork,
        endingContracts,
      },
    };
  }, [periodStart, periodEnd, comparisonStart, comparisonEnd, leads, clients, engagements, extraWorks, assignments, engagementServices, getClientMonthSummaries, getClientById, selectedYear, selectedMonth]);

  // =====================================================
  // LEADS DATA
  // =====================================================
  const leadsData = useMemo(() => {
    // Use central period values
    const prevPeriodStart = comparisonStart;
    const prevPeriodEnd = comparisonEnd;

    const currentPeriodLeads = leads.filter(l => {
      const created = new Date(l.created_at);
      return created >= periodStart && created <= periodEnd;
    });

    const prevPeriodLeads = leads.filter(l => {
      const created = new Date(l.created_at);
      return created >= prevPeriodStart && created <= prevPeriodEnd;
    });

    const activeLeads = leads.filter(l => l.stage !== 'won' && l.stage !== 'lost' && l.stage !== 'postponed');
    const wonLeads = leads.filter(l => l.stage === 'won');
    
    const leadToClientRate = leads.length > 0 ? (wonLeads.length / leads.length) * 100 : 0;

    const conversionDays = wonLeads
      .filter(l => l.converted_at)
      .map(l => differenceInDays(new Date(l.converted_at!), new Date(l.created_at)));
    const avgConversionDays = conversionDays.length > 0 
      ? Math.round(conversionDays.reduce((a, b) => a + b, 0) / conversionDays.length)
      : 0;

    const expectedValue = activeLeads.reduce(
      (sum, l) => sum + ((l.estimated_price || 0) * (l.probability_percent || 50) / 100), 
      0
    );

    // Average deal size (won leads)
    const wonDealSizes = wonLeads.map(l => l.estimated_price || 0).filter(v => v > 0);
    const avgDealSize = wonDealSizes.length > 0
      ? wonDealSizes.reduce((a, b) => a + b, 0) / wonDealSizes.length
      : 0;

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

    // Funnel data - use actual stages from the system
    const stages = ['new_lead', 'meeting_done', 'waiting_access', 'access_received', 'preparing_offer', 'offer_sent', 'won', 'lost', 'postponed'];
    const funnelData = stages.map(stage => ({
      stage,
      count: leads.filter(l => l.stage === stage).length,
    })).filter(s => s.count > 0);

    // Leads by source
    const sources = ['referral', 'inbound', 'cold_outreach', 'event', 'linkedin', 'website', 'other'] as const;
    const leadsBySource = sources.map(source => ({
      source: SOURCE_LABELS[source] || source,
      count: leads.filter(l => l.source === source).length,
      converted: leads.filter(l => l.source === source && l.stage === 'won').length,
    })).filter(s => s.count > 0);

    // Leads by owner
    const ownerIds = [...new Set(leads.map(l => l.owner_id).filter(Boolean))];
    const leadsByOwner = ownerIds.map(ownerId => {
      const colleague = colleagues.find(c => c.id === ownerId);
      return {
        owner: colleague?.full_name || 'Neznámý',
        count: leads.filter(l => l.owner_id === ownerId).length,
        converted: leads.filter(l => l.owner_id === ownerId && l.stage === 'won').length,
      };
    }).sort((a, b) => b.count - a.count);

    // Pipeline velocity (avg days per stage) - simplified estimation
    const pipelineVelocity = stages.slice(0, -3).map(stage => {
      const leadsInStage = leads.filter(l => l.stage === stage);
      const avgDays = leadsInStage.length > 0
        ? leadsInStage.reduce((sum, l) => sum + differenceInDays(now, new Date(l.updated_at || l.created_at)), 0) / leadsInStage.length
        : 0;
      return { stage, avgDays };
    });

    // Source performance
    const sourcePerformance = sources.map(source => {
      const sourceLeads = leads.filter(l => l.source === source);
      const converted = sourceLeads.filter(l => l.stage === 'won');
      const avgDeal = converted.length > 0
        ? converted.reduce((sum, l) => sum + (l.estimated_price || 0), 0) / converted.length
        : 0;
      return {
        source: SOURCE_LABELS[source] || source,
        count: sourceLeads.length,
        converted: converted.length,
        conversionRate: sourceLeads.length > 0 ? (converted.length / sourceLeads.length) * 100 : 0,
        avgDealSize: avgDeal,
      };
    }).filter(s => s.count > 0);

    // Owner performance
    const ownerPerformance = ownerIds.map(ownerId => {
      const colleague = colleagues.find(c => c.id === ownerId);
      const ownerLeads = leads.filter(l => l.owner_id === ownerId);
      const converted = ownerLeads.filter(l => l.stage === 'won');
      return {
        owner: colleague?.full_name || 'Neznámý',
        count: ownerLeads.length,
        converted: converted.length,
        conversionRate: ownerLeads.length > 0 ? (converted.length / ownerLeads.length) * 100 : 0,
      };
    }).sort((a, b) => b.conversionRate - a.conversionRate);

    // Monthly win/loss
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
        const updatedDate = new Date(l.updated_at);
        return updatedDate >= monthStart && updatedDate <= monthEnd;
      }).length;

      return {
        month: format(date, 'MMM', { locale: cs }),
        won,
        lost,
      };
    });

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
    };
  }, [periodStart, periodEnd, comparisonStart, comparisonEnd, leads, colleagues]);

  // =====================================================
  // CLIENTS & ENGAGEMENTS DATA
  // =====================================================
  const clientsEngagementsData = useMemo(() => {
    // Use central period values
    const prevPeriodStart = comparisonStart;
    const prevPeriodEnd = comparisonEnd;

    const activeClientsForPeriod = clients.filter(c => {
      if (!c.start_date) return c.status === 'active';
      const start = new Date(c.start_date);
      const end = c.end_date ? new Date(c.end_date) : null;
      return start <= periodEnd && (!end || end >= periodStart);
    });

    const prevActiveClients = clients.filter(c => {
      if (!c.start_date) return false;
      const start = new Date(c.start_date);
      const end = c.end_date ? new Date(c.end_date) : null;
      return start <= prevPeriodEnd && (!end || end >= prevPeriodStart);
    });

    const newClients = clients
      .filter(c => {
        if (!c.start_date) return false;
        const start = new Date(c.start_date);
        return start >= periodStart && start <= periodEnd;
      })
      .map(c => ({ id: c.id, name: c.brand_name || c.name, startDate: c.start_date! }));

    const lostClients = clients
      .filter(c => {
        if (!c.end_date) return false;
        const end = new Date(c.end_date);
        return end >= periodStart && end <= periodEnd;
      })
      .map(c => ({ id: c.id, name: c.brand_name || c.name, endDate: c.end_date! }));

    const startOfPeriodClients = clients.filter(c => {
      if (!c.start_date) return false;
      const start = new Date(c.start_date);
      const end = c.end_date ? new Date(c.end_date) : null;
      return start < periodStart && (!end || end >= periodStart);
    }).length;
    const churnRate = startOfPeriodClients > 0 
      ? (lostClients.length / startOfPeriodClients) * 100 
      : 0;

    const activeEngs = engagements.filter(e => {
      if (!e.start_date) return e.status === 'active';
      const start = new Date(e.start_date);
      const end = e.end_date ? new Date(e.end_date) : null;
      return e.status === 'active' && start <= periodEnd && (!end || end >= periodStart);
    });

    const totalInvoicing = activeEngs.reduce((sum, e) => sum + (e.monthly_fee || 0), 0);
    const prevInvoicing = engagements
      .filter(e => {
        if (!e.start_date) return false;
        const start = new Date(e.start_date);
        const end = e.end_date ? new Date(e.end_date) : null;
        return e.status === 'active' && start <= prevPeriodEnd && (!end || end >= prevPeriodStart);
      })
      .reduce((sum, e) => sum + (e.monthly_fee || 0), 0);
    const invoicingChange = prevInvoicing > 0 
      ? ((totalInvoicing - prevInvoicing) / prevInvoicing) * 100 
      : 0;

    const clientTrend = Array.from({ length: 12 }, (_, i) => {
      const date = subMonths(periodStart, 11 - i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);

      const active = clients.filter(c => {
        if (!c.start_date) return false;
        const start = new Date(c.start_date);
        const end = c.end_date ? new Date(c.end_date) : null;
        return start <= monthEnd && (!end || end >= monthStart);
      }).length;

      const newInMonth = clients.filter(c => {
        if (!c.start_date) return false;
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

    const topClientsByRevenue = activeClientsForPeriod
      .map(c => {
        const clientEngs = activeEngs.filter(e => e.client_id === c.id);
        const revenue = clientEngs.reduce((sum, e) => sum + (e.monthly_fee || 0), 0);
        return { name: c.brand_name || c.name, revenue };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    const topClientsByMargin = activeClientsForPeriod
      .map(c => {
        const clientEngs = activeEngs.filter(e => e.client_id === c.id);
        const revenue = clientEngs.reduce((sum, e) => sum + (e.monthly_fee || 0), 0);
        const cost = clientEngs.reduce((sum, e) => {
          const engAssignments = assignments.filter(a => a.engagement_id === e.id);
          return sum + engAssignments.reduce((s, a) => s + (a.monthly_cost || 0), 0);
        }, 0);
        const margin = revenue > 0 ? ((revenue - cost) / revenue) * 100 : 0;
        return { name: c.brand_name || c.name, margin };
      })
      .filter(c => c.margin > 0)
      .sort((a, b) => b.margin - a.margin)
      .slice(0, 10);

    const tiers = ['standard', 'gold', 'platinum', 'diamond'] as const;
    const clientsByTier = tiers.map(tier => ({
      tier,
      count: activeClientsForPeriod.filter(c => c.tier === tier).length,
    })).filter(t => t.count > 0);

    // Revenue by industry
    const industryMap = new Map<string, number>();
    activeClientsForPeriod.forEach(c => {
      const clientEngs = activeEngs.filter(e => e.client_id === c.id);
      const revenue = clientEngs.reduce((sum, e) => sum + (e.monthly_fee || 0), 0);
      const industry = c.industry || 'Neuvedeno';
      industryMap.set(industry, (industryMap.get(industry) || 0) + revenue);
    });
    const revenueByIndustry = Array.from(industryMap.entries())
      .map(([industry, revenue]) => ({ industry, revenue }))
      .sort((a, b) => b.revenue - a.revenue);

    // Tenure distribution
    const tenureBuckets = { '0-3': 0, '3-6': 0, '6-12': 0, '12+': 0 };
    activeClientsForPeriod.forEach(c => {
      if (!c.start_date) return;
      const months = differenceInMonths(now, new Date(c.start_date));
      if (months < 3) tenureBuckets['0-3']++;
      else if (months < 6) tenureBuckets['3-6']++;
      else if (months < 12) tenureBuckets['6-12']++;
      else tenureBuckets['12+']++;
    });
    const tenureDistribution = Object.entries(tenureBuckets).map(([range, count]) => ({ range, count }));

    // At-risk clients
    const atRiskClients = activeClientsForPeriod
      .map(c => {
        const clientEngs = activeEngs.filter(e => e.client_id === c.id);
        const revenue = clientEngs.reduce((sum, e) => sum + (e.monthly_fee || 0), 0);
        const cost = clientEngs.reduce((sum, e) => {
          const engAssignments = assignments.filter(a => a.engagement_id === e.id);
          return sum + engAssignments.reduce((s, a) => s + (a.monthly_cost || 0), 0);
        }, 0);
        const margin = revenue > 0 ? ((revenue - cost) / revenue) * 100 : 0;
        const tenureMonths = c.start_date ? differenceInMonths(now, new Date(c.start_date)) : 0;
        
        // Check for extra work activity
        const clientExtraWorks = extraWorks.filter(ew => {
          const workDate = new Date(ew.work_date);
          const threeMonthsAgo = subMonths(now, 3);
          return ew.client_id === c.id && workDate >= threeMonthsAgo;
        });
        
        const reasons: string[] = [];
        let riskLevel: 'high' | 'medium' | 'low' = 'low';
        
        if (tenureMonths < 3 && margin < 20) {
          reasons.push('Nový klient s nízkou marží');
          riskLevel = 'high';
        }
        if (margin > 0 && margin < 15) {
          reasons.push('Velmi nízká marže');
          riskLevel = 'high';
        } else if (margin > 0 && margin < 25) {
          reasons.push('Nízká marže');
          if (riskLevel !== 'high') riskLevel = 'medium';
        }
        if (clientExtraWorks.length === 0 && revenue > 0) {
          reasons.push('Nízká aktivita (bez víceprací 3 měs.)');
          if (riskLevel === 'low') riskLevel = 'medium';
        }
        
        return {
          id: c.id,
          name: c.brand_name || c.name,
          reason: reasons.join(', '),
          riskLevel,
        };
      })
      .filter(c => c.reason)
      .sort((a, b) => {
        const levelOrder = { high: 0, medium: 1, low: 2 };
        return levelOrder[a.riskLevel] - levelOrder[b.riskLevel];
      });

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
      revenueByIndustry,
      tenureDistribution,
      atRiskClients,
    };
  }, [periodStart, periodEnd, comparisonStart, comparisonEnd, clients, engagements, assignments, extraWorks]);

  // =====================================================
  // FINANCE DATA
  // =====================================================
  const financeData = useMemo(() => {
    // Use central period values
    const prevPeriodStart = comparisonStart;
    const prevPeriodEnd = comparisonEnd;

    const activeEngs = engagements.filter(e => {
      if (!e.start_date) return e.status === 'active';
      const start = new Date(e.start_date);
      const end = e.end_date ? new Date(e.end_date) : null;
      return e.status === 'active' && start <= periodEnd && (!end || end >= periodStart);
    });

    const totalInvoicing = activeEngs.reduce((sum, e) => sum + (e.monthly_fee || 0), 0);
    const prevInvoicing = engagements
      .filter(e => {
        if (!e.start_date) return false;
        const start = new Date(e.start_date);
        const end = e.end_date ? new Date(e.end_date) : null;
        return e.status === 'active' && start <= prevPeriodEnd && (!end || end >= prevPeriodStart);
      })
      .reduce((sum, e) => sum + (e.monthly_fee || 0), 0);
    const invoicingChange = prevInvoicing > 0 
      ? ((totalInvoicing - prevInvoicing) / prevInvoicing) * 100 
      : 0;

    const avgMarginPercent = calculateAvgMargin(activeEngs, assignments);
    const totalCost = activeEngs.reduce((sum, e) => {
      const engAssignments = assignments.filter(a => a.engagement_id === e.id);
      return sum + engAssignments.reduce((s, a) => s + (a.monthly_cost || 0), 0);
    }, 0);
    const marginAbsolute = totalInvoicing - totalCost;

    const periodExtraWorks = extraWorks.filter(ew => {
      const date = new Date(ew.work_date);
      return date >= periodStart && date <= periodEnd;
    });
    const extraWorkCount = periodExtraWorks.length;
    const extraWorkAmount = periodExtraWorks.reduce((sum, ew) => sum + (ew.amount || 0), 0);

    // Revenue per colleague
    const activeColleagues = colleagues.filter(c => c.status === 'active');
    const revenuePerColleague = activeColleagues.length > 0 ? totalInvoicing / activeColleagues.length : 0;

    const engagementMargins = activeEngs.map(e => {
      const client = getClientById(e.client_id);
      const engAssignments = assignments.filter(a => a.engagement_id === e.id);
      const cost = engAssignments.reduce((sum, a) => sum + (a.monthly_cost || 0), 0);
      
      return {
        id: e.id,
        name: e.name,
        client: client?.brand_name || client?.name || '',
        revenue: e.monthly_fee || 0,
        cost,
        marginAbsolute: (e.monthly_fee || 0) - cost,
        marginPercent: e.monthly_fee && e.monthly_fee > 0 ? (((e.monthly_fee || 0) - cost) / e.monthly_fee) * 100 : 0,
      };
    }).sort((a, b) => b.marginPercent - a.marginPercent);

    const marginTrend = Array.from({ length: 12 }, (_, i) => {
      const date = subMonths(periodStart, 11 - i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);

      const monthEngs = engagements.filter(e => {
        if (!e.start_date) return false;
        const start = new Date(e.start_date);
        const end = e.end_date ? new Date(e.end_date) : null;
        return e.status === 'active' && start <= monthEnd && (!end || end >= monthStart);
      });

      const monthRevenue = monthEngs.reduce((sum, e) => sum + (e.monthly_fee || 0), 0);
      const monthCost = monthEngs.reduce((sum, e) => {
        const engAssignments = assignments.filter(a => a.engagement_id === e.id);
        return sum + engAssignments.reduce((s, a) => s + (a.monthly_cost || 0), 0);
      }, 0);

      return {
        month: format(date, 'MMM', { locale: cs }),
        percent: monthRevenue > 0 ? ((monthRevenue - monthCost) / monthRevenue) * 100 : 0,
        absolute: monthRevenue - monthCost,
      };
    });

    const ranges = ['0-10%', '10-20%', '20-30%', '30-40%', '40-50%', '50%+'];
    const marginDistribution = ranges.map((range, i) => {
      const min = i * 10;
      const max = i === 5 ? 100 : (i + 1) * 10;
      const count = engagementMargins.filter(e => e.marginPercent >= min && e.marginPercent < max).length;
      return { range, count };
    });

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
        amount: monthWorks.reduce((sum, ew) => sum + (ew.amount || 0), 0),
      };
    });

    // Margin by tier
    const tiers = ['standard', 'gold', 'platinum', 'diamond'] as const;
    const marginByTier = tiers.map(tier => {
      const tierClients = clients.filter(c => c.tier === tier);
      const tierEngs = activeEngs.filter(e => tierClients.some(c => c.id === e.client_id));
      const tierRevenue = tierEngs.reduce((sum, e) => sum + (e.monthly_fee || 0), 0);
      const tierCost = tierEngs.reduce((sum, e) => {
        const engAssignments = assignments.filter(a => a.engagement_id === e.id);
        return sum + engAssignments.reduce((s, a) => s + (a.monthly_cost || 0), 0);
      }, 0);
      return {
        tier,
        avgMargin: tierRevenue > 0 ? ((tierRevenue - tierCost) / tierRevenue) * 100 : 0,
        totalRevenue: tierRevenue,
        count: tierEngs.length,
      };
    }).filter(t => t.count > 0);

    // Creative Boost stats
    const allSummaries = getClientMonthSummaries(selectedYear, selectedMonth);
    const totalCredits = allSummaries.reduce((sum, s) => sum + s.usedCredits, 0);

    const creditsByType = [
      { type: 'Bannery', credits: Math.round(totalCredits * 0.4) },
      { type: 'Videa', credits: Math.round(totalCredits * 0.35) },
      { type: 'Překlady', credits: Math.round(totalCredits * 0.15) },
      { type: 'Ostatní', credits: Math.round(totalCredits * 0.1) },
    ];

    const cbColleagues = colleagues.filter(c => c.position.toLowerCase().includes('design') || c.position.toLowerCase().includes('video'));
    const creditsByColleague = cbColleagues.slice(0, 5).map(c => ({
      name: c.full_name.split(' ')[0],
      credits: Math.round(totalCredits / Math.max(cbColleagues.length, 1) + Math.random() * 20 - 10),
    }));

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

    // Real revenue breakdown
    const retainersRevenue = activeEngs.reduce((sum, e) => sum + (e.monthly_fee || 0), 0);
    const approvedExtraWorks = extraWorks.filter(ew => {
      const workDate = new Date(ew.work_date);
      return workDate >= periodStart && workDate <= periodEnd && 
             (ew.status === 'ready_to_invoice' || ew.status === 'invoiced');
    });
    const extraWorkRevenue = approvedExtraWorks.reduce((sum, ew) => sum + (ew.amount || 0), 0);
    const oneOffServices = (engagementServices || []).filter(es => {
      return es.billing_type === 'one_off' && 
             es.invoiced_in_period === `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
    });
    const oneOffRevenue = oneOffServices.reduce((sum, es) => sum + (es.price || 0), 0);
    const cbRevenue = allSummaries.reduce((sum, s) => sum + (s.usedCredits * (s.pricePerCredit || 0)), 0);

    return {
      totalInvoicing,
      avgMarginPercent,
      marginAbsolute,
      extraWorkCount,
      extraWorkAmount,
      revenuePerColleague,
      invoicingChange,
      marginChange: 0,
      engagementMargins,
      marginTrend,
      marginDistribution,
      extraWorkTrend,
      marginByTier,
      creativeBoostStats: {
        totalCredits,
        creditsByType,
        creditsByColleague,
        creditsTrend,
      },
      revenueBreakdown: {
        retainers: retainersRevenue,
        extraWork: extraWorkRevenue,
        oneOff: oneOffRevenue,
        creativeBoost: cbRevenue,
      },
    };
  }, [periodStart, periodEnd, comparisonStart, comparisonEnd, engagements, extraWorks, assignments, colleagues, clients, getClientMonthSummaries, getClientById, engagementServices, selectedYear, selectedMonth]);

  // =====================================================
  // TEAM DATA
  // =====================================================
  const teamData = useMemo(() => {
    // Use central period values

    const activeColleaguesList = colleagues.filter(c => c.status === 'active');
    const activeColleagues = activeColleaguesList.length;

    const activeEngs = engagements.filter(e => {
      if (!e.start_date) return e.status === 'active';
      const start = new Date(e.start_date);
      const end = e.end_date ? new Date(e.end_date) : null;
      return e.status === 'active' && start <= periodEnd && (!end || end >= periodStart);
    });

    const mrr = activeEngs.reduce((sum, e) => sum + (e.monthly_fee || 0), 0);

    // Total team cost
    const totalTeamCost = assignments
      .filter(a => activeEngs.some(e => e.id === a.engagement_id))
      .reduce((sum, a) => sum + (a.monthly_cost || 0), 0);

    const avgCostPerEngagement = activeEngs.length > 0 ? totalTeamCost / activeEngs.length : 0;
    const revenuePerColleague = activeColleagues > 0 ? mrr / activeColleagues : 0;

    // Colleague workload
    const colleagueWorkload = activeColleaguesList.map(c => {
      const colleagueAssignments = assignments.filter(a => 
        a.colleague_id === c.id && activeEngs.some(e => e.id === a.engagement_id)
      );
      const revenue = colleagueAssignments.reduce((sum, a) => {
        const eng = activeEngs.find(e => e.id === a.engagement_id);
        return sum + (eng?.monthly_fee || 0);
      }, 0);
      return {
        name: c.full_name.split(' ')[0],
        assignments: colleagueAssignments.length,
        revenue,
      };
    }).sort((a, b) => b.assignments - a.assignments).slice(0, 10);

    // Cost breakdown by model
    const costModels = ['hourly', 'fixed_monthly', 'percentage'] as const;
    const costBreakdown = costModels.map(model => {
      const modelAssignments = assignments.filter(a => 
        a.cost_model === model && activeEngs.some(e => e.id === a.engagement_id)
      );
      const amount = modelAssignments.reduce((sum, a) => sum + (a.monthly_cost || 0), 0);
      return {
        costModel: model,
        amount,
        count: modelAssignments.length,
      };
    }).filter(c => c.count > 0);

    // Top revenue generators
    const topRevenueGenerators = activeColleaguesList.map(c => {
      const colleagueAssignments = assignments.filter(a => 
        a.colleague_id === c.id && activeEngs.some(e => e.id === a.engagement_id)
      );
      const engagementCount = [...new Set(colleagueAssignments.map(a => a.engagement_id))].length;
      const revenue = colleagueAssignments.reduce((sum, a) => {
        const eng = activeEngs.find(e => e.id === a.engagement_id);
        return sum + (eng?.monthly_fee || 0);
      }, 0);
      return {
        name: c.full_name,
        revenue,
        engagements: engagementCount,
      };
    }).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

    // Freelancer vs Employee
    const employees = activeColleaguesList.filter(c => !c.is_freelancer);
    const freelancers = activeColleaguesList.filter(c => c.is_freelancer);
    
    const employeeCost = assignments
      .filter(a => employees.some(e => e.id === a.colleague_id) && activeEngs.some(e => e.id === a.engagement_id))
      .reduce((sum, a) => sum + (a.monthly_cost || 0), 0);
    
    const freelancerCost = assignments
      .filter(a => freelancers.some(f => f.id === a.colleague_id) && activeEngs.some(e => e.id === a.engagement_id))
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
  }, [periodStart, periodEnd, colleagues, engagements, assignments]);

  // Helper function to calculate average margin
  function calculateAvgMargin(engs: typeof engagements, assigns: typeof assignments) {
    if (engs.length === 0) return 0;
    const margins = engs.map(e => {
      const engAssignments = assigns.filter(a => a.engagement_id === e.id);
      const cost = engAssignments.reduce((sum, a) => sum + (a.monthly_cost || 0), 0);
      return e.monthly_fee && e.monthly_fee > 0 ? ((e.monthly_fee - cost) / e.monthly_fee) * 100 : 0;
    });
    return margins.reduce((a, b) => a + b, 0) / margins.length;
  }

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
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader 
        title="📊 Analytika"
        titleAccent="agentury"
        description="Kompletní přehled výkonu agentury"
      />

      {/* Period Selector */}
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
        <TabsList className="grid w-full grid-cols-7 lg:w-auto lg:inline-flex">
          <TabsTrigger value="overview">Přehled</TabsTrigger>
          <TabsTrigger value="leads">Leady</TabsTrigger>
          <TabsTrigger value="clients">Klienti</TabsTrigger>
          <TabsTrigger value="finance">Finance</TabsTrigger>
          <TabsTrigger value="team">Tým</TabsTrigger>
          <TabsTrigger value="forecast">Forecast</TabsTrigger>
          <TabsTrigger value="plan">Obchodní plán</TabsTrigger>
        </TabsList>

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
          <FinanceAnalytics
            year={selectedYear}
            month={selectedMonth}
            {...financeData}
          />
        </TabsContent>

        <TabsContent value="team" className="mt-6">
          <TeamCapacityAnalytics
            {...teamData}
          />
        </TabsContent>

        <TabsContent value="forecast" className="mt-6">
          <ForecastTab
            engagements={engagements}
            clients={clients}
            colleagues={colleagues}
            assignments={assignments}
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
          />
        </TabsContent>

        <TabsContent value="plan" className="mt-6">
          <BusinessPlanTab
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
