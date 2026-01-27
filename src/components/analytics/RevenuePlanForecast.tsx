import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Target, TrendingUp, TrendingDown, Edit2, Save, X, 
  FileText, Calculator, Sparkles, CalendarX, ArrowRight,
  Trash2
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, parseISO, isSameMonth, addMonths } from 'date-fns';
import { cs } from 'date-fns/locale';
import { useCRMData } from '@/hooks/useCRMData';
import { useLeadsData } from '@/hooks/useLeadsData';
import { usePlannedEngagements } from '@/hooks/usePlannedEngagements';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import { AddPlannedEngagementDialog } from './AddPlannedEngagementDialog';
import { 
  getTargetForMonth, 
  calculateActualRevenue, 
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

const STORAGE_KEY = 'crm-business-plan';

export function RevenuePlanForecast({ selectedYear, selectedMonth }: RevenuePlanForecastProps) {
  const { engagements, extraWorks, engagementServices, issuedInvoices, clients, colleagues, assignments } = useCRMData();
  const { leads } = useLeadsData();
  const { plannedEngagements, addPlannedEngagement, deletePlannedEngagement } = usePlannedEngagements();
  
  const [plans, setPlans] = useState<MonthlyPlan[]>(() => getStoredPlans());
  const [editingMonth, setEditingMonth] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showMonthlyTable, setShowMonthlyTable] = useState(false);

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

  // Current MRR from active retainers
  const currentMRR = useMemo(() => {
    return engagements
      .filter(e => e.status === 'active' && e.type === 'retainer')
      .reduce((sum, e) => sum + (e.monthly_fee || 0), 0);
  }, [engagements]);

  // Ending engagements this month
  const endingEngagements = useMemo(() => {
    return engagements.filter(e => {
      if (!e.end_date || e.status !== 'active') return false;
      const endDate = parseISO(e.end_date);
      return isSameMonth(endDate, monthStart);
    }).map(eng => ({
      ...eng,
      client: clients.find(c => c.id === eng.client_id)
    }));
  }, [engagements, clients, monthStart]);

  const churnMRR = endingEngagements.reduce((sum, e) => sum + (e.monthly_fee || 0), 0);

  // Planned engagements for this month
  const plannedForMonth = useMemo(() => {
    return plannedEngagements.filter(p => {
      const startDate = parseISO(p.start_date);
      return isSameMonth(startDate, monthStart);
    });
  }, [plannedEngagements, monthStart]);

  const newMRR = plannedForMonth.reduce((sum, p) => 
    sum + (p.monthly_fee * (p.probability_percent / 100)), 0
  );

  // Leads with offer sent
  const leadsWithOfferSent = useMemo(() => {
    return leads.filter(l => l.stage === 'offer_sent');
  }, [leads]);

  const pipelineMRR = leadsWithOfferSent.reduce((sum, l) => {
    if (l.potential_services && l.potential_services.length > 0) {
      return sum + l.potential_services.reduce((s: number, ps: any) => s + ps.price, 0);
    }
    return sum + (l.estimated_price || 0);
  }, 0);

  // Projected MRR
  const projectedMRR = currentMRR - churnMRR + newMRR;

  // Generate months data for the year
  const monthsData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const target = getTargetForMonth(selectedYear, month);
      const { actual, source } = calculateActualRevenue(
        selectedYear, 
        month, 
        issuedInvoices || [], 
        engagements, 
        extraWorks || [], 
        engagementServices || []
      );
      
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
  }, [selectedYear, selectedMonth, plans, engagements, extraWorks, engagementServices, issuedInvoices]);

  // Build chart data: past 6 months + current + 3 future with projections
  const chartData = useMemo(() => {
    const data: any[] = [];
    const now = new Date();
    
    // Past months (current year's data)
    monthsData.forEach(m => {
      const isPastOrCurrent = m.isPast || m.isCurrentMonth;
      
      // Calculate projection for future months
      let projection = 0;
      if (!isPastOrCurrent) {
        // Simple projection: current MRR adjusted for known churn/new
        const monthDate = new Date(selectedYear, m.month - 1);
        const monthsAhead = (m.month - selectedMonth);
        
        // Get churn for this specific month
        const monthChurn = engagements.filter(e => {
          if (!e.end_date || e.status !== 'active') return false;
          const endDate = parseISO(e.end_date);
          return isSameMonth(endDate, monthDate);
        }).reduce((sum, e) => sum + (e.monthly_fee || 0), 0);

        // Get planned for this month
        const monthPlanned = plannedEngagements.filter(p => {
          const startDate = parseISO(p.start_date);
          return isSameMonth(startDate, monthDate);
        }).reduce((sum, p) => sum + (p.monthly_fee * (p.probability_percent / 100)), 0);

        // Cumulative projection
        let cumChurn = 0;
        let cumNew = 0;
        for (let i = selectedMonth; i <= m.month; i++) {
          const iDate = new Date(selectedYear, i - 1);
          cumChurn += engagements.filter(e => {
            if (!e.end_date || e.status !== 'active') return false;
            return isSameMonth(parseISO(e.end_date), iDate);
          }).reduce((sum, e) => sum + (e.monthly_fee || 0), 0);
          
          cumNew += plannedEngagements.filter(p => 
            isSameMonth(parseISO(p.start_date), iDate)
          ).reduce((sum, p) => sum + (p.monthly_fee * (p.probability_percent / 100)), 0);
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
  }, [monthsData, selectedMonth, currentMRR, engagements, plannedEngagements, selectedYear]);

  // Year totals
  const yearTotals = useMemo(() => {
    const totalTarget = monthsData.reduce((sum, m) => sum + m.target, 0);
    const totalActual = monthsData.filter(m => m.isPast || m.isCurrentMonth).reduce((sum, m) => sum + m.actual, 0);
    const yearProgress = totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0;
    const remaining = totalTarget - totalActual;
    
    return { totalTarget, totalActual, yearProgress, remaining };
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

  // Get assigned colleagues for an engagement
  const getAssignedColleagues = (engagementId: string) => {
    return assignments
      .filter(a => a.engagement_id === engagementId)
      .map(a => colleagues.find(c => c.id === a.colleague_id))
      .filter(Boolean)
      .map(c => c!.full_name.split(' ').map(n => n[0]).join(''))
      .join(', ');
  };

  return (
    <div className="space-y-6">
      {/* Annual KPIs */}
      <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-transparent">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Plán & Forecast {selectedYear}
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
                formatter={(value: number, name: string) => [formatCurrency(value), 
                  name === 'target' ? 'Cíl' : name === 'actual' ? 'Skutečnost' : 'Projekce'
                ]}
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
            <AddPlannedEngagementDialog
              colleagues={colleagues as any}
              onAdd={addPlannedEngagement}
              defaultStartDate={monthStart}
            />

            {plannedForMonth.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Žádné plánované zakázky pro tento měsíc
              </p>
            ) : (
              <div className="space-y-2">
                {plannedForMonth.map(planned => {
                  const assignedNames = planned.assigned_colleague_ids
                    .map(id => colleagues.find(c => c.id === id))
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
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pipeline */}
      {leadsWithOfferSent.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              🎯 Pipeline (leady s nabídkou)
              <span className="text-muted-foreground font-normal">
                {leadsWithOfferSent.length} leadů • ~{formatCompact(pipelineMRR)} potenciální MRR
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {leadsWithOfferSent.slice(0, 6).map(lead => {
                const leadValue = lead.potential_services && lead.potential_services.length > 0
                  ? lead.potential_services.reduce((s: number, ps: any) => s + ps.price, 0)
                  : lead.estimated_price || 0;
                
                return (
                  <div key={lead.id} className="p-3 rounded-lg border bg-amber-500/5">
                    <div className="font-medium text-sm">{lead.company_name}</div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-muted-foreground">Nabídka odeslaná</span>
                      <span className="text-sm font-medium text-amber-600">{formatCompact(leadValue)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            {leadsWithOfferSent.length > 6 && (
              <p className="text-xs text-muted-foreground text-center mt-3">
                +{leadsWithOfferSent.length - 6} dalších leadů
              </p>
            )}
          </CardContent>
        </Card>
      )}

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
              {showMonthlyTable ? 'Skrýt tabulku' : 'Nastavit cíle měsíců'}
            </Button>
          </div>
        </CardHeader>
        {showMonthlyTable && (
          <CardContent>
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
                    const monthDate = new Date(selectedYear, m.month - 1);
                    let cumChurn = 0;
                    let cumNew = 0;
                    for (let i = selectedMonth; i <= m.month; i++) {
                      const iDate = new Date(selectedYear, i - 1);
                      cumChurn += engagements.filter(e => {
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
    </div>
  );
}
