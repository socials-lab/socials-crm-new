import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { KPICard } from '@/components/shared/KPICard';
import { 
  ChevronLeft, 
  ChevronRight, 
  TrendingDown, 
  Users, 
  Calendar, 
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Target,
  Wallet,
  UserCheck
} from 'lucide-react';
import { format, parseISO, addDays, startOfMonth, endOfMonth, addMonths } from 'date-fns';
import { cs } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Engagement {
  id: string;
  name: string;
  client_id: string;
  monthly_fee: number | null;
  end_date: string | null;
  status: string | null;
  type: string;
  start_date: string | null;
}

interface Client {
  id: string;
  name: string;
  brand_name: string | null;
}

interface Colleague {
  id: string;
  full_name: string;
  position: string;
  seniority: string;
  status: string | null;
}

interface Assignment {
  id: string;
  engagement_id: string;
  colleague_id: string;
  role_on_engagement: string | null;
  end_date: string | null;
}

interface Lead {
  id: string;
  company_name: string;
  estimated_price: number | null;
  stage: string | null;
  probability_percent: number | null;
}

interface ForecastTabProps {
  engagements: Engagement[];
  clients: Client[];
  colleagues: Colleague[];
  assignments: Assignment[];
  leads: Lead[];
  monthlyTargets?: Record<string, number>;
}

const DEFAULT_MAX_ENGAGEMENTS = 5;

export function ForecastTab({ 
  engagements, 
  clients, 
  colleagues, 
  assignments, 
  leads,
  monthlyTargets = {}
}: ForecastTabProps) {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${Math.round(value / 1000)}k`;
    }
    return value.toLocaleString('cs-CZ');
  };

  const getTargetForMonth = (year: number, month: number) => {
    const key = `${year}-${month.toString().padStart(2, '0')}`;
    return monthlyTargets[key] || 1700000;
  };

  // Calculate forecast data
  const forecastData = useMemo(() => {
    const monthStart = startOfMonth(new Date(selectedYear, selectedMonth - 1));
    const monthEnd = endOfMonth(new Date(selectedYear, selectedMonth - 1));

    // Get active colleagues
    const activeColleagues = colleagues.filter(c => c.status === 'active');

    // Get ending engagements this month
    const endingEngagements = engagements.filter(e => {
      if (!e.end_date || e.status !== 'active') return false;
      const endDate = parseISO(e.end_date);
      return endDate >= monthStart && endDate <= monthEnd;
    }).map(e => ({
      ...e,
      client: clients.find(c => c.id === e.client_id),
      assignedColleagues: assignments
        .filter(a => a.engagement_id === e.id && (!a.end_date || parseISO(a.end_date) >= monthStart))
        .map(a => ({
          ...a,
          colleague: colleagues.find(c => c.id === a.colleague_id)
        }))
    }));

    // Calculate lost MRR
    const lostMRR = endingEngagements.reduce((sum, e) => sum + (e.monthly_fee || 0), 0);

    // Calculate current MRR (active retainers at start of month)
    const currentMRR = engagements
      .filter(e => {
        if (e.status !== 'active' || e.type !== 'retainer') return false;
        const start = e.start_date ? parseISO(e.start_date) : null;
        if (!start || start > monthEnd) return false;
        if (!e.end_date) return true;
        return parseISO(e.end_date) > monthEnd;
      })
      .reduce((sum, e) => sum + (e.monthly_fee || 0), 0);

    const mrrAfterChurn = currentMRR - lostMRR;
    const target = getTargetForMonth(selectedYear, selectedMonth);
    const requiredIncrease = Math.max(0, target - mrrAfterChurn);

    // Calculate churn severity
    const churnPercent = currentMRR > 0 ? (lostMRR / currentMRR) * 100 : 0;
    const severity = churnPercent > 20 ? 'high' : churnPercent > 10 ? 'medium' : 'low';

    // Calculate colleague capacity forecast
    const colleagueCapacity = activeColleagues.map(colleague => {
      // Current active assignments for this colleague
      const currentAssignments = assignments.filter(a => {
        if (a.colleague_id !== colleague.id) return false;
        const engagement = engagements.find(e => e.id === a.engagement_id);
        if (!engagement || engagement.status !== 'active') return false;
        // Assignment is active if no end_date or end_date is in future
        if (a.end_date && parseISO(a.end_date) < monthStart) return false;
        return true;
      });

      const currentEngagementCount = currentAssignments.length;
      const maxEngagements = DEFAULT_MAX_ENGAGEMENTS;
      const utilization = (currentEngagementCount / maxEngagements) * 100;

      // Find ending assignments for this colleague
      const endingAssignments = currentAssignments.filter(a => {
        const engagement = engagements.find(e => e.id === a.engagement_id);
        if (!engagement?.end_date) return false;
        const endDate = parseISO(engagement.end_date);
        return endDate >= monthStart && endDate <= monthEnd;
      }).map(a => {
        const engagement = engagements.find(e => e.id === a.engagement_id)!;
        const client = clients.find(c => c.id === engagement.client_id);
        return {
          engagement,
          client,
          endDate: engagement.end_date!,
          role: a.role_on_engagement || 'Specialist'
        };
      });

      // Calculate average MRR for this colleague's engagements
      const colleagueEngagementMRRs = currentAssignments
        .map(a => engagements.find(e => e.id === a.engagement_id))
        .filter(Boolean)
        .map(e => e!.monthly_fee || 0);
      
      const avgMRR = colleagueEngagementMRRs.length > 0
        ? colleagueEngagementMRRs.reduce((sum, m) => sum + m, 0) / colleagueEngagementMRRs.length
        : 0;

      // Calculate future free slots after endings
      const futureSlots = endingAssignments.length;
      const futureCapacity = maxEngagements - currentEngagementCount + futureSlots;

      return {
        colleague,
        currentEngagements: currentEngagementCount,
        maxEngagements,
        utilization,
        endingAssignments,
        freeSlotsAfterEndings: futureSlots,
        futureCapacity,
        avgMRR,
        hasEndingEngagements: endingAssignments.length > 0
      };
    }).sort((a, b) => {
      // Sort: those with ending engagements first, then by utilization
      if (a.hasEndingEngagements && !b.hasEndingEngagements) return -1;
      if (!a.hasEndingEngagements && b.hasEndingEngagements) return 1;
      return b.utilization - a.utilization;
    });

    // Colleagues who will have capacity
    const colleaguesWithFutureCapacity = colleagueCapacity.filter(c => c.freeSlotsAfterEndings > 0);
    const totalFreedSlots = colleaguesWithFutureCapacity.reduce((sum, c) => sum + c.freeSlotsAfterEndings, 0);
    const potentialRevenue = colleaguesWithFutureCapacity.reduce((sum, c) => sum + (c.avgMRR * c.freeSlotsAfterEndings), 0);

    // Pipeline leads analysis
    const activeLeads = leads.filter(l => 
      l.stage && !['won', 'lost', 'postponed'].includes(l.stage)
    );
    const pipelineValue = activeLeads.reduce((sum, l) => {
      const probability = (l.probability_percent || 50) / 100;
      return sum + (l.estimated_price || 0) * probability;
    }, 0);

    // 3-month timeline data
    const timelineData = [0, 1, 2].map(monthOffset => {
      const month = addMonths(monthStart, monthOffset);
      const mStart = startOfMonth(month);
      const mEnd = endOfMonth(month);

      const events = engagements
        .filter(e => {
          if (!e.end_date || e.status !== 'active') return false;
          const endDate = parseISO(e.end_date);
          return endDate >= mStart && endDate <= mEnd;
        })
        .flatMap(e => {
          const client = clients.find(c => c.id === e.client_id);
          return assignments
            .filter(a => a.engagement_id === e.id)
            .map(a => {
              const colleague = colleagues.find(c => c.id === a.colleague_id);
              return {
                date: e.end_date!,
                collegueue: colleague?.full_name || 'Neznámý',
                engagement: e.name,
                client: client?.brand_name || client?.name || 'Neznámý'
              };
            });
        });

      return {
        month,
        monthName: format(month, 'LLLL', { locale: cs }),
        events,
        totalSlots: events.length
      };
    });

    return {
      endingEngagements,
      currentMRR,
      lostMRR,
      mrrAfterChurn,
      target,
      requiredIncrease,
      churnPercent,
      severity,
      colleagueCapacity,
      colleaguesWithFutureCapacity: colleaguesWithFutureCapacity.length,
      totalFreedSlots,
      potentialRevenue,
      activeLeads,
      pipelineValue,
      timelineData
    };
  }, [selectedYear, selectedMonth, engagements, clients, colleagues, assignments, leads, monthlyTargets]);

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const monthName = format(new Date(selectedYear, selectedMonth - 1), 'LLLL yyyy', { locale: cs });

  const severityColors = {
    high: 'border-destructive/50 bg-destructive/5',
    medium: 'border-amber-500/50 bg-amber-500/5',
    low: 'border-emerald-500/50 bg-emerald-500/5'
  };

  return (
    <div className="space-y-6">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold capitalize">Forecast - {monthName}</h2>
          <p className="text-muted-foreground">Predikce tržeb a kapacity týmu</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[120px] text-center font-medium capitalize">
            {monthName}
          </span>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* KPI Summary Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <KPICard
          title="Aktuální MRR"
          value={`${formatCurrency(forecastData.currentMRR)} Kč`}
          icon={Wallet}
        />
        <KPICard
          title="Ztráta MRR"
          value={forecastData.lostMRR > 0 ? `-${formatCurrency(forecastData.lostMRR)} Kč` : '0 Kč'}
          icon={TrendingDown}
          className={forecastData.lostMRR > 0 ? 'border-destructive/30' : ''}
        />
        <KPICard
          title="MRR po churnu"
          value={`${formatCurrency(forecastData.mrrAfterChurn)} Kč`}
          icon={Target}
        />
        <KPICard
          title="Gap do plánu"
          value={forecastData.requiredIncrease > 0 ? `+${formatCurrency(forecastData.requiredIncrease)} Kč` : 'Splněno ✓'}
          icon={Target}
          className={forecastData.requiredIncrease > 0 ? 'border-amber-500/30' : 'border-emerald-500/30'}
        />
        <KPICard
          title="Kolegové s kapacitou"
          value={forecastData.colleaguesWithFutureCapacity.toString()}
          icon={Users}
        />
        <KPICard
          title="Uvolněné sloty"
          value={`+${forecastData.totalFreedSlots}`}
          icon={Calendar}
        />
        <KPICard
          title="Potenciální revenue"
          value={`~${formatCurrency(forecastData.potentialRevenue)} Kč`}
          icon={UserCheck}
          subtitle="při obsazení"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Ending Engagements */}
        <Card className={cn('border-2', severityColors[forecastData.severity])}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingDown className="h-5 w-5" />
              Končící zakázky ({format(new Date(selectedYear, selectedMonth - 1), 'LLLL', { locale: cs })})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {forecastData.endingEngagements.length === 0 ? (
              <div className="flex items-center gap-2 text-muted-foreground py-4">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <span>Žádné zakázky nekončí tento měsíc</span>
              </div>
            ) : (
              <div className="space-y-3">
                {forecastData.endingEngagements.map(engagement => (
                  <div 
                    key={engagement.id} 
                    className="flex items-start justify-between p-3 rounded-lg bg-background border"
                  >
                    <div className="space-y-1">
                      <div className="font-medium">{engagement.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {engagement.client?.brand_name || engagement.client?.name}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {engagement.assignedColleagues.map(ac => (
                          <Badge key={ac.id} variant="secondary" className="text-xs">
                            {ac.colleague?.full_name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">
                        {format(parseISO(engagement.end_date!), 'd.M.', { locale: cs })}
                      </div>
                      <div className="font-semibold text-destructive">
                        -{formatCurrency(engagement.monthly_fee || 0)} Kč
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Team Capacity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5" />
              Kapacita týmu po ukončení
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {forecastData.colleagueCapacity.slice(0, 5).map(cap => (
              <div 
                key={cap.colleague.id} 
                className={cn(
                  "p-3 rounded-lg border",
                  cap.hasEndingEngagements ? "bg-amber-500/5 border-amber-500/30" : "bg-background"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-medium">{cap.colleague.full_name}</div>
                    <div className="text-xs text-muted-foreground">{cap.colleague.position}</div>
                  </div>
                  <Badge variant={cap.utilization >= 100 ? "destructive" : cap.utilization >= 80 ? "secondary" : "outline"}>
                    {cap.currentEngagements}/{cap.maxEngagements} zakázek
                  </Badge>
                </div>
                
                <Progress value={cap.utilization} className="h-2 mb-2" />
                
                {cap.hasEndingEngagements ? (
                  <div className="space-y-1 mt-3">
                    {cap.endingAssignments.map((ea, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <AlertTriangle className="h-3 w-3 text-amber-500" />
                        <span className="text-muted-foreground">
                          Po {format(parseISO(ea.endDate), 'd.M.', { locale: cs })} končí:
                        </span>
                        <span className="font-medium">{ea.client?.brand_name || ea.client?.name}</span>
                      </div>
                    ))}
                    <div className="flex items-center gap-2 text-sm text-emerald-600 mt-2">
                      <Calendar className="h-3 w-3" />
                      <span>Volná kapacita: +{cap.freeSlotsAfterEndings} zakázka</span>
                    </div>
                    {cap.avgMRR > 0 && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Wallet className="h-3 w-3" />
                        <span>Průměrný MRR zakázek: ~{formatCurrency(cap.avgMRR)} Kč</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    <span>Žádné končící zakázky</span>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5" />
            Timeline kapacity (příští 3 měsíce)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {forecastData.timelineData.map((month, idx) => (
              <div 
                key={idx}
                className={cn(
                  "p-4 rounded-lg border",
                  idx === 0 ? "bg-primary/5 border-primary/30" : "bg-muted/30"
                )}
              >
                <div className="font-medium capitalize mb-3">{month.monthName}</div>
                {month.events.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Žádné změny</div>
                ) : (
                  <div className="space-y-2">
                    {month.events.slice(0, 3).map((event, eIdx) => (
                      <div key={eIdx} className="text-sm">
                        <span className="text-muted-foreground">
                          {format(parseISO(event.date), 'd.M.', { locale: cs })}
                        </span>
                        {' '}
                        <span className="font-medium">{event.collegueue}</span>
                        {' '}
                        <span className="text-emerald-600">+1</span>
                      </div>
                    ))}
                    {month.events.length > 3 && (
                      <div className="text-xs text-muted-foreground">
                        +{month.events.length - 3} dalších
                      </div>
                    )}
                  </div>
                )}
                <div className="mt-3 pt-3 border-t text-sm">
                  <span className="text-muted-foreground">Celkem uvolněno:</span>
                  {' '}
                  <span className="font-semibold text-emerald-600">+{month.totalSlots} slotů</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lightbulb className="h-5 w-5 text-primary" />
            Doporučení
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {forecastData.requiredIncrease > 0 && (
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>
                  Pro splnění plánu je potřeba získat{' '}
                  <strong>+{formatCurrency(forecastData.requiredIncrease)} Kč</strong> nového MRR
                </span>
              </li>
            )}
            {forecastData.colleagueCapacity
              .filter(c => c.hasEndingEngagements)
              .slice(0, 2)
              .map(c => (
                <li key={c.colleague.id} className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>
                    Od {format(parseISO(c.endingAssignments[0]?.endDate || new Date().toISOString()), 'd.M.', { locale: cs })} bude{' '}
                    <strong>{c.colleague.full_name}</strong> volný pro nového klienta
                  </span>
                </li>
              ))
            }
            {forecastData.activeLeads.length > 0 && (
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>
                  V pipeline je {forecastData.activeLeads.length} aktivních leadů s váženou hodnotou{' '}
                  <strong>~{formatCurrency(forecastData.pipelineValue)} Kč</strong>
                </span>
              </li>
            )}
            {forecastData.totalFreedSlots > 0 && forecastData.potentialRevenue > 0 && (
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>
                  Obsazením {forecastData.totalFreedSlots} uvolněných slotů lze získat až{' '}
                  <strong>~{formatCurrency(forecastData.potentialRevenue)} Kč</strong> měsíčně
                </span>
              </li>
            )}
            {forecastData.lostMRR === 0 && forecastData.requiredIncrease === 0 && (
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-1">✓</span>
                <span>
                  Tento měsíc je vše v pořádku - žádný churn a plán je splněn
                </span>
              </li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
