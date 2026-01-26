import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { cs } from 'date-fns/locale';
import { Briefcase, CreditCard, ExternalLink, Sparkles, Zap, Palette, Coins, CheckCircle, FileText } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useCRMData } from '@/hooks/useCRMData';
import { useUserRole } from '@/hooks/useUserRole';
import { useCreativeBoostData, CreativeBoostProvider } from '@/hooks/useCreativeBoostData';
import { useUpsellApprovals } from '@/hooks/useUpsellApprovals';
import { cn } from '@/lib/utils';

function MyWorkContent() {
  const navigate = useNavigate();
  const { colleagueId } = useUserRole();
  
  const { 
    colleagues,
    engagements, 
    assignments, 
    clients,
    getColleagueById,
    getEngagementServicesByEngagementId,
    services,
  } = useCRMData();
  
  const { getColleagueCredits, getColleagueCreditsYear, getColleagueCreditsDetail, getColleagueCreditsByClient } = useCreativeBoostData();
  const { getApprovedCommissionsForColleague } = useUpsellApprovals();

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  // Get current colleague based on logged-in user
  const currentColleague = useMemo(() => {
    if (!colleagueId) return null;
    return getColleagueById(colleagueId);
  }, [colleagueId, getColleagueById]);

  // Get assignments for current colleague
  const myAssignments = useMemo(() => {
    if (!currentColleague) return [];
    return assignments.filter(
      a => a.colleague_id === currentColleague.id && !a.end_date
    );
  }, [assignments, currentColleague]);

  // Calculate earnings and client data
  const myWorkData = useMemo(() => {
    let totalMonthlyEarnings = 0;
    const clientData: { 
      client: typeof clients[0], 
      engagement: typeof engagements[0], 
      assignment: typeof assignments[0],
      services: ReturnType<typeof getEngagementServicesByEngagementId>
    }[] = [];
    
    myAssignments.forEach(assignment => {
      const engagement = engagements.find(e => e.id === assignment.engagement_id);
      if (engagement) {
        const client = clients.find(c => c.id === engagement.client_id);
        if (client) {
          const engagementServicesList = getEngagementServicesByEngagementId(engagement.id);
          clientData.push({ client, engagement, assignment, services: engagementServicesList });
          totalMonthlyEarnings += assignment.monthly_cost || 0;
        }
      }
    });
    
    return { totalMonthlyEarnings, clientData };
  }, [myAssignments, engagements, clients, getEngagementServicesByEngagementId]);

  // Creative Boost credits
  const monthCredits = currentColleague ? getColleagueCredits(currentColleague.id, currentYear, currentMonth) : 0;
  const yearCredits = currentColleague ? getColleagueCreditsYear(currentColleague.id, currentYear) : 0;
  const creditsDetail = currentColleague ? getColleagueCreditsDetail(currentColleague.id, currentYear, currentMonth) : [];
  const creditsByClient = currentColleague ? getColleagueCreditsByClient(currentColleague.id, currentYear, currentMonth) : [];
  
  // Total reward from Creative Boost
  const totalCreativeBoostReward = creditsByClient.reduce((sum, c) => sum + c.totalReward, 0);

  // Approved upsell commissions for current colleague
  const approvedCommissions = currentColleague 
    ? getApprovedCommissionsForColleague(currentColleague.id, currentYear, currentMonth) 
    : [];
  const totalApprovedCommission = approvedCommissions.reduce((sum, c) => sum + c.commissionAmount, 0);

  // If no colleague is linked, show message
  if (!currentColleague) {
    return (
      <div className="p-6 space-y-6 animate-fade-in">
        <PageHeader 
          title="👤 Můj přehled" 
          titleAccent="práce"
          description="Přehled vašich zakázek a odměn"
        />
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Váš účet není propojen s profilem kolegy.</p>
        </Card>
      </div>
    );
  }

  const getServiceName = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    return service?.name || 'Neznámá služba';
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader 
        title="👤 Můj přehled" 
        titleAccent="práce"
        description={`Vítejte, ${currentColleague.full_name}`}
      />

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Aktivní zakázky
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{myWorkData.clientData.length}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Celková měsíční odměna
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">
              {myWorkData.totalMonthlyEarnings.toLocaleString()} CZK
            </p>
          </CardContent>
        </Card>

        {(monthCredits > 0 || yearCredits > 0) && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Creative Boost kredity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{monthCredits}</p>
              <p className="text-xs text-muted-foreground">tento měsíc ({yearCredits} za rok)</p>
            </CardContent>
          </Card>
        )}

        {totalCreativeBoostReward > 0 && (
          <Card className="bg-green-500/5 border-green-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Coins className="h-4 w-4 text-green-600" />
                Odměna za Creative Boost
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{totalCreativeBoostReward.toLocaleString()} Kč</p>
              <p className="text-xs text-muted-foreground">za {monthCredits} kreditů tento měsíc</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Assignments list */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Moje zakázky</h2>
        
        {myWorkData.clientData.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            Nemáte žádné aktivní zakázky
          </Card>
        ) : (
          <div className="space-y-3">
            {myWorkData.clientData.map(({ client, engagement, assignment, services: engagementServices }) => (
              <Card key={assignment.id} className="overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary font-semibold text-sm">
                          {client.brand_name.charAt(0)}
                        </div>
                        <div>
                          <button
                            onClick={() => navigate(`/engagements?highlight=${engagement.id}`)}
                            className="font-medium text-primary hover:underline flex items-center gap-1"
                          >
                            {engagement.name}
                            <ExternalLink className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => navigate(`/clients?highlight=${client.id}`)}
                            className="text-xs text-muted-foreground hover:underline"
                          >
                            {client.brand_name}
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{assignment.role_on_engagement}</p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">
                        {(assignment.monthly_cost || 0).toLocaleString()} CZK
                      </p>
                      <p className="text-xs text-muted-foreground">měsíční odměna</p>
                    </div>
                  </div>

                  {/* Services on this engagement */}
                  {engagementServices.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs text-muted-foreground mb-2">Služby:</p>
                      <div className="flex flex-wrap gap-1">
                        {engagementServices.filter(s => s.is_active).map(service => (
                          <Badge key={service.id} variant="secondary" className="text-xs">
                            {getServiceName(service.service_id)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Creative Boost rewards by client */}
      {creditsByClient.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Palette className="h-5 w-5" />
            🎨 Odměny za Creative Boost - tento měsíc
          </h2>
          <div className="grid gap-3">
            {creditsByClient.map((clientReward) => (
              <Card key={clientReward.clientId} className="overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Palette className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <button
                            onClick={() => clientReward.engagementId && navigate(`/engagements?highlight=${clientReward.engagementId}`)}
                            className="font-medium text-primary hover:underline flex items-center gap-1"
                          >
                            {clientReward.brandName || clientReward.clientName}
                            <ExternalLink className="h-3 w-3" />
                          </button>
                          <p className="text-xs text-muted-foreground">{clientReward.engagementName}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right space-y-1">
                      <p className="text-lg font-bold text-green-600">
                        {clientReward.totalReward.toLocaleString()} Kč
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {clientReward.totalCredits} kr × {clientReward.rewardPerCredit} Kč
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          
          {/* Total summary */}
          <Card className="bg-green-500/5 border-green-500/20">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Celková odměna za Creative Boost</span>
                </div>
                <span className="text-xl font-bold text-green-600">
                  {totalCreativeBoostReward.toLocaleString()} Kč
                </span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Creative Boost detail - only show if we have detail not covered by client summary */}
      {creditsDetail.length > 0 && creditsByClient.length === 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Creative Boost - tento měsíc
          </h2>
          <div className="grid gap-2">
            {creditsDetail.map((detail, idx) => (
              <Card key={idx} className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{detail.clientName}</p>
                    <p className="text-xs text-muted-foreground">{detail.outputTypeName}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {detail.expressCount > 0 && (
                      <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/20">
                        <Zap className="h-3 w-3 mr-1" />
                        Express
                      </Badge>
                    )}
                    <span className="font-bold">{detail.totalCredits} kreditů</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Approved Upsell Commissions */}
      {approvedCommissions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            💰 Schválené provize - tento měsíc
          </h2>
          <div className="grid gap-3">
            {approvedCommissions.map((commission) => (
              <Card key={`${commission.type}-${commission.id}`} className="overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                          {commission.type === 'extra_work' ? (
                            <FileText className="h-4 w-4 text-green-600" />
                          ) : (
                            <Sparkles className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                        <div>
                          <button
                            onClick={() => commission.engagementId && navigate(`/engagements?highlight=${commission.engagementId}`)}
                            className="font-medium text-primary hover:underline flex items-center gap-1"
                          >
                            {commission.brandName}
                            <ExternalLink className="h-3 w-3" />
                          </button>
                          <p className="text-xs text-muted-foreground">
                            {commission.type === 'extra_work' ? 'Vícepráce' : 'Nová služba'}: {commission.itemName}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right space-y-1">
                      <p className="text-lg font-bold text-green-600">
                        {commission.commissionAmount.toLocaleString()} {commission.currency}
                      </p>
                      <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                        ✅ Schváleno
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          
          {/* Total summary */}
          <Card className="bg-green-500/5 border-green-500/20">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Celkem schválené provize</span>
                </div>
                <span className="text-xl font-bold text-green-600">
                  {totalApprovedCommission.toLocaleString()} CZK
                </span>
              </div>
            </div>
          </Card>
        </div>
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
