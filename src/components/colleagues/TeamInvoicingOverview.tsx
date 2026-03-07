import { useMemo, useState } from 'react';
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
  FileText,
  Users,
  TrendingUp,
  Eye,
  ChevronRight,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { useCRMData } from '@/hooks/useCRMData';
import { useCreativeBoostData } from '@/hooks/useCreativeBoostData';
import { useUpsellApprovals } from '@/hooks/useUpsellApprovals';
import { useTeamEarnings } from '@/hooks/useTeamEarnings';
import { calculateProratedReward } from '@/utils/proratedRewardUtils';
import { ColleagueInvoiceSheet } from './ColleagueInvoiceSheet';
import type { Colleague, Client, Engagement, EngagementAssignment, ExtraWork } from '@/types/crm';
import type { ActivityReward } from '@/hooks/useActivityRewards';

const MONTHS = [
  'Leden', 'Unor', 'Brezen', 'Duben', 'Kveten', 'Cerven',
  'Cervenec', 'Srpen', 'Zari', 'Rijen', 'Listopad', 'Prosinec',
];

interface CreditClientSummary {
  clientName: string;
  totalCredits: number;
  totalReward: number;
}

interface ApprovedCommissionSummary {
  clientName: string;
  commissionAmount: number;
}

export interface ColleagueInvoiceData {
  colleague: Colleague;
  clientItems: { name: string; amount: number; note?: string }[];
  creativeBoostItems: { name: string; credits: number; amount: number }[];
  commissionItems: { name: string; amount: number }[];
  extraWorkItems: { name: string; amount: number; hours?: number | null; rate?: number | null }[];
  manualItems: { name: string; category: ActivityReward['category']; amount: number }[];
  clientTotal: number;
  marketingTotal: number;
  internalTotal: number;
  grandTotal: number;
}

export function buildColleagueInvoiceData(
  colleague: Colleague,
  selectedYear: number,
  selectedMonth: number,
  assignments: EngagementAssignment[],
  engagements: Engagement[],
  clients: Client[],
  extraWorks: ExtraWork[],
  activityRewards: ActivityReward[],
  getColleagueCreditsByClient: (colleagueId: string, year: number, month: number) => CreditClientSummary[],
  getApprovedCommissionsForColleague: (colleagueId: string, year?: number, month?: number) => ApprovedCommissionSummary[],
): ColleagueInvoiceData & { itemCount: number } {
  const colleagueAssignments = assignments.filter(
    (assignment) => assignment.colleague_id === colleague.id && !assignment.end_date,
  );

  const clientItems: ColleagueInvoiceData['clientItems'] = [];
  for (const assignment of colleagueAssignments) {
    const engagement = engagements.find((item) => item.id === assignment.engagement_id);
    if (!engagement || engagement.status !== 'active') {
      continue;
    }

    const client = clients.find((item) => item.id === engagement.client_id);
    if (!client) {
      continue;
    }

    const monthlyAmount = assignment.monthly_cost || 0;
    const prorated = calculateProratedReward(monthlyAmount, assignment.start_date, selectedYear, selectedMonth);
    clientItems.push({
      name: `${client.brand_name || client.name} - sprava uctu`,
      amount: prorated.proratedAmount,
      note: prorated.isProrated && prorated.startDay ? `od ${prorated.startDay}.` : undefined,
    });
  }

  const creditsByClient = getColleagueCreditsByClient(colleague.id, selectedYear, selectedMonth);
  const creativeBoostItems = creditsByClient.map((item) => ({
    name: item.clientName,
    credits: item.totalCredits,
    amount: item.totalReward,
  }));

  const commissions = getApprovedCommissionsForColleague(colleague.id, selectedYear, selectedMonth);
  const commissionItems = commissions.map((item) => ({
    name: `${item.clientName} - provize za upsell`,
    amount: item.commissionAmount,
  }));

  const colleagueExtraWorks = extraWorks.filter((item) => {
    if (item.colleague_id !== colleague.id) return false;
    if (item.status !== 'ready_to_invoice' && item.status !== 'invoiced') return false;
    const [year, month] = item.billing_period.split('-').map(Number);
    return year === selectedYear && month === selectedMonth;
  });

  const extraWorkItems = colleagueExtraWorks.map((item) => {
    const client = clients.find((entry) => entry.id === item.client_id);
    const rate = item.internal_hourly_rate ?? colleague.internal_hourly_cost;
    const amount = rate && item.hours_worked ? rate * item.hours_worked : item.amount;
    return {
      name: `${client?.brand_name || client?.name || '?'} - ${item.name}`,
      amount,
      hours: item.hours_worked,
      rate,
    };
  });

  const manualItems = activityRewards.map((item) => {
    if (!item.invoice_item_name) {
      throw new Error(`Activity reward ${item.id} is missing invoice_item_name.`);
    }
    return {
      name: item.invoice_item_name,
      category: item.category,
      amount: item.amount,
    };
  });

  const clientTotal =
    clientItems.reduce((sum, item) => sum + item.amount, 0) +
    creativeBoostItems.reduce((sum, item) => sum + item.amount, 0) +
    commissionItems.reduce((sum, item) => sum + item.amount, 0) +
    extraWorkItems.reduce((sum, item) => sum + item.amount, 0) +
    manualItems.filter((item) => item.category === 'client_work').reduce((sum, item) => sum + item.amount, 0);

  const marketingTotal = manualItems
    .filter((item) => item.category === 'marketing')
    .reduce((sum, item) => sum + item.amount, 0);

  const internalTotal = manualItems
    .filter((item) => item.category === 'marketing' || item.category === 'overhead')
    .reduce((sum, item) => sum + item.amount, 0);

  const grandTotal = clientTotal + internalTotal;
  const itemCount =
    clientItems.length +
    creativeBoostItems.length +
    commissionItems.length +
    extraWorkItems.length +
    manualItems.length;

  return {
    colleague,
    clientItems,
    creativeBoostItems,
    commissionItems,
    extraWorkItems,
    manualItems,
    clientTotal,
    marketingTotal,
    internalTotal,
    grandTotal,
    itemCount,
  };
}

export function TeamInvoicingOverview() {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedColleague, setSelectedColleague] = useState<Colleague | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { colleagues, engagements, assignments, clients, extraWorks } = useCRMData();
  const { getColleagueCreditsByClient } = useCreativeBoostData();
  const { getApprovedCommissionsForColleague } = useUpsellApprovals();
  const { getColleagueActivities } = useTeamEarnings();

  const availableYears = useMemo(() => {
    const years: number[] = [];
    for (let i = 0; i < 3; i += 1) {
      years.push(now.getFullYear() - i);
    }
    return years;
  }, [now]);

  const colleagueInvoices = useMemo(() => {
    const activeColleagues = colleagues.filter((colleague) => colleague.status === 'active');
    return activeColleagues
      .map((colleague) => {
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
      })
      .filter((item) => item.grandTotal > 0 || item.itemCount > 0)
      .sort((a, b) => b.grandTotal - a.grandTotal);
  }, [
    colleagues,
    selectedYear,
    selectedMonth,
    assignments,
    engagements,
    clients,
    extraWorks,
    getColleagueActivities,
    getColleagueCreditsByClient,
    getApprovedCommissionsForColleague,
  ]);

  const teamTotal = useMemo(
    () => colleagueInvoices.reduce((sum, item) => sum + item.grandTotal, 0),
    [colleagueInvoices],
  );
  const maxAmount = useMemo(
    () => Math.max(...colleagueInvoices.map((item) => item.grandTotal), 1),
    [colleagueInvoices],
  );

  const handleViewDetail = function handleViewDetail(colleague: Colleague) {
    setSelectedColleague(colleague);
    setSheetOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(Number(value))}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {MONTHS.map((month, index) => {
              const monthNumber = index + 1;
              const isFuture = selectedYear === now.getFullYear() && monthNumber > now.getMonth() + 1;
              if (isFuture) return null;
              return <SelectItem key={monthNumber} value={monthNumber.toString()}>{month}</SelectItem>;
            })}
          </SelectContent>
        </Select>
        <Select
          value={selectedYear.toString()}
          onValueChange={(value) => {
            const newYear = Number(value);
            setSelectedYear(newYear);
            if (newYear === now.getFullYear() && selectedMonth > now.getMonth() + 1) {
              setSelectedMonth(now.getMonth() + 1);
            }
          }}
        >
          <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {availableYears.map((year) => (
              <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Celkem k fakturaci</p>
                <p className="text-2xl font-bold text-primary">{(teamTotal / 1000).toFixed(0)}k Kc</p>
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
                <p className="text-xs text-muted-foreground">Kolegu s vykazy</p>
                <p className="text-2xl font-bold">{colleagueInvoices.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Vykazy a odmeny - {MONTHS[selectedMonth - 1]} {selectedYear}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="hidden md:grid grid-cols-[1fr_80px_120px_120px_120px_120px_80px] gap-2 px-4 py-2 border-b text-xs font-medium text-muted-foreground">
            <span>Kolega</span>
            <span className="text-center">Polozek</span>
            <span className="text-right">Klientska</span>
            <span className="text-right">Marketing</span>
            <span className="text-right">Rezijni</span>
            <span className="text-right">Celkem</span>
            <span />
          </div>

          <div className="divide-y">
            {colleagueInvoices.map((data) => (
              <div
                key={data.colleague.id}
                className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => handleViewDetail(data.colleague)}
              >
                <div className="md:grid md:grid-cols-[1fr_80px_120px_120px_120px_120px_80px] md:gap-2 md:items-center">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                      {data.colleague.full_name.split(' ').map((part) => part[0]).join('')}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate text-sm">{data.colleague.full_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{data.colleague.position}</p>
                    </div>
                  </div>

                  <div className="hidden md:block text-center">
                    <Badge variant="secondary" className="text-xs">{data.itemCount}</Badge>
                  </div>
                  <div className="hidden md:block text-right text-sm">
                    {data.clientTotal > 0 ? `${data.clientTotal.toLocaleString('cs-CZ')} Kc` : '-'}
                  </div>
                  <div className="hidden md:block text-right text-sm text-muted-foreground">
                    {data.marketingTotal > 0 ? `${data.marketingTotal.toLocaleString('cs-CZ')} Kc` : '-'}
                  </div>
                  <div className="hidden md:block text-right text-sm text-muted-foreground">
                    {data.internalTotal > 0 ? `${data.internalTotal.toLocaleString('cs-CZ')} Kc` : '-'}
                  </div>
                  <div className="hidden md:block text-right">
                    <span className="text-sm font-bold text-primary">
                      {data.grandTotal.toLocaleString('cs-CZ')} Kc
                    </span>
                  </div>
                  <div className="hidden md:flex justify-end">
                    <Button variant="ghost" size="sm" className="gap-1">
                      <Eye className="h-4 w-4" />
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between mt-2 md:hidden">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">{data.itemCount} polozek</Badge>
                      {data.creativeBoostItems.length > 0 && (
                        <Badge variant="outline" className="text-xs gap-1">
                          <Sparkles className="h-3 w-3" />
                          CB
                        </Badge>
                      )}
                      {data.extraWorkItems.length > 0 && (
                        <Badge variant="outline" className="text-xs gap-1">
                          <Wrench className="h-3 w-3" />
                          {data.extraWorkItems.length}
                        </Badge>
                      )}
                    </div>
                    <span className="font-bold text-primary">{data.grandTotal.toLocaleString('cs-CZ')} Kc</span>
                  </div>
                </div>

                <div className="mt-2 hidden lg:block">
                  <Progress value={(data.grandTotal / maxAmount) * 100} className="h-1.5" />
                </div>
              </div>
            ))}

            {colleagueInvoices.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                Zadne vykazy za {MONTHS[selectedMonth - 1]} {selectedYear}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <ColleagueInvoiceSheet
        colleague={selectedColleague}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        initialYear={selectedYear}
        initialMonth={selectedMonth}
      />
    </div>
  );
}
