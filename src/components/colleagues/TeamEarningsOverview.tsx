import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  TrendingUp, 
  Briefcase, 
  Sparkles, 
  CheckCircle, 
  ListTodo,
  Eye,
  ChevronRight,
} from 'lucide-react';
import { useTeamEarnings, type ColleagueEarningsSummary } from '@/hooks/useTeamEarnings';
import { ColleagueEarningsSheet } from './ColleagueEarningsSheet';
import type { Colleague } from '@/types/crm';

const MONTHS = [
  'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
  'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'
];

export function TeamEarningsOverview() {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedColleague, setSelectedColleague] = useState<Colleague | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { getTeamEarningsSummary, getTeamTotalForMonth } = useTeamEarnings();

  const teamSummary = useMemo(() => {
    return getTeamEarningsSummary(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth, getTeamEarningsSummary]);

  const teamTotal = useMemo(() => {
    return getTeamTotalForMonth(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth, getTeamTotalForMonth]);

  // Get available years
  const availableYears = useMemo(() => {
    const years: number[] = [];
    for (let i = 0; i < 3; i++) {
      years.push(now.getFullYear() - i);
    }
    return years;
  }, []);

  // Calculate max earnings for progress bar
  const maxEarnings = useMemo(() => {
    return Math.max(...teamSummary.map(s => s.totalEarnings), 1);
  }, [teamSummary]);

  const handleViewDetails = (colleague: Colleague) => {
    setSelectedColleague(colleague);
    setSheetOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex items-center gap-3">
          <Select
            value={selectedMonth.toString()}
            onValueChange={(v) => setSelectedMonth(Number(v))}
          >
            <SelectTrigger className="w-[140px]">
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
            <SelectTrigger className="w-[100px]">
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
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Celkové odměny</p>
                <p className="text-2xl font-bold text-primary">
                  {(teamTotal / 1000).toFixed(0)}k Kč
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-muted">
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Aktivní kolegové</p>
                <p className="text-2xl font-bold">{teamSummary.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-muted">
                <Briefcase className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Průměr na kolegu</p>
                <p className="text-2xl font-bold">
                  {teamSummary.length > 0 
                    ? ((teamTotal / teamSummary.length) / 1000).toFixed(0) 
                    : 0}k Kč
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Přehled odměn - {MONTHS[selectedMonth - 1]} {selectedYear}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {teamSummary.map((summary) => (
              <div
                key={summary.colleague.id}
                className="p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {/* Avatar & Name */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold shrink-0">
                      {summary.colleague.full_name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{summary.colleague.full_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{summary.colleague.position}</p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="hidden md:flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Zakázky</p>
                      <p className="text-sm font-medium">{summary.engagementCount}</p>
                    </div>
                    
                    {summary.creativeBoostCredits > 0 && (
                      <Badge variant="outline" className="text-xs gap-1">
                        <Sparkles className="h-3 w-3" />
                        {summary.creativeBoostCredits} kr
                      </Badge>
                    )}
                    
                    {summary.commissionsReward > 0 && (
                      <Badge variant="outline" className="text-xs gap-1 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                        <CheckCircle className="h-3 w-3" />
                        {(summary.commissionsReward / 1000).toFixed(1)}k
                      </Badge>
                    )}
                    
                    {summary.activitiesCount > 0 && (
                      <Badge variant="outline" className="text-xs gap-1 bg-amber-500/10 text-amber-600 border-amber-500/20">
                        <ListTodo className="h-3 w-3" />
                        {summary.activitiesCount}×
                      </Badge>
                    )}
                  </div>

                  {/* Earnings Progress */}
                  <div className="w-32 hidden lg:block">
                    <Progress 
                      value={(summary.totalEarnings / maxEarnings) * 100} 
                      className="h-2"
                    />
                  </div>

                  {/* Total */}
                  <div className="text-right min-w-[100px]">
                    <p className="text-lg font-bold text-primary">
                      {(summary.totalEarnings / 1000).toFixed(0)}k
                    </p>
                    <p className="text-xs text-muted-foreground">Kč</p>
                  </div>

                  {/* Action */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => handleViewDetails(summary.colleague)}
                  >
                    <Eye className="h-4 w-4" />
                    <span className="hidden sm:inline">Detail</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                {/* Mobile stats */}
                <div className="flex items-center gap-2 mt-2 md:hidden flex-wrap">
                  <Badge variant="outline" className="text-xs">
                    {summary.engagementCount} zakázek
                  </Badge>
                  {summary.creativeBoostCredits > 0 && (
                    <Badge variant="outline" className="text-xs gap-1">
                      <Sparkles className="h-3 w-3" />
                      {summary.creativeBoostCredits} kr
                    </Badge>
                  )}
                  {summary.activitiesCount > 0 && (
                    <Badge variant="outline" className="text-xs gap-1">
                      <ListTodo className="h-3 w-3" />
                      {summary.activitiesCount}× činností
                    </Badge>
                  )}
                </div>
              </div>
            ))}

            {teamSummary.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                Žádní aktivní kolegové
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detail Sheet */}
      <ColleagueEarningsSheet
        colleague={selectedColleague}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  );
}
