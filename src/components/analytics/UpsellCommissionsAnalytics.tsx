import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { KPICard } from '@/components/shared/KPICard';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Coins, Users, Trophy, ArrowUp, ArrowDown, TrendingUp, Sparkles, FileText, Briefcase, AlertTriangle } from 'lucide-react';
import { useUpsellApprovals } from '@/hooks/useUpsellApprovals';
import { format, subMonths } from 'date-fns';
import { cs } from 'date-fns/locale';

interface UpsellCommissionsAnalyticsProps {
  periodStart: Date;
  periodEnd: Date;
  comparisonStart: Date;
  comparisonEnd: Date;
  periodLabel: string;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

function getMonthKeysBetween(start: Date, end: Date): Array<{ year: number; month: number }> {
  const keys: Array<{ year: number; month: number }> = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const endKey = new Date(end.getFullYear(), end.getMonth(), 1);

  while (cursor <= endKey) {
    keys.push({ year: cursor.getFullYear(), month: cursor.getMonth() + 1 });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return keys;
}

export function UpsellCommissionsAnalytics({
  periodStart,
  periodEnd,
  comparisonStart,
  comparisonEnd,
  periodLabel,
}: UpsellCommissionsAnalyticsProps) {
  const { getUpsellsForMonth } = useUpsellApprovals();

  const currentPeriodMonthKeys = useMemo(
    () => getMonthKeysBetween(periodStart, periodEnd),
    [periodStart, periodEnd]
  );
  const comparisonPeriodMonthKeys = useMemo(
    () => getMonthKeysBetween(comparisonStart, comparisonEnd),
    [comparisonStart, comparisonEnd]
  );

  const currentMonthUpsells = useMemo(
    () => currentPeriodMonthKeys.flatMap((key) => getUpsellsForMonth(key.year, key.month)),
    [currentPeriodMonthKeys, getUpsellsForMonth]
  );
  const hasUnsupportedCurrency = useMemo(
    () => currentMonthUpsells.some((upsell) => upsell.currency !== 'CZK'),
    [currentMonthUpsells],
  );

  const currentMonthStats = useMemo(() => {
    const total = currentMonthUpsells.reduce((sum, u) => sum + u.commissionAmount, 0);
    const approved = currentMonthUpsells.filter(u => u.isApproved).reduce((sum, u) => sum + u.commissionAmount, 0);
    const pending = total - approved;
    const count = currentMonthUpsells.length;

    // By type
    const extraWorkCount = currentMonthUpsells.filter(u => u.type === 'extra_work').length;
    const serviceCount = currentMonthUpsells.filter(u => u.type === 'service').length;

    const prevUpsells = comparisonPeriodMonthKeys.flatMap((key) => getUpsellsForMonth(key.year, key.month));
    const prevTotal = prevUpsells.reduce((sum, u) => sum + u.commissionAmount, 0);
    const change = prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : 0;

    return { total, approved, pending, count, change, extraWorkCount, serviceCount };
  }, [comparisonPeriodMonthKeys, currentMonthUpsells, getUpsellsForMonth]);

  // 12-month trend
  const upsellTrend = useMemo(() => {
    const anchorDate = new Date(periodEnd.getFullYear(), periodEnd.getMonth(), 1);
    return Array.from({ length: 12 }, (_, i) => {
      const date = subMonths(anchorDate, 11 - i);
      const y = date.getFullYear();
      const m = date.getMonth() + 1;
      
      const upsells = getUpsellsForMonth(y, m);
      const totalCommission = upsells.reduce((sum, u) => sum + u.commissionAmount, 0);
      const approvedCommission = upsells.filter(u => u.isApproved).reduce((sum, u) => sum + u.commissionAmount, 0);
      const pendingCommission = totalCommission - approvedCommission;

      return {
        month: format(date, 'MMM', { locale: cs }),
        fullMonth: format(date, 'LLLL yyyy', { locale: cs }),
        total: totalCommission,
        approved: approvedCommission,
        pending: pendingCommission,
        count: upsells.length,
      };
    });
  }, [getUpsellsForMonth, periodEnd]);

  // Top upsellers (last 6 months)
  const topUpsellers = useMemo(() => {
    const colleagueStats = new Map<string, { 
      id: string; 
      name: string; 
      totalAmount: number; 
      commissionAmount: number; 
      count: number;
      approvedCommission: number;
      extraWorkCount: number;
      serviceCount: number;
    }>();

    for (let i = 0; i < 6; i++) {
      const date = subMonths(new Date(periodEnd.getFullYear(), periodEnd.getMonth(), 1), i);
      const y = date.getFullYear();
      const m = date.getMonth() + 1;
      
      const upsells = getUpsellsForMonth(y, m);
      
      upsells.forEach(upsell => {
        const existing = colleagueStats.get(upsell.upsoldById) || {
          id: upsell.upsoldById,
          name: upsell.upsoldByName,
          totalAmount: 0,
          commissionAmount: 0,
          count: 0,
          approvedCommission: 0,
          extraWorkCount: 0,
          serviceCount: 0,
        };
        
        existing.totalAmount += upsell.amount;
        existing.commissionAmount += upsell.commissionAmount;
        existing.count += 1;
        if (upsell.isApproved) {
          existing.approvedCommission += upsell.commissionAmount;
        }
        if (upsell.type === 'extra_work') {
          existing.extraWorkCount += 1;
        } else {
          existing.serviceCount += 1;
        }
        
        colleagueStats.set(upsell.upsoldById, existing);
      });
    }

    return Array.from(colleagueStats.values())
      .sort((a, b) => b.commissionAmount - a.commissionAmount)
      .slice(0, 10);
  }, [getUpsellsForMonth, periodEnd]);

  // Upsell type distribution
  const typeDistribution = useMemo(() => {
    const extraWork = currentMonthUpsells.filter(u => u.type === 'extra_work');
    const services = currentMonthUpsells.filter(u => u.type === 'service');

    return [
      { name: 'Vícepráce', value: extraWork.reduce((sum, u) => sum + u.commissionAmount, 0), count: extraWork.length },
      { name: 'Nové služby', value: services.reduce((sum, u) => sum + u.commissionAmount, 0), count: services.length },
    ].filter(d => d.value > 0);
  }, [currentMonthUpsells]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Total paid in last 12 months
  const totalPaidYear = useMemo(() => {
    return upsellTrend.reduce((sum, m) => sum + m.approved, 0);
  }, [upsellTrend]);

  if (hasUnsupportedCurrency) {
    return (
      <Card className="border-amber-400/40 bg-amber-500/5">
        <CardContent className="pt-6 flex items-center gap-2 text-sm">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <span>
            Upsell analytics zatím nepodporuje kombinaci měn. Obsahuje data mimo CZK.
          </span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Provize v období"
          value={formatCurrency(currentMonthStats.total)}
          subtitle={
            <span className="flex items-center gap-1">
              {currentMonthStats.change >= 0 ? (
                <ArrowUp className="h-3 w-3 text-status-active" />
              ) : (
                <ArrowDown className="h-3 w-3 text-status-lost" />
              )}
              {Math.abs(currentMonthStats.change).toFixed(0)}% vs předchozí období
            </span>
          }
          icon={Coins}
        />
        <KPICard
          title="Schváleno k výplatě"
          value={formatCurrency(currentMonthStats.approved)}
          subtitle={`Čeká: ${formatCurrency(currentMonthStats.pending)}`}
          icon={TrendingUp}
        />
        <KPICard
          title="Vyplaceno za rok"
          value={formatCurrency(totalPaidYear)}
          subtitle="posledních 12 měsíců"
          icon={Coins}
        />
        <KPICard
          title="Počet upsellů"
          value={currentMonthStats.count.toString()}
          subtitle={`${currentMonthStats.extraWorkCount} víceprací, ${currentMonthStats.serviceCount} služeb (${periodLabel})`}
          icon={Users}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Commission Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Coins className="h-4 w-4 text-primary" />
              Vyplacené provize po měsících
            </CardTitle>
            <CardDescription>Posledních 12 měsíců</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={upsellTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} className="text-xs" />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(label, payload) => {
                      if (payload?.[0]?.payload?.fullMonth) {
                        return payload[0].payload.fullMonth.charAt(0).toUpperCase() + payload[0].payload.fullMonth.slice(1);
                      }
                      return label;
                    }}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="approved" name="Schváleno" fill="hsl(var(--primary))" stackId="a" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="pending" name="Čeká na schválení" fill="hsl(var(--chart-4))" stackId="a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Upsell Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Rozložení provizí podle typu
            </CardTitle>
            <CardDescription>{periodLabel}</CardDescription>
          </CardHeader>
          <CardContent>
            {typeDistribution.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <Coins className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p>Žádné upselly v tomto období</p>
              </div>
            ) : (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={typeDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {typeDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="flex justify-center gap-6 mt-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <span className="text-sm">{currentMonthStats.extraWorkCount} víceprací</span>
              </div>
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-chart-2" />
                <span className="text-sm">{currentMonthStats.serviceCount} služeb</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Upsellers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            Top Upsellers (posledních 6 měsíců)
          </CardTitle>
          <CardDescription>Kolegové s nejvyššími provizemi za upselly</CardDescription>
        </CardHeader>
        <CardContent>
          {topUpsellers.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p>Zatím žádné upselly</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Kolega</TableHead>
                    <TableHead className="text-right">Vícepráce</TableHead>
                    <TableHead className="text-right">Služby</TableHead>
                    <TableHead className="text-right">Celkem upsellů</TableHead>
                    <TableHead className="text-right">Objem prodeje</TableHead>
                    <TableHead className="text-right">Provize celkem</TableHead>
                    <TableHead className="text-right">Vyplaceno</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topUpsellers.map((seller, index) => (
                    <TableRow key={seller.id}>
                      <TableCell>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                      </TableCell>
                      <TableCell className="font-medium">{seller.name}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{seller.extraWorkCount}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{seller.serviceCount}</TableCell>
                      <TableCell className="text-right font-medium">{seller.count}</TableCell>
                      <TableCell className="text-right">{formatCurrency(seller.totalAmount)}</TableCell>
                      <TableCell className="text-right font-medium text-primary">
                        {formatCurrency(seller.commissionAmount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className="bg-status-active/10 text-status-active border-status-active/20">
                          {formatCurrency(seller.approvedCommission)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Month Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Coins className="h-4 w-4" />
            Detail upsellů v období
          </CardTitle>
            <CardDescription>{periodLabel}</CardDescription>
        </CardHeader>
        <CardContent>
          {currentMonthUpsells.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p>Žádné upselly v tomto období</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Typ</TableHead>
                    <TableHead>Položka</TableHead>
                    <TableHead>Klient</TableHead>
                    <TableHead>Prodal</TableHead>
                    <TableHead className="text-right">Částka</TableHead>
                    <TableHead className="text-right">Provize</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentMonthUpsells.map((upsell) => (
                    <TableRow key={`${upsell.type}-${upsell.id}`}>
                      <TableCell>
                        {upsell.type === 'extra_work' ? (
                          <Badge variant="outline" className="bg-chart-2/10 text-chart-2 border-chart-2/20">
                            <FileText className="h-3 w-3 mr-1" />
                            Vícepráce
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-chart-3/10 text-chart-3 border-chart-3/20">
                            <Sparkles className="h-3 w-3 mr-1" />
                            Služba
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-medium max-w-[200px] truncate">{upsell.itemName}</TableCell>
                      <TableCell>{upsell.brandName}</TableCell>
                      <TableCell>{upsell.upsoldByName}</TableCell>
                      <TableCell className="text-right">{formatCurrency(upsell.amount)}</TableCell>
                      <TableCell className="text-right font-medium text-primary">
                        {formatCurrency(upsell.commissionAmount)}
                      </TableCell>
                      <TableCell>
                        {upsell.isApproved ? (
                          <Badge className="bg-status-active/10 text-status-active border-status-active/20">
                            ✅ Schváleno
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-status-paused/10 text-status-paused border-status-paused/20">
                            Čeká
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
