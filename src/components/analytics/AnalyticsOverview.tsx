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
  serviceTypeBreakdown: { name: string; value: number }[];
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
  serviceTypeBreakdown,
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
      </div>

      {/* KPI Cards Row 2 - Operational */}
      <div className="grid gap-4 md:grid-cols-2">
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

      {/* Charts Row 2 - Service Types & Client Distribution */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Service Type Breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">
              Rozložení dle služeb
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={serviceTypeBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                  >
                    {serviceTypeBreakdown.map((entry, index) => (
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
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {serviceTypeBreakdown.slice(0, 6).map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-1.5">
                  <div 
                    className="w-2.5 h-2.5 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-xs text-muted-foreground">{entry.name}</span>
                </div>
              ))}
              {serviceTypeBreakdown.length > 6 && (
                <span className="text-xs text-muted-foreground">+{serviceTypeBreakdown.length - 6} dalších</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Client Distribution (all clients) */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">
              Rozložení dle klientů
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={clientConcentration}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={1}
                    dataKey="percentage"
                    nameKey="name"
                  >
                    {clientConcentration.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number, name: string, props: any) => {
                      const item = props.payload;
                      return [`${value.toFixed(1)}% (${item.revenue.toLocaleString()} Kč)`, item.name];
                    }}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {clientConcentration.slice(0, 5).map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-1.5">
                  <div 
                    className="w-2.5 h-2.5 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-xs text-muted-foreground">{entry.name} ({entry.percentage.toFixed(0)}%)</span>
                </div>
              ))}
              {clientConcentration.length > 5 && (
                <span className="text-xs text-muted-foreground">+{clientConcentration.length - 5} dalších</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 3 */}
      <div className="grid gap-4 lg:grid-cols-1">
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
                    stroke="hsl(var(--chart-5))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--chart-5))', r: 4 }}
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
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--chart-5))' }} />
                <span className="text-xs text-muted-foreground">Marže %</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section - Low Margin Only */}
      {alerts.lowMarginEngagements.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Zakázky s nízkou marží (&lt;50%)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {alerts.lowMarginEngagements.map((e, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
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
          </CardContent>
        </Card>
      )}

    </div>
  );
}
