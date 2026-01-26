import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Clock, Banknote, Trash2, TrendingUp } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cs } from 'date-fns/locale';
import type { ActivityReward } from '@/hooks/useActivityRewards';

interface ActivityRewardsHistoryProps {
  rewards: ActivityReward[];
  currentMonthTotal: number;
  getRewardsByMonth: (year: number, month: number) => ActivityReward[];
  getMonthlyTotals: () => { year: number; month: number; total: number; count: number }[];
  onAddClick: () => void;
  onDelete: (rewardId: string) => void;
}

const MONTHS = [
  'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
  'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'
];

export function ActivityRewardsHistory({
  rewards,
  currentMonthTotal,
  getRewardsByMonth,
  getMonthlyTotals,
  onAddClick,
  onDelete,
}: ActivityRewardsHistoryProps) {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);

  const monthlyTotals = getMonthlyTotals();
  const filteredRewards = getRewardsByMonth(selectedYear, selectedMonth);

  // Get available years from rewards
  const availableYears = useMemo(() => {
    const years = new Set(rewards.map(r => parseISO(r.activity_date).getFullYear()));
    years.add(now.getFullYear());
    return Array.from(years).sort((a, b) => b - a);
  }, [rewards]);

  const selectedMonthTotal = filteredRewards.reduce((sum, r) => sum + r.amount, 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Činnosti k fakturaci
          </CardTitle>
          <Button size="sm" onClick={onAddClick} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Přidat
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current month summary */}
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Tento měsíc</span>
            <span className="text-lg font-semibold text-primary">
              {currentMonthTotal.toLocaleString('cs-CZ')} Kč
            </span>
          </div>
        </div>

        {/* Month/Year filter */}
        <div className="flex gap-2">
          <Select
            value={selectedMonth.toString()}
            onValueChange={(v) => setSelectedMonth(Number(v))}
          >
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((month, index) => (
                <SelectItem key={index + 1} value={(index + 1).toString()}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={selectedYear.toString()}
            onValueChange={(v) => setSelectedYear(Number(v))}
          >
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Selected month total */}
        {(selectedYear !== now.getFullYear() || selectedMonth !== now.getMonth() + 1) && (
          <div className="p-2 rounded-lg bg-muted/50 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {MONTHS[selectedMonth - 1]} {selectedYear}
            </span>
            <span className="font-medium">{selectedMonthTotal.toLocaleString('cs-CZ')} Kč</span>
          </div>
        )}

        {/* Rewards list */}
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {filteredRewards.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Žádné činnosti v tomto měsíci
            </p>
          ) : (
            filteredRewards.map((reward) => (
              <div
                key={reward.id}
                className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{reward.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {format(parseISO(reward.activity_date), 'd. M. yyyy', { locale: cs })}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {reward.billing_type === 'hourly' ? (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {reward.hours}h × {reward.hourly_rate} Kč
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Banknote className="h-3 w-3" />
                            Fixní
                          </span>
                        )}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm whitespace-nowrap">
                      {reward.amount.toLocaleString('cs-CZ')} Kč
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                      onClick={() => onDelete(reward.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Monthly totals summary */}
        {monthlyTotals.length > 0 && (
          <div className="pt-3 border-t">
            <p className="text-xs font-medium text-muted-foreground mb-2">Historie po měsících</p>
            <div className="grid grid-cols-2 gap-2">
              {monthlyTotals.slice(0, 6).map((mt) => (
                <div
                  key={`${mt.year}-${mt.month}`}
                  className="text-xs p-2 rounded bg-muted/50 flex justify-between"
                >
                  <span className="text-muted-foreground">
                    {MONTHS[mt.month - 1].slice(0, 3)} {mt.year}
                  </span>
                  <span className="font-medium">{mt.total.toLocaleString('cs-CZ')} Kč</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
