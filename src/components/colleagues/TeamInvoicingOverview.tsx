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
  FileText, Users, TrendingUp, Eye, ChevronRight,
  Briefcase, Sparkles, CheckCircle, ListTodo, Wrench,
} from 'lucide-react';
import { useCRMData } from '@/hooks/useCRMData';
import { useCreativeBoostData } from '@/hooks/useCreativeBoostData';
import { useUpsellApprovals } from '@/hooks/useUpsellApprovals';
import { useTeamEarnings } from '@/hooks/useTeamEarnings';
import { ColleagueInvoiceSheet } from './ColleagueInvoiceSheet';
import type { Colleague } from '@/types/crm';
import { calculateProratedReward } from '@/utils/proratedRewardUtils';

const MONTHS = [
  'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
  'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'
];

export interface ColleagueInvoiceData {
  colleague: Colleague;
  clientItems: { name: string; amount: number; note?: string }[];
  creativeBoostItems: { name: string; credits: number; amount: number }[];
  commissionItems: { name: string; amount: number }[];
  extraWorkItems: { name: string; amount: number; hours?: number | null; rate?: number | null }[];
  manualItems: { name: string; category: string; amount: number }[];
  clientTotal: number;
  internalTotal: number;
  grandTotal: number;
}

function buildColleagueInvoiceData(
  colleague: Colleague,
  selectedYear: number,
  selectedMonth: number,
  assignments: any[],
  engagements: any[],
  clients: any[],
  extraWorks: any[],
  getColleagueCreditsByClient: any,
  getApprovedCommissionsForColleague: any,
): ColleagueInvoiceData & { itemCount: number } {
  // 1. Client assignments
  const colleagueAssignments = assignments.filter(
    (a: any) => a.colleague_id === colleague.id && !a.end_date
  );
  
  const clientItems: ColleagueInvoiceData['clientItems'] = [];
  colleagueAssignments.forEach((assignment: any) => {
    const engagement = engagements.find((e: any) => e.id === assignment.engagement_id);
    if (!engagement || engagement.status !== 'active') return;
    const client = clients.find((c: any) => c.id === engagement.client_id);
    if (!client) return;
    
    const monthlyAmount = assignment.monthly_cost || 0;
    const prorated = calculateProratedReward(monthlyAmount, assignment.start_date, selectedYear, selectedMonth);
    
    clientItems.push({
      name: `${client.brand_name || client.name} – správa účtu`,
      amount: prorated.proratedAmount,
      note: prorated.isProrated && prorated.startDay ? `od ${prorated.startDay}.` : undefined,
    });
  });

  // 2. Creative Boost
  const creditsByClient = getColleagueCreditsByClient(colleague.id, selectedYear, selectedMonth);
  const creativeBoostItems = creditsByClient.map((cb: any) => ({
    name: cb.clientName,
    credits: cb.totalCredits,
    amount: cb.totalReward,
  }));

  // 3. Commissions
  const commissions = getApprovedCommissionsForColleague(colleague.id, selectedYear, selectedMonth);
  const commissionItems = commissions.map((c: any) => ({
    name: `${c.clientName} – provize za upsell`,
    amount: c.commissionAmount,
  }));

  // 4. Extra work
  const colleagueExtraWorks = extraWorks.filter((ew: any) => {
    if (ew.colleague_id !== colleague.id) return false;
    if (ew.status !== 'ready_to_invoice' && ew.status !== 'invoiced') return false;
    const [ewYear, ewMonth] = ew.billing_period.split('-').map(Number);
    return ewYear === selectedYear && ewMonth === selectedMonth;
  });
  
  const extraWorkItems = colleagueExtraWorks.map((ew: any) => {
    const client = clients.find((c: any) => c.id === ew.client_id);
    const rate = ew.internal_hourly_rate ?? colleague.internal_hourly_cost;
    const amount = (rate && ew.hours_worked) ? rate * ew.hours_worked : ew.amount;
    return {
      name: `${client?.brand_name || client?.name || '?'} – ${ew.name}`,
      amount,
      hours: ew.hours_worked,
      rate,
    };
  });

  // 5. Manual items
  const manualItems: ColleagueInvoiceData['manualItems'] = [];
  try {
    const stored = localStorage.getItem('activity-rewards');
    if (stored) {
      const rewards = JSON.parse(stored) as any[];
      rewards
        .filter((r: any) => {
          if (r.colleague_id !== colleague.id && r.colleague_id !== 'demo-colleague') return false;
          const d = new Date(r.activity_date);
          return d.getFullYear() === selectedYear && d.getMonth() + 1 === selectedMonth;
        })
        .forEach((r: any) => {
          manualItems.push({
            name: r.invoice_item_name || r.description,
            category: r.category || 'overhead',
            amount: r.amount,
          });
        });
    }
  } catch {}

  const clientTotal = clientItems.reduce((s, i) => s + i.amount, 0)
    + creativeBoostItems.reduce((s: number, i: any) => s + i.amount, 0)
    + commissionItems.reduce((s: number, i: any) => s + i.amount, 0)
    + extraWorkItems.reduce((s: number, i: any) => s + i.amount, 0)
    + manualItems.filter(i => i.category === 'client_work').reduce((s, i) => s + i.amount, 0);
  
  const internalTotal = manualItems
    .filter(i => i.category === 'marketing' || i.category === 'overhead')
    .reduce((s, i) => s + i.amount, 0);

  const grandTotal = clientTotal + internalTotal;
  const itemCount = clientItems.length + creativeBoostItems.length + commissionItems.length + extraWorkItems.length + manualItems.length;

  return {
    colleague,
    clientItems,
    creativeBoostItems,
    commissionItems,
    extraWorkItems,
    manualItems,
    clientTotal,
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
  const { getTeamEarningsSummary, getTeamTotalForMonth } = useTeamEarnings();

  const availableYears = useMemo(() => {
    const years: number[] = [];
    for (let i = 0; i < 3; i++) years.push(now.getFullYear() - i);
    return years;
  }, []);

  // Build detailed invoice data for each colleague
  const colleagueInvoices = useMemo(() => {
    const activeColleagues = colleagues.filter(c => c.status === 'active');
    
    return activeColleagues
      .map(colleague => buildColleagueInvoiceData(
        colleague, selectedYear, selectedMonth,
        assignments, engagements, clients, extraWorks,
        getColleagueCreditsByClient, getApprovedCommissionsForColleague,
      ))
      .filter(c => c.grandTotal > 0 || c.itemCount > 0)
      .sort((a, b) => b.grandTotal - a.grandTotal);
  }, [colleagues, assignments, engagements, clients, extraWorks, selectedYear, selectedMonth, getColleagueCreditsByClient, getApprovedCommissionsForColleague]);

  const teamTotal = useMemo(() => colleagueInvoices.reduce((s, c) => s + c.grandTotal, 0), [colleagueInvoices]);
  const maxAmount = useMemo(() => Math.max(...colleagueInvoices.map(c => c.grandTotal), 1), [colleagueInvoices]);

  const handleViewDetail = (colleague: Colleague) => {
    setSelectedColleague(colleague);
    setSheetOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-3">
        <Select value={selectedMonth.toString()} onValueChange={v => setSelectedMonth(Number(v))}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {MONTHS.map((m, i) => {
              const monthNum = i + 1;
              const isFuture = selectedYear === now.getFullYear() && monthNum > now.getMonth() + 1;
              if (isFuture) return null;
              return <SelectItem key={monthNum} value={monthNum.toString()}>{m}</SelectItem>;
            })}
          </SelectContent>
        </Select>
        <Select value={selectedYear.toString()} onValueChange={v => {
          const newYear = Number(v);
          setSelectedYear(newYear);
          // If switching to current year and selected month is in the future, clamp it
          if (newYear === now.getFullYear() && selectedMonth > now.getMonth() + 1) {
            setSelectedMonth(now.getMonth() + 1);
          }
        }}>
          <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {availableYears.map(y => (
              <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Celkem k fakturaci</p>
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
                <p className="text-xs text-muted-foreground">Kolegů s výkazy</p>
                <p className="text-2xl font-bold">{colleagueInvoices.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Výkazy a odměny – {MONTHS[selectedMonth - 1]} {selectedYear}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Desktop header */}
          <div className="hidden md:grid grid-cols-[1fr_80px_120px_120px_120px_80px] gap-2 px-4 py-2 border-b text-xs font-medium text-muted-foreground">
            <span>Kolega</span>
            <span className="text-center">Položek</span>
            <span className="text-right">Klientská</span>
            <span className="text-right">Režijní</span>
            <span className="text-right">Celkem</span>
            <span></span>
          </div>
          
          <div className="divide-y">
            {colleagueInvoices.map(data => (
              <div
                key={data.colleague.id}
                className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => handleViewDetail(data.colleague)}
              >
                <div className="md:grid md:grid-cols-[1fr_80px_120px_120px_120px_80px] md:gap-2 md:items-center">
                  {/* Name */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                      {data.colleague.full_name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate text-sm">{data.colleague.full_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{data.colleague.position}</p>
                    </div>
                  </div>

                  {/* Item count */}
                  <div className="hidden md:block text-center">
                    <Badge variant="secondary" className="text-xs">{data.itemCount}</Badge>
                  </div>

                  {/* Client total */}
                  <div className="hidden md:block text-right text-sm">
                    {data.clientTotal > 0 ? `${data.clientTotal.toLocaleString('cs-CZ')} Kč` : '–'}
                  </div>

                  {/* Internal total */}
                  <div className="hidden md:block text-right text-sm text-muted-foreground">
                    {data.internalTotal > 0 ? `${data.internalTotal.toLocaleString('cs-CZ')} Kč` : '–'}
                  </div>

                  {/* Grand total */}
                  <div className="hidden md:block text-right">
                    <span className="text-sm font-bold text-primary">
                      {data.grandTotal.toLocaleString('cs-CZ')} Kč
                    </span>
                  </div>

                  {/* Action */}
                  <div className="hidden md:flex justify-end">
                    <Button variant="ghost" size="sm" className="gap-1">
                      <Eye className="h-4 w-4" />
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Mobile summary */}
                  <div className="flex items-center justify-between mt-2 md:hidden">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">{data.itemCount} položek</Badge>
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
                    <span className="font-bold text-primary">
                      {data.grandTotal.toLocaleString('cs-CZ')} Kč
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-2 hidden lg:block">
                  <Progress value={(data.grandTotal / maxAmount) * 100} className="h-1.5" />
                </div>
              </div>
            ))}

            {colleagueInvoices.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                Žádné výkazy za {MONTHS[selectedMonth - 1]} {selectedYear}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detail Sheet — now with historical view */}
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

// Re-export for use in sheet
export { buildColleagueInvoiceData };
