import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KPICard } from '@/components/shared/KPICard';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell,
} from 'recharts';
import { 
  Users, 
  Target, 
  Clock, 
  DollarSign,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STAGE_COLORS: Record<string, string> = {
  'new_lead': 'hsl(var(--chart-1))',
  'contacted': 'hsl(var(--chart-2))',
  'in_progress': 'hsl(var(--chart-3))',
  'offer_sent': 'hsl(var(--chart-4))',
  'won': 'hsl(var(--status-active))',
  'lost': 'hsl(var(--status-lost))',
};

const STAGE_LABELS: Record<string, string> = {
  'new_lead': 'Nový lead',
  'contacted': 'Kontaktován',
  'in_progress': 'V jednání',
  'offer_sent': 'Nabídka odeslána',
  'won': 'Vyhráno',
  'lost': 'Ztraceno',
};

interface LeadsAnalyticsProps {
  year: number;
  month: number;
  totalLeads: number;
  newLeadsThisMonth: number;
  leadToClientRate: number;
  avgConversionDays: number;
  expectedValue: number;
  leadChange: number;
  leadTrend: { month: string; new: number; active: number; closed: number }[];
  funnelData: { stage: string; count: number }[];
  leadsBySource: { source: string; count: number; converted: number }[];
  leadsByOwner: { owner: string; count: number; converted: number }[];
}

export function LeadsAnalytics({
  totalLeads,
  newLeadsThisMonth,
  leadToClientRate,
  avgConversionDays,
  expectedValue,
  leadChange,
  leadTrend,
  funnelData,
  leadsBySource,
  leadsByOwner,
}: LeadsAnalyticsProps) {
  const formatCurrency = (value: number) => `${(value / 1000).toFixed(0)}K`;
  
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <KPICard
          title="Celkem leadů"
          value={totalLeads}
          icon={Users}
          subtitle={
            <span className={cn(
              "flex items-center gap-1 text-xs",
              leadChange >= 0 ? "text-status-active" : "text-status-lost"
            )}>
              {leadChange >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
              {Math.abs(leadChange)} vs minulý měsíc
            </span>
          }
        />
        <KPICard
          title="Nové leady"
          value={newLeadsThisMonth}
          icon={Users}
          subtitle="tento měsíc"
        />
        <KPICard
          title="Konverzní poměr"
          value={`${leadToClientRate.toFixed(1)}%`}
          icon={Target}
          subtitle="lead → klient"
        />
        <KPICard
          title="Průměrná doba konverze"
          value={`${avgConversionDays} dní`}
          icon={Clock}
        />
        <KPICard
          title="Očekávaná hodnota"
          value={`${formatCurrency(expectedValue)} Kč`}
          icon={DollarSign}
          subtitle="vážená pravděpodobností"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Lead Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Vývoj leadů (12 měsíců)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={leadTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="new" 
                    stackId="1"
                    stroke="hsl(var(--chart-1))" 
                    fill="hsl(var(--chart-1))"
                    fillOpacity={0.6}
                    name="Nové"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="active" 
                    stackId="1"
                    stroke="hsl(var(--chart-2))" 
                    fill="hsl(var(--chart-2))"
                    fillOpacity={0.6}
                    name="Aktivní"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="closed" 
                    stackId="1"
                    stroke="hsl(var(--chart-3))" 
                    fill="hsl(var(--chart-3))"
                    fillOpacity={0.6}
                    name="Uzavřené"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-chart-1" />
                <span className="text-xs text-muted-foreground">Nové</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-chart-2" />
                <span className="text-xs text-muted-foreground">Aktivní</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-chart-3" />
                <span className="text-xs text-muted-foreground">Uzavřené</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Funnel */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Průchodnost funnelem</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    type="number"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis 
                    type="category"
                    dataKey="stage"
                    width={120}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickFormatter={(value) => STAGE_LABELS[value] || value}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`${value} leadů`, 'Počet']}
                    labelFormatter={(label) => STAGE_LABELS[label] || label}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {funnelData.map((entry) => (
                      <Cell key={entry.stage} fill={STAGE_COLORS[entry.stage] || 'hsl(var(--chart-1))'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Leads by Source */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Leady podle zdroje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={leadsBySource}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="source" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--chart-1))" name="Celkem" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="converted" fill="hsl(var(--status-active))" name="Konvertováno" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--chart-1))' }} />
                <span className="text-xs text-muted-foreground">Celkem</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--status-active))' }} />
                <span className="text-xs text-muted-foreground">Konvertováno</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Leads by Owner */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Leady podle obchodníka</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={leadsByOwner} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    type="number"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis 
                    type="category"
                    dataKey="owner"
                    width={100}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--chart-2))" name="Celkem" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="converted" fill="hsl(var(--status-active))" name="Konvertováno" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
