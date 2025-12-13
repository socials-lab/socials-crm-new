import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AnalyticsOverview } from '@/components/analytics/AnalyticsOverview';
import { LeadsAnalytics } from '@/components/analytics/LeadsAnalytics';
import { ClientsEngagementsAnalytics } from '@/components/analytics/ClientsEngagementsAnalytics';
import { FinanceAnalytics } from '@/components/analytics/FinanceAnalytics';
import { 
  clients, 
  engagements, 
  engagementAssignments,
  engagementMonthlyMetrics,
  extraWorks,
  colleagues,
  getActiveClients,
  getActiveEngagements,
  calculateMRR,
  getClientById,
} from '@/data/mockData';
import { useLeadsData } from '@/hooks/useLeadsData';
import { useCreativeBoostData } from '@/hooks/useCreativeBoostData';
import { currentUser } from '@/data/mockData';
import { format, subMonths, startOfMonth, endOfMonth, differenceInDays } from 'date-fns';
import { cs } from 'date-fns/locale';

// Check permissions
const canSeeAnalytics = ['admin', 'management', 'finance'].includes(currentUser.role);

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
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  
  const { leads } = useLeadsData();
  const { getClientMonthSummaries } = useCreativeBoostData();

  const goToPreviousMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  // =====================================================
  // OVERVIEW DATA
  // =====================================================
  const overviewData = useMemo(() => {
    const periodStart = new Date(selectedYear, selectedMonth - 1, 1);
    const periodEnd = new Date(selectedYear, selectedMonth, 0);
    const prevPeriodStart = subMonths(periodStart, 1);
    const prevPeriodEnd = endOfMonth(prevPeriodStart);

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
    const metrics = engagementMonthlyMetrics.filter(m => m.year === selectedYear && m.month === selectedMonth);
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

    // Revenue breakdown
    const revenueBreakdown = [
      { name: 'Retainery', value: Math.round(mrr * 0.7) },
      { name: 'Vícepráce', value: Math.round(mrr * 0.15) },
      { name: 'Jednorázové', value: Math.round(mrr * 0.1) },
      { name: 'Creative Boost', value: Math.round(mrr * 0.05) },
    ];

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

    const overdueLeads = leads
      .filter(l => l.stage !== 'won' && l.stage !== 'lost')
      .map(l => {
        const days = differenceInDays(now, new Date(l.updated_at));
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
  }, [selectedYear, selectedMonth, leads]);

  // =====================================================
  // LEADS DATA
  // =====================================================
  const leadsData = useMemo(() => {
    const periodStart = new Date(selectedYear, selectedMonth - 1, 1);
    const periodEnd = new Date(selectedYear, selectedMonth, 0);
    const prevPeriodStart = subMonths(periodStart, 1);

    // Leads for current period
    const currentPeriodLeads = leads.filter(l => {
      const created = new Date(l.created_at);
      return created >= periodStart && created <= periodEnd;
    });

    const prevPeriodLeads = leads.filter(l => {
      const created = new Date(l.created_at);
      return created >= prevPeriodStart && created < periodStart;
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

    return {
      totalLeads: leads.length,
      newLeadsThisMonth: currentPeriodLeads.length,
      leadToClientRate,
      avgConversionDays,
      expectedValue,
      leadChange: currentPeriodLeads.length - prevPeriodLeads.length,
      leadTrend,
      funnelData,
      leadsBySource,
      leadsByOwner,
    };
  }, [selectedYear, selectedMonth, leads]);

  // =====================================================
  // CLIENTS & ENGAGEMENTS DATA
  // =====================================================
  const clientsEngagementsData = useMemo(() => {
    const periodStart = new Date(selectedYear, selectedMonth - 1, 1);
    const periodEnd = new Date(selectedYear, selectedMonth, 0);
    const prevPeriodStart = subMonths(periodStart, 1);
    const prevPeriodEnd = endOfMonth(prevPeriodStart);

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
    const metrics = engagementMonthlyMetrics.filter(m => m.year === selectedYear && m.month === selectedMonth);
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
  }, [selectedYear, selectedMonth]);

  // =====================================================
  // FINANCE DATA
  // =====================================================
  const financeData = useMemo(() => {
    const periodStart = new Date(selectedYear, selectedMonth - 1, 1);
    const periodEnd = new Date(selectedYear, selectedMonth, 0);
    const prevPeriodStart = subMonths(periodStart, 1);
    const prevPeriodEnd = endOfMonth(prevPeriodStart);

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
    const metrics = engagementMonthlyMetrics.filter(m => m.year === selectedYear && m.month === selectedMonth);
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
      const assignments = engagementAssignments.filter(a => a.engagement_id === e.id);
      const cost = assignments.reduce((sum, a) => sum + (a.monthly_cost || 0), 0);
      
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

      const monthMetrics = engagementMonthlyMetrics.filter(m => m.year === year && m.month === month);
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

    // Credits by type (mock data)
    const creditsByType = [
      { type: 'Bannery', credits: Math.round(totalCredits * 0.4) },
      { type: 'Videa', credits: Math.round(totalCredits * 0.35) },
      { type: 'Překlady', credits: Math.round(totalCredits * 0.15) },
      { type: 'Ostatní', credits: Math.round(totalCredits * 0.1) },
    ];

    // Credits by colleague (mock data)
    const cbColleagues = colleagues.filter(c => c.position.toLowerCase().includes('design') || c.position.toLowerCase().includes('video'));
    const creditsByColleague = cbColleagues.slice(0, 5).map(c => ({
      name: c.full_name.split(' ')[0],
      credits: Math.round(totalCredits / cbColleagues.length + Math.random() * 20 - 10),
    }));

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
  }, [selectedYear, selectedMonth, getClientMonthSummaries]);

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
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rok:</span>
          <Select 
            value={selectedYear.toString()} 
            onValueChange={(v) => setSelectedYear(Number(v))}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2023, 2024, 2025, 2026].map(year => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium w-24 text-center">
            {monthNames[selectedMonth - 1]}
          </span>
          <Button variant="outline" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
          <TabsTrigger value="overview">Přehled</TabsTrigger>
          <TabsTrigger value="leads">Leady</TabsTrigger>
          <TabsTrigger value="clients">Klienti & Zakázky</TabsTrigger>
          <TabsTrigger value="finance">Finance</TabsTrigger>
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
      </Tabs>
    </div>
  );
}
