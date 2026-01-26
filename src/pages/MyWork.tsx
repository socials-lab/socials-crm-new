import { useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { cs } from 'date-fns/locale';
import { 
  Briefcase, 
  CreditCard, 
  ExternalLink, 
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
import { useActivityRewards } from '@/hooks/useActivityRewards';
import { AddActivityRewardDialog } from '@/components/my-work/AddActivityRewardDialog';
import { InvoicingOverview } from '@/components/my-work/InvoicingOverview';
import { calculateProratedReward, type ProratedRewardResult } from '@/utils/proratedRewardUtils';
import { CATEGORY_LABELS } from '@/hooks/useActivityRewards';

interface ClientRewardItem {
  clientName: string;
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
  
  const { 
    colleagues,
    engagements, 
    assignments, 
    clients,
    getColleagueById,
  } = useCRMData();
  
  const { getColleagueCredits, getColleagueCreditsByClient } = useCreativeBoostData();
  const { getApprovedCommissionsForColleague } = useUpsellApprovals();
  
  // Activity rewards hook
  const {
    rewards: activityRewards,
    currentMonthTotal: activityCurrentMonthTotal,
    getRewardsByMonth,
    getRewardsByCategory,
    getMonthlyTotals,
    addReward,
    deleteReward,
  } = useActivityRewards(colleagueId);

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

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
    return assignments.filter(
      a => a.colleague_id === currentColleague.id && !a.end_date
    );
  }, [assignments, currentColleague]);

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
      if (engagement && engagement.status === 'active') {
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
            clientName: client.brand_name || client.name,
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

  // Internal work this month
  const internalWorkThisMonth = getRewardsByMonth(currentYear, currentMonth);
  const categorizedInternalWork = getRewardsByCategory(currentYear, currentMonth);

  // Total client earnings this month (WITHOUT internal work)
  const totalClientEarnings = myWorkData.totalMonthlyProrated + totalCreativeBoostReward + totalApprovedCommission;

  // Prepare data for invoicing overview
  const clientRewardsForInvoice = myWorkData.clientRewards.map((cr) => ({
    clientName: cr.clientName,
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
    clientName: comm.clientName,
    amount: comm.commissionAmount,
  }));

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold">
            👋 Ahoj, <span className="text-primary">{currentColleague.full_name.split(' ')[0]}</span>
          </h1>
          <p className="text-sm text-muted-foreground">{currentColleague.position}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Dnes</p>
          <p className="text-sm font-medium">{format(currentDate, 'EEEE d. MMMM', { locale: cs })}</p>
        </div>
      </div>


      {/* Main Content Grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        
        {/* My Engagements - with start dates */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" />
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
              myWorkData.clientData.slice(0, 5).map(({ client, engagement, assignment, startDate }) => (
                <button
                  key={assignment.id}
                  onClick={() => navigate(`/engagements?highlight=${engagement.id}`)}
                  className="w-full flex items-center gap-3 p-2 rounded-lg border hover:bg-muted/50 hover:border-primary/30 transition-all text-left"
                >
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                    {(client.brand_name || client.name).charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{client.brand_name || client.name}</p>
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
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Coins className="h-4 w-4 text-primary" />
              Odměny tento měsíc
              <Badge variant="outline" className="text-xs font-normal">za klientskou práci</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {/* Client rewards breakdown */}
            {myWorkData.clientRewards.length > 0 && (
              <div className="space-y-1.5">
                {myWorkData.clientRewards.map((item) => (
                  <div key={item.engagementId} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-sm truncate">{item.clientName}</span>
                      {item.prorated.isProrated && item.prorated.startDay && (
                        <Badge variant="secondary" className="text-xs shrink-0 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          od {item.prorated.startDay}.
                        </Badge>
                      )}
                    </div>
                    <span className={`font-medium whitespace-nowrap ${item.prorated.isProrated ? 'text-amber-600' : ''}`}>
                      {item.prorated.proratedAmount.toLocaleString()} Kč
                    </span>
                  </div>
                ))}
              </div>
            )}
            
            {totalCreativeBoostReward > 0 && (
              <div className="flex items-center justify-between py-1.5 border-t">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Creative Boost ({monthCredits} kr)
                </span>
                <span className="font-medium text-primary">{totalCreativeBoostReward.toLocaleString()} Kč</span>
              </div>
            )}
            
            {totalApprovedCommission > 0 && (
              <div className="flex items-center justify-between py-1.5 border-t">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Schválené provize
                </span>
                <span className="font-medium text-primary">{totalApprovedCommission.toLocaleString()} Kč</span>
              </div>
            )}
            
            <Separator />
            
            <div className="flex items-center justify-between pt-1">
              <span className="font-medium">Celkem za klientskou práci</span>
              <span className="text-xl font-bold text-primary">{totalClientEarnings.toLocaleString()} Kč</span>
            </div>
          </CardContent>
        </Card>

        {/* NEW: Internal Work Section */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                Interní práce
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
              Práce mimo klienty (marketing, režijní služby) – pro fakturaci
            </p>
            
            {internalWorkThisMonth.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">Žádná interní práce tento měsíc</p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => setShowAddActivityDialog(true)}
                >
                  Přidat činnost
                </Button>
              </div>
            ) : (
              <>
                {/* Marketing */}
                {categorizedInternalWork.marketing.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Megaphone className="h-3 w-3" />
                      <span>{CATEGORY_LABELS.marketing}</span>
                    </div>
                    {categorizedInternalWork.marketing.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-1 pl-5">
                        <span className="text-sm truncate">{item.invoice_item_name}</span>
                        <span className="font-medium">{item.amount.toLocaleString()} Kč</span>
                      </div>
                    ))}
                    {categorizedInternalWork.marketing.length > 3 && (
                      <p className="text-xs text-muted-foreground pl-5">
                        +{categorizedInternalWork.marketing.length - 3} dalších položek
                      </p>
                    )}
                  </div>
                )}
                
                {/* Overhead */}
                {categorizedInternalWork.overhead.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Building2 className="h-3 w-3" />
                      <span>{CATEGORY_LABELS.overhead}</span>
                    </div>
                    {categorizedInternalWork.overhead.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-1 pl-5">
                        <span className="text-sm truncate">{item.invoice_item_name}</span>
                        <span className="font-medium">{item.amount.toLocaleString()} Kč</span>
                      </div>
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
                  <span className="font-medium">Celkem interní práce</span>
                  <span className="text-lg font-bold text-primary">{activityCurrentMonthTotal.toLocaleString()} Kč</span>
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
            <div className="grid gap-2 sm:grid-cols-2 max-h-[400px] overflow-y-auto">
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
        clientRewards={clientRewardsForInvoice}
        creativeBoostItems={creativeBoostForInvoice}
        commissionItems={commissionsForInvoice}
        internalRewards={activityRewards}
        getRewardsByMonth={getRewardsByMonth}
        getRewardsByCategory={getRewardsByCategory}
        onAddInternalWork={() => setShowAddActivityDialog(true)}
      />

      {/* Socials HUB */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-6">
          <a 
            href="https://notion.so/socials-hub" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-4 group"
          >
            <div className="p-4 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                Socials HUB
                <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </h3>
              <p className="text-sm text-muted-foreground">
                Přístupové údaje • SOP & Procesy • Mise & Vize • Hodnoty • Principy rozhodování
              </p>
            </div>
          </a>
        </CardContent>
      </Card>


      {/* Add Activity Reward Dialog */}
      {currentColleague && (
        <AddActivityRewardDialog
          open={showAddActivityDialog}
          onOpenChange={setShowAddActivityDialog}
          onAdd={addReward}
          colleagueId={currentColleague.id}
        />
      )}
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
