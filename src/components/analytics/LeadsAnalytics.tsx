import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KPICard } from '@/components/shared/KPICard';
import { FunnelPassthroughAnalytics } from './FunnelPassthroughAnalytics';
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
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const STAGE_COLORS: Record<string, string> = {
  'new_lead': 'hsl(var(--chart-1))',
  'meeting_done': 'hsl(var(--chart-2))',
  'waiting_access': 'hsl(var(--chart-3))',
  'access_received': 'hsl(var(--chart-4))',
  'preparing_offer': 'hsl(var(--chart-5))',
  'offer_sent': 'hsl(var(--primary))',
  'won': 'hsl(var(--status-active))',
  'lost': 'hsl(var(--status-lost))',
  'postponed': 'hsl(var(--muted-foreground))',
};

const STAGE_LABELS: Record<string, string> = {
  'new_lead': 'Nový lead',
  'meeting_done': 'Meeting proběhl',
  'waiting_access': 'Čekáme na přístupy',
  'access_received': 'Přístupy získány',
  'preparing_offer': 'Připravujeme nabídku',
  'offer_sent': 'Nabídka odeslána',
  'won': 'Vyhráno',
  'lost': 'Ztraceno',
  'postponed': 'Odloženo',
};

interface SourcePerformance {
  source: string;
  count: number;
  converted: number;
  conversionRate: number;
  avgDealSize: number;
}

interface OwnerPerformance {
  owner: string;
  count: number;
  converted: number;
  conversionRate: number;
}

interface LeadsAnalyticsProps {
  year: number;
  month: number;
  totalLeads: number;
  newLeadsThisMonth: number;
  leadToClientRate: number;
  avgConversionDays: number;
  expectedValue: number;
  avgDealSize: number;
  leadChange: number;
  leadTrend: { month: string; new: number; active: number; closed: number }[];
  funnelData: { stage: string; count: number }[];
  leadsBySource: { source: string; count: number; converted: number }[];
  leadsByOwner: { owner: string; count: number; converted: number }[];
  pipelineVelocity: { stage: string; avgDays: number }[];
  sourcePerformance: SourcePerformance[];
  ownerPerformance: OwnerPerformance[];
  monthlyWinLoss: { month: string; won: number; lost: number }[];
}

export function LeadsAnalytics({
  totalLeads,
  newLeadsThisMonth,
  leadToClientRate,
  avgConversionDays,
  expectedValue,
  avgDealSize,
  leadChange,
  leadTrend,
  funnelData,
  pipelineVelocity,
  sourcePerformance,
  ownerPerformance,
  monthlyWinLoss,
}: LeadsAnalyticsProps) {
  const formatCurrency = (value: number) => `${(value / 1000).toFixed(0)}K`;
  
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
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
          title="Win Rate"
          value={`${leadToClientRate.toFixed(1)}%`}
          icon={Target}
          subtitle="lead → klient"
        />
        <KPICard
          title="Prům. doba konverze"
          value={`${avgConversionDays} dní`}
          icon={Clock}
        />
        <KPICard
          title="Prům. deal size"
          value={`${formatCurrency(avgDealSize)} Kč`}
          icon={TrendingUp}
          subtitle="vyhrané dealy"
        />
        <KPICard
          title="Pipeline hodnota"
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

        {/* Pipeline Velocity */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Pipeline Velocity (prům. dny ve stage)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pipelineVelocity} layout="vertical">
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
                    formatter={(value: number) => [`${value.toFixed(1)} dní`, 'Průměr']}
                    labelFormatter={(label) => STAGE_LABELS[label] || label}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="avgDays" radius={[0, 4, 4, 0]}>
                    {pipelineVelocity.map((entry) => (
                      <Cell key={entry.stage} fill={STAGE_COLORS[entry.stage] || 'hsl(var(--chart-1))'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Overview - Compact Design */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Přehled pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Active stages as horizontal compact cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
            {funnelData
              .filter(item => !['won', 'lost', 'postponed'].includes(item.stage))
              .map((item, index) => {
                const maxCount = Math.max(...funnelData.filter(f => !['won', 'lost', 'postponed'].includes(f.stage)).map(f => f.count), 1);
                const percentage = (item.count / maxCount) * 100;
                return (
                  <div
                    key={item.stage}
                    className="relative p-3 rounded-lg border bg-card overflow-hidden"
                  >
                    {/* Background progress bar */}
                    <div
                      className="absolute inset-0 opacity-15"
                      style={{
                        backgroundColor: STAGE_COLORS[item.stage],
                        width: `${percentage}%`,
                      }}
                    />
                    <div className="relative">
                      <div className="text-2xl font-bold" style={{ color: STAGE_COLORS[item.stage] }}>
                        {item.count}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {STAGE_LABELS[item.stage]}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
          
          {/* Closed stages as compact row */}
          <div className="flex items-center gap-4 pt-3 border-t">
            <span className="text-xs text-muted-foreground">Uzavřené:</span>
            {funnelData
              .filter(item => ['won', 'lost', 'postponed'].includes(item.stage))
              .map((item) => (
                <div key={item.stage} className="flex items-center gap-1.5">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: STAGE_COLORS[item.stage] }}
                  />
                  <span className="text-sm font-medium">{item.count}</span>
                  <span className="text-xs text-muted-foreground">{STAGE_LABELS[item.stage]}</span>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Win/Loss */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Won vs Lost (12 měsíců)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyWinLoss}>
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
                <Bar dataKey="won" fill="hsl(var(--status-active))" name="Vyhráno" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="lost" fill="hsl(var(--status-lost))" name="Ztraceno" stackId="a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--status-active))' }} />
              <span className="text-xs text-muted-foreground">Vyhráno</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--status-lost))' }} />
              <span className="text-xs text-muted-foreground">Ztraceno</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Tables */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Source Performance */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Výkon podle zdroje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Zdroj</TableHead>
                    <TableHead className="text-right">Leady</TableHead>
                    <TableHead className="text-right">Konverze</TableHead>
                    <TableHead className="text-right">Win Rate</TableHead>
                    <TableHead className="text-right">Prům. Deal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sourcePerformance.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        Žádná data o zdrojích
                      </TableCell>
                    </TableRow>
                  ) : (
                    sourcePerformance.map((source) => (
                      <TableRow key={source.source}>
                        <TableCell className="font-medium">{source.source}</TableCell>
                        <TableCell className="text-right">{source.count}</TableCell>
                        <TableCell className="text-right">{source.converted}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={source.conversionRate >= 20 ? 'default' : 'secondary'}>
                            {source.conversionRate.toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(source.avgDealSize)} Kč</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Owner Performance */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Výkon obchodníků</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Obchodník</TableHead>
                    <TableHead className="text-right">Leady</TableHead>
                    <TableHead className="text-right">Konverze</TableHead>
                    <TableHead className="text-right">Win Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ownerPerformance.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        Žádná data o obchodnících
                      </TableCell>
                    </TableRow>
                  ) : (
                    ownerPerformance.map((owner) => (
                      <TableRow key={owner.owner}>
                        <TableCell className="font-medium">{owner.owner}</TableCell>
                        <TableCell className="text-right">{owner.count}</TableCell>
                        <TableCell className="text-right">{owner.converted}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={owner.conversionRate >= 20 ? 'default' : 'secondary'}>
                            {owner.conversionRate.toFixed(1)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Funnel Passthrough Analytics */}
      <FunnelPassthroughAnalytics />
    </div>
  );
}
