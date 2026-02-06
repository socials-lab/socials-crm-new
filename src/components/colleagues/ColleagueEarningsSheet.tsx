import { useState, useMemo } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Briefcase, 
  Sparkles, 
  CheckCircle, 
  ListTodo, 
  TrendingUp,
  Clock,
  Banknote,
  Calendar,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cs } from 'date-fns/locale';
import type { Colleague } from '@/types/crm';
import { useTeamEarnings, type ColleagueMonthlyHistory } from '@/hooks/useTeamEarnings';

interface ColleagueEarningsSheetProps {
  colleague: Colleague | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MONTHS = [
  'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
  'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'
];

export function ColleagueEarningsSheet({ colleague, open, onOpenChange }: ColleagueEarningsSheetProps) {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);

  const { getColleagueMonthlyHistory, getColleagueEarningsForMonth, getColleagueActivities } = useTeamEarnings();

  const monthlyHistory = useMemo(() => {
    if (!colleague) return [];
    return getColleagueMonthlyHistory(colleague.id, 12);
  }, [colleague, getColleagueMonthlyHistory]);

  const selectedMonthData = useMemo(() => {
    if (!colleague) return null;
    return getColleagueEarningsForMonth(colleague.id, selectedYear, selectedMonth);
  }, [colleague, selectedYear, selectedMonth, getColleagueEarningsForMonth]);

  const activities = useMemo(() => {
    if (!colleague) return [];
    return getColleagueActivities(colleague.id, selectedYear, selectedMonth);
  }, [colleague, selectedYear, selectedMonth, getColleagueActivities]);

  // Get available years
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    years.add(now.getFullYear());
    monthlyHistory.forEach(h => years.add(h.year));
    return Array.from(years).sort((a, b) => b - a);
  }, [monthlyHistory]);

  if (!colleague) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
              {colleague.full_name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <span>{colleague.full_name}</span>
              <p className="text-sm font-normal text-muted-foreground">{colleague.position}</p>
            </div>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Month Selector */}
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

          {/* Selected Month Summary */}
          {selectedMonthData && (
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-muted-foreground">
                    {MONTHS[selectedMonth - 1]} {selectedYear}
                  </span>
                  <span className="text-2xl font-bold text-primary">
                    {selectedMonthData.totalEarnings.toLocaleString('cs-CZ')} Kč
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Briefcase className="h-3.5 w-3.5" />
                      Fixní ze zakázek
                    </span>
                    <span className="font-medium">{selectedMonthData.fixedEarnings.toLocaleString('cs-CZ')} Kč</span>
                  </div>
                  
                  {selectedMonthData.creativeBoostReward > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Sparkles className="h-3.5 w-3.5" />
                        Creative Boost ({selectedMonthData.creativeBoostCredits} kr)
                      </span>
                      <span className="font-medium text-primary">{selectedMonthData.creativeBoostReward.toLocaleString('cs-CZ')} Kč</span>
                    </div>
                  )}
                  
                  {selectedMonthData.commissionsReward > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <CheckCircle className="h-3.5 w-3.5" />
                        Provize
                      </span>
                      <span className="font-medium text-primary">{selectedMonthData.commissionsReward.toLocaleString('cs-CZ')} Kč</span>
                    </div>
                  )}
                  
                  {selectedMonthData.activitiesReward > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <ListTodo className="h-3.5 w-3.5" />
                        Ostatní činnosti ({selectedMonthData.activitiesCount}×)
                      </span>
                      <span className="font-medium text-primary">{selectedMonthData.activitiesReward.toLocaleString('cs-CZ')} Kč</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Activity Details for Selected Month */}
          {activities.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <ListTodo className="h-4 w-4 text-muted-foreground" />
                Činnosti v {MONTHS[selectedMonth - 1].toLowerCase()}u
              </h4>
              <div className="space-y-2">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="p-3 rounded-lg border bg-card"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{activity.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(parseISO(activity.activity_date), 'd. M. yyyy', { locale: cs })}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {activity.billing_type === 'hourly' ? (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {activity.hours}h × {activity.hourly_rate} Kč
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
                      <span className="font-semibold text-sm whitespace-nowrap">
                        {activity.amount.toLocaleString('cs-CZ')} Kč
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Monthly History */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              Historie odměn
            </h4>
            <div className="space-y-2">
              {monthlyHistory.map((month) => (
                <button
                  key={`${month.year}-${month.month}`}
                  onClick={() => {
                    setSelectedYear(month.year);
                    setSelectedMonth(month.month);
                  }}
                  className={`w-full p-3 rounded-lg border text-left transition-colors ${
                    month.year === selectedYear && month.month === selectedMonth
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {MONTHS[month.month - 1]} {month.year}
                    </span>
                    <span className="font-semibold text-primary">
                      {month.totalEarnings.toLocaleString('cs-CZ')} Kč
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    {month.fixedEarnings > 0 && (
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-3 w-3" />
                        {(month.fixedEarnings / 1000).toFixed(0)}k
                      </span>
                    )}
                    {month.creativeBoostCredits > 0 && (
                      <span className="flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        {month.creativeBoostCredits} kr
                      </span>
                    )}
                    {month.commissionsReward > 0 && (
                      <span className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        {(month.commissionsReward / 1000).toFixed(1)}k
                      </span>
                    )}
                    {month.activitiesCount > 0 && (
                      <span className="flex items-center gap-1">
                        <ListTodo className="h-3 w-3" />
                        {month.activitiesCount}×
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
