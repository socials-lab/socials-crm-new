import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Target, TrendingUp, TrendingDown, Edit2, Save, X, 
  FileText, Calculator, Sparkles, CalendarX, ArrowRight,
  Trash2, Settings
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, parseISO, isSameMonth, addMonths } from 'date-fns';
import { cs } from 'date-fns/locale';
import { usePlannedEngagements } from '@/hooks/usePlannedEngagements';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { AddPlannedEngagementDialog } from './AddPlannedEngagementDialog';
import { EditMonthlyTargetsDialog } from './EditMonthlyTargetsDialog';
import { 
  getTargetForMonth, 
  getStoredPlans,
  DEFAULT_TARGETS_2026,
  type RevenueSource 
} from '@/utils/businessPlanUtils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface MonthlyPlan {
  year: number;
  month: number;
  targetRevenue: number;
}

interface RevenuePlanForecastProps {
  selectedYear: number;
  selectedMonth: number;
}

// ============= MOCK DATA FOR DEMO =============

const MOCK_COLLEAGUES = [
  { id: 'col-1', full_name: 'Jan Novák', position: 'Account Manager', status: 'active' },
  { id: 'col-2', full_name: 'Marie Svobodová', position: 'Graphic Designer', status: 'active' },
  { id: 'col-3', full_name: 'Petr Kučera', position: 'Performance Specialist', status: 'active' },
  { id: 'col-4', full_name: 'Eva Horáková', position: 'Copywriter', status: 'active' },
];

const MOCK_CLIENTS = [
  { id: 'cli-1', name: 'ABC Electronics', brand_name: 'ABC' },
  { id: 'cli-2', name: 'Fashion Store s.r.o.', brand_name: 'FashionHub' },
  { id: 'cli-3', name: 'Foodie Restaurant', brand_name: 'Foodie' },
  { id: 'cli-4', name: 'Tech Solutions a.s.', brand_name: 'TechSol' },
  { id: 'cli-5', name: 'Beauty Brand', brand_name: 'GlowUp' },
  { id: 'cli-6', name: 'Auto Dealer CZ', brand_name: 'AutoMax' },
  { id: 'cli-7', name: 'Home Decor', brand_name: 'CozyHome' },
  { id: 'cli-8', name: 'Sport Equipment', brand_name: 'FitGear' },
];

// Active engagements with MRR
const MOCK_ENGAGEMENTS = [
  { id: 'eng-1', client_id: 'cli-1', name: 'Full Service Retainer', monthly_fee: 85000, status: 'active', type: 'retainer', start_date: '2024-03-01', end_date: null },
  { id: 'eng-2', client_id: 'cli-2', name: 'Social Media Management', monthly_fee: 45000, status: 'active', type: 'retainer', start_date: '2024-06-01', end_date: '2026-02-28' },
  { id: 'eng-3', client_id: 'cli-3', name: 'Performance Ads', monthly_fee: 60000, status: 'active', type: 'retainer', start_date: '2024-09-01', end_date: null },
  { id: 'eng-4', client_id: 'cli-4', name: 'B2B Lead Gen', monthly_fee: 120000, status: 'active', type: 'retainer', start_date: '2024-01-15', end_date: null },
  { id: 'eng-5', client_id: 'cli-5', name: 'Instagram + TikTok', monthly_fee: 55000, status: 'active', type: 'retainer', start_date: '2024-11-01', end_date: '2026-01-31' },
  { id: 'eng-6', client_id: 'cli-6', name: 'Automotive Campaign', monthly_fee: 95000, status: 'active', type: 'retainer', start_date: '2025-01-01', end_date: null },
  // New engagement starting this month
  { id: 'eng-7', client_id: 'cli-7', name: 'E-commerce Growth', monthly_fee: 70000, status: 'active', type: 'retainer', start_date: '2026-01-15', end_date: null },
];

// Leads with offer sent (pipeline)
const MOCK_LEADS_PIPELINE = [
  { id: 'lead-1', company_name: 'Startup XYZ', estimated_price: 45000, stage: 'offer_sent' },
  { id: 'lead-2', company_name: 'BigCorp Industries', estimated_price: 150000, stage: 'offer_sent' },
  { id: 'lead-3', company_name: 'Local Bakery', estimated_price: 25000, stage: 'offer_sent' },
  { id: 'lead-4', company_name: 'Fitness Club Chain', estimated_price: 80000, stage: 'offer_sent' },
];

// Assignments (colleague to engagement)
const MOCK_ASSIGNMENTS = [
  { engagement_id: 'eng-1', colleague_id: 'col-1' },
  { engagement_id: 'eng-1', colleague_id: 'col-2' },
  { engagement_id: 'eng-2', colleague_id: 'col-3' },
  { engagement_id: 'eng-3', colleague_id: 'col-3' },
  { engagement_id: 'eng-4', colleague_id: 'col-1' },
  { engagement_id: 'eng-5', colleague_id: 'col-2' },
  { engagement_id: 'eng-5', colleague_id: 'col-4' },
  { engagement_id: 'eng-6', colleague_id: 'col-3' },
  { engagement_id: 'eng-7', colleague_id: 'col-1' },
];

// Mock actual revenue for past months (simulating invoiced data)
const MOCK_MONTHLY_ACTUALS_2026: Record<number, { actual: number; source: RevenueSource }> = {
  1: { actual: 1750000, source: 'estimated' }, // Current month - estimated
};

const STORAGE_KEY = 'crm-business-plan';

export function RevenuePlanForecast({ selectedYear, selectedMonth }: RevenuePlanForecastProps) {
  const { plannedEngagements, addPlannedEngagement, deletePlannedEngagement } = usePlannedEngagements();
  
  const [plans, setPlans] = useState<MonthlyPlan[]>(() => getStoredPlans());
  const [editingMonth, setEditingMonth] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showMonthlyTable, setShowMonthlyTable] = useState(true);
  const [showTargetsDialog, setShowTargetsDialog] = useState(false);

  const monthStart = startOfMonth(new Date(selectedYear, selectedMonth - 1));
  const monthEnd = endOfMonth(monthStart);

  const savePlans = (newPlans: MonthlyPlan[]) => {
    setPlans(newPlans);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newPlans));
  };

  const setPlanForMonth = (year: number, month: number, targetRevenue: number) => {
    const existing = plans.filter(p => !(p.year === year && p.month === month));
    savePlans([...existing, { year, month, targetRevenue }]);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatCompact = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
    return num.toLocaleString('cs-CZ');
  };

  // Current MRR from active retainers (MOCK)
  const currentMRR = useMemo(() => {
    return MOCK_ENGAGEMENTS
      .filter(e => e.status === 'active' && e.type === 'retainer')
      .reduce((sum, e) => sum + (e.monthly_fee || 0), 0);
  }, []);

  // Ending engagements this month (MOCK)
  const endingEngagements = useMemo(() => {
    return MOCK_ENGAGEMENTS.filter(e => {
      if (!e.end_date || e.status !== 'active') return false;
      const endDate = parseISO(e.end_date);
      return isSameMonth(endDate, monthStart);
    }).map(eng => ({
      ...eng,
      client: MOCK_CLIENTS.find(c => c.id === eng.client_id)
    }));
  }, [monthStart]);

  const churnMRR = endingEngagements.reduce((sum, e) => sum + (e.monthly_fee || 0), 0);

  // NEW: Engagements starting this month (MOCK)
  const startingEngagements = useMemo(() => {
    return MOCK_ENGAGEMENTS.filter(e => {
      if (!e.start_date || e.status !== 'active') return false;
      const startDate = parseISO(e.start_date);
      return isSameMonth(startDate, monthStart);
    }).map(eng => ({
      ...eng,
      client: MOCK_CLIENTS.find(c => c.id === eng.client_id)
    }));
  }, [monthStart]);

  const startingMRR = startingEngagements.reduce((sum, e) => sum + (e.monthly_fee || 0), 0);

  // Planned engagements for this month (manual forecasts)
  const plannedForMonth = useMemo(() => {
    return plannedEngagements.filter(p => {
      const startDate = parseISO(p.start_date);
      return isSameMonth(startDate, monthStart);
    });
  }, [plannedEngagements, monthStart]);

  const plannedMRR = plannedForMonth.reduce((sum, p) => 
    sum + (p.monthly_fee * (p.probability_percent / 100)), 0
  );

  // Total new MRR = actual starting + planned
  const newMRR = startingMRR + plannedMRR;

  // Leads with offer sent (MOCK)
  const leadsWithOfferSent = MOCK_LEADS_PIPELINE;

  const pipelineMRR = leadsWithOfferSent.reduce((sum, l) => sum + (l.estimated_price || 0), 0);

  // Projected MRR
  const projectedMRR = currentMRR - churnMRR + newMRR;

  // Calculate actual revenue for a month (MOCK)
  const calculateActual = (year: number, month: number): { actual: number; source: RevenueSource } => {
    if (year === 2026 && MOCK_MONTHLY_ACTUALS_2026[month]) {
      return MOCK_MONTHLY_ACTUALS_2026[month];
    }
    // For future months or missing data, estimate from current MRR
    const monthDate = new Date(year, month - 1);
    const now = new Date();
    if (monthDate > now) {
      return { actual: 0, source: 'estimated' };
    }
    // Past months without data - simulate growth
    const baseMonthlyRevenue = 1500000;
    const monthsFromBase = (year - 2025) * 12 + month;
    const growthFactor = 1 + (monthsFromBase * 0.02); // 2% monthly growth
    return { actual: Math.round(baseMonthlyRevenue * growthFactor), source: 'invoiced' };
  };

  // Generate months data for the year
  const monthsData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const target = getTargetForMonth(selectedYear, month);
      const { actual, source } = calculateActual(selectedYear, month);
      
      const progress = target > 0 ? Math.min((actual / target) * 100, 100) : 0;
      const diff = actual - target;
      const diffPercent = target > 0 ? ((actual - target) / target) * 100 : 0;
      
      return {
        year: selectedYear,
        month,
        monthName: format(new Date(selectedYear, month - 1), 'LLLL', { locale: cs }),
        monthShort: format(new Date(selectedYear, month - 1), 'LLL', { locale: cs }),
        target,
        actual,
        source,
        progress,
        diff,
        diffPercent,
        isCurrentMonth: selectedYear === new Date().getFullYear() && month === new Date().getMonth() + 1,
        isPast: new Date(selectedYear, month - 1) < startOfMonth(new Date()),
        isSelected: month === selectedMonth,
      };
    });
  }, [selectedYear, selectedMonth, plans]);

  // Build chart data: past 6 months + current + 3 future with projections
  const chartData = useMemo(() => {
    const data: any[] = [];
    
    monthsData.forEach(m => {
      const isPastOrCurrent = m.isPast || m.isCurrentMonth;
      
      // Calculate projection for future months
      let projection = 0;
      if (!isPastOrCurrent) {
        const monthDate = new Date(selectedYear, m.month - 1);
        
        // Get churn for months between now and target month
        let cumChurn = 0;
        let cumNew = 0;
        for (let i = selectedMonth; i <= m.month; i++) {
          const iDate = new Date(selectedYear, i - 1);
          cumChurn += MOCK_ENGAGEMENTS.filter(e => {
            if (!e.end_date || e.status !== 'active') return false;
            return isSameMonth(parseISO(e.end_date), iDate);
          }).reduce((sum, e) => sum + (e.monthly_fee || 0), 0);
          
          cumNew += plannedEngagements.filter(p => 
            isSameMonth(parseISO(p.start_date), iDate)
          ).reduce((sum, p) => sum + (p.monthly_fee * (p.probability_percent / 100)), 0);
          
          // Also add starting engagements from mock
          cumNew += MOCK_ENGAGEMENTS.filter(e => {
            if (!e.start_date) return false;
            return isSameMonth(parseISO(e.start_date), iDate);
          }).reduce((sum, e) => sum + (e.monthly_fee || 0), 0);
        }
        
        projection = currentMRR - cumChurn + cumNew;
      }
      
      data.push({
        month: m.monthShort,
        monthNum: m.month,
        target: m.target,
        actual: isPastOrCurrent ? m.actual : null,
        projection: !isPastOrCurrent ? projection : null,
        isSelected: m.isSelected,
        isFuture: !isPastOrCurrent,
      });
    });
    
    return data;
  }, [monthsData, selectedMonth, currentMRR, plannedEngagements, selectedYear]);

  // Year totals + deficit calculation
  const yearTotals = useMemo(() => {
    const totalTarget = monthsData.reduce((sum, m) => sum + m.target, 0);
    const totalActual = monthsData.filter(m => m.isPast || m.isCurrentMonth).reduce((sum, m) => sum + m.actual, 0);
    const yearProgress = totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0;
    const remaining = totalTarget - totalActual;
    
    // Calculate YTD deficit (how much behind/ahead we are)
    const pastMonthsTarget = monthsData
      .filter(m => m.isPast || m.isCurrentMonth)
      .reduce((sum, m) => sum + m.target, 0);
    const pastMonthsActual = monthsData
      .filter(m => m.isPast || m.isCurrentMonth)
      .reduce((sum, m) => sum + m.actual, 0);
    
    const ytdDeficit = pastMonthsTarget - pastMonthsActual; // positive = behind, negative = ahead
    const remainingMonths = monthsData.filter(m => !m.isPast && !m.isCurrentMonth).length;
    const monthlyAdjustment = remainingMonths > 0 ? ytdDeficit / remainingMonths : 0;
    
    return { 
      totalTarget, 
      totalActual, 
      yearProgress, 
      remaining,
      ytdDeficit,
      remainingMonths,
      monthlyAdjustment
    };
  }, [monthsData]);

  const selectedMonthData = monthsData.find(m => m.month === selectedMonth);
  const monthTarget = selectedMonthData?.target || 0;
  const fulfillmentPercent = monthTarget > 0 ? (projectedMRR / monthTarget) * 100 : 0;

  const handleStartEdit = (year: number, month: number, currentValue: number) => {
    setEditingMonth(`${year}-${month}`);
    setEditValue(currentValue.toString());
  };

  const handleSaveEdit = (year: number, month: number) => {
    const value = parseInt(editValue) || 0;
    setPlanForMonth(year, month, value);
    setEditingMonth(null);
    setEditValue('');
  };

  const handleCancelEdit = () => {
    setEditingMonth(null);
    setEditValue('');
  };

  // Get assigned colleagues for an engagement (MOCK)
  const getAssignedColleagues = (engagementId: string) => {
    return MOCK_ASSIGNMENTS
      .filter(a => a.engagement_id === engagementId)
      .map(a => MOCK_COLLEAGUES.find(c => c.id === a.colleague_id))
      .filter(Boolean)
      .map(c => c!.full_name.split(' ').map(n => n[0]).join(''))
      .join(', ');
  };

  return (
    <div className="space-y-6">
      {/* Demo Badge */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-center gap-2">
        <Badge variant="outline" className="border-amber-500 text-amber-600">DEMO</Badge>
        <span className="text-sm text-muted-foreground">
          Zobrazená data jsou ukázková. Plánované zakázky se ukládají do localStorage.
        </span>
      </div>

      {/* Annual KPIs */}
      <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-transparent">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Plán & Forecast {selectedYear}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTargetsDialog(true)}
            >
              <Settings className="h-4 w-4 mr-1" />
              Nastavit cíle
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="p-3 rounded-lg bg-background border">
              <p className="text-sm text-muted-foreground">Roční cíl</p>
              <p className="text-2xl font-bold">{formatCompact(yearTotals.totalTarget)}</p>
            </div>
            <div className="p-3 rounded-lg bg-background border">
              <p className="text-sm text-muted-foreground">YTD tržby</p>
              <p className="text-2xl font-bold">{formatCompact(yearTotals.totalActual)}</p>
            </div>
            <div className="p-3 rounded-lg bg-background border">
              <p className="text-sm text-muted-foreground">Plnění</p>
              <p className={`text-2xl font-bold ${yearTotals.yearProgress >= 100 ? 'text-emerald-600' : ''}`}>
                {yearTotals.yearProgress.toFixed(1)}%
              </p>
            </div>
            <div className="p-3 rounded-lg bg-background border">
              <p className="text-sm text-muted-foreground">Zbývá</p>
              <p className="text-2xl font-bold text-muted-foreground">{formatCompact(yearTotals.remaining)}</p>
            </div>
          </div>
          <Progress value={yearTotals.yearProgress} className="h-3" />
        </CardContent>
      </Card>

      {/* Trend Chart */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            📈 Trend tržeb
            <Badge variant="outline" className="font-normal">skutečnost + projekce</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorProjection" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(142 76% 36%)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(142 76% 36%)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                tickFormatter={(v) => formatCompact(v)}
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <Tooltip 
                formatter={(value: number, name: string, props: any) => {
                  const dataKey = props?.dataKey || name;
                  const label = dataKey === 'target' ? 'Cíl' : dataKey === 'actual' ? 'Skutečnost' : 'Projekce';
                  return [formatCurrency(value), label];
                }}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="target" 
                stroke="hsl(var(--muted-foreground))" 
                fillOpacity={1}
                fill="url(#colorTarget)"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Cíl"
              />
              <Area 
                type="monotone" 
                dataKey="actual" 
                stroke="hsl(var(--primary))" 
                fillOpacity={1}
                fill="url(#colorActual)"
                strokeWidth={2}
                name="Skutečnost"
                connectNulls={false}
              />
              <Area 
                type="monotone" 
                dataKey="projection" 
                stroke="hsl(142 76% 36%)" 
                fillOpacity={1}
                fill="url(#colorProjection)"
                strokeWidth={2}
                strokeDasharray="3 3"
                name="Projekce"
                connectNulls={false}
              />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 mt-3 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-primary"></div>
              <span className="text-muted-foreground">Skutečnost</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-emerald-500" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 3px, hsl(142 76% 36%) 3px, hsl(142 76% 36%) 6px)' }}></div>
              <span className="text-muted-foreground">Projekce</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-muted-foreground" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 3px, hsl(var(--muted-foreground)) 3px, hsl(var(--muted-foreground)) 6px)' }}></div>
              <span className="text-muted-foreground">Cíl</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Month Detail */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              📅 {format(monthStart, 'LLLL yyyy', { locale: cs })}
            </span>
            {selectedMonthData && selectedMonthData.source === 'invoiced' ? (
              <Badge variant="outline" className="text-xs flex items-center gap-1">
                <FileText className="h-3 w-3" />
                z faktur
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs flex items-center gap-1">
                <Calculator className="h-3 w-3" />
                odhad
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="p-4 rounded-lg border bg-card">
              <p className="text-sm text-muted-foreground mb-1">Cíl měsíce</p>
              <p className="text-2xl font-bold">{formatCompact(monthTarget)}</p>
            </div>
            <div className="p-4 rounded-lg border bg-card">
              <p className="text-sm text-muted-foreground mb-1">Aktuální MRR</p>
              <p className="text-2xl font-bold">{formatCompact(currentMRR)}</p>
              <Progress value={(currentMRR / monthTarget) * 100} className="h-2 mt-2" />
            </div>
            <div className="p-4 rounded-lg border bg-card">
              <p className="text-sm text-muted-foreground mb-1">Projekce</p>
              <div className="flex items-baseline gap-2">
                <p className={`text-2xl font-bold ${fulfillmentPercent >= 100 ? 'text-emerald-600' : fulfillmentPercent >= 90 ? 'text-amber-600' : 'text-destructive'}`}>
                  {formatCompact(projectedMRR)}
                </p>
                <span className="text-sm text-muted-foreground">→ {fulfillmentPercent.toFixed(0)}%</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {churnMRR > 0 && <span className="text-destructive">-{formatCompact(churnMRR)}</span>}
                {churnMRR > 0 && newMRR > 0 && ' / '}
                {newMRR > 0 && <span className="text-emerald-600">+{formatCompact(newMRR)}</span>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Departures & Arrivals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Departures (Churn) */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <CalendarX className="h-4 w-4 text-destructive" />
              Odchody (churn)
              {churnMRR > 0 && (
                <Badge variant="destructive" className="ml-auto">
                  -{formatCompact(churnMRR)}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {endingEngagements.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Žádné zakázky nekončí tento měsíc ✓
              </p>
            ) : (
              <div className="space-y-2">
                {endingEngagements.map(eng => (
                  <div key={eng.id} className="flex items-center justify-between p-3 rounded-lg border bg-destructive/5">
                    <div className="space-y-0.5">
                      <div className="font-medium text-sm">{eng.client?.brand_name || eng.client?.name || eng.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {eng.end_date && format(parseISO(eng.end_date), 'd.M.', { locale: cs })}
                        {getAssignedColleagues(eng.id) && ` • ${getAssignedColleagues(eng.id)}`}
                      </div>
                    </div>
                    <span className="text-sm font-medium text-destructive">
                      -{formatCompact(eng.monthly_fee || 0)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Arrivals (New Business) */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-500" />
              Příchody (new business)
              {newMRR > 0 && (
                <Badge className="ml-auto bg-emerald-600">
                  +{formatCompact(newMRR)}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Actual new deals from mock data */}
            {startingEngagements.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Nové zakázky (z CRM)</p>
                {startingEngagements.map(eng => (
                  <div key={eng.id} className="flex items-center justify-between p-3 rounded-lg border bg-emerald-500/10">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{eng.client?.brand_name || eng.client?.name || eng.name}</span>
                        <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-300">
                          Aktivní
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        od {eng.start_date && format(parseISO(eng.start_date), 'd.M.', { locale: cs })}
                        {getAssignedColleagues(eng.id) && ` • ${getAssignedColleagues(eng.id)}`}
                      </div>
                    </div>
                    <span className="text-sm font-medium text-emerald-600">
                      +{formatCompact(eng.monthly_fee || 0)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Manual planned engagements */}
            <div className="space-y-2">
              {(startingEngagements.length > 0 || plannedForMonth.length > 0) && plannedForMonth.length > 0 && (
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide pt-2">Plánované (manuální forecast)</p>
              )}
              {plannedForMonth.map(planned => {
                const assignedNames = planned.assigned_colleague_ids
                  .map(id => MOCK_COLLEAGUES.find(c => c.id === id))
                  .filter(Boolean)
                  .map(c => c!.full_name.split(' ')[0])
                  .join(', ');

                return (
                  <div key={planned.id} className="flex items-center justify-between p-3 rounded-lg border bg-emerald-500/5">
                    <div className="space-y-0.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{planned.client_name}</span>
                        {planned.probability_percent < 100 && (
                          <Badge variant="outline" className="text-xs">
                            {planned.probability_percent}%
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {planned.name} • od {format(parseISO(planned.start_date), 'd.M.', { locale: cs })}
                        {assignedNames && ` • ${assignedNames}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-emerald-600">
                        +{formatCompact(planned.monthly_fee)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => deletePlannedEngagement(planned.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {startingEngagements.length === 0 && plannedForMonth.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Žádné nové zakázky tento měsíc
              </p>
            )}

            <AddPlannedEngagementDialog
              colleagues={MOCK_COLLEAGUES as any}
              onAdd={addPlannedEngagement}
              defaultStartDate={monthStart}
            />
          </CardContent>
        </Card>
      </div>


      {/* Monthly Plan Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium">📋 Měsíční přehled plánu</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMonthlyTable(!showMonthlyTable)}
            >
              {showMonthlyTable ? 'Skrýt tabulku' : 'Zobrazit tabulku'}
            </Button>
          </div>
        </CardHeader>
        {showMonthlyTable && (
          <CardContent>
            {/* Deficit/Surplus Alert */}
            {yearTotals.ytdDeficit > 0 ? (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                <div className="flex items-start gap-2">
                  <TrendingDown className="h-5 w-5 text-destructive mt-0.5" />
                  <div>
                    <p className="font-medium text-destructive">
                      Aktuální ztráta: {formatCurrency(yearTotals.ytdDeficit)}
                    </p>
                    {yearTotals.remainingMonths > 0 && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Pro dohnání cíle potřebujete každý ze zbývajících {yearTotals.remainingMonths} měsíců přeplnit o ~<strong>{formatCurrency(Math.ceil(yearTotals.monthlyAdjustment))}</strong>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : yearTotals.ytdDeficit < 0 ? (
              <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                <div className="flex items-start gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-emerald-600">
                      Jste {formatCurrency(Math.abs(yearTotals.ytdDeficit))} před plánem! 🎉
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Máte náskok, který můžete využít jako rezervu nebo investovat do růstu.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Měsíc</TableHead>
                  <TableHead className="text-right">Cíl</TableHead>
                  <TableHead className="text-right">Skutečnost</TableHead>
                  <TableHead className="text-right">Projekce</TableHead>
                  <TableHead className="text-right">Plnění</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthsData.map((m) => {
                  const isEditing = editingMonth === `${m.year}-${m.month}`;
                  const showProjection = !m.isPast && !m.isCurrentMonth;
                  
                  // Calculate projection for this row
                  let rowProjection = 0;
                  if (showProjection) {
                    let cumChurn = 0;
                    let cumNew = 0;
                    for (let i = selectedMonth; i <= m.month; i++) {
                      const iDate = new Date(selectedYear, i - 1);
                      cumChurn += MOCK_ENGAGEMENTS.filter(e => {
                        if (!e.end_date || e.status !== 'active') return false;
                        return isSameMonth(parseISO(e.end_date), iDate);
                      }).reduce((sum, e) => sum + (e.monthly_fee || 0), 0);
                      
                      cumNew += plannedEngagements.filter(p => 
                        isSameMonth(parseISO(p.start_date), iDate)
                      ).reduce((sum, p) => sum + (p.monthly_fee * (p.probability_percent / 100)), 0);
                    }
                    rowProjection = currentMRR - cumChurn + cumNew;
                  }
                  
                  const displayValue = m.isPast || m.isCurrentMonth ? m.actual : rowProjection;
                  const fulfillment = m.target > 0 ? (displayValue / m.target) * 100 : 0;
                  
                  return (
                    <TableRow key={m.month} className={m.isSelected ? 'bg-primary/5' : ''}>
                      <TableCell className="font-medium">
                        <span className="capitalize">{m.monthName.slice(0, 3)}</span>
                        {m.isSelected && <span className="ml-1 text-primary">◄</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1">
                            <Input
                              type="number"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="w-24 h-7 text-right"
                            />
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleSaveEdit(m.year, m.month)}>
                              <Save className="h-3 w-3" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleCancelEdit}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <span>{m.target > 0 ? formatCompact(m.target) : '—'}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {(m.isPast || m.isCurrentMonth) ? formatCompact(m.actual) : '—'}
                          {(m.isPast || m.isCurrentMonth) && m.actual > 0 && (
                            m.source === 'invoiced' ? (
                              <FileText className="h-3 w-3 text-muted-foreground" />
                            ) : (
                              <Calculator className="h-3 w-3 text-muted-foreground" />
                            )
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {showProjection ? (
                          <span className="text-emerald-600">{formatCompact(rowProjection)}</span>
                        ) : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        {m.target > 0 ? (
                          <Badge 
                            variant={fulfillment >= 100 ? 'outline' : fulfillment >= 90 ? 'secondary' : 'destructive'}
                            className={fulfillment >= 100 ? 'text-emerald-600 border-emerald-300' : ''}
                          >
                            {fulfillment.toFixed(0)}%
                          </Badge>
                        ) : '—'}
                      </TableCell>
                      <TableCell>
                        {!isEditing && (
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-7 w-7"
                            onClick={() => handleStartEdit(m.year, m.month, m.target)}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        )}
      </Card>

      {/* Edit Monthly Targets Dialog */}
      <EditMonthlyTargetsDialog
        open={showTargetsDialog}
        onOpenChange={setShowTargetsDialog}
        selectedYear={selectedYear}
        plans={plans}
        onSave={savePlans}
      />
    </div>
  );
}
