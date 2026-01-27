import { useMemo, useState } from 'react';
import { format, isSameMonth, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { cs } from 'date-fns/locale';
import { Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { usePlannedEngagements } from '@/hooks/usePlannedEngagements';
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

interface TeamCapacityForecastProps {
  engagements: Engagement[];
  colleagues: Colleague[];
  assignments: Assignment[];
  selectedYear: number;
  selectedMonth: number;
}

export function TeamCapacityForecast({ 
  engagements, 
  colleagues, 
  assignments,
  selectedYear, 
  selectedMonth 
}: TeamCapacityForecastProps) {
  const [showAllColleagues, setShowAllColleagues] = useState(false);
  const { plannedEngagements } = usePlannedEngagements();

  const monthStart = startOfMonth(new Date(selectedYear, selectedMonth - 1));
  const monthEnd = endOfMonth(monthStart);

  const plannedForMonth = useMemo(() => {
    return plannedEngagements.filter(p => {
      const startDate = parseISO(p.start_date);
      return isSameMonth(startDate, monthStart);
    });
  }, [plannedEngagements, monthStart]);

  const getColleagueSlotType = (colleague: Colleague): ServiceSlotType => {
    return getSlotTypeFromPosition(colleague.position) || 'meta';
  };

  const colleagueCapacity = useMemo(() => {
    const activeColleagues = colleagues.filter(c => c.status === 'active');

    return activeColleagues.map(colleague => {
      const slots = getCapacitySlots(colleague.capacity_slots);
      const primarySlotType = getColleagueSlotType(colleague);

      const currentAssignments = assignments.filter(a => {
        const eng = engagements.find(e => e.id === a.engagement_id);
        return a.colleague_id === colleague.id && 
               eng?.status === 'active' &&
               (!a.end_date || parseISO(a.end_date) > monthStart);
      });

      const endingAssignments = assignments.filter(a => {
        if (a.colleague_id !== colleague.id) return false;
        const eng = engagements.find(e => e.id === a.engagement_id);
        if (!eng?.end_date) return false;
        const endDate = parseISO(eng.end_date);
        return isSameMonth(endDate, monthStart);
      });

      const newPlanned = plannedForMonth.filter(p => 
        p.assigned_colleague_ids.includes(colleague.id)
      );

      const slotCounts: Record<ServiceSlotType, { current: number; afterEndings: number; afterNew: number }> = {
        meta: { current: 0, afterEndings: 0, afterNew: 0 },
        google: { current: 0, afterEndings: 0, afterNew: 0 },
        graphics: { current: 0, afterEndings: 0, afterNew: 0 },
      };

      slotCounts[primarySlotType].current = currentAssignments.length;
      slotCounts[primarySlotType].afterEndings = currentAssignments.length - endingAssignments.length;
      slotCounts[primarySlotType].afterNew = slotCounts[primarySlotType].afterEndings + newPlanned.length;

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
      if (a.hasChanges !== b.hasChanges) return a.hasChanges ? -1 : 1;
      const aUtil = a.slotCounts[a.primarySlotType].current / (a.slots[a.primarySlotType] || 1);
      const bUtil = b.slotCounts[b.primarySlotType].current / (b.slots[b.primarySlotType] || 1);
      return bUtil - aUtil;
    });
  }, [colleagues, assignments, engagements, plannedForMonth, monthStart]);

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

  const displayedColleagues = showAllColleagues 
    ? colleagueCapacity 
    : colleagueCapacity.slice(0, 6);

  return (
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
  );
}
