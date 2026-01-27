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
  Trophy,
} from 'lucide-react';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
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

interface WonDeal {
  id: string;
  companyName: string;
  value: number;
  source: string;
  owner: string;
  conversionDays: number;
  convertedAt: string;
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
  wonDeals: WonDeal[];
  totalWonValue: number;
  wonDealsCount: number;
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
  wonDeals,
  totalWonValue,
  wonDealsCount,
}: LeadsAnalyticsProps) {
  const formatCurrency = (value: number) => `${(value / 1000).toFixed(0)}K`;
  
  return (
    <div className="space-y-6">
      {/* KPI Cards - 2 rows for better readability */}
      <div className="grid gap-4 md:grid-cols-3">
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
      </div>
      
      <div className="grid gap-4 md:grid-cols-3">
        <KPICard
          title="Průměrná doba konverze"
          value={`${avgConversionDays} dní`}
          icon={Clock}
        />
        <KPICard
          title="Uzavřené dealy"
          value={wonDealsCount}
          icon={Trophy}
          subtitle={`${formatCurrency(totalWonValue)} Kč MRR`}
        />
        <KPICard
          title="Pipeline hodnota"
          value={`${formatCurrency(expectedValue)} Kč`}
          icon={DollarSign}
          subtitle="leady s odeslanou nabídkou"
        />
      </div>

      {/* Lead Trend - Full Width Large Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Vývoj leadů (12 měsíců)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
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
          <div className="flex justify-center gap-6 mt-3">
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

      {/* Charts Row - Pipeline Velocity */}
      <div className="grid gap-4 lg:grid-cols-2">
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

      {/* Performance Tables Section */}

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

      {/* Won Deals Section */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Trophy className="h-5 w-5 text-status-active" />
              Vyhrané dealy
            </CardTitle>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-muted-foreground">
                Celkem: <span className="font-semibold text-foreground">{wonDealsCount}</span>
              </span>
              <span className="text-muted-foreground">
                Hodnota: <span className="font-semibold text-status-active">{formatCurrency(totalWonValue)} Kč</span>
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Společnost</TableHead>
                  <TableHead className="text-right">Hodnota</TableHead>
                  <TableHead>Zdroj</TableHead>
                  <TableHead>Obchodník</TableHead>
                  <TableHead className="text-right">Doba konverze</TableHead>
                  <TableHead>Datum uzavření</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {wonDeals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Žádné vyhrané dealy
                    </TableCell>
                  </TableRow>
                ) : (
                  wonDeals.map((deal) => (
                    <TableRow key={deal.id}>
                      <TableCell className="font-medium">{deal.companyName}</TableCell>
                      <TableCell className="text-right font-semibold text-status-active">
                        {formatCurrency(deal.value)} Kč
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{deal.source}</Badge>
                      </TableCell>
                      <TableCell>{deal.owner}</TableCell>
                      <TableCell className="text-right">{deal.conversionDays} dní</TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(deal.convertedAt), 'd. M. yyyy', { locale: cs })}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Funnel Passthrough Analytics */}
      <FunnelPassthroughAnalytics />
    </div>
  );
}
