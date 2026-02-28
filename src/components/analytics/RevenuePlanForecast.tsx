import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Target,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Plus,
  Trash2,
} from 'lucide-react';
import { format, isSameMonth, parseISO, startOfMonth } from 'date-fns';
import { cs } from 'date-fns/locale';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useCRMData } from '@/hooks/useCRMData';
import { usePlannedEngagements } from '@/hooks/usePlannedEngagements';
import { useRevenueTargets } from '@/hooks/useRevenueTargets';
import { calculateActualRevenue } from '@/utils/businessPlanUtils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface RevenuePlanForecastProps {
  selectedYear: number;
  selectedMonth: number;
}

export function RevenuePlanForecast({ selectedYear, selectedMonth }: RevenuePlanForecastProps) {
  const {
    engagements,
    colleagues,
    assignments,
    issuedInvoices,
    extraWorks,
    engagementServices,
  } = useCRMData();
  const { plannedEngagements, addPlannedEngagement, deletePlannedEngagement } = usePlannedEngagements();
  const { getTargetForMonth, upsertTargets } = useRevenueTargets();

  const [draftTargets, setDraftTargets] = useState<Record<number, string>>({});
  const [newPlan, setNewPlan] = useState({
    client_name: '',
    name: '',
    monthly_fee: '',
    start_date: format(startOfMonth(new Date(selectedYear, selectedMonth - 1)), 'yyyy-MM-dd'),
    probability_percent: 100,
    assigned_colleague_ids: [] as string[],
    notes: '',
  });

  function formatCurrency(value: number) {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  function formatCompact(value: number) {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
    return value.toLocaleString('cs-CZ');
  }

  const activeRetainers = useMemo(() => {
    const now = new Date(selectedYear, selectedMonth - 1, 1);
    return engagements.filter((e) => {
      if (e.status !== 'active' || e.type !== 'retainer' || !e.start_date) return false;
      const start = parseISO(e.start_date);
      const end = e.end_date ? parseISO(e.end_date) : null;
      return start <= now && (!end || end >= now);
    });
  }, [engagements, selectedYear, selectedMonth]);

  const currentMRR = useMemo(
    () => activeRetainers.reduce((sum, e) => sum + (e.monthly_fee || 0), 0),
    [activeRetainers]
  );

  const monthsData = useMemo(() => {
    return Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      const target = getTargetForMonth(selectedYear, month);
      const actualData = calculateActualRevenue(
        selectedYear,
        month,
        issuedInvoices,
        engagements,
        extraWorks,
        engagementServices
      );

      const date = new Date(selectedYear, month - 1, 1);
      const isPastOrCurrent = date <= new Date(selectedYear, selectedMonth - 1, 1);

      return {
        month,
        monthName: format(date, 'LLLL', { locale: cs }),
        monthShort: format(date, 'LLL', { locale: cs }),
        target,
        actual: actualData.actual,
        source: actualData.source,
        isPastOrCurrent,
      };
    });
  }, [
    selectedYear,
    selectedMonth,
    getTargetForMonth,
    issuedInvoices,
    engagements,
    extraWorks,
    engagementServices,
  ]);

  const missingTargetMonths = monthsData.filter((m) => m.target === null).map((m) => m.month);

  const plannedForYear = useMemo(() => {
    return plannedEngagements.filter((item) => parseISO(item.start_date).getFullYear() === selectedYear);
  }, [plannedEngagements, selectedYear]);

  const chartData = useMemo(() => {
    return monthsData.map((m) => {
      const monthDate = new Date(selectedYear, m.month - 1, 1);
      const churnForMonth = engagements
        .filter((e) => e.end_date && isSameMonth(parseISO(e.end_date), monthDate))
        .reduce((sum, e) => sum + (e.monthly_fee || 0), 0);
      const plannedForMonth = plannedForYear
        .filter((p) => isSameMonth(parseISO(p.start_date), monthDate))
        .reduce((sum, p) => sum + p.monthly_fee * (p.probability_percent / 100), 0);
      const startsForMonth = engagements
        .filter((e) => e.start_date && isSameMonth(parseISO(e.start_date), monthDate))
        .reduce((sum, e) => sum + (e.monthly_fee || 0), 0);

      const projection = currentMRR - churnForMonth + plannedForMonth + startsForMonth;

      return {
        month: m.monthShort,
        target: m.target ?? null,
        actual: m.isPastOrCurrent ? m.actual : null,
        projection: !m.isPastOrCurrent ? projection : null,
      };
    });
  }, [monthsData, selectedYear, engagements, plannedForYear, currentMRR]);

  const yearTotals = useMemo(() => {
    const withTargets = monthsData.filter((m) => m.target !== null);
    const totalTarget = withTargets.reduce((sum, m) => sum + (m.target || 0), 0);
    const totalActual = withTargets
      .filter((m) => m.isPastOrCurrent)
      .reduce((sum, m) => sum + m.actual, 0);
    const progress = totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0;
    return { totalTarget, totalActual, progress };
  }, [monthsData]);

  const monthStart = startOfMonth(new Date(selectedYear, selectedMonth - 1));
  const endingThisMonth = engagements.filter(
    (e) => e.end_date && isSameMonth(parseISO(e.end_date), monthStart)
  );
  const startingThisMonth = engagements.filter(
    (e) => e.start_date && isSameMonth(parseISO(e.start_date), monthStart)
  );
  const plannedThisMonth = plannedEngagements.filter((p) =>
    isSameMonth(parseISO(p.start_date), monthStart)
  );

  async function handleSaveTargets() {
    const rows = Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      const raw = draftTargets[month];
      const target = raw !== undefined ? Number(raw) : getTargetForMonth(selectedYear, month);
      if (target === null || Number.isNaN(target)) return null;
      return { year: selectedYear, month, target_revenue: target };
    }).filter((row): row is { year: number; month: number; target_revenue: number } => row !== null);

    await upsertTargets(rows);
  }

  async function handleAddPlannedEngagement() {
    if (!newPlan.client_name || !newPlan.name || !newPlan.monthly_fee || !newPlan.start_date) {
      return;
    }
    await addPlannedEngagement({
      client_name: newPlan.client_name,
      name: newPlan.name,
      monthly_fee: Number(newPlan.monthly_fee),
      start_date: new Date(newPlan.start_date).toISOString(),
      probability_percent: newPlan.probability_percent,
      assigned_colleague_ids: newPlan.assigned_colleague_ids,
      notes: newPlan.notes,
      lead_id: null,
    });

    setNewPlan({
      client_name: '',
      name: '',
      monthly_fee: '',
      start_date: format(startOfMonth(new Date(selectedYear, selectedMonth - 1)), 'yyyy-MM-dd'),
      probability_percent: 100,
      assigned_colleague_ids: [],
      notes: '',
    });
  }

  return (
    <div className="space-y-6">
      {missingTargetMonths.length > 0 && (
        <Card className="border-amber-400/40 bg-amber-500/5">
          <CardContent className="pt-6 flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span>
              Chybí měsíční cíle pro měsíce: {missingTargetMonths.join(', ')}.
            </span>
          </CardContent>
        </Card>
      )}

      <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-transparent">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Plán & Forecast {selectedYear}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            <div className="p-3 rounded-lg bg-background border">
              <p className="text-sm text-muted-foreground">Roční cíl</p>
              <p className="text-2xl font-bold">{formatCompact(yearTotals.totalTarget)}</p>
            </div>
            <div className="p-3 rounded-lg bg-background border">
              <p className="text-sm text-muted-foreground">YTD tržby</p>
              <p className="text-2xl font-bold">{formatCompact(yearTotals.totalActual)}</p>
            </div>
            <div className="p-3 rounded-lg bg-background border">
              <p className={`text-sm text-muted-foreground`}>Plnění</p>
              <p className="text-2xl font-bold">{yearTotals.progress.toFixed(1)}%</p>
            </div>
          </div>
          <Progress value={Math.min(100, yearTotals.progress)} className="h-3" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            📈 Trend tržeb
            <Badge variant="outline" className="font-normal">skutečnost + projekce</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={{ stroke: 'hsl(var(--border))' }} />
              <YAxis tickFormatter={(v) => formatCompact(v)} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={{ stroke: 'hsl(var(--border))' }} />
              <Tooltip
                formatter={(value: number, name: string) => {
                  if (name === 'target') return [formatCurrency(value), 'Cíl'];
                  if (name === 'actual') return [formatCurrency(value), 'Skutečnost'];
                  return [formatCurrency(value), 'Projekce'];
                }}
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Area type="monotone" dataKey="target" stroke="hsl(var(--muted-foreground))" fillOpacity={0.08} fill="hsl(var(--muted-foreground))" strokeDasharray="5 5" />
              <Area type="monotone" dataKey="actual" stroke="hsl(var(--primary))" fillOpacity={0.2} fill="hsl(var(--primary))" connectNulls={false} />
              <Area type="monotone" dataKey="projection" stroke="hsl(142 76% 36%)" fillOpacity={0.15} fill="hsl(142 76% 36%)" strokeDasharray="3 3" connectNulls={false} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-destructive" />
              Odchody (churn)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {endingThisMonth.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Žádné zakázky nekončí tento měsíc</p>
            ) : endingThisMonth.map((eng) => (
              <div key={eng.id} className="flex items-center justify-between p-3 rounded-lg border bg-destructive/5">
                <div className="text-sm">{eng.name}</div>
                <span className="font-medium text-destructive">-{formatCompact(eng.monthly_fee || 0)}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              Příchody (new business)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[...startingThisMonth, ...plannedThisMonth].length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Žádné nové zakázky tento měsíc</p>
            ) : (
              <>
                {startingThisMonth.map((eng) => (
                  <div key={`start-${eng.id}`} className="flex items-center justify-between p-3 rounded-lg border bg-emerald-500/10">
                    <div className="text-sm">{eng.name}</div>
                    <span className="font-medium text-emerald-600">+{formatCompact(eng.monthly_fee || 0)}</span>
                  </div>
                ))}
                {plannedThisMonth.map((plan) => (
                  <div key={`plan-${plan.id}`} className="flex items-center justify-between p-3 rounded-lg border bg-emerald-500/5">
                    <div className="text-sm">
                      {plan.client_name} - {plan.name} ({plan.probability_percent}%)
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-emerald-600">+{formatCompact(plan.monthly_fee)}</span>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deletePlannedEngagement(plan.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Přidat plánovanou zakázku</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Název klienta</Label>
              <Input value={newPlan.client_name} onChange={(e) => setNewPlan((p) => ({ ...p, client_name: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Název zakázky</Label>
              <Input value={newPlan.name} onChange={(e) => setNewPlan((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Měsíční fee</Label>
              <Input type="number" value={newPlan.monthly_fee} onChange={(e) => setNewPlan((p) => ({ ...p, monthly_fee: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Start</Label>
              <Input type="date" value={newPlan.start_date} onChange={(e) => setNewPlan((p) => ({ ...p, start_date: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Pravděpodobnost (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={newPlan.probability_percent}
                onChange={(e) => setNewPlan((p) => ({ ...p, probability_percent: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Poznámky</Label>
              <Input value={newPlan.notes} onChange={(e) => setNewPlan((p) => ({ ...p, notes: e.target.value }))} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Přiřazení kolegové</Label>
            <div className="flex flex-wrap gap-2">
              {colleagues.filter((c) => c.status === 'active').map((c) => {
                const selected = newPlan.assigned_colleague_ids.includes(c.id);
                return (
                  <Button
                    key={c.id}
                    type="button"
                    variant={selected ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setNewPlan((p) => ({
                        ...p,
                        assigned_colleague_ids: selected
                          ? p.assigned_colleague_ids.filter((id) => id !== c.id)
                          : [...p.assigned_colleague_ids, c.id],
                      }));
                    }}
                  >
                    {c.full_name}
                  </Button>
                );
              })}
            </div>
          </div>

          <Button onClick={handleAddPlannedEngagement} className="gap-2">
            <Plus className="h-4 w-4" />
            Přidat plánovanou zakázku
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Měsíční cíle</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Měsíc</TableHead>
                <TableHead className="text-right">Cíl</TableHead>
                <TableHead className="text-right">Skutečnost</TableHead>
                <TableHead className="text-right">Plnění</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monthsData.map((m) => {
                const inputValue = draftTargets[m.month] ?? (m.target !== null ? String(m.target) : '');
                const effectiveTarget = inputValue ? Number(inputValue) : null;
                const fulfillment = effectiveTarget && effectiveTarget > 0 ? (m.actual / effectiveTarget) * 100 : null;
                return (
                  <TableRow key={m.month}>
                    <TableCell className="capitalize">{m.monthName}</TableCell>
                    <TableCell className="text-right">
                      <Input
                        className="w-32 ml-auto"
                        value={inputValue}
                        placeholder="chybí cíl"
                        onChange={(e) => setDraftTargets((prev) => ({ ...prev, [m.month]: e.target.value.replace(/[^0-9]/g, '') }))}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCompact(m.actual)}{' '}
                      <span className="text-xs text-muted-foreground">
                        ({m.source === 'invoiced' ? 'faktury' : 'odhad'})
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {fulfillment === null ? (
                        <Badge variant="destructive">Bez cíle</Badge>
                      ) : (
                        <Badge variant={fulfillment >= 100 ? 'outline' : fulfillment >= 90 ? 'secondary' : 'destructive'}>
                          {fulfillment.toFixed(0)}%
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <div className="mt-4 flex justify-end">
            <Button onClick={handleSaveTargets}>Uložit měsíční cíle</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
