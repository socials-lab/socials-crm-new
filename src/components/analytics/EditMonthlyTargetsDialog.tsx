import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Target, TrendingUp, Calculator, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { DEFAULT_TARGETS_2026, getTargetForMonth } from '@/utils/businessPlanUtils';

interface MonthlyPlan {
  year: number;
  month: number;
  targetRevenue: number;
}

interface EditMonthlyTargetsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedYear: number;
  plans: MonthlyPlan[];
  onSave: (plans: MonthlyPlan[]) => void;
}

const STORAGE_KEY = 'crm-business-plan';

export function EditMonthlyTargetsDialog({
  open,
  onOpenChange,
  selectedYear,
  plans,
  onSave,
}: EditMonthlyTargetsDialogProps) {
  const [monthlyValues, setMonthlyValues] = useState<Record<number, string>>({});
  const [annualTarget, setAnnualTarget] = useState('');

  useEffect(() => {
    if (open) {
      // Initialize with current values
      const values: Record<number, string> = {};
      for (let month = 1; month <= 12; month++) {
        const target = getTargetForMonth(selectedYear, month);
        values[month] = target > 0 ? target.toString() : '';
      }
      setMonthlyValues(values);
      
      // Calculate current annual total
      const total = Object.values(values).reduce((sum, v) => sum + (parseInt(v) || 0), 0);
      setAnnualTarget(total.toString());
    }
  }, [open, selectedYear, plans]);

  const handleMonthChange = (month: number, value: string) => {
    const numValue = value.replace(/[^0-9]/g, '');
    setMonthlyValues(prev => ({ ...prev, [month]: numValue }));
    
    // Recalculate annual total
    const newValues = { ...monthlyValues, [month]: numValue };
    const total = Object.values(newValues).reduce((sum, v) => sum + (parseInt(v) || 0), 0);
    setAnnualTarget(total.toString());
  };

  const handleDistributeEvenly = () => {
    const total = parseInt(annualTarget) || 0;
    if (total <= 0) return;
    
    const perMonth = Math.floor(total / 12);
    const remainder = total - (perMonth * 12);
    
    const newValues: Record<number, string> = {};
    for (let month = 1; month <= 12; month++) {
      // Add remainder to December
      const value = month === 12 ? perMonth + remainder : perMonth;
      newValues[month] = value.toString();
    }
    setMonthlyValues(newValues);
  };

  const handleDistributeGrowth = () => {
    const total = parseInt(annualTarget) || 0;
    if (total <= 0) return;
    
    // Start at ~7% of annual, grow ~3% monthly to reach target
    // Formula: sum of geometric series = a * (1 - r^n) / (1 - r)
    // We want to find 'a' (first month) given total and growth rate
    const growthRate = 1.03; // 3% monthly growth
    const n = 12;
    const geometricSum = (1 - Math.pow(growthRate, n)) / (1 - growthRate);
    const firstMonth = Math.floor(total / geometricSum);
    
    const newValues: Record<number, string> = {};
    let currentValue = firstMonth;
    let runningTotal = 0;
    
    for (let month = 1; month <= 11; month++) {
      newValues[month] = Math.round(currentValue).toString();
      runningTotal += Math.round(currentValue);
      currentValue *= growthRate;
    }
    
    // Last month gets the remainder to hit exact target
    newValues[12] = (total - runningTotal).toString();
    setMonthlyValues(newValues);
  };

  const handleResetToDefaults = () => {
    const newValues: Record<number, string> = {};
    for (let month = 1; month <= 12; month++) {
      const defaultValue = selectedYear === 2026 ? DEFAULT_TARGETS_2026[month] || 0 : 0;
      newValues[month] = defaultValue > 0 ? defaultValue.toString() : '';
    }
    setMonthlyValues(newValues);
    
    const total = Object.values(newValues).reduce((sum, v) => sum + (parseInt(v) || 0), 0);
    setAnnualTarget(total.toString());
  };

  const handleSave = () => {
    const newPlans: MonthlyPlan[] = [];
    
    for (let month = 1; month <= 12; month++) {
      const value = parseInt(monthlyValues[month]) || 0;
      // Only save if different from default or if there's a value
      if (value > 0) {
        newPlans.push({
          year: selectedYear,
          month,
          targetRevenue: value,
        });
      }
    }
    
    // Filter out plans for other years, then add new ones
    const otherYearPlans = plans.filter(p => p.year !== selectedYear);
    onSave([...otherYearPlans, ...newPlans]);
    onOpenChange(false);
  };

  const formatNumber = (value: string) => {
    const num = parseInt(value) || 0;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
    return num.toLocaleString('cs-CZ');
  };

  const currentTotal = Object.values(monthlyValues).reduce((sum, v) => sum + (parseInt(v) || 0), 0);
  const targetTotal = parseInt(annualTarget) || 0;
  const difference = currentTotal - targetTotal;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Nastavení měsíčních cílů {selectedYear}
          </DialogTitle>
          <DialogDescription>
            Nastavte měsíční cíle tržeb. Změny se projeví v trendových grafech.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Annual Target */}
          <div className="p-4 rounded-lg border bg-primary/5">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-medium">Roční cíl</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDistributeEvenly}
                  className="text-xs"
                >
                  <Calculator className="h-3 w-3 mr-1" />
                  Rozdělit rovnoměrně
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDistributeGrowth}
                  className="text-xs"
                >
                  <TrendingUp className="h-3 w-3 mr-1" />
                  S růstem 3%
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Input
                type="text"
                value={annualTarget}
                onChange={(e) => setAnnualTarget(e.target.value.replace(/[^0-9]/g, ''))}
                className="text-lg font-bold"
                placeholder="25400000"
              />
              <span className="text-muted-foreground whitespace-nowrap">
                = {formatNumber(annualTarget)} Kč
              </span>
            </div>
            {difference !== 0 && (
              <p className={`text-xs mt-2 ${difference > 0 ? 'text-amber-600' : 'text-destructive'}`}>
                Součet měsíců: {formatNumber(currentTotal.toString())} Kč 
                ({difference > 0 ? '+' : ''}{formatNumber(difference.toString())} Kč rozdíl)
              </p>
            )}
          </div>

          {/* Monthly Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Array.from({ length: 12 }, (_, i) => {
              const month = i + 1;
              const monthName = format(new Date(selectedYear, month - 1), 'LLLL', { locale: cs });
              const value = monthlyValues[month] || '';
              const defaultValue = selectedYear === 2026 ? DEFAULT_TARGETS_2026[month] || 0 : 0;
              const isCustom = parseInt(value) !== defaultValue && value !== '';
              
              return (
                <div key={month} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs capitalize">{monthName}</Label>
                    {isCustom && (
                      <Badge variant="outline" className="text-[10px] px-1 py-0">
                        upraveno
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Input
                      type="text"
                      value={value}
                      onChange={(e) => handleMonthChange(month, e.target.value)}
                      className="text-sm h-9"
                      placeholder="0"
                    />
                    <span className="text-xs text-muted-foreground w-10">
                      {formatNumber(value)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Reset button */}
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetToDefaults}
              className="text-muted-foreground"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Obnovit výchozí hodnoty
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Zrušit
          </Button>
          <Button onClick={handleSave}>
            Uložit cíle
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
