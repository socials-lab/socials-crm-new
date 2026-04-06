import { useCallback, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { cs } from 'date-fns/locale';
// @ts-ignore - no types available
import { vokativ } from 'vokativ';
import { 
  Briefcase, 
  CreditCard, 
  Sparkles, 
  Coins, 
  CheckCircle, 
  Mail,
  Phone,
  FileText,
  Users,
  Package,
  GraduationCap,
  Building2,
  Plus,
  CalendarDays,
  AlertCircle,
  Megaphone,
  Wrench,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useCRMData } from '@/hooks/useCRMData';
import { useUserRole } from '@/hooks/useUserRole';
import { useCreativeBoostData, CreativeBoostProvider } from '@/hooks/useCreativeBoostData';
import { useUpsellApprovals } from '@/hooks/useUpsellApprovals';
import { useActivityRewards, type ActivityReward } from '@/hooks/useActivityRewards';
import { useCzkEurRate } from '@/hooks/useCzkEurRate';
import { AddActivityRewardDialog } from '@/components/my-work/AddActivityRewardDialog';
import { EditActivityRewardDialog } from '@/components/my-work/EditActivityRewardDialog';
import { InvoicingOverview } from '@/components/my-work/InvoicingOverview';
import { calculateProratedReward, type ProratedRewardResult } from '@/utils/proratedRewardUtils';
import { CATEGORY_LABELS } from '@/hooks/useActivityRewards';

interface ClientRewardItem {
  companyName: string;
  engagementId: string;
  role: string;
  fullMonthlyAmount: number;
  prorated: ProratedRewardResult;
  startDate: string | null;
}

function MyWorkContent() {
  const navigate = useNavigate();
  const { colleagueId } = useUserRole();
  const [showAddActivityDialog, setShowAddActivityDialog] = useState(false);
  const [addActivityDefaultDate, setAddActivityDefaultDate] = useState<string | undefined>(undefined);
  const [editingReward, setEditingReward] = useState<ActivityReward | null>(null);
  
  const { 
    colleagues,
    engagements, 
    assignments, 
    clients,
    extraWorks,
    getColleagueById,
  } = useCRMData();
  
  const { getColleagueCredits, getColleagueCreditsByClient } = useCreativeBoostData();
  const { getApprovedCommissionsForColleague } = useUpsellApprovals();
  const { convertCzkToEur, eurRate, rateDate } = useCzkEurRate();
  
  // Activity rewards hook
  const {
    rewards: activityRewards,
    isLoading: isLoadingRewards,
    error: rewardsError,
    refetch: refetchRewards,
    getRewardsByMonth,
    getRewardsByCategory,
    getMonthlyTotals,
    addReward,
    updateReward,
    deleteReward,
  } = useActivityRewards(colleagueId);

  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const currentYear = selectedYear;
  const currentMonth = selectedMonth;
  const monthLabel = format(new Date(selectedYear, selectedMonth - 1), 'LLLL yyyy', { locale: cs });
  const capitalizedMonthLabel = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

  const goToPreviousMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((y) => y - 1);
      return;
    }
    setSelectedMonth((m) => m - 1);
  };

  const goToNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((y) => y + 1);
      return;
    }
    setSelectedMonth((m) => m + 1);
  };

  // Get current colleague
  const currentColleague = useMemo(() => {
    if (!colleagueId) return null;
    return getColleagueById(colleagueId);
  }, [colleagueId, getColleagueById]);

  // Active colleagues for contacts (excluding current) - show ALL
  const activeColleagues = useMemo(() => {
    return colleagues
      .filter(c => c.status === 'active' && c.id !== colleagueId)
      .sort((a, b) => a.full_name.localeCompare(b.full_name, 'cs'));
  }, [colleagues, colleagueId]);

  // Get assignments for current colleague
  const myAssignments = useMemo(() => {
    if (!currentColleague) return [];
    const monthStart = new Date(currentYear, currentMonth - 1, 1);
    const monthEnd = new Date(currentYear, currentMonth, 0);

    return assignments.filter(a => {
      if (a.colleague_id !== currentColleague.id) return false;
      const eng = engagements.find(e => e.id === a.engagement_id);
      if (!eng) return false;
      // Exclude cancelled/completed engagements
      if (eng.status === 'cancelled' || eng.status === 'completed') return false;

      // Include assignments and engagements that overlap selected month.
      const assignmentStart = a.start_date ? new Date(a.start_date) : null;
      const assignmentEnd = a.end_date ? new Date(a.end_date) : null;
      const engagementStart = eng.start_date ? new Date(eng.start_date) : null;
      const engagementEnd = eng.end_date ? new Date(eng.end_date) : null;

      if (assignmentStart && assignmentStart > monthEnd) return false;
      if (assignmentEnd && assignmentEnd < monthStart) return false;
      if (engagementStart && engagementStart > monthEnd) return false;
      if (engagementEnd && engagementEnd < monthStart) return false;

      return true;
    });
  }, [assignments, currentColleague, engagements, currentYear, currentMonth]);

  // Calculate earnings and client data with prorated rewards
  const myWorkData = useMemo(() => {
    let totalMonthlyFull = 0;
    let totalMonthlyProrated = 0;
    const clientData: { 
      client: typeof clients[0], 
      engagement: typeof engagements[0], 
      assignment: typeof assignments[0],
      startDate: string | null,
    }[] = [];
    
    const clientRewards: ClientRewardItem[] = [];
    
    myAssignments.forEach(assignment => {
      const engagement = engagements.find(e => e.id === assignment.engagement_id);
      if (engagement) {
        const client = clients.find(c => c.id === engagement.client_id);
        if (client) {
          const monthlyAmount = assignment.monthly_cost || 0;
          const prorated = calculateProratedReward(
            monthlyAmount,
            assignment.start_date,
            currentYear,
            currentMonth
          );
          
          clientData.push({ 
            client, 
            engagement, 
            assignment,
            startDate: assignment.start_date || null,
          });
          
          clientRewards.push({
            companyName: client.name,
            engagementId: engagement.id,
            role: assignment.role_on_engagement || 'Specialista',
            fullMonthlyAmount: monthlyAmount,
            prorated,
            startDate: assignment.start_date || null,
          });
          
          totalMonthlyFull += monthlyAmount;
          totalMonthlyProrated += prorated.proratedAmount;
        }
      }
    });
    
    return { totalMonthlyFull, totalMonthlyProrated, clientData, clientRewards };
  }, [myAssignments, engagements, clients, currentYear, currentMonth]);

  // Creative Boost
  const monthCredits = currentColleague ? getColleagueCredits(currentColleague.id, currentYear, currentMonth) : 0;
  const creditsByClient = currentColleague ? getColleagueCreditsByClient(currentColleague.id, currentYear, currentMonth) : [];
  const totalCreativeBoostReward = creditsByClient.reduce((sum, c) => sum + c.totalReward, 0);

  // Approved commissions
  const approvedCommissions = currentColleague 
    ? getApprovedCommissionsForColleague(currentColleague.id, currentYear, currentMonth) 
    : [];
  const totalApprovedCommission = approvedCommissions.reduce((sum, c) => sum + c.commissionAmount, 0);

  // Extra work for current colleague this month (ready_to_invoice or invoiced)
  const myExtraWorks = useMemo(() => {
    if (!currentColleague) return [];
    return extraWorks.filter(ew => {
      if (ew.colleague_id !== currentColleague.id) return false;
      // Only show approved (ready_to_invoice or invoiced)
      if (ew.status !== 'ready_to_invoice' && ew.status !== 'invoiced') return false;
      // Check billing period matches current month
      const [ewYear, ewMonth] = ew.billing_period.split('-').map(Number);
      return ewYear === currentYear && ewMonth === currentMonth;
    });
  }, [extraWorks, currentColleague, currentYear, currentMonth]);

  // Calculate colleague earnings from extra work using their hourly rate × hours
  const getColleagueExtraWorkAmount = (ew: typeof extraWorks[0]) => {
    if (currentColleague?.internal_hourly_cost && ew.hours_worked) {
      return currentColleague.internal_hourly_cost * ew.hours_worked;
    }
    return ew.amount; // fallback to client amount if no hourly rate or hours
  };

  const totalExtraWork = myExtraWorks.reduce((sum, ew) => sum + getColleagueExtraWorkAmount(ew), 0);

  // Client names for activity reward dialog (sorted, unique brand_name or name)
  const clientNames = useMemo(() => {
    return [...new Set(clients.map(c => c.brand_name || c.name))].sort((a, b) => a.localeCompare(b, 'cs'));
  }, [clients]);

  const clientWorkOptions = useMemo(() => {
    const optionMap = new Map<string, { id: string; label: string; legalName: string }>();
    engagements
      .filter((engagement) => engagement.status !== 'cancelled' && engagement.status !== 'completed')
      .forEach((engagement) => {
        const client = clients.find((c) => c.id === engagement.client_id);
        if (!client) return;
        const legalName = client.name;
        const brandName = client.brand_name || client.name;
        const label = `${engagement.name} - ${brandName}`;
        optionMap.set(engagement.id, {
          id: engagement.id,
          label,
          legalName,
        });
      });

    return Array.from(optionMap.values()).sort((a, b) => a.label.localeCompare(b.label, 'cs'));
  }, [engagements, clients]);

  // Internal work this month
  const internalWorkThisMonth = getRewardsByMonth(currentYear, currentMonth);
  const categorizedInternalWork = getRewardsByCategory(currentYear, currentMonth);
  const manualItemsTotal = internalWorkThisMonth.reduce((sum, item) => sum + item.amount, 0);

  // Total client earnings this month (WITHOUT internal work)
  const totalClientEarnings = myWorkData.totalMonthlyProrated + totalCreativeBoostReward + totalApprovedCommission + totalExtraWork;
  const showEurConversion = currentColleague?.invoice_currency === 'EUR';

  const formatAmountWithOptionalEur = useCallback(
    (amountCzk: number) => {
      const czk = `${amountCzk.toLocaleString('cs-CZ')} Kč`;
      if (!showEurConversion) return czk;
      const eur = convertCzkToEur(amountCzk);
      if (eur == null) return `${czk} (EUR přepočet nedostupný)`;
      return `${czk} (~${eur.toLocaleString('cs-CZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR)`;
    },
    [showEurConversion, convertCzkToEur],
  );

  // Prepare data for invoicing overview
  const clientRewardsForInvoice = myWorkData.clientRewards.map((cr) => ({
    clientName: cr.companyName,
    engagementId: cr.engagementId,
    amount: cr.prorated.proratedAmount,
    isProrated: cr.prorated.isProrated,
    startDay: cr.prorated.startDay,
  }));

  const creativeBoostForInvoice = creditsByClient.map((cb) => ({
    clientName: cb.clientName,
    credits: cb.totalCredits,
    reward: cb.totalReward,
  }));

  const commissionsForInvoice = approvedCommissions.map((comm) => ({
    clientName: comm.clientName || comm.brandName || 'Neznámý klient',
    amount: comm.commissionAmount,
  }));

  const extraWorksForInvoice = myExtraWorks.map((ew) => {
    const client = clients.find(c => c.id === ew.client_id);
    const colleagueAmount = getColleagueExtraWorkAmount(ew);
    return {
      clientName: client?.name || 'Neznámý klient',
      name: ew.name,
      amount: colleagueAmount,
      hours: ew.hours_worked,
      hourlyRate: currentColleague?.internal_hourly_cost,
    };
  });

  // Get client data for any month (used by InvoicingOverview for past months)
  const getClientDataForMonth = useCallback((year: number, month: number) => {
    if (!currentColleague) return { clientRewards: [], creativeBoostItems: [], commissionItems: [], extraWorkItems: [] };
    const now = new Date();

    // Get assignments active in that month
    const monthAssignments = assignments.filter(a => {
      if (a.colleague_id !== currentColleague.id) return false;
      const eng = engagements.find(e => e.id === a.engagement_id);
      if (!eng) return false;
      if (eng.status === 'cancelled' || eng.status === 'completed') return false;
      // Check engagement was active during the requested month
      const monthStart = new Date(year, month - 1, 1);
      const monthEnd = new Date(year, month, 0);
      const engStart = new Date(eng.start_date);
      const engEnd = eng.end_date ? new Date(eng.end_date) : null;
      if (engStart > monthEnd) return false;
      if (engEnd && engEnd < monthStart) return false;
      if (a.end_date && new Date(a.end_date) < monthStart) return false;
      return true;
    });

    const cr = monthAssignments.map(assignment => {
      const eng = engagements.find(e => e.id === assignment.engagement_id);
      const client = eng ? clients.find(c => c.id === eng.client_id) : null;
      const monthlyAmount = assignment.monthly_cost || 0;
      const prorated = calculateProratedReward(monthlyAmount, assignment.start_date, year, month);
      return {
        clientName: client?.name || client?.brand_name || '',
        engagementId: assignment.engagement_id,
        amount: prorated.proratedAmount,
        isProrated: prorated.isProrated,
        startDay: prorated.startDay,
      };
    }).filter(r => r.clientName);

    const cbByClient = getColleagueCreditsByClient(currentColleague.id, year, month);
    const cb = cbByClient.map(c => ({ clientName: c.clientName, credits: c.totalCredits, reward: c.totalReward }));

    const comms = getApprovedCommissionsForColleague(currentColleague.id, year, month)
      .map(c => ({ clientName: c.clientName || c.brandName || 'Neznámý klient', amount: c.commissionAmount }));

    const monthExtraWorks = extraWorks.filter(ew => {
      if (!ew.colleague_id || ew.colleague_id !== currentColleague.id) return false;
      if (!ew.work_date) return false;
      const d = new Date(ew.work_date);
      return d.getFullYear() === year && d.getMonth() + 1 === month;
    });
    const ew = monthExtraWorks.map(e => {
      const client = clients.find(c => c.id === e.client_id);
      const amount = currentColleague.internal_hourly_cost && e.hours_worked
        ? currentColleague.internal_hourly_cost * e.hours_worked
        : e.amount;
      return { clientName: client?.name || '', name: e.name, amount, hours: e.hours_worked, hourlyRate: currentColleague.internal_hourly_cost };
    });

    return { clientRewards: cr, creativeBoostItems: cb, commissionItems: comms, extraWorkItems: ew };
  }, [currentColleague, assignments, engagements, clients, extraWorks, getColleagueCreditsByClient, getApprovedCommissionsForColleague, calculateProratedReward]);

  // No colleague linked
  if (!currentColleague) {
    return (
      <div className="p-4 md:p-6 space-y-6 animate-fade-in">
        <PageHeader 
          title="👤 Můj přehled" 
          description="Přehled vašich zakázek a odměn"
        />
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Váš účet není propojen s profilem kolegy.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-5 animate-fade-in">
      {/* Header with greeting */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-semibold">
            👋 Ahoj, <span className="text-primary">{vokativ(currentColleague.full_name.split(' ')[0]).replace(/^./, (c: string) => c.toUpperCase())}</span>
          </h1>
          <p className="text-sm text-muted-foreground">{currentColleague.position}</p>
        </div>
        <div className="shrink-0 flex flex-col items-start sm:items-end gap-2">
          <div className="text-left sm:text-right">
            <p className="text-xs text-muted-foreground">Dnes</p>
            <p className="text-sm font-medium">{format(currentDate, 'EEEE d. MMMM', { locale: cs })}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-[120px] text-center text-sm font-medium">
              {capitalizedMonthLabel}
            </div>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>


      {/* Main Content Grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        
        {/* My Engagements - with start dates */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="flex min-w-0 items-center gap-2 text-sm font-medium">
                <Briefcase className="h-4 w-4 shrink-0 text-primary" />
                Moje zakázky
              </CardTitle>
              <Link to="/engagements">
                <Button variant="ghost" size="sm" className="text-xs h-7">Zobrazit vše</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {myWorkData.clientData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nemáte aktivní zakázky</p>
            ) : (
              myWorkData.clientData.map(({ client, engagement, assignment, startDate }) => (
                <button
                  key={assignment.id}
                  onClick={() => navigate(`/engagements?highlight=${engagement.id}`)}
                  className="w-full flex items-center gap-3 p-2 rounded-lg border hover:bg-muted/50 hover:border-primary/30 transition-all text-left"
                >
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                    {(client.brand_name || client.name).charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{engagement.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="truncate">{assignment.role_on_engagement}</span>
                      {startDate && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 shrink-0">
                            <CalendarDays className="h-3 w-3" />
                            od {format(parseISO(startDate), 'd. M. yyyy')}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-primary whitespace-nowrap">
                    {(assignment.monthly_cost || 0).toLocaleString()} Kč
                  </span>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        {/* Earnings Summary - CLIENT WORK ONLY */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 flex-wrap">
              <Coins className="h-4 w-4 text-primary" />
              Odměny
              <Badge variant="outline" className="text-xs font-normal">za klientskou práci</Badge>
              {showEurConversion && (
                <Badge variant="secondary" className="text-xs font-normal">
                  fakturace v EUR
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {showEurConversion && eurRate && (
              <p className="text-xs text-muted-foreground">
                Aktuální kurz: 1 CZK = {eurRate.toFixed(4)} EUR{rateDate ? ` (${rateDate})` : ''}
              </p>
            )}
            {/* Client rewards breakdown */}
            {myWorkData.clientRewards.length > 0 && (
              <div className="space-y-1.5">
                {myWorkData.clientRewards.map((item) => (
                  <div key={item.engagementId} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-sm truncate">{item.companyName}</span>
                      {item.prorated.isProrated && item.prorated.startDay && (
                        <Badge variant="secondary" className="text-xs shrink-0 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          od {item.prorated.startDay}.
                        </Badge>
                      )}
                    </div>
                    <span className={`font-medium whitespace-nowrap ${item.prorated.isProrated ? 'text-amber-600' : ''}`}>
                      {formatAmountWithOptionalEur(item.prorated.proratedAmount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
            
            {creditsByClient.length > 0 && (
              <div className="space-y-1.5 border-t pt-1.5">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Sparkles className="h-3 w-3" />
                  Creative Boost ({monthCredits} kr)
                </div>
                {creditsByClient.map((cb) => (
                  <div key={cb.clientId} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-sm truncate">{cb.brandName || cb.clientName}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        {cb.bannerCredits > 0 && (
                          <Badge variant="outline" className="text-[10px] h-4">
                            🖼️ {cb.bannerCredits} kr × {cb.bannerRewardPerCredit} Kč
                          </Badge>
                        )}
                        {cb.videoCredits > 0 && (
                          <Badge variant="secondary" className="text-[10px] h-4">
                            🎬 {cb.videoCredits} kr × {cb.videoRewardPerCredit} Kč
                          </Badge>
                        )}
                      </div>
                    </div>
                    <span className="font-medium text-primary whitespace-nowrap">{cb.totalReward.toLocaleString()} Kč</span>
                    
                  </div>
                ))}
                {creditsByClient.length > 1 && (
                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span className="text-muted-foreground">Creative Boost celkem</span>
                    <span className="font-semibold text-primary">{totalCreativeBoostReward.toLocaleString()} Kč</span>
                    
                  </div>
                )}
              </div>
            )}
            
            {approvedCommissions.length > 0 && (
              <div className="space-y-1.5 border-t pt-1.5">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <CheckCircle className="h-3 w-3" />
                  Schválené provize
                </div>
                {approvedCommissions.map((comm) => (
                  <div key={comm.id} className="flex items-center justify-between py-1">
                    <span className="text-sm truncate">
                      {(comm.brandName || comm.clientName || 'Neznámý klient')} - provize
                    </span>
                    <span className="font-medium text-primary whitespace-nowrap">
                      {formatAmountWithOptionalEur(comm.commissionAmount)}
                    </span>
                  </div>
                ))}
                {approvedCommissions.length > 1 && (
                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span className="text-muted-foreground">Provize celkem</span>
                    <span className="font-semibold text-primary">{formatAmountWithOptionalEur(totalApprovedCommission)}</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Extra Work */}
            {myExtraWorks.length > 0 && (
              <div className="space-y-1.5 border-t pt-1.5">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Wrench className="h-3 w-3" />
                  Více práce
                </div>
                {myExtraWorks.map((ew) => {
                  const client = clients.find(c => c.id === ew.client_id);
                  const colleagueAmount = getColleagueExtraWorkAmount(ew);
                  return (
                    <div key={ew.id} className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-sm truncate">{client?.name || 'Neznámý klient'} – {ew.name}</span>
                        {ew.hours_worked && currentColleague?.internal_hourly_cost && (
                          <Badge variant="secondary" className="text-xs shrink-0">
                            {ew.hours_worked}h × {currentColleague.internal_hourly_cost} Kč
                          </Badge>
                        )}
                      </div>
                      <span className="font-medium">{colleagueAmount.toLocaleString()} Kč</span>
                      
                    </div>
                  );
                })}
              </div>
            )}
            
            <Separator />
            
            <div className="flex items-center justify-between pt-1">
              <span className="font-medium">Celkem za klientskou práci</span>
              <span className="text-xl font-bold text-primary">{formatAmountWithOptionalEur(totalClientEarnings)}</span>
            </div>
            {currentColleague?.min_monthly_reward != null && currentColleague.min_monthly_reward > 0 && (
              <div className="flex items-center justify-between pt-2 mt-2 border-t border-dashed">
                <span className="text-xs text-muted-foreground">Garantovaná min. odměna</span>
                <span className={`text-sm font-medium ${totalClientEarnings >= currentColleague.min_monthly_reward ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {currentColleague.min_monthly_reward.toLocaleString()} Kč
                  {totalClientEarnings < currentColleague.min_monthly_reward && (
                    <span className="text-xs ml-1">(doplatek {(currentColleague.min_monthly_reward - totalClientEarnings).toLocaleString()} Kč)</span>
                  )}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Manual Items Section */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Manuální položky
              </CardTitle>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 h-7"
                onClick={() => setShowAddActivityDialog(true)}
              >
                <Plus className="h-3.5 w-3.5" />
                Přidat
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Manuálně přidané položky (marketing, interní práce, práce na klientovi) – pro fakturaci
            </p>

            {isLoadingRewards ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">Načítání položek...</p>
              </div>
            ) : rewardsError ? (
              <div className="text-center py-4 space-y-2">
                <p className="text-sm text-destructive">
                  {rewardsError instanceof Error ? rewardsError.message : 'Nepodařilo se načíst položky'}
                </p>
                <Button variant="outline" size="sm" onClick={() => refetchRewards()}>
                  Zkusit znovu
                </Button>
              </div>
            ) : internalWorkThisMonth.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">Žádné manuální položky tento měsíc</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={() => setShowAddActivityDialog(true)}
                >
                  Přidat položku
                </Button>
              </div>
            ) : (
              <>
                {/* Client Work - shown first */}
                {categorizedInternalWork.client_work.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Briefcase className="h-3 w-3" />
                      <span>{CATEGORY_LABELS.client_work}</span>
                    </div>
                    {categorizedInternalWork.client_work.slice(0, 3).map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setEditingReward(item)}
                        className="w-full flex items-center justify-between py-1 pl-5 hover:bg-muted/50 rounded px-2 text-left"
                      >
                        <span className="text-sm truncate">{item.invoice_item_name}</span>
                        <span className="font-medium">{formatAmountWithOptionalEur(item.amount)}</span>
                      </button>
                    ))}
                    {categorizedInternalWork.client_work.length > 3 && (
                      <p className="text-xs text-muted-foreground pl-5">
                        +{categorizedInternalWork.client_work.length - 3} dalších položek
                      </p>
                    )}
                  </div>
                )}

                {/* Marketing */}
                {categorizedInternalWork.marketing.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Megaphone className="h-3 w-3" />
                      <span>{CATEGORY_LABELS.marketing}</span>
                    </div>
                    {categorizedInternalWork.marketing.slice(0, 3).map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setEditingReward(item)}
                        className="w-full flex items-center justify-between py-1 pl-5 hover:bg-muted/50 rounded px-2 text-left"
                      >
                        <span className="text-sm truncate">{item.invoice_item_name}</span>
                        <span className="font-medium">{formatAmountWithOptionalEur(item.amount)}</span>
                      </button>
                    ))}
                    {categorizedInternalWork.marketing.length > 3 && (
                      <p className="text-xs text-muted-foreground pl-5">
                        +{categorizedInternalWork.marketing.length - 3} dalších položek
                      </p>
                    )}
                  </div>
                )}

                {/* Overhead / Internal */}
                {categorizedInternalWork.overhead.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Building2 className="h-3 w-3" />
                      <span>{CATEGORY_LABELS.overhead}</span>
                    </div>
                    {categorizedInternalWork.overhead.slice(0, 3).map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setEditingReward(item)}
                        className="w-full flex items-center justify-between py-1 pl-5 hover:bg-muted/50 rounded px-2 text-left"
                      >
                        <span className="text-sm truncate">{item.invoice_item_name}</span>
                        <span className="font-medium">{formatAmountWithOptionalEur(item.amount)}</span>
                      </button>
                    ))}
                    {categorizedInternalWork.overhead.length > 3 && (
                      <p className="text-xs text-muted-foreground pl-5">
                        +{categorizedInternalWork.overhead.length - 3} dalších položek
                      </p>
                    )}
                  </div>
                )}

                <Separator />

                <div className="flex items-center justify-between">
                  <span className="font-medium">Celkem manuální položky</span>
                  <span className="text-lg font-bold text-primary">{formatAmountWithOptionalEur(manualItemsTotal)}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Team Contacts - All colleagues with contact info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Kontakty kolegů
              <Badge variant="outline" className="text-xs font-normal">{activeColleagues.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 lg:max-h-[400px] lg:overflow-y-auto">
              {activeColleagues.map((colleague) => (
                <div key={colleague.id} className="p-3 rounded-lg border space-y-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {colleague.full_name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{colleague.full_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{colleague.position}</p>
                    </div>
                  </div>
                  <div className="space-y-1 pl-10">
                    <a 
                      href={`mailto:${colleague.email}`} 
                      className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{colleague.email}</span>
                    </a>
                    {colleague.phone ? (
                      <a 
                        href={`tel:${colleague.phone}`} 
                        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Phone className="h-3 w-3" />
                        <span>{colleague.phone}</span>
                      </a>
                    ) : (
                      <span className="flex items-center gap-2 text-xs text-muted-foreground/50">
                        <Phone className="h-3 w-3" />
                        <span>—</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoicing Overview - Complete invoice items */}
      <InvoicingOverview
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        clientRewards={clientRewardsForInvoice}
        creativeBoostItems={creativeBoostForInvoice}
        commissionItems={commissionsForInvoice}
        extraWorkItems={extraWorksForInvoice}
        getClientDataForMonth={getClientDataForMonth}
        internalRewards={activityRewards}
        getRewardsByCategory={getRewardsByCategory}
        invoiceCurrency={currentColleague.invoice_currency}
        convertCzkToEur={convertCzkToEur}
        onAddInternalWork={(year, month) => {
          const defaultDate = `${year}-${String(month).padStart(2, '0')}-15`;
          setAddActivityDefaultDate(defaultDate);
          setShowAddActivityDialog(true);
        }}
        onEditReward={(reward) => setEditingReward(reward)}
      />

      {/* Add Activity Reward Dialog */}
      {colleagueId && (
        <AddActivityRewardDialog
          open={showAddActivityDialog}
          onOpenChange={(open) => {
            setShowAddActivityDialog(open);
            if (!open) setAddActivityDefaultDate(undefined);
          }}
          onAdd={addReward}
          colleagueId={colleagueId}
          clientNames={clientNames}
          clientOptions={clientWorkOptions}
          defaultDate={addActivityDefaultDate}
        />
      )}

      {/* Edit Activity Reward Dialog */}
      <EditActivityRewardDialog
        open={!!editingReward}
        onOpenChange={(open) => !open && setEditingReward(null)}
        reward={editingReward}
        onUpdate={updateReward}
        onDelete={deleteReward}
        clientNames={clientNames}
        clientOptions={clientWorkOptions}
      />
    </div>
  );
}

export default function MyWork() {
  return (
    <CreativeBoostProvider>
      <MyWorkContent />
    </CreativeBoostProvider>
  );
}
