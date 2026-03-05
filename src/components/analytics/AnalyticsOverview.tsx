import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KPICard } from '@/components/shared/KPICard';
import { Badge } from '@/components/ui/badge';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

interface AnalyticsOverviewProps {
  year: number;
  month: number;
  activeClients: number;
  activeEngagements: number;
  mrr: number;
  avgMargin: number;
  mrrChange: number;
  clientChange: number;
  mrrTrend: { month: string; value: number }[];
  revenueBreakdown: { name: string; value: number }[];
  alerts: {
    lowMarginEngagements: { name: string; client: string; margin: number }[];
    overdueLeads: { company: string; daysOverdue: number }[];
    pendingExtraWork: number;
  };
}

export function AnalyticsOverview({
  activeClients,
  activeEngagements,
  mrr,
  avgMargin,
  mrrChange,
  clientChange,
  mrrTrend,
  revenueBreakdown,
  alerts,
}: AnalyticsOverviewProps) {
  const formatCurrency = (value: number) => `${(value / 1000).toFixed(0)}K`;
  
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
              {Math.abs(clientChange)} vs předchozí období
            </span>
          }
        />
        <KPICard
          title="Aktivní zakázky"
          value={activeEngagements}
          icon={Briefcase}
        />
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
              {Math.abs(mrrChange).toFixed(1)}% vs předchozí období
            </span>
          }
        />
        <KPICard
          title="Průměrná marže"
          value={`${avgMargin.toFixed(1)}%`}
          icon={Percent}
        />
      </div>

      {/* Charts Row */}
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
            <CardTitle className="text-base font-medium">Rozložení příjmů</CardTitle>
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

        {/* Pending Extra Work */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-status-paused" />
              Vícepráce ke schválení
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <p className="text-4xl font-bold text-primary">{alerts.pendingExtraWork}</p>
                <p className="text-sm text-muted-foreground mt-1">čeká na schválení</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
