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
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  ComposedChart
} from 'recharts';
import { Coins, TrendingUp, Users, Briefcase, FileText, Trophy, ArrowUp, ArrowDown } from 'lucide-react';
import { useCRMData } from '@/hooks/useCRMData';
import { useUpsellApprovals } from '@/hooks/useUpsellApprovals';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { cs } from 'date-fns/locale';

interface UpsellsExtraWorkAnalyticsProps {
  year: number;
  month: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export function UpsellsExtraWorkAnalytics({ year, month }: UpsellsExtraWorkAnalyticsProps) {
  const { extraWorks, colleagues, getClientById, getColleagueById } = useCRMData();
  const { getUpsellsForMonth } = useUpsellApprovals();

  // =====================================================
  // EXTRA WORK MARGIN CALCULATIONS
  // =====================================================
  const extraWorkMarginData = useMemo(() => {
    const monthStart = startOfMonth(new Date(year, month - 1));
    const monthEnd = endOfMonth(new Date(year, month - 1));

    const monthExtraWorks = extraWorks.filter(ew => {
      const workDate = parseISO(ew.work_date);
      return isWithinInterval(workDate, { start: monthStart, end: monthEnd });
    });

    // Calculate margin per extra work
    // Margin = amount - (hours_worked * colleague's internal_hourly_cost)
    const extraWorksWithMargin = monthExtraWorks.map(ew => {
      const colleague = getColleagueById(ew.colleague_id);
      const client = getClientById(ew.client_id);
      
      // Cost = hours worked * colleague's internal hourly rate (or use the hourly_rate from extra work if set)
      const hourlyRate = colleague?.internal_hourly_cost || 500;
      const cost = ew.hours_worked ? ew.hours_worked * hourlyRate : ew.amount * 0.5; // Estimate 50% cost if no hours
      
      const margin = ew.amount - cost;
      const marginPercent = ew.amount > 0 ? (margin / ew.amount) * 100 : 0;

      return {
        id: ew.id,
        name: ew.name,
        clientName: client?.brand_name || client?.name || 'Neznámý',
        colleagueName: colleague?.full_name || 'Neznámý',
        amount: ew.amount,
        cost,
        margin,
        marginPercent,
        status: ew.status,
        hoursWorked: ew.hours_worked,
      };
    });

    const totalRevenue = extraWorksWithMargin.reduce((sum, ew) => sum + ew.amount, 0);
    const totalCost = extraWorksWithMargin.reduce((sum, ew) => sum + ew.cost, 0);
    const totalMargin = totalRevenue - totalCost;
    const avgMarginPercent = totalRevenue > 0 ? (totalMargin / totalRevenue) * 100 : 0;

    // Group by status
    const byStatus = {
      pending_approval: extraWorksWithMargin.filter(ew => ew.status === 'pending_approval'),
      in_progress: extraWorksWithMargin.filter(ew => ew.status === 'in_progress'),
      ready_to_invoice: extraWorksWithMargin.filter(ew => ew.status === 'ready_to_invoice'),
      invoiced: extraWorksWithMargin.filter(ew => ew.status === 'invoiced'),
    };

    return {
      extraWorks: extraWorksWithMargin,
      totalRevenue,
      totalCost,
      totalMargin,
      avgMarginPercent,
      byStatus,
      count: extraWorksWithMargin.length,
    };
  }, [extraWorks, year, month, getClientById, getColleagueById]);

  // =====================================================
  // UPSELL COMMISSIONS BY MONTH (LAST 12 MONTHS)
  // =====================================================
  const upsellTrend = useMemo(() => {
    const trend = Array.from({ length: 12 }, (_, i) => {
      const date = subMonths(new Date(year, month - 1), 11 - i);
      const y = date.getFullYear();
      const m = date.getMonth() + 1;
      
      const upsells = getUpsellsForMonth(y, m);
      const totalCommission = upsells.reduce((sum, u) => sum + u.commissionAmount, 0);
      const approvedCommission = upsells
        .filter(u => u.isApproved)
        .reduce((sum, u) => sum + u.commissionAmount, 0);
      const pendingCommission = totalCommission - approvedCommission;

      return {
        month: format(date, 'MMM', { locale: cs }),
        fullMonth: format(date, 'LLLL yyyy', { locale: cs }),
        year: y,
        monthNum: m,
        total: totalCommission,
        approved: approvedCommission,
        pending: pendingCommission,
        count: upsells.length,
      };
    });

    return trend;
  }, [year, month, getUpsellsForMonth]);

  // =====================================================
  // TOP UPSELLERS (COLLEAGUES)
  // =====================================================
  const topUpsellers = useMemo(() => {
    // Aggregate all upsells from last 6 months
    const colleagueStats = new Map<string, { 
      id: string; 
      name: string; 
      totalAmount: number; 
      commissionAmount: number; 
      count: number;
      approvedCommission: number;
    }>();

    for (let i = 0; i < 6; i++) {
      const date = subMonths(new Date(year, month - 1), i);
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
        };
        
        existing.totalAmount += upsell.amount;
        existing.commissionAmount += upsell.commissionAmount;
        existing.count += 1;
        if (upsell.isApproved) {
          existing.approvedCommission += upsell.commissionAmount;
        }
        
        colleagueStats.set(upsell.upsoldById, existing);
      });
    }

    return Array.from(colleagueStats.values())
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 10);
  }, [year, month, getUpsellsForMonth]);

  // Current month upsells
  const currentMonthUpsells = useMemo(() => {
    return getUpsellsForMonth(year, month);
  }, [year, month, getUpsellsForMonth]);

  const currentMonthStats = useMemo(() => {
    const total = currentMonthUpsells.reduce((sum, u) => sum + u.commissionAmount, 0);
    const approved = currentMonthUpsells.filter(u => u.isApproved).reduce((sum, u) => sum + u.commissionAmount, 0);
    const pending = total - approved;
    const count = currentMonthUpsells.length;

    // Previous month for comparison
    const prevDate = subMonths(new Date(year, month - 1), 1);
    const prevUpsells = getUpsellsForMonth(prevDate.getFullYear(), prevDate.getMonth() + 1);
    const prevTotal = prevUpsells.reduce((sum, u) => sum + u.commissionAmount, 0);
    const change = prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : 0;

    return { total, approved, pending, count, change };
  }, [currentMonthUpsells, year, month, getUpsellsForMonth]);

  // Extra work margin trend (last 12 months)
  const extraWorkMarginTrend = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const date = subMonths(new Date(year, month - 1), 11 - i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);

      const monthExtraWorks = extraWorks.filter(ew => {
        const workDate = parseISO(ew.work_date);
        return isWithinInterval(workDate, { start: monthStart, end: monthEnd });
      });

      const revenue = monthExtraWorks.reduce((sum, ew) => sum + ew.amount, 0);
      // Estimate cost at 50% for simplicity in trend view
      const cost = revenue * 0.5;
      const margin = revenue - cost;
      const marginPercent = revenue > 0 ? (margin / revenue) * 100 : 0;

      return {
        month: format(date, 'MMM', { locale: cs }),
        revenue,
        margin,
        marginPercent: Math.round(marginPercent),
      };
    });
  }, [extraWorks, year, month]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Marže víceprací"
          value={formatCurrency(extraWorkMarginData.totalMargin)}
          subtitle={`${extraWorkMarginData.avgMarginPercent.toFixed(0)}% průměrná marže`}
          icon={TrendingUp}
        />
        <KPICard
          title="Objem víceprací"
          value={formatCurrency(extraWorkMarginData.totalRevenue)}
          subtitle={`${extraWorkMarginData.count} položek`}
          icon={FileText}
        />
        <KPICard
          title="Provize tento měsíc"
          value={formatCurrency(currentMonthStats.total)}
          subtitle={
            <span className="flex items-center gap-1">
              {currentMonthStats.change >= 0 ? (
                <ArrowUp className="h-3 w-3 text-status-active" />
              ) : (
                <ArrowDown className="h-3 w-3 text-status-lost" />
              )}
              {Math.abs(currentMonthStats.change).toFixed(0)}% vs minulý měsíc
            </span>
          }
          icon={Coins}
        />
        <KPICard
          title="Aktivní upsellers"
          value={topUpsellers.length.toString()}
          subtitle={`${currentMonthStats.count} upsellů tento měsíc`}
          icon={Users}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Extra Work Margin Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Vývoj marže víceprací
            </CardTitle>
            <CardDescription>Posledních 12 měsíců</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={extraWorkMarginTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis yAxisId="left" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} className="text-xs" />
                  <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `${v}%`} className="text-xs" />
                  <Tooltip 
                    formatter={(value: number, name: string) => {
                      if (name === 'Marže %') return `${value}%`;
                      return formatCurrency(value);
                    }}
                  />
                  <Bar yAxisId="left" dataKey="revenue" name="Objem" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="left" dataKey="margin" name="Marže" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="marginPercent" name="Marže %" stroke="hsl(var(--chart-4))" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Upsell Commissions Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Coins className="h-4 w-4 text-primary" />
              Vyplacené provize po měsících
            </CardTitle>
            <CardDescription>Posledních 12 měsíců</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
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
                  />
                  <Legend />
                  <Bar dataKey="approved" name="Schváleno" fill="hsl(var(--primary))" stackId="a" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="pending" name="Čeká na schválení" fill="hsl(var(--chart-4))" stackId="a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
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
          <CardDescription>Kolegové s nejvyšším objemem prodaných víceprací a služeb</CardDescription>
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
                    <TableHead className="text-right">Počet upsellů</TableHead>
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
                      <TableCell className="text-right">{seller.count}</TableCell>
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

      {/* Extra Work Details with Margin */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Detail víceprací s marží
          </CardTitle>
          <CardDescription>Aktuální měsíc</CardDescription>
        </CardHeader>
        <CardContent>
          {extraWorkMarginData.extraWorks.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p>Žádné vícepráce v tomto měsíci</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vícepráce</TableHead>
                    <TableHead>Klient</TableHead>
                    <TableHead>Kolega</TableHead>
                    <TableHead className="text-right">Hodiny</TableHead>
                    <TableHead className="text-right">Částka</TableHead>
                    <TableHead className="text-right">Náklady</TableHead>
                    <TableHead className="text-right">Marže</TableHead>
                    <TableHead className="text-right">Marže %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {extraWorkMarginData.extraWorks.slice(0, 10).map((ew) => (
                    <TableRow key={ew.id}>
                      <TableCell className="font-medium max-w-[200px] truncate">{ew.name}</TableCell>
                      <TableCell>{ew.clientName}</TableCell>
                      <TableCell>{ew.colleagueName}</TableCell>
                      <TableCell className="text-right">{ew.hoursWorked || '-'}</TableCell>
                      <TableCell className="text-right">{formatCurrency(ew.amount)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{formatCurrency(ew.cost)}</TableCell>
                      <TableCell className="text-right font-medium">
                        <span className={ew.margin >= 0 ? 'text-status-active' : 'text-status-lost'}>
                          {formatCurrency(ew.margin)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge 
                          variant="outline" 
                          className={
                            ew.marginPercent >= 50 
                              ? 'bg-status-active/10 text-status-active border-status-active/20'
                              : ew.marginPercent >= 30
                              ? 'bg-status-paused/10 text-status-paused border-status-paused/20'
                              : 'bg-status-lost/10 text-status-lost border-status-lost/20'
                          }
                        >
                          {ew.marginPercent.toFixed(0)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {extraWorkMarginData.extraWorks.length > 10 && (
                <p className="text-sm text-muted-foreground text-center mt-4">
                  +{extraWorkMarginData.extraWorks.length - 10} dalších položek
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
