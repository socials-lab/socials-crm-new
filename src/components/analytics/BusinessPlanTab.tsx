import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Target, TrendingUp, TrendingDown, Edit2, Save, X, FileText, Calculator } from 'lucide-react';
import { format, startOfMonth } from 'date-fns';
import { cs } from 'date-fns/locale';
import { useCRMData } from '@/hooks/useCRMData';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { 
  getTargetForMonth, 
  calculateActualRevenue, 
  getStoredPlans,
  DEFAULT_TARGETS_2026,
  type RevenueSource 
} from '@/utils/businessPlanUtils';

interface MonthlyPlan {
  year: number;
  month: number;
  targetRevenue: number;
}

interface BusinessPlanTabProps {
  selectedYear: number;
  selectedMonth: number;
}

const STORAGE_KEY = 'crm-business-plan';

export function BusinessPlanTab({ selectedYear, selectedMonth }: BusinessPlanTabProps) {
  const { engagements, extraWorks, engagementServices, issuedInvoices } = useCRMData();
  
  // Load plans from localStorage
  const [plans, setPlans] = useState<MonthlyPlan[]>(() => getStoredPlans());
  
  const [editingMonth, setEditingMonth] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const savePlans = (newPlans: MonthlyPlan[]) => {
    setPlans(newPlans);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newPlans));
  };

  const setPlanForMonth = (year: number, month: number, targetRevenue: number) => {
    const existing = plans.filter(p => !(p.year === year && p.month === month));
    savePlans([...existing, { year, month, targetRevenue }]);
  };

  // Generate months for the year
  const monthsData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      
      // Use shared utility for target (checks localStorage then defaults)
      const target = getTargetForMonth(selectedYear, month);
      
      // Use shared utility for actual revenue calculation
      const { actual, source } = calculateActualRevenue(
        selectedYear, 
        month, 
        issuedInvoices || [], 
        engagements, 
        extraWorks || [], 
        engagementServices || []
      );
      
      const progress = target > 0 ? Math.min((actual / target) * 100, 100) : 0;
      const diff = actual - target;
      const diffPercent = target > 0 ? ((actual - target) / target) * 100 : 0;
      
      return {
        year: selectedYear,
        month,
        monthName: format(new Date(selectedYear, month - 1), 'LLLL', { locale: cs }),
        monthShort: format(new Date(selectedYear, month - 1), 'LLL', { locale: cs }),
        target,
        actual,
        source,
        progress,
        diff,
        diffPercent,
        isCurrentMonth: selectedYear === new Date().getFullYear() && month === new Date().getMonth() + 1,
        isPast: new Date(selectedYear, month - 1) < startOfMonth(new Date()),
      };
    });
  }, [selectedYear, plans, engagements, extraWorks, engagementServices, issuedInvoices]);

  // Summary for selected month
  const selectedMonthData = monthsData.find(m => m.month === selectedMonth);

  // Year totals
  const yearTotals = useMemo(() => {
    const totalTarget = monthsData.reduce((sum, m) => sum + m.target, 0);
    const totalActual = monthsData.filter(m => m.isPast || m.isCurrentMonth).reduce((sum, m) => sum + m.actual, 0);
    const yearProgress = totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0;
    
    return { totalTarget, totalActual, yearProgress };
  }, [monthsData]);

  const handleStartEdit = (year: number, month: number, currentValue: number) => {
    setEditingMonth(`${year}-${month}`);
    setEditValue(currentValue.toString());
  };

  const handleSaveEdit = (year: number, month: number) => {
    const value = parseInt(editValue) || 0;
    setPlanForMonth(year, month, value);
    setEditingMonth(null);
    setEditValue('');
  };

  const handleCancelEdit = () => {
    setEditingMonth(null);
    setEditValue('');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatShortCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    }
    return `${(amount / 1000).toFixed(0)}k`;
  };

  return (
    <div className="space-y-6">
      {/* Year Summary */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Roční plán {selectedYear}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Roční cíl</p>
              <p className="text-2xl font-bold">{formatCurrency(yearTotals.totalTarget)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Aktuální tržby</p>
              <p className="text-2xl font-bold">{formatCurrency(yearTotals.totalActual)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Plnění</p>
              <p className="text-2xl font-bold">{yearTotals.yearProgress.toFixed(1)}%</p>
            </div>
          </div>
          <Progress value={yearTotals.yearProgress} className="h-3" />
        </CardContent>
      </Card>

      {/* Trend Chart */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Trend plnění plánu</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={monthsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="monthShort" 
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                tickFormatter={(v) => formatShortCurrency(v)}
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                labelFormatter={(label) => `${label}`}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="target" 
                stroke="hsl(var(--muted-foreground))" 
                fillOpacity={1}
                fill="url(#colorTarget)"
                strokeWidth={2}
                name="Plán"
              />
              <Area 
                type="monotone" 
                dataKey="actual" 
                stroke="hsl(var(--primary))" 
                fillOpacity={1}
                fill="url(#colorActual)"
                strokeWidth={2}
                name="Skutečnost"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Selected Month Detail */}
      {selectedMonthData && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span className="capitalize">{selectedMonthData.monthName} {selectedYear}</span>
              <div className="flex items-center gap-2">
                {selectedMonthData.source === 'invoiced' ? (
                  <Badge variant="outline" className="text-xs flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    faktury
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs flex items-center gap-1">
                    <Calculator className="h-3 w-3" />
                    odhad
                  </Badge>
                )}
                {selectedMonthData.target > 0 && (
                  <Badge variant={selectedMonthData.diffPercent >= 0 ? 'default' : 'destructive'}>
                    {selectedMonthData.diffPercent >= 0 ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {selectedMonthData.diffPercent >= 0 ? '+' : ''}{selectedMonthData.diffPercent.toFixed(1)}%
                  </Badge>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Cíl</p>
                <p className="text-xl font-semibold">{formatCurrency(selectedMonthData.target)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Skutečnost</p>
                <p className="text-xl font-semibold">{formatCurrency(selectedMonthData.actual)}</p>
              </div>
            </div>
            {selectedMonthData.target > 0 && (
              <Progress value={selectedMonthData.progress} className="h-2" />
            )}
          </CardContent>
        </Card>
      )}

      {/* Monthly Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Měsíční plán</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {monthsData.map((m) => {
              const isEditing = editingMonth === `${m.year}-${m.month}`;
              
              return (
                <div 
                  key={m.month} 
                  className={`flex items-center gap-4 p-3 rounded-lg border ${
                    m.isCurrentMonth ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <div className="w-24 font-medium capitalize">{m.monthName.slice(0, 3)}</div>
                  
                  {/* Target input */}
                  <div className="flex-1 flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <Input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-32 h-8"
                          placeholder="Cíl v CZK"
                        />
                        <Button size="sm" variant="ghost" onClick={() => handleSaveEdit(m.year, m.month)}>
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className="text-sm text-muted-foreground w-28">
                          Cíl: {m.target > 0 ? formatCurrency(m.target) : '—'}
                        </span>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleStartEdit(m.year, m.month, m.target)}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </div>
                  
                  {/* Actual + source */}
                  <div className="w-36 flex items-center gap-2">
                    <span className="text-sm">{formatCurrency(m.actual)}</span>
                    {(m.isPast || m.isCurrentMonth) && m.actual > 0 && (
                      m.source === 'invoiced' ? (
                        <FileText className="h-3 w-3 text-muted-foreground" />
                      ) : (
                        <Calculator className="h-3 w-3 text-muted-foreground" />
                      )
                    )}
                  </div>
                  
                  {/* Progress */}
                  <div className="w-20">
                    {m.target > 0 ? (
                      <div className="flex items-center gap-2">
                        <Progress value={m.progress} className="h-2 flex-1" />
                        <span className={`text-xs font-medium ${
                          m.progress >= 100 ? 'text-green-600' : m.progress >= 80 ? 'text-amber-600' : 'text-red-600'
                        }`}>
                          {m.progress.toFixed(0)}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </div>
                  
                  {/* Status badge */}
                  <div className="w-24 text-right">
                    {m.target > 0 && (m.isPast || m.isCurrentMonth) && (
                      <Badge 
                        variant={m.diff >= 0 ? 'outline' : 'destructive'} 
                        className={`text-xs ${m.diff >= 0 ? 'text-green-600 border-green-300' : ''}`}
                      >
                        {m.diff >= 0 ? '+' : ''}{(m.diff / 1000).toFixed(0)}k
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
