import { useMemo, useState } from 'react';
import { format, isSameMonth, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { cs } from 'date-fns/locale';
import { TrendingDown, TrendingUp, Users, CalendarX, Sparkles, Trash2, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { usePlannedEngagements } from '@/hooks/usePlannedEngagements';
import { AddPlannedEngagementDialog } from './AddPlannedEngagementDialog';
import { 
  SERVICE_SLOT_TYPES, 
  SERVICE_SLOT_LABELS, 
  SERVICE_SLOT_BG_COLORS,
  SERVICE_SLOT_TEXT_COLORS,
  getCapacitySlots,
  getSlotTypeFromPosition,
  type ServiceSlotType,
  type CapacitySlots 
} from '@/constants/serviceSlotTypes';

interface EngagementService {
  id: string;
  engagement_id: string;
  name: string;
  service_id: string | null;
}

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
  capacity_slots?: Record<string, number> | null;
}

interface Assignment {
  id: string;
  engagement_id: string;
  colleague_id: string;
  engagement_service_id: string | null;
  role_on_engagement: string | null;
  end_date: string | null;
}

interface ForecastTabProps {
  engagements: Engagement[];
  clients: Client[];
  colleagues: Colleague[];
  assignments: Assignment[];
  engagementServices?: EngagementService[];
  selectedYear: number;
  selectedMonth: number;
}

const DEFAULT_CAPACITY_SLOTS: CapacitySlots = { meta: 3, google: 2, graphics: 2 };

export function ForecastTab({ 
  engagements, 
  clients, 
  colleagues, 
  assignments, 
  selectedYear, 
  selectedMonth 
}: ForecastTabProps) {
  const [showAllColleagues, setShowAllColleagues] = useState(false);
  const { 
    plannedEngagements, 
    addPlannedEngagement, 
    deletePlannedEngagement 
  } = usePlannedEngagements();

  const monthStart = startOfMonth(new Date(selectedYear, selectedMonth - 1));
  const monthEnd = endOfMonth(monthStart);

  // Format number to compact form
  const formatCompact = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
    return num.toLocaleString('cs-CZ');
  };

  // Calculate current MRR from active retainer engagements
  const currentMRR = useMemo(() => {
    return engagements
      .filter(e => e.status === 'active' && e.type === 'retainer')
      .reduce((sum, e) => sum + (e.monthly_fee || 0), 0);
  }, [engagements]);

  // Find engagements ending this month
  const endingEngagements = useMemo(() => {
    return engagements.filter(e => {
      if (!e.end_date || e.status !== 'active') return false;
      const endDate = parseISO(e.end_date);
      return isSameMonth(endDate, monthStart);
    }).map(eng => ({
      ...eng,
      client: clients.find(c => c.id === eng.client_id)
    }));
  }, [engagements, clients, monthStart]);

  // Calculate churn (lost MRR)
  const churnMRR = useMemo(() => {
    return endingEngagements.reduce((sum, e) => sum + (e.monthly_fee || 0), 0);
  }, [endingEngagements]);

  // Get planned engagements for this month
  const plannedForMonth = useMemo(() => {
    return plannedEngagements.filter(p => {
      const startDate = parseISO(p.start_date);
      return isSameMonth(startDate, monthStart);
    });
  }, [plannedEngagements, monthStart]);

  // Calculate new MRR from planned engagements (weighted by probability)
  const newMRR = useMemo(() => {
    return plannedForMonth.reduce((sum, p) => 
      sum + (p.monthly_fee * (p.probability_percent / 100)), 0
    );
  }, [plannedForMonth]);

  // Projected MRR after changes
  const projectedMRR = currentMRR - churnMRR + newMRR;

  // Churn rate
  const churnRate = currentMRR > 0 ? (churnMRR / currentMRR) * 100 : 0;

  // Determine slot type from colleague's position
  const getColleagueSlotType = (colleague: Colleague): ServiceSlotType => {
    return getSlotTypeFromPosition(colleague.position) || 'meta';
  };

  // Get colleague data with capacity impacts PER SLOT TYPE
  const colleagueCapacity = useMemo(() => {
    const activeColleagues = colleagues.filter(c => c.status === 'active');

    return activeColleagues.map(colleague => {
      // Get capacity slots for this colleague
      const slots = getCapacitySlots(colleague.capacity_slots);
      
      // Primary slot type based on position
      const primarySlotType = getColleagueSlotType(colleague);

      // Current active assignments
      const currentAssignments = assignments.filter(a => {
        const eng = engagements.find(e => e.id === a.engagement_id);
        return a.colleague_id === colleague.id && 
               eng?.status === 'active' &&
               (!a.end_date || parseISO(a.end_date) > monthStart);
      });

      // Assignments ending this month
      const endingAssignments = assignments.filter(a => {
        if (a.colleague_id !== colleague.id) return false;
        const eng = engagements.find(e => e.id === a.engagement_id);
        if (!eng?.end_date) return false;
        const endDate = parseISO(eng.end_date);
        return isSameMonth(endDate, monthStart);
      });

      // Planned engagements assigned to this colleague
      const newPlanned = plannedForMonth.filter(p => 
        p.assigned_colleague_ids.includes(colleague.id)
      );

      // Calculate counts per slot type
      const slotCounts: Record<ServiceSlotType, { current: number; afterEndings: number; afterNew: number }> = {
        meta: { current: 0, afterEndings: 0, afterNew: 0 },
        google: { current: 0, afterEndings: 0, afterNew: 0 },
        graphics: { current: 0, afterEndings: 0, afterNew: 0 },
      };

      // For now, count assignments based on colleague's primary slot type
      // In future, this could be based on engagement_service_id mapping
      slotCounts[primarySlotType].current = currentAssignments.length;
      slotCounts[primarySlotType].afterEndings = currentAssignments.length - endingAssignments.length;
      slotCounts[primarySlotType].afterNew = slotCounts[primarySlotType].afterEndings + newPlanned.length;

      // Build timeline of events
      const events: { date: Date; type: 'freed' | 'filled'; name: string; slotType: ServiceSlotType }[] = [];
      
      endingAssignments.forEach(a => {
        const eng = engagements.find(e => e.id === a.engagement_id);
        if (eng?.end_date) {
          events.push({ 
            date: parseISO(eng.end_date), 
            type: 'freed', 
            name: eng.name,
            slotType: primarySlotType,
          });
        }
      });

      newPlanned.forEach(p => {
        events.push({ 
          date: parseISO(p.start_date), 
          type: 'filled', 
          name: p.name,
          slotType: primarySlotType,
        });
      });

      events.sort((a, b) => a.date.getTime() - b.date.getTime());

      return {
        colleague,
        slots,
        slotCounts,
        primarySlotType,
        events,
        hasChanges: events.length > 0,
      };
    }).sort((a, b) => {
      // Sort by changes first, then by utilization
      if (a.hasChanges !== b.hasChanges) return a.hasChanges ? -1 : 1;
      const aUtil = a.slotCounts[a.primarySlotType].current / (a.slots[a.primarySlotType] || 1);
      const bUtil = b.slotCounts[b.primarySlotType].current / (b.slots[b.primarySlotType] || 1);
      return bUtil - aUtil;
    });
  }, [colleagues, assignments, engagements, plannedForMonth, monthStart]);

  // Total free capacity at end of month per slot type
  const totalFreeCapacityByType = useMemo(() => {
    const result: Record<ServiceSlotType, number> = { meta: 0, google: 0, graphics: 0 };
    
    colleagueCapacity.forEach(c => {
      SERVICE_SLOT_TYPES.forEach(slotType => {
        const max = c.slots[slotType] || 0;
        const used = c.slotCounts[slotType].afterNew;
        result[slotType] += Math.max(0, max - used);
      });
    });
    
    return result;
  }, [colleagueCapacity]);

  const totalFreeCapacity = totalFreeCapacityByType.meta + totalFreeCapacityByType.google + totalFreeCapacityByType.graphics;

  // Colleagues to display
  const displayedColleagues = showAllColleagues 
    ? colleagueCapacity 
    : colleagueCapacity.slice(0, 6);

  const monthLabel = format(monthStart, 'LLLL yyyy', { locale: cs });

  // Get assigned colleagues for an engagement
  const getAssignedColleagues = (engagementId: string) => {
    return assignments
      .filter(a => a.engagement_id === engagementId)
      .map(a => colleagues.find(c => c.id === a.colleague_id))
      .filter(Boolean)
      .map(c => c!.full_name.split(' ').map(n => n[0]).join(''))
      .join(', ');
  };

  return (
    <div className="space-y-6">
      {/* Summary Section - 3 KPI cards */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            Souhrn měsíce
            <Badge variant="outline" className="font-normal capitalize">{monthLabel}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 3 Main KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* MRR Flow */}
            <div className="rounded-lg border bg-card p-4 space-y-1">
              <div className="text-sm text-muted-foreground">MRR</div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-semibold">{formatCompact(currentMRR)}</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <span className={`text-2xl font-semibold ${projectedMRR >= currentMRR ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCompact(projectedMRR)}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                {churnMRR > 0 && <span className="text-red-600">-{formatCompact(churnMRR)}</span>}
                {churnMRR > 0 && newMRR > 0 && ' / '}
                {newMRR > 0 && <span className="text-green-600">+{formatCompact(newMRR)}</span>}
                {churnMRR === 0 && newMRR === 0 && 'beze změn'}
              </div>
            </div>

            {/* Churn */}
            <div className="rounded-lg border bg-card p-4 space-y-1">
              <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                <TrendingDown className="h-4 w-4 text-red-500" />
                Churn
              </div>
              <div className="text-2xl font-semibold text-red-600">
                {churnMRR > 0 ? `-${formatCompact(churnMRR)}` : '0'}
              </div>
              <div className="text-xs text-muted-foreground">
                {endingEngagements.length} {endingEngagements.length === 1 ? 'zakázka' : 'zakázky'} 
                {churnRate > 0 && ` (${churnRate.toFixed(1)}%)`}
              </div>
            </div>

            {/* New / Planned */}
            <div className="rounded-lg border bg-card p-4 space-y-1">
              <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-green-500" />
                Nové zakázky
              </div>
              <div className="text-2xl font-semibold text-green-600">
                {newMRR > 0 ? `+${formatCompact(newMRR)}` : '0'}
              </div>
              <div className="text-xs text-muted-foreground">
                {plannedForMonth.length} {plannedForMonth.length === 1 ? 'plánovaná' : 'plánované'}
              </div>
            </div>
          </div>

          {/* Summary bar */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm bg-muted/50 rounded-lg px-4 py-3">
            <div>
              <span className="text-muted-foreground">Výsledné MRR: </span>
              <span className="font-semibold">{formatCompact(projectedMRR)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Změna: </span>
              <span className={`font-semibold ${projectedMRR >= currentMRR ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {projectedMRR >= currentMRR ? '+' : ''}{formatCompact(projectedMRR - currentMRR)}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground">Volná kapacita:</span>
              {SERVICE_SLOT_TYPES.map(slotType => (
                <span key={slotType} className={`font-medium ${SERVICE_SLOT_TEXT_COLORS[slotType]}`}>
                  {totalFreeCapacityByType[slotType]} {SERVICE_SLOT_LABELS[slotType]}
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Two-column: Departures and Arrivals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Departures (Ending engagements) */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <CalendarX className="h-4 w-4 text-red-500" />
              Odchody
              {endingEngagements.length > 0 && (
                <Badge variant="destructive" className="ml-auto">
                  -{formatCompact(churnMRR)}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {endingEngagements.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Žádné zakázky nekončí tento měsíc
              </p>
            ) : (
              <div className="space-y-3">
                {endingEngagements.map(eng => (
                  <div key={eng.id} className="flex items-start justify-between p-3 rounded-lg border bg-red-50/50 dark:bg-red-950/20">
                    <div className="space-y-1">
                      <div className="font-medium text-sm">{eng.client?.brand_name || eng.client?.name || eng.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {eng.end_date && format(parseISO(eng.end_date), 'd.M.', { locale: cs })}
                        {getAssignedColleagues(eng.id) && (
                          <span className="ml-2">• {getAssignedColleagues(eng.id)}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-sm font-medium text-red-600">
                      -{formatCompact(eng.monthly_fee || 0)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Arrivals (Planned engagements) */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-green-500" />
              Příchody
              {plannedForMonth.length > 0 && (
                <Badge variant="default" className="ml-auto bg-green-600">
                  +{formatCompact(newMRR)}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Add button */}
            <AddPlannedEngagementDialog
              colleagues={colleagues as any}
              onAdd={addPlannedEngagement}
              defaultStartDate={monthStart}
            />

            {/* Planned engagements list */}
            {plannedForMonth.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Žádné plánované zakázky pro tento měsíc
              </p>
            ) : (
              <div className="space-y-3">
                {plannedForMonth.map(planned => {
                  const assignedNames = planned.assigned_colleague_ids
                    .map(id => colleagues.find(c => c.id === id))
                    .filter(Boolean)
                    .map(c => c!.full_name.split(' ')[0])
                    .join(', ');

                  return (
                    <div key={planned.id} className="flex items-start justify-between p-3 rounded-lg border bg-green-50/50 dark:bg-green-950/20">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{planned.client_name}</span>
                          {planned.probability_percent < 100 && (
                            <Badge variant="outline" className="text-xs">
                              {planned.probability_percent}%
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {planned.name} • od {format(parseISO(planned.start_date), 'd.M.', { locale: cs })}
                          {assignedNames && <span className="ml-1">• {assignedNames}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-green-600">
                          +{formatCompact(planned.monthly_fee)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => deletePlannedEngagement(planned.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Team Capacity */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Kapacita týmu
            </CardTitle>
            {colleagueCapacity.length > 6 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllColleagues(!showAllColleagues)}
              >
                {showAllColleagues ? 'Zobrazit méně' : `Zobrazit vše (${colleagueCapacity.length})`}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Summary by slot type */}
          <div className="flex flex-wrap gap-3 mb-4 pb-3 border-b">
            {SERVICE_SLOT_TYPES.map(slotType => (
              <div key={slotType} className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${SERVICE_SLOT_BG_COLORS[slotType]}`}>
                <span className={`text-sm font-medium ${SERVICE_SLOT_TEXT_COLORS[slotType]}`}>
                  {SERVICE_SLOT_LABELS[slotType]}
                </span>
                <span className={`text-sm ${SERVICE_SLOT_TEXT_COLORS[slotType]}`}>
                  {totalFreeCapacityByType[slotType]} volných
                </span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {displayedColleagues.map(({ colleague, slots, slotCounts, primarySlotType, events, hasChanges }) => {
              const primaryMax = slots[primarySlotType] || 0;
              const primaryCurrent = slotCounts[primarySlotType].current;
              const primaryAfterNew = slotCounts[primarySlotType].afterNew;

              return (
                <div 
                  key={colleague.id} 
                  className={`p-3 rounded-lg border ${hasChanges ? 'bg-muted/50' : ''}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-medium text-sm truncate">{colleague.full_name}</span>
                      <Badge variant="outline" className={`text-xs ${SERVICE_SLOT_TEXT_COLORS[primarySlotType]} shrink-0`}>
                        {SERVICE_SLOT_LABELS[primarySlotType]}
                      </Badge>
                    </div>
                  </div>

                  {/* Slot type breakdown */}
                  <div className="space-y-1.5 mb-2">
                    {SERVICE_SLOT_TYPES.filter(st => slots[st] > 0).map(slotType => {
                      const max = slots[slotType];
                      const current = slotCounts[slotType].current;
                      const afterNew = slotCounts[slotType].afterNew;
                      const changed = current !== afterNew;
                      
                      return (
                        <div key={slotType} className="flex items-center gap-2">
                          <span className={`text-xs w-16 ${SERVICE_SLOT_TEXT_COLORS[slotType]}`}>
                            {SERVICE_SLOT_LABELS[slotType]}
                          </span>
                          <Progress 
                            value={(afterNew / max) * 100} 
                            className="h-1.5 flex-1"
                          />
                          <span className="text-xs text-muted-foreground w-12 text-right">
                            {changed ? (
                              <>
                                {current}→{afterNew}/{max}
                              </>
                            ) : (
                              `${current}/${max}`
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {events.length > 0 && (
                    <div className="space-y-1 pt-2 border-t">
                      {events.slice(0, 2).map((event, idx) => (
                        <div key={idx} className="text-xs flex items-center gap-1">
                          <span className={event.type === 'freed' ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}>
                            {event.type === 'freed' ? '+1' : '-1'} {SERVICE_SLOT_LABELS[event.slotType]}
                          </span>
                          <span className="text-muted-foreground truncate">
                            {format(event.date, 'd.M.', { locale: cs })} • {event.name}
                          </span>
                        </div>
                      ))}
                      {events.length > 2 && (
                        <div className="text-xs text-muted-foreground">
                          +{events.length - 2} dalších změn
                        </div>
                      )}
                    </div>
                  )}

                  {!hasChanges && (
                    <div className="text-xs text-muted-foreground pt-2 border-t">
                      Beze změn
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
