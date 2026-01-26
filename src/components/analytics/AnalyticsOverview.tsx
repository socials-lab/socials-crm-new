import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KPICard } from '@/components/shared/KPICard';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  ComposedChart,
} from 'recharts';
import { 
  Building2, 
  TrendingUp, 
  Briefcase, 
  Percent,
  AlertTriangle,
  Clock,
  ArrowUp,
  ArrowDown,
  Calendar,
  Target,
  CalendarClock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

interface ClientConcentration {
  name: string;
  revenue: number;
  percentage: number;
}

interface AnalyticsOverviewProps {
  year: number;
  month: number;
  activeClients: number;
  activeEngagements: number;
  mrr: number;
  arr: number;
  avgMargin: number;
  avgClientLifetimeMonths: number;
  pipelineCoverage: number;
  mrrChange: number;
  clientChange: number;
  mrrTrend: { month: string; value: number }[];
  revenueBreakdown: { name: string; value: number }[];
  clientConcentration: ClientConcentration[];
  concentrationRisk: boolean;
  monthlyRevenueMargin: { month: string; revenue: number; margin: number }[];
  alerts: {
    lowMarginEngagements: { name: string; client: string; margin: number }[];
    overdueLeads: { company: string; daysOverdue: number }[];
    pendingExtraWork: number;
    endingContracts: { client: string; daysLeft: number }[];
  };
}

export function AnalyticsOverview({
  activeClients,
  activeEngagements,
  mrr,
  arr,
  avgMargin,
  avgClientLifetimeMonths,
  pipelineCoverage,
  mrrChange,
  clientChange,
  mrrTrend,
  revenueBreakdown,
  clientConcentration,
  concentrationRisk,
  monthlyRevenueMargin,
  alerts,
}: AnalyticsOverviewProps) {
  const formatCurrency = (value: number) => `${(value / 1000).toFixed(0)}K`;
  const formatCurrencyFull = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    return `${(value / 1000).toFixed(0)}K`;
  };
  
  return (
    <div className="space-y-6">
      {/* KPI Cards Row 1 - Main Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <KPICard
          title="MRR"
          value={`${formatCurrency(mrr)} Kč`}
          icon={TrendingUp}
          subtitle={
            <span className={cn(
              "flex items-center gap-1 text-xs",
              mrrChange >= 0 ? "text-status-active" : "text-status-lost"
            )}>
              {mrrChange >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
              {Math.abs(mrrChange).toFixed(1)}% vs minulý měsíc
            </span>
          }
        />
        <KPICard
          title="ARR"
          value={`${formatCurrencyFull(arr)} Kč`}
          icon={Calendar}
          subtitle="roční opakované příjmy"
        />
        <KPICard
          title="Průměrná marže"
          value={`${avgMargin.toFixed(1)}%`}
          icon={Percent}
        />
        <KPICard
          title="Prům. délka spolupráce"
          value={`${avgClientLifetimeMonths.toFixed(1)} měs.`}
          icon={CalendarClock}
          subtitle="aktivní klienti"
        />
        <KPICard
          title="Pipeline Coverage"
          value={`${(pipelineCoverage * 100).toFixed(0)}%`}
          icon={Target}
          subtitle="vs 3M target"
        />
      </div>

      {/* KPI Cards Row 2 - Operational */}
      <div className="grid gap-4 md:grid-cols-3">
        <KPICard
          title="Aktivní klienti"
          value={activeClients}
          icon={Building2}
          subtitle={
            <span className={cn(
              "flex items-center gap-1 text-xs",
              clientChange >= 0 ? "text-status-active" : "text-status-lost"
            )}>
              {clientChange >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
              {Math.abs(clientChange)} vs minulý měsíc
            </span>
          }
        />
        <KPICard
          title="Aktivní zakázky"
          value={activeEngagements}
          icon={Briefcase}
        />
        <KPICard
          title="Vícepráce ke schválení"
          value={alerts.pendingExtraWork}
          icon={Clock}
          subtitle="čeká na schválení"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* MRR Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Vývoj MRR (12 měsíců)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mrrTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`${value.toLocaleString()} Kč`, 'MRR']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Rozložení příjmů (reálná data)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={revenueBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {revenueBreakdown.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`${value.toLocaleString()} Kč`, 'Příjem']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-2">
              {revenueBreakdown.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-xs text-muted-foreground">{entry.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Client Concentration */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              Koncentrace klientů (Top 5)
              {concentrationRisk && (
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Riziko &gt;50%
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={clientConcentration} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    type="number"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickFormatter={(value) => `${value}%`}
                    domain={[0, 100]}
                  />
                  <YAxis 
                    type="category"
                    dataKey="name"
                    width={100}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <Tooltip 
                    formatter={(value: number, name: string) => {
                      if (name === 'percentage') return [`${value.toFixed(1)}%`, 'Podíl'];
                      return [value, name];
                    }}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar 
                    dataKey="percentage" 
                    fill="hsl(var(--chart-1))" 
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Revenue + Margin */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Revenue vs Marže (12 měsíců)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={monthlyRevenueMargin}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis 
                    yAxisId="left"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickFormatter={(value) => `${value}%`}
                    domain={[0, 100]}
                  />
                  <Tooltip 
                    formatter={(value: number, name: string) => {
                      if (name === 'revenue') return [`${value.toLocaleString()} Kč`, 'Revenue'];
                      if (name === 'margin') return [`${value.toFixed(1)}%`, 'Marže'];
                      return [value, name];
                    }}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar yAxisId="left" dataKey="revenue" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="margin" 
                    stroke="hsl(var(--status-active))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--status-active))', r: 4 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--chart-2))' }} />
                <span className="text-xs text-muted-foreground">Revenue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--status-active))' }} />
                <span className="text-xs text-muted-foreground">Marže %</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Low Margin Engagements */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-status-paused" />
              Nízká marže (&lt;30%)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {alerts.lowMarginEngagements.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Všechny zakázky dosahují cílové marže 🎉
              </p>
            ) : (
              <div className="space-y-2">
                {alerts.lowMarginEngagements.slice(0, 5).map((e, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                    <div>
                      <p className="font-medium text-sm">{e.name}</p>
                      <p className="text-xs text-muted-foreground">{e.client}</p>
                    </div>
                    <Badge variant="destructive" className="text-xs">
                      {e.margin.toFixed(1)}%
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ending Contracts */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-status-paused" />
              Končící smlouvy (&lt;60 dní)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {alerts.endingContracts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Žádné smlouvy blížící se ke konci 🎉
              </p>
            ) : (
              <div className="space-y-2">
                {alerts.endingContracts.slice(0, 5).map((c, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                    <p className="font-medium text-sm">{c.client}</p>
                    <Badge variant="secondary" className="text-xs">
                      {c.daysLeft} dní
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Overdue Leads */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-status-paused" />
              Leady čekající &gt;14 dní
            </CardTitle>
          </CardHeader>
          <CardContent>
            {alerts.overdueLeads.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Žádné opožděné leady 🎉
              </p>
            ) : (
              <div className="space-y-2">
                {alerts.overdueLeads.slice(0, 5).map((lead, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                    <p className="font-medium text-sm">{lead.company}</p>
                    <Badge variant="secondary" className="text-xs">
                      {lead.daysOverdue} dní
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Concentration Risk Alert */}
      {concentrationRisk && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Vysoká koncentrace klientů:</strong> Top 5 klientů tvoří více než 50% celkových příjmů. 
            Doporučujeme diverzifikovat klientskou bázi pro snížení rizika.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
