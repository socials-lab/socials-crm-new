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
  AreaChart,
  Area,
} from 'recharts';
import {
  Sparkles,
  Users,
  DollarSign,
  Zap,
  Target,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ClientCBStats {
  clientId: string;
  clientName: string;
  brandName: string;
  usedCredits: number;
  maxCredits: number;
  utilizationPercent: number;
  pricePerCredit: number;
  revenue: number;
}

interface CreativeBoostAnalyticsProps {
  year: number;
  month: number;
  totalCredits: number;
  totalRevenue: number;
  avgUtilization: number;
  activeClients: number;
  avgPricePerCredit: number;
  creditsTrend: { month: string; credits: number; revenue: number }[];
  utilizationTrend: { month: string; percent: number }[];
  creditsByType: { type: string; credits: number }[];
  creditsByColleague: { name: string; credits: number }[];
  creditsByClient: ClientCBStats[];
  creditsChange: number;
  revenueChange: number;
}

export function CreativeBoostAnalytics({
  totalCredits,
  totalRevenue,
  avgUtilization,
  activeClients,
  avgPricePerCredit,
  creditsTrend,
  utilizationTrend,
  creditsByType,
  creditsByColleague,
  creditsByClient,
  creditsChange,
  revenueChange,
}: CreativeBoostAnalyticsProps) {
  const formatCurrency = (value: number) => `${(value / 1000).toFixed(0)}K`;
  const creditsByTypeChartHeight = Math.max(280, creditsByType.length * 52);

  function getUtilizationBadge(percent: number) {
    if (percent >= 90) return 'default';
    if (percent >= 70) return 'secondary';
    return 'outline';
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <KPICard
          title="Celkem kreditů"
          value={totalCredits}
          icon={Sparkles}
          subtitle={
            <span className={creditsChange >= 0 ? 'text-status-active' : 'text-status-lost'}>
              {creditsChange >= 0 ? '+' : ''}{creditsChange.toFixed(1)}% vs min. měsíc
            </span>
          }
        />
        <KPICard
          title="Tržby z CB"
          value={`${formatCurrency(totalRevenue)} Kč`}
          icon={DollarSign}
          subtitle={
            <span className={revenueChange >= 0 ? 'text-status-active' : 'text-status-lost'}>
              {revenueChange >= 0 ? '+' : ''}{revenueChange.toFixed(1)}% vs min. měsíc
            </span>
          }
        />
        <KPICard
          title="Prům. využití"
          value={`${avgUtilization.toFixed(0)}%`}
          icon={Target}
          subtitle="z balíčků"
        />
        <KPICard
          title="Aktivní klienti"
          value={activeClients}
          icon={Users}
          subtitle="s CB službou"
        />
        <KPICard
          title="Prům. cena/kredit"
          value={`${avgPricePerCredit.toFixed(0)} Kč`}
          icon={Zap}
        />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Vývoj Creative Boost (12 měsíců)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={creditsTrend.map((item, index) => ({
                  ...item,
                  utilization: utilizationTrend[index]?.percent || 0,
                }))}
              >
                <defs>
                  <linearGradient id="colorCredits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={{ stroke: 'hsl(var(--border))' }} />
                <YAxis yAxisId="left" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={{ stroke: 'hsl(var(--border))' }} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={{ stroke: 'hsl(var(--border))' }} />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    if (name === 'revenue') return [`${value.toLocaleString()} Kč`, 'Tržby'];
                    if (name === 'utilization') return [`${value.toFixed(1)}%`, 'Využití'];
                    return [`${value}`, 'Kredity'];
                  }}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Area yAxisId="left" type="monotone" dataKey="credits" stroke="hsl(var(--primary))" fill="url(#colorCredits)" strokeWidth={2} />
                <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="hsl(var(--status-active))" strokeWidth={2} dot={{ fill: 'hsl(var(--status-active))', r: 3 }} />
                <Line yAxisId="right" type="monotone" dataKey="utilization" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ fill: 'hsl(var(--chart-2))', r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Kredity podle typu výstupu</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ height: `${creditsByTypeChartHeight}px` }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={creditsByType} layout="vertical" margin={{ top: 4, right: 8, bottom: 4, left: 8 }} barCategoryGap="35%">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={{ stroke: 'hsl(var(--border))' }} />
                  <YAxis
                    type="category"
                    dataKey="type"
                    width={180}
                    interval={0}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value} kreditů`, 'Kredity']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="credits" fill="hsl(var(--chart-4))" radius={[0, 4, 4, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Kredity podle kolegy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={creditsByColleague}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={{ stroke: 'hsl(var(--border))' }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={{ stroke: 'hsl(var(--border))' }} />
                  <Tooltip
                    formatter={(value: number) => [`${value} kreditů`, 'Kredity']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="credits" fill="hsl(var(--chart-5))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Přehled podle klientů</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Klient</TableHead>
                  <TableHead className="text-right">Balíček</TableHead>
                  <TableHead className="text-right">Čerpáno</TableHead>
                  <TableHead className="text-right">Využití</TableHead>
                  <TableHead className="text-right">Cena/kredit</TableHead>
                  <TableHead className="text-right">Tržby</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {creditsByClient.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Žádní klienti s Creative Boost v tomto období
                    </TableCell>
                  </TableRow>
                ) : (
                  creditsByClient.map((client) => (
                    <TableRow key={client.clientId}>
                      <TableCell className="font-medium">{client.brandName || client.clientName}</TableCell>
                      <TableCell className="text-right">{client.maxCredits} kr.</TableCell>
                      <TableCell className="text-right">{client.usedCredits} kr.</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={getUtilizationBadge(client.utilizationPercent)}>
                          {client.utilizationPercent.toFixed(0)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{client.pricePerCredit.toLocaleString()} Kč</TableCell>
                      <TableCell className="text-right font-medium">{client.revenue.toLocaleString()} Kč</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
