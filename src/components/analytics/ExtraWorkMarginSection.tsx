import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  Line,
  ComposedChart
} from 'recharts';
import { TrendingUp, FileText, Briefcase } from 'lucide-react';
import { useCRMData } from '@/hooks/useCRMData';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { cs } from 'date-fns/locale';

interface ExtraWorkMarginSectionProps {
  year: number;
  month: number;
}

export function ExtraWorkMarginSection({ year, month }: ExtraWorkMarginSectionProps) {
  const { extraWorks, getClientById, getColleagueById } = useCRMData();

  // Extra work margin data for current month
  const extraWorkMarginData = useMemo(() => {
    const monthStart = startOfMonth(new Date(year, month - 1));
    const monthEnd = endOfMonth(new Date(year, month - 1));

    const monthExtraWorks = extraWorks.filter(ew => {
      const workDate = parseISO(ew.work_date);
      return isWithinInterval(workDate, { start: monthStart, end: monthEnd });
    });

    const extraWorksWithMargin = monthExtraWorks.map(ew => {
      const colleague = getColleagueById(ew.colleague_id);
      const client = getClientById(ew.client_id);
      
      const hourlyRate = colleague?.internal_hourly_cost || 500;
      const cost = ew.hours_worked ? ew.hours_worked * hourlyRate : ew.amount * 0.5;
      
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

    return {
      extraWorks: extraWorksWithMargin,
      totalRevenue,
      totalCost,
      totalMargin,
      avgMarginPercent,
      count: extraWorksWithMargin.length,
    };
  }, [extraWorks, year, month, getClientById, getColleagueById]);

  // 12-month trend
  const extraWorkMarginTrend = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const date = subMonths(new Date(year, month - 1), 11 - i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);

      const monthExtraWorks = extraWorks.filter(ew => {
        const workDate = parseISO(ew.work_date);
        return isWithinInterval(workDate, { start: monthStart, end: monthEnd });
      });

      let revenue = 0;
      let cost = 0;

      monthExtraWorks.forEach(ew => {
        const colleague = getColleagueById(ew.colleague_id);
        const hourlyRate = colleague?.internal_hourly_cost || 500;
        const ewCost = ew.hours_worked ? ew.hours_worked * hourlyRate : ew.amount * 0.5;
        
        revenue += ew.amount;
        cost += ewCost;
      });

      const margin = revenue - cost;
      const marginPercent = revenue > 0 ? (margin / revenue) * 100 : 0;

      return {
        month: format(date, 'MMM', { locale: cs }),
        revenue,
        cost,
        margin,
        marginPercent: Math.round(marginPercent),
      };
    });
  }, [extraWorks, year, month, getColleagueById]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getMarginBadgeColor = (percent: number) => {
    if (percent >= 40) return 'bg-status-active/10 text-status-active border-status-active/20';
    if (percent >= 20) return 'bg-status-paused/10 text-status-paused border-status-paused/20';
    return 'bg-status-lost/10 text-status-lost border-status-lost/20';
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Marže víceprací</p>
              <p className="text-xl font-bold">{formatCurrency(extraWorkMarginData.totalMargin)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-chart-2/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-chart-2" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Objem víceprací</p>
              <p className="text-xl font-bold">{formatCurrency(extraWorkMarginData.totalRevenue)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-chart-3/10 flex items-center justify-center">
              <Briefcase className="h-5 w-5 text-chart-3" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Počet</p>
              <p className="text-xl font-bold">{extraWorkMarginData.count}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-chart-4/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-chart-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Prům. marže</p>
              <p className="text-xl font-bold">{extraWorkMarginData.avgMarginPercent.toFixed(0)}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Vývoj marže víceprací
          </CardTitle>
          <CardDescription>Posledních 12 měsíců</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[280px]">
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
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
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

      {/* Detail Table */}
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
                  {extraWorkMarginData.extraWorks.slice(0, 15).map((ew) => (
                    <TableRow key={ew.id}>
                      <TableCell className="font-medium max-w-[200px] truncate">{ew.name}</TableCell>
                      <TableCell>{ew.clientName}</TableCell>
                      <TableCell>{ew.colleagueName}</TableCell>
                      <TableCell className="text-right">{ew.hoursWorked || '-'}</TableCell>
                      <TableCell className="text-right">{formatCurrency(ew.amount)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{formatCurrency(ew.cost)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(ew.margin)}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className={getMarginBadgeColor(ew.marginPercent)}>
                          {ew.marginPercent.toFixed(0)}%
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
    </div>
  );
}
