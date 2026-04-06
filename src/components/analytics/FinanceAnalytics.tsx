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
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { 
  DollarSign, 
  Percent, 
  TrendingUp, 
  Briefcase,
  Sparkles,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMemo, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface EngagementMargin {
  id: string;
  name: string;
  client: string;
  revenue: number;
  revenueEurOriginal?: number;
  cost: number;
  marginAbsolute: number;
  marginPercent: number;
}

interface FinanceAnalyticsProps {
  year: number;
  month: number;
  totalInvoicing: number;
  avgMarginPercent: number;
  marginAbsolute: number;
  extraWorkCount: number;
  extraWorkAmount: number;
  invoicingChange: number;
  marginChange: number;
  engagementMargins: EngagementMargin[];
  marginTrend: { month: string; percent: number; absolute: number }[];
  marginDistribution: { range: string; count: number }[];
  extraWorkTrend: { month: string; count: number; amount: number }[];
  eurConversionRate: number | null;
  eurConversionDate: string | null;
  creativeBoostStats: {
    totalCredits: number;
    creditsByType: { type: string; credits: number }[];
    creditsByColleague: { name: string; credits: number }[];
    creditsTrend: { month: string; credits: number }[];
  };
  servicePerformance: {
    serviceName: string;
    usageCount: number;
    revenue: number;
    cost: number;
    marginAbsolute: number;
    marginPercent: number;
  }[];
}

type SortKey = 'revenue' | 'cost' | 'marginAbsolute' | 'marginPercent';
type SortDirection = 'asc' | 'desc';

export function FinanceAnalytics({
  totalInvoicing,
  avgMarginPercent,
  marginAbsolute,
  extraWorkCount,
  extraWorkAmount,
  invoicingChange,
  engagementMargins,
  marginTrend,
  marginDistribution,
  extraWorkTrend,
  eurConversionRate,
  eurConversionDate,
  creativeBoostStats,
  servicePerformance,
}: FinanceAnalyticsProps) {
  const formatCurrency = (value: number) => `${(value / 1000).toFixed(0)}K`;
  const [sortKey, setSortKey] = useState<SortKey>('marginPercent');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  const getMarginColor = (margin: number) => {
    if (margin >= 40) return 'text-status-active';
    if (margin >= 20) return 'text-status-paused';
    return 'text-status-lost';
  };

  const getMarginBadgeVariant = (margin: number) => {
    if (margin >= 40) return 'default';
    if (margin >= 20) return 'secondary';
    return 'destructive';
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(key);
    setSortDirection('desc');
  };

  const sortedEngagementMargins = useMemo(() => {
    const sorted = [...engagementMargins];
    sorted.sort((a, b) => {
      const direction = sortDirection === 'asc' ? 1 : -1;
      return (a[sortKey] - b[sortKey]) * direction;
    });
    return sorted;
  }, [engagementMargins, sortDirection, sortKey]);

  const sortIcon = (key: SortKey) => {
    if (sortKey !== key) return <ArrowUpDown className="h-3 w-3 text-muted-foreground" />;
    return sortDirection === 'asc'
      ? <ArrowUp className="h-3 w-3 text-foreground" />
      : <ArrowDown className="h-3 w-3 text-foreground" />;
  };

  const serviceUsageTotal = useMemo(
    () => servicePerformance.reduce((sum, item) => sum + item.usageCount, 0),
    [servicePerformance]
  );
  const topServiceRows = useMemo(
    () => [...servicePerformance].sort((a, b) => b.usageCount - a.usageCount).slice(0, 10),
    [servicePerformance]
  );
  const pieData = useMemo(
    () => topServiceRows.map((item) => ({ name: item.serviceName, value: item.usageCount })),
    [topServiceRows]
  );
  const pieColors = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];
  const topServiceByRevenue = useMemo(
    () => [...servicePerformance].sort((a, b) => b.revenue - a.revenue)[0] ?? null,
    [servicePerformance]
  );
  const topServiceByMarginAbsolute = useMemo(
    () => [...servicePerformance].sort((a, b) => b.marginAbsolute - a.marginAbsolute)[0] ?? null,
    [servicePerformance]
  );

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <KPICard
          title="Celková fakturace"
          value={`${formatCurrency(totalInvoicing)} Kč`}
          icon={DollarSign}
          subtitle={
            <div className="space-y-0.5">
              <span className={cn(
                "flex items-center gap-1 text-xs",
                invoicingChange >= 0 ? "text-status-active" : "text-status-lost"
              )}>
                {invoicingChange >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                {Math.abs(invoicingChange).toFixed(1)}% vs předchozí období
              </span>
              {eurConversionRate && (
                <span className="text-[11px] text-muted-foreground">
                  EUR přepočet kurzem {eurConversionRate.toFixed(3)}{eurConversionDate ? ` (${eurConversionDate})` : ''}
                </span>
              )}
            </div>
          }
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
          title="Vícepráce"
          value={extraWorkCount}
          icon={Briefcase}
          subtitle={`${formatCurrency(extraWorkAmount)} Kč`}
        />
        <KPICard
          title="Creative Boost"
          value={`${creativeBoostStats.totalCredits} kreditů`}
          icon={Sparkles}
        />
      </div>

      {/* Margin Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Marže na zakázkách</CardTitle>
          <p className="text-xs text-muted-foreground pt-1">
            Z vystavených faktur z CRM, které jsou navázané na konkrétní zakázku.
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Zakázka</TableHead>
                  <TableHead>Klient</TableHead>
                  <TableHead className="text-right">
                    <button
                      type="button"
                      onClick={() => handleSort('revenue')}
                      className="inline-flex items-center gap-1 ml-auto hover:text-foreground transition-colors"
                    >
                      Příjem
                      {sortIcon('revenue')}
                    </button>
                  </TableHead>
                  <TableHead className="text-right">
                    <button
                      type="button"
                      onClick={() => handleSort('cost')}
                      className="inline-flex items-center gap-1 ml-auto hover:text-foreground transition-colors"
                    >
                      Náklady
                      {sortIcon('cost')}
                    </button>
                  </TableHead>
                  <TableHead className="text-right">
                    <button
                      type="button"
                      onClick={() => handleSort('marginAbsolute')}
                      className="inline-flex items-center gap-1 ml-auto hover:text-foreground transition-colors"
                    >
                      Marže abs.
                      {sortIcon('marginAbsolute')}
                    </button>
                  </TableHead>
                  <TableHead className="text-right">
                    <button
                      type="button"
                      onClick={() => handleSort('marginPercent')}
                      className="inline-flex items-center gap-1 ml-auto hover:text-foreground transition-colors"
                    >
                      Marže %
                      {sortIcon('marginPercent')}
                    </button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedEngagementMargins.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Žádné zakázky s dostupnými daty o maržích
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedEngagementMargins.map((engagement) => (
                    <TableRow key={engagement.id}>
                      <TableCell className="font-medium">{engagement.name}</TableCell>
                      <TableCell className="text-muted-foreground">{engagement.client}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end">
                          <span>{engagement.revenue.toLocaleString()} Kč</span>
                          {(engagement.revenueEurOriginal || 0) > 0 && (
                            <span className="text-[11px] text-muted-foreground">
                              z {(engagement.revenueEurOriginal || 0).toLocaleString()} EUR
                            </span>
                          )}
                        </div>
                      </TableCell>
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

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Nejvyužívanější a nejziskovější služby</CardTitle>
          <p className="text-xs text-muted-foreground">
            Poměrové využití služeb a marže podle aktuálně fakturovaných zakázek v období.
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            {topServiceByRevenue && (
              <Badge variant="outline">
                Nejvyšší revenue: {topServiceByRevenue.serviceName} ({Math.round(topServiceByRevenue.revenue).toLocaleString()} Kč)
              </Badge>
            )}
            {topServiceByMarginAbsolute && (
              <Badge variant="outline">
                Nejvyšší marže abs.: {topServiceByMarginAbsolute.serviceName} ({Math.round(topServiceByMarginAbsolute.marginAbsolute).toLocaleString()} Kč)
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={110}
                    paddingAngle={2}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`service-pie-${index}`} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, _name: string, item) => {
                      const share = serviceUsageTotal > 0 ? (Number(value) / serviceUsageTotal) * 100 : 0;
                      return [`${value} využití (${share.toFixed(1)} %)`, item?.payload?.name || 'Služba'];
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Služba</TableHead>
                    <TableHead className="text-right">Využití</TableHead>
                    <TableHead className="text-right">Podíl</TableHead>
                  <TableHead className="text-right">Příjem</TableHead>
                    <TableHead className="text-right">Marže %</TableHead>
                    <TableHead className="text-right">Marže abs.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topServiceRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Žádná data o službách v tomto období
                      </TableCell>
                    </TableRow>
                  ) : (
                    topServiceRows.map((service) => {
                      const share = serviceUsageTotal > 0 ? (service.usageCount / serviceUsageTotal) * 100 : 0;
                      return (
                        <TableRow key={service.serviceName}>
                          <TableCell className="font-medium">{service.serviceName}</TableCell>
                          <TableCell className="text-right">{service.usageCount}</TableCell>
                          <TableCell className="text-right">{share.toFixed(1)}%</TableCell>
                          <TableCell className="text-right">{Math.round(service.revenue).toLocaleString()} Kč</TableCell>
                          <TableCell className="text-right">
                            <Badge variant={getMarginBadgeVariant(service.marginPercent)}>
                              {service.marginPercent.toFixed(1)}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">{service.marginAbsolute.toLocaleString()} Kč</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
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
      </div>

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

      {/* Creative Boost Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Creative Boost
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Credits by Type */}
            <div>
              <h4 className="text-sm font-medium mb-3">Kredity podle typu</h4>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={creativeBoostStats.creditsByType} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                    <YAxis 
                      type="category" 
                      dataKey="type" 
                      width={80}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`${value} kreditů`, 'Kredity']}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="credits" fill="hsl(var(--chart-4))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Credits by Colleague */}
            <div>
              <h4 className="text-sm font-medium mb-3">Kredity podle kolegy</h4>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={creativeBoostStats.creditsByColleague} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      width={80}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`${value} kreditů`, 'Kredity']}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="credits" fill="hsl(var(--chart-5))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Credits Trend */}
            <div>
              <h4 className="text-sm font-medium mb-3">Vývoj kreditů</h4>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={creativeBoostStats.creditsTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                    <Tooltip 
                      formatter={(value: number) => [`${value} kreditů`, 'Kredity']}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="credits" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))', r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
