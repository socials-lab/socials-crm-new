import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Target, TrendingUp, TrendingDown, Edit2, Save, X } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { cs } from 'date-fns/locale';
import { useCRMData } from '@/hooks/useCRMData';

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
  const { engagements, extraWorks, engagementServices } = useCRMData();
  
  // Load plans from localStorage
  const [plans, setPlans] = useState<MonthlyPlan[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  
  const [editingMonth, setEditingMonth] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const savePlans = (newPlans: MonthlyPlan[]) => {
    setPlans(newPlans);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newPlans));
  };

  const getPlanForMonth = (year: number, month: number) => {
    return plans.find(p => p.year === year && p.month === month);
  };

  const setPlanForMonth = (year: number, month: number, targetRevenue: number) => {
    const existing = plans.filter(p => !(p.year === year && p.month === month));
    savePlans([...existing, { year, month, targetRevenue }]);
  };

  const calculateActualRevenue = (year: number, month: number) => {
    const periodStart = startOfMonth(new Date(year, month - 1));
    const periodEnd = endOfMonth(new Date(year, month - 1));

    // Retainer revenue from active engagements
    const retainerRevenue = engagements
      .filter(e => {
        if (e.status !== 'active' || e.type !== 'retainer') return false;
        const start = e.start_date ? new Date(e.start_date) : null;
        const end = e.end_date ? new Date(e.end_date) : null;
        if (!start) return false;
        return start <= periodEnd && (!end || end >= periodStart);
      })
      .reduce((sum, e) => sum + (e.monthly_fee || 0), 0);

    // Extra works revenue
    const extraWorksRevenue = extraWorks
      .filter(ew => {
        const workDate = new Date(ew.work_date);
        return workDate >= periodStart && workDate <= periodEnd && 
               (ew.status === 'ready_to_invoice' || ew.status === 'invoiced');
      })
      .reduce((sum, ew) => sum + (ew.amount || 0), 0);

    // One-off services
    const oneOffRevenue = (engagementServices || [])
      .filter(es => {
        return es.billing_type === 'one_off' && 
               es.invoiced_in_period === `${year}-${String(month).padStart(2, '0')}`;
      })
      .reduce((sum, es) => sum + (es.price || 0), 0);

    return retainerRevenue + extraWorksRevenue + oneOffRevenue;
  };

  // Generate months for the year
  const monthsData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const plan = getPlanForMonth(selectedYear, month);
      const actual = calculateActualRevenue(selectedYear, month);
      const target = plan?.targetRevenue || 0;
      const progress = target > 0 ? Math.min((actual / target) * 100, 100) : 0;
      const diff = actual - target;
      const diffPercent = target > 0 ? ((actual - target) / target) * 100 : 0;
      
      return {
        year: selectedYear,
        month,
        monthName: format(new Date(selectedYear, month - 1), 'LLLL', { locale: cs }),
        target,
        actual,
        progress,
        diff,
        diffPercent,
        isCurrentMonth: selectedYear === new Date().getFullYear() && month === new Date().getMonth() + 1,
        isPast: new Date(selectedYear, month - 1) < startOfMonth(new Date()),
      };
    });
  }, [selectedYear, plans, engagements, extraWorks, engagementServices]);

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

      {/* Selected Month Detail */}
      {selectedMonthData && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span className="capitalize">{selectedMonthData.monthName} {selectedYear}</span>
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
                  
                  {/* Actual */}
                  <div className="w-28 text-right">
                    <span className="text-sm">{formatCurrency(m.actual)}</span>
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
