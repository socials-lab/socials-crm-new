import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, CreditCard, ExternalLink, Sparkles, Zap } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ColorBadge } from '@/components/shared/ColorBadge';
import { useCRMData } from '@/hooks/useCRMData';
import { useUserRole } from '@/hooks/useUserRole';
import { useCreativeBoostData, CreativeBoostProvider } from '@/hooks/useCreativeBoostData';
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
  
  const { getColleagueCredits, getColleagueCreditsYear, getColleagueCreditsDetail } = useCreativeBoostData();

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

      {/* Creative Boost detail */}
      {creditsDetail.length > 0 && (
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
                      <ColorBadge color="amber" className="text-xs" icon={<Zap className="h-3 w-3" />}>
                        Express
                      </ColorBadge>
                    )}
                    <span className="font-bold">{detail.totalCredits} kreditů</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
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
