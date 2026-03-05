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
  Briefcase, Sparkles, CheckCircle, Wrench, 
  Megaphone, Building2, FileText, TrendingUp,
  ListTodo, Calendar, Clock, Banknote,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cs } from 'date-fns/locale';
import type { Colleague } from '@/types/crm';
import { useCRMData } from '@/hooks/useCRMData';
import { useCreativeBoostData } from '@/hooks/useCreativeBoostData';
import { useUpsellApprovals } from '@/hooks/useUpsellApprovals';
import { useTeamEarnings } from '@/hooks/useTeamEarnings';
import { buildColleagueInvoiceData, type ColleagueInvoiceData } from './TeamInvoicingOverview';

const MONTHS = [
  'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
  'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'
];

const MONTHS_SHORT = [
  'Led', 'Úno', 'Bře', 'Dub', 'Kvě', 'Čvn',
  'Čvc', 'Srp', 'Zář', 'Říj', 'Lis', 'Pro'
];

interface ColleagueInvoiceSheetProps {
  colleague: Colleague | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialYear: number;
  initialMonth: number;
}

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">{title}</span>
      </div>
      <div className="pl-2 border-l-2 border-primary/20 space-y-1">
        {children}
      </div>
    </div>
  );
}

function LineItem({ name, amount, note }: { name: string; amount: number; note?: string }) {
  return (
    <div className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-muted/50">
      <span className="text-sm flex-1 min-w-0 truncate">{name}</span>
      {note && <Badge variant="secondary" className="text-xs shrink-0">{note}</Badge>}
      <span className="font-medium text-sm whitespace-nowrap">{amount.toLocaleString('cs-CZ')} Kč</span>
    </div>
  );
}

export function ColleagueInvoiceSheet({ colleague, open, onOpenChange, initialYear, initialMonth }: ColleagueInvoiceSheetProps) {
  const [selectedYear, setSelectedYear] = useState(initialYear);
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);

  // Reset when opening with new colleague
  const [lastColleagueId, setLastColleagueId] = useState<string | null>(null);
  if (colleague && colleague.id !== lastColleagueId) {
    setLastColleagueId(colleague.id);
    setSelectedYear(initialYear);
    setSelectedMonth(initialMonth);
  }

  const { engagements, assignments, clients, extraWorks } = useCRMData();
  const { getColleagueCreditsByClient } = useCreativeBoostData();
  const { getApprovedCommissionsForColleague } = useUpsellApprovals();
  const { getColleagueMonthlyHistory, getColleagueActivities } = useTeamEarnings();

  const availableYears = useMemo(() => {
    const years: number[] = [];
    const now = new Date();
    for (let i = 0; i < 3; i++) years.push(now.getFullYear() - i);
    return years;
  }, []);

  // Current month detail
  const data = useMemo<ColleagueInvoiceData | null>(() => {
    if (!colleague) return null;
    return buildColleagueInvoiceData(
      colleague, selectedYear, selectedMonth,
      assignments, engagements, clients, extraWorks,
      getColleagueCreditsByClient, getApprovedCommissionsForColleague,
    );
  }, [colleague, selectedYear, selectedMonth, assignments, engagements, clients, extraWorks, getColleagueCreditsByClient, getApprovedCommissionsForColleague]);

  // Monthly history for the timeline
  const monthlyHistory = useMemo(() => {
    if (!colleague) return [];
    return getColleagueMonthlyHistory(colleague.id, 12);
  }, [colleague, getColleagueMonthlyHistory]);

  // Activity details for selected month
  const activities = useMemo(() => {
    if (!colleague) return [];
    return getColleagueActivities(colleague.id, selectedYear, selectedMonth);
  }, [colleague, selectedYear, selectedMonth, getColleagueActivities]);

  if (!colleague || !data) return null;

  const hasClient = data.clientItems.length > 0 || data.creativeBoostItems.length > 0 
    || data.commissionItems.length > 0 || data.extraWorkItems.length > 0
    || data.manualItems.some(i => i.category === 'client_work');
  
  const hasInternal = data.manualItems.some(i => i.category === 'marketing' || i.category === 'overhead');
  const marketingItems = data.manualItems.filter(i => i.category === 'marketing');
  const overheadItems = data.manualItems.filter(i => i.category === 'overhead');
  const clientWorkItems = data.manualItems.filter(i => i.category === 'client_work');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
              {colleague.full_name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <span className="block">{colleague.full_name}</span>
              <span className="block text-sm font-normal text-muted-foreground">{colleague.position}</span>
            </div>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Month selector — horizontal scrollable pills */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
              {monthlyHistory.filter(month => {
                const now = new Date();
                return month.year < now.getFullYear() || (month.year === now.getFullYear() && month.month <= now.getMonth() + 1);
              }).map((month) => {
                const isSelected = month.year === selectedYear && month.month === selectedMonth;
                return (
                  <button
                    key={`${month.year}-${month.month}`}
                    onClick={() => {
                      setSelectedYear(month.year);
                      setSelectedMonth(month.month);
                    }}
                    className={`shrink-0 px-3 py-2 rounded-lg border text-left transition-colors ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <span className="text-xs font-medium block">
                      {MONTHS_SHORT[month.month - 1]}
                    </span>
                    <span className={`text-sm font-bold block ${isSelected ? 'text-primary' : ''}`}>
                      {(month.totalEarnings / 1000).toFixed(0)}k
                    </span>
                    {month.year !== new Date().getFullYear() && (
                      <span className="text-[10px] text-muted-foreground">{month.year}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Summary card */}
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">
                  {MONTHS[selectedMonth - 1]} {selectedYear}
                </span>
                <span className="text-2xl font-bold text-primary">
                  {data.grandTotal.toLocaleString('cs-CZ')} Kč
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {data.clientTotal > 0 && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-3 w-3" /> Klient: {data.clientTotal.toLocaleString('cs-CZ')} Kč
                  </span>
                )}
                {data.internalTotal > 0 && (
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3 w-3" /> Režie: {data.internalTotal.toLocaleString('cs-CZ')} Kč
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Detailed line items */}
          {(hasClient || hasInternal) ? (
            <div className="space-y-5">
              {hasClient && (
                <Section icon={Briefcase} title="Klientská práce">
                  {data.clientItems.map((item, i) => (
                    <LineItem key={`c-${i}`} name={item.name} amount={item.amount} note={item.note} />
                  ))}
                  {data.creativeBoostItems.map((item, i) => (
                    <LineItem 
                      key={`cb-${i}`} 
                      name={`${item.name} – Creative Boost (${item.credits} kr.)`} 
                      amount={item.amount} 
                    />
                  ))}
                  {data.commissionItems.map((item, i) => (
                    <LineItem key={`com-${i}`} name={item.name} amount={item.amount} />
                  ))}
                  {data.extraWorkItems.map((item, i) => (
                    <LineItem 
                      key={`ew-${i}`} 
                      name={item.name} 
                      amount={item.amount}
                      note={item.hours && item.rate ? `${item.hours}h × ${item.rate} Kč` : undefined}
                    />
                  ))}
                  {clientWorkItems.map((item, i) => (
                    <LineItem key={`cw-${i}`} name={item.name} amount={item.amount} />
                  ))}
                </Section>
              )}

              {hasInternal && (
                <Section icon={Building2} title="Režijní položky">
                  {marketingItems.length > 0 && (
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-2">
                        <Megaphone className="h-3 w-3" /> Marketing
                      </div>
                      {marketingItems.map((item, i) => (
                        <LineItem key={`m-${i}`} name={item.name} amount={item.amount} />
                      ))}
                    </div>
                  )}
                  {overheadItems.length > 0 && (
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-2">
                        <Building2 className="h-3 w-3" /> Interní práce
                      </div>
                      {overheadItems.map((item, i) => (
                        <LineItem key={`o-${i}`} name={item.name} amount={item.amount} />
                      ))}
                    </div>
                  )}
                </Section>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Žádné položky za {MONTHS[selectedMonth - 1]} {selectedYear}
            </p>
          )}

          {/* Activity reward details */}
          {activities.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <ListTodo className="h-4 w-4 text-muted-foreground" />
                  Detail manuálních položek
                </h4>
                <div className="space-y-2">
                  {activities.map((activity) => (
                    <div key={activity.id} className="p-3 rounded-lg border bg-card">
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
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
