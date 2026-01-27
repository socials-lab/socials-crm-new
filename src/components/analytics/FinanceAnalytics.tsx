import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KPICard } from '@/components/shared/KPICard';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { 
  DollarSign, 
  Percent, 
  TrendingUp, 
  Briefcase,
  ArrowUp,
  ArrowDown,
  Users,
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

const TIER_COLORS: Record<string, string> = {
  'standard': 'hsl(var(--muted-foreground))',
  'gold': 'hsl(45, 100%, 50%)',
  'platinum': 'hsl(220, 20%, 65%)',
  'diamond': 'hsl(200, 100%, 60%)',
};

interface EngagementMargin {
  id: string;
  name: string;
  client: string;
  revenue: number;
  cost: number;
  marginAbsolute: number;
  marginPercent: number;
}

interface MarginByTier {
  tier: string;
  avgMargin: number;
  totalRevenue: number;
  count: number;
}

interface FinanceAnalyticsProps {
  year: number;
  month: number;
  totalInvoicing: number;
  avgMarginPercent: number;
  marginAbsolute: number;
  extraWorkCount: number;
  extraWorkAmount: number;
  revenuePerColleague: number;
  invoicingChange: number;
  marginChange: number;
  avgMrrPerClient: number;
  engagementMargins: EngagementMargin[];
  marginTrend: { month: string; percent: number; absolute: number }[];
  marginDistribution: { range: string; count: number }[];
  extraWorkTrend: { month: string; count: number; amount: number }[];
  marginByTier: MarginByTier[];
  revenueBreakdown: {
    retainers: number;
    extraWork: number;
    oneOff: number;
  };
}

export function FinanceAnalytics({
  totalInvoicing,
  avgMarginPercent,
  marginAbsolute,
  extraWorkCount,
  extraWorkAmount,
  revenuePerColleague,
  invoicingChange,
  avgMrrPerClient,
  engagementMargins,
  marginTrend,
  marginDistribution,
  extraWorkTrend,
  marginByTier,
  revenueBreakdown,
}: FinanceAnalyticsProps) {
  const formatCurrency = (value: number) => `${(value / 1000).toFixed(0)}K`;
  
  const getMarginBadgeVariant = (margin: number) => {
    if (margin >= 40) return 'default';
    if (margin >= 20) return 'secondary';
    return 'destructive';
  };
  
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <KPICard
          title="Celková fakturace"
          value={`${formatCurrency(totalInvoicing)} Kč`}
          icon={DollarSign}
          subtitle={
            <span className={cn(
              "flex items-center gap-1 text-xs",
              invoicingChange >= 0 ? "text-status-active" : "text-status-lost"
            )}>
              {invoicingChange >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
              {Math.abs(invoicingChange).toFixed(1)}% vs minulý měsíc
            </span>
          }
        />
        <KPICard
          title="Prům. MRR/klient"
          value={`${formatCurrency(avgMrrPerClient)} Kč`}
          icon={Users}
          subtitle="měsíční"
        />
        <KPICard
          title="Průměrná marže"
          value={`${avgMarginPercent.toFixed(1)}%`}
          icon={Percent}
        />
        <KPICard
          title="Marže absolutní"
          value={`${formatCurrency(marginAbsolute)} Kč`}
          icon={TrendingUp}
        />
        <KPICard
          title="Revenue/Kolega"
          value={`${formatCurrency(revenuePerColleague)} Kč`}
          icon={Users}
          subtitle="měsíční"
        />
        <KPICard
          title="Vícepráce"
          value={extraWorkCount}
          icon={Briefcase}
          subtitle={`${formatCurrency(extraWorkAmount)} Kč`}
        />
      </div>

      {/* Revenue Breakdown Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Struktura příjmů (reálná data)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-primary">{formatCurrency(revenueBreakdown.retainers)} Kč</p>
              <p className="text-sm text-muted-foreground">Retainery</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-chart-2">{formatCurrency(revenueBreakdown.extraWork)} Kč</p>
              <p className="text-sm text-muted-foreground">Vícepráce</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-chart-3">{formatCurrency(revenueBreakdown.oneOff)} Kč</p>
              <p className="text-sm text-muted-foreground">Jednorázové</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Margin Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Marže na zakázkách</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Zakázka</TableHead>
                  <TableHead>Klient</TableHead>
                  <TableHead className="text-right">Příjem</TableHead>
                  <TableHead className="text-right">Náklady</TableHead>
                  <TableHead className="text-right">Marže abs.</TableHead>
                  <TableHead className="text-right">Marže %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {engagementMargins.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Žádné zakázky s dostupnými daty o maržích
                    </TableCell>
                  </TableRow>
                ) : (
                  engagementMargins.map((engagement) => (
                    <TableRow key={engagement.id}>
                      <TableCell className="font-medium">{engagement.name}</TableCell>
                      <TableCell className="text-muted-foreground">{engagement.client}</TableCell>
                      <TableCell className="text-right">{engagement.revenue.toLocaleString()} Kč</TableCell>
                      <TableCell className="text-right">{engagement.cost.toLocaleString()} Kč</TableCell>
                      <TableCell className="text-right">{engagement.marginAbsolute.toLocaleString()} Kč</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={getMarginBadgeVariant(engagement.marginPercent)}>
                          {engagement.marginPercent.toFixed(1)}%
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

      {/* Charts Row 1 */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Margin Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Vývoj marže (12 měsíců)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={marginTrend}>
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
                    tickFormatter={(value) => `${value}%`}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="percent" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                    name="Marže %"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="absolute" 
                    stroke="hsl(var(--status-active))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--status-active))', r: 4 }}
                    name="Marže Kč"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--primary))' }} />
                <span className="text-xs text-muted-foreground">Marže %</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--status-active))' }} />
                <span className="text-xs text-muted-foreground">Marže absolutní</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Margin by Tier */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Marže podle tier klienta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={marginByTier}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="tier" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickFormatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
                  />
                  <YAxis 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickFormatter={(value) => `${value}%`}
                    domain={[0, 100]}
                  />
                  <Tooltip 
                    formatter={(value: number, name: string) => {
                      if (name === 'avgMargin') return [`${value.toFixed(1)}%`, 'Prům. marže'];
                      return [value, name];
                    }}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="avgMargin" radius={[4, 4, 0, 0]}>
                    {marginByTier.map((entry) => (
                      <Bar key={entry.tier} dataKey="avgMargin" fill={TIER_COLORS[entry.tier] || 'hsl(var(--chart-1))'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-2">
              {marginByTier.map((entry) => (
                <div key={entry.tier} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: TIER_COLORS[entry.tier] || 'hsl(var(--chart-1))' }}
                  />
                  <span className="text-xs text-muted-foreground capitalize">
                    {entry.tier} ({entry.count})
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Margin Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Rozložení marží</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={marginDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="range" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`${value} zakázek`, 'Počet']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Extra Work Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Vývoj víceprací (12 měsíců)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={extraWorkTrend}>
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
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar yAxisId="left" dataKey="count" fill="hsl(var(--chart-1))" name="Počet" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="right" dataKey="amount" fill="hsl(var(--chart-2))" name="Částka" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--chart-1))' }} />
                <span className="text-xs text-muted-foreground">Počet</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--chart-2))' }} />
                <span className="text-xs text-muted-foreground">Částka</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
