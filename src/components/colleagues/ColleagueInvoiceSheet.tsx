import { useEffect, useMemo, useState, type ElementType, type ReactNode } from 'react';
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
  Briefcase,
  Building2,
  ListTodo,
  Calendar,
  Clock,
  Banknote,
  Megaphone,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cs } from 'date-fns/locale';
import type { Colleague } from '@/types/crm';
import { useCRMData } from '@/hooks/useCRMData';
import { useCreativeBoostData } from '@/hooks/useCreativeBoostData';
import { useUpsellApprovals } from '@/hooks/useUpsellApprovals';
import { useTeamEarnings } from '@/hooks/useTeamEarnings';
import { usePayoutMonthSnapshots } from '@/hooks/usePayoutMonthSnapshots';
import { buildColleagueInvoiceData, type ColleagueInvoiceData } from './TeamInvoicingOverview';

const MONTHS = [
  'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
  'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec',
];

const MONTHS_SHORT = [
  'Led', 'Úno', 'Bře', 'Dub', 'Kvě', 'Čvn',
  'Čvc', 'Srp', 'Zář', 'Říj', 'Lis', 'Pro',
];

interface ColleagueInvoiceSheetProps {
  colleague: Colleague | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialYear: number;
  initialMonth: number;
}

function Section({ icon: Icon, title, children }: { icon: ElementType; title: string; children: ReactNode }) {
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

export function ColleagueInvoiceSheet({
  colleague,
  open,
  onOpenChange,
  initialYear,
  initialMonth,
}: ColleagueInvoiceSheetProps) {
  const colleagueId = colleague?.id ?? null;
  const [selectedYear, setSelectedYear] = useState(initialYear);
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);

  useEffect(() => {
    if (!colleagueId) return;
    setSelectedYear(initialYear);
    setSelectedMonth(initialMonth);
  }, [colleagueId, initialYear, initialMonth]);

  const { engagements, assignments, clients, extraWorks } = useCRMData();
  const { getColleagueCreditsByClient } = useCreativeBoostData();
  const { getApprovedCommissionsForColleague } = useUpsellApprovals();
  const { getColleagueMonthlyHistory, getColleagueActivities } = useTeamEarnings();
  const { isMonthClosed, getSnapshotForMonth, getSnapshotsForColleague } = usePayoutMonthSnapshots();

  const data = useMemo<ColleagueInvoiceData | null>(() => {
    if (!colleague) return null;
    const snapshot = getSnapshotForMonth(colleague.id, selectedYear, selectedMonth);
    if (isMonthClosed(selectedYear, selectedMonth)) {
      if (!snapshot) {
        throw new Error(`Closed payout month ${selectedYear}-${selectedMonth} is missing snapshot for colleague ${colleague.id}.`);
      }
      return {
        colleague,
        clientItems: snapshot.lineItems.clientItems || [],
        creativeBoostItems: snapshot.lineItems.creativeBoostItems || [],
        commissionItems: snapshot.lineItems.commissionItems || [],
        extraWorkItems: snapshot.lineItems.extraWorkItems || [],
        manualItems: snapshot.lineItems.manualItems || [],
        clientTotal: snapshot.clientTotal,
        marketingTotal: snapshot.marketingTotal,
        internalTotal: snapshot.internalTotal,
        grandTotal: snapshot.grandTotal,
      };
    }
    const activities = getColleagueActivities(colleague.id, selectedYear, selectedMonth);
    return buildColleagueInvoiceData(
      colleague,
      selectedYear,
      selectedMonth,
      assignments,
      engagements,
      clients,
      extraWorks,
      activities,
      getColleagueCreditsByClient,
      getApprovedCommissionsForColleague,
    );
  }, [
    colleague,
    selectedYear,
    selectedMonth,
    assignments,
    engagements,
    clients,
    extraWorks,
    getColleagueActivities,
    getColleagueCreditsByClient,
    getApprovedCommissionsForColleague,
    isMonthClosed,
    getSnapshotForMonth,
  ]);

  const monthlyHistory = useMemo(() => {
    if (!colleague) return [];
    const baseHistory = getColleagueMonthlyHistory(colleague.id, 12);
    const snapshotHistory = getSnapshotsForColleague(colleague.id).map((snapshot) => ({
      year: snapshot.year,
      month: snapshot.month,
      fixedEarnings: 0,
      creativeBoostReward: 0,
      creativeBoostCredits: 0,
      commissionsReward: 0,
      activitiesReward: 0,
      activitiesCount: 0,
      totalEarnings: snapshot.grandTotal,
      activities: [],
    }));

    const byKey = new Map<string, (typeof baseHistory)[number]>();
    baseHistory.forEach((entry) => {
      byKey.set(`${entry.year}-${entry.month}`, entry);
    });
    snapshotHistory.forEach((entry) => {
      byKey.set(`${entry.year}-${entry.month}`, entry);
    });

    return Array.from(byKey.values()).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
  }, [colleague, getColleagueMonthlyHistory, getSnapshotsForColleague]);

  const activities = useMemo(() => {
    if (!colleague) return [];
    if (isMonthClosed(selectedYear, selectedMonth)) {
      return [];
    }
    return getColleagueActivities(colleague.id, selectedYear, selectedMonth);
  }, [colleague, selectedYear, selectedMonth, getColleagueActivities, isMonthClosed]);

  if (!colleague || !data) return null;

  const hasClient =
    data.clientItems.length > 0 ||
    data.creativeBoostItems.length > 0 ||
    data.commissionItems.length > 0 ||
    data.extraWorkItems.length > 0 ||
    data.manualItems.some((item) => item.category === 'client_work');

  const hasInternal = data.manualItems.some(
    (item) => item.category === 'marketing' || item.category === 'overhead',
  );

  const marketingItems = data.manualItems.filter((item) => item.category === 'marketing');
  const overheadItems = data.manualItems.filter((item) => item.category === 'overhead');
  const clientWorkItems = data.manualItems.filter((item) => item.category === 'client_work');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
              {colleague.full_name.split(' ').map((part) => part[0]).join('')}
            </div>
            <div>
              <span className="block">{colleague.full_name}</span>
              <span className="block text-sm font-normal text-muted-foreground">{colleague.position}</span>
            </div>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
              {[...monthlyHistory.filter((month) => {
                const now = new Date();
                return month.year < now.getFullYear() || (month.year === now.getFullYear() && month.month <= now.getMonth() + 1);
              })].reverse().map((month) => {
                const isSelected = month.year === selectedYear && month.month === selectedMonth;
                return (
                  <button
                    key={`${month.year}-${month.month}`}
                    onClick={() => {
                      setSelectedYear(month.year);
                      setSelectedMonth(month.month);
                    }}
                    className={`shrink-0 px-3 py-2 rounded-lg border text-left transition-colors ${isSelected ? 'border-primary bg-primary/10 text-primary' : 'hover:bg-muted/50'}`}
                  >
                    <span className="text-xs font-medium block">{MONTHS_SHORT[month.month - 1]}</span>
                    <span className={`text-sm font-bold block ${isSelected ? 'text-primary' : ''}`}>
                      {(month.totalEarnings / 1000).toFixed(0)}k
                    </span>
                    <span className="text-[10px] text-muted-foreground">{month.year}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">{MONTHS[selectedMonth - 1]} {selectedYear}</span>
                <span className="text-2xl font-bold text-primary">{data.grandTotal.toLocaleString('cs-CZ')} Kč</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {data.clientTotal > 0 && (
                  <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" /> Klientská: {data.clientTotal.toLocaleString('cs-CZ')} Kč</span>
                )}
                {data.internalTotal > 0 && (
                  <span className="flex items-center gap-1"><Building2 className="h-3 w-3" /> Režie: {data.internalTotal.toLocaleString('cs-CZ')} Kč</span>
                )}
              </div>
            </CardContent>
          </Card>

          {(hasClient || hasInternal) ? (
            <div className="space-y-5">
              {hasClient && (
                <Section icon={Briefcase} title="Klientská práce">
                  {data.clientItems.map((item, index) => (
                    <LineItem key={`client-${index}`} name={item.name} amount={item.amount} note={item.note} />
                  ))}
                  {data.creativeBoostItems.map((item, index) => (
                    <LineItem key={`cb-${index}`} name={`${item.name} - Creative Boost (${item.credits} kr.)`} amount={item.amount} />
                  ))}
                  {data.commissionItems.map((item, index) => (
                    <LineItem key={`commission-${index}`} name={item.name} amount={item.amount} />
                  ))}
                  {data.extraWorkItems.map((item, index) => (
                    <LineItem
                      key={`extra-${index}`}
                      name={item.name}
                      amount={item.amount}
                      note={item.hours && item.rate ? `${item.hours}h x ${item.rate} Kč` : undefined}
                    />
                  ))}
                  {clientWorkItems.map((item, index) => (
                    <LineItem key={`client-work-${index}`} name={item.name} amount={item.amount} />
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
                      {marketingItems.map((item, index) => (
                        <LineItem key={`marketing-${index}`} name={item.name} amount={item.amount} />
                      ))}
                    </div>
                  )}
                  {overheadItems.length > 0 && (
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-2">
                        <Building2 className="h-3 w-3" /> Interní práce
                      </div>
                      {overheadItems.map((item, index) => (
                        <LineItem key={`overhead-${index}`} name={item.name} amount={item.amount} />
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
                                  {activity.hours}h x {activity.hourly_rate} Kč
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <Banknote className="h-3 w-3" />
                                  Fixni
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
