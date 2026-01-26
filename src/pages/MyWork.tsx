import { useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
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
  Calendar,
  FileText,
  Users,
  Clock,
  Package,
  GraduationCap,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useCRMData } from '@/hooks/useCRMData';
import { useUserRole } from '@/hooks/useUserRole';
import { useMeetingsData } from '@/hooks/useMeetingsData';
import { useCreativeBoostData, CreativeBoostProvider } from '@/hooks/useCreativeBoostData';
import { useUpsellApprovals } from '@/hooks/useUpsellApprovals';

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
  
  const { getTodaysMeetings, getUpcomingMeetings } = useMeetingsData();
  const { getColleagueCredits, getColleagueCreditsByClient } = useCreativeBoostData();
  const { getApprovedCommissionsForColleague } = useUpsellApprovals();

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  // Get current colleague
  const currentColleague = useMemo(() => {
    if (!colleagueId) return null;
    return getColleagueById(colleagueId);
  }, [colleagueId, getColleagueById]);

  // Active colleagues for contacts (excluding current)
  const activeColleagues = useMemo(() => {
    return colleagues
      .filter(c => c.status === 'active' && c.id !== colleagueId)
      .slice(0, 6);
  }, [colleagues, colleagueId]);

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
    }[] = [];
    
    myAssignments.forEach(assignment => {
      const engagement = engagements.find(e => e.id === assignment.engagement_id);
      if (engagement && engagement.status === 'active') {
        const client = clients.find(c => c.id === engagement.client_id);
        if (client) {
          clientData.push({ client, engagement, assignment });
          totalMonthlyEarnings += assignment.monthly_cost || 0;
        }
      }
    });
    
    return { totalMonthlyEarnings, clientData };
  }, [myAssignments, engagements, clients]);

  // Meetings
  const todaysMeetings = getTodaysMeetings();
  const upcomingMeetings = getUpcomingMeetings(7);

  // Creative Boost
  const monthCredits = currentColleague ? getColleagueCredits(currentColleague.id, currentYear, currentMonth) : 0;
  const creditsByClient = currentColleague ? getColleagueCreditsByClient(currentColleague.id, currentYear, currentMonth) : [];
  const totalCreativeBoostReward = creditsByClient.reduce((sum, c) => sum + c.totalReward, 0);

  // Approved commissions
  const approvedCommissions = currentColleague 
    ? getApprovedCommissionsForColleague(currentColleague.id, currentYear, currentMonth) 
    : [];
  const totalApprovedCommission = approvedCommissions.reduce((sum, c) => sum + c.commissionAmount, 0);

  // Total earnings this month
  const totalMonthlyEarnings = myWorkData.totalMonthlyEarnings + totalCreativeBoostReward + totalApprovedCommission;

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

      {/* Quick Summary Cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Card className="p-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Briefcase className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{myWorkData.clientData.length}</p>
              <p className="text-xs text-muted-foreground">zakázek</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <CreditCard className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{(totalMonthlyEarnings / 1000).toFixed(0)}k</p>
              <p className="text-xs text-muted-foreground">měsíčně</p>
            </div>
          </div>
        </Card>

        <Card className="p-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{todaysMeetings.length}</p>
              <p className="text-xs text-muted-foreground">meetingů dnes</p>
            </div>
          </div>
        </Card>

        {monthCredits > 0 && (
          <Card className="p-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{monthCredits}</p>
                <p className="text-xs text-muted-foreground">CB kreditů</p>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        
        {/* My Engagements - Compact */}
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
              myWorkData.clientData.slice(0, 5).map(({ client, engagement, assignment }) => (
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
                    <p className="text-xs text-muted-foreground truncate">{assignment.role_on_engagement}</p>
                  </div>
                  <span className="text-sm font-semibold text-primary whitespace-nowrap">
                    {(assignment.monthly_cost || 0).toLocaleString()} Kč
                  </span>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        {/* Earnings Summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Coins className="h-4 w-4 text-primary" />
              Odměny tento měsíc
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">Fixní odměna ze zakázek</span>
              <span className="font-medium">{myWorkData.totalMonthlyEarnings.toLocaleString()} Kč</span>
            </div>
            
            {totalCreativeBoostReward > 0 && (
              <div className="flex items-center justify-between py-2 border-t">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Creative Boost ({monthCredits} kr)
                </span>
                <span className="font-medium text-primary">{totalCreativeBoostReward.toLocaleString()} Kč</span>
              </div>
            )}
            
            {totalApprovedCommission > 0 && (
              <div className="flex items-center justify-between py-2 border-t">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Schválené provize
                </span>
                <span className="font-medium text-primary">{totalApprovedCommission.toLocaleString()} Kč</span>
              </div>
            )}
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <span className="font-medium">Celkem</span>
              <span className="text-xl font-bold text-primary">{totalMonthlyEarnings.toLocaleString()} Kč</span>
            </div>
          </CardContent>
        </Card>

        {/* Today's Meetings */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Dnešní meetingy
              </CardTitle>
              <Link to="/meetings">
                <Button variant="ghost" size="sm" className="text-xs h-7">Všechny</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {todaysMeetings.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Žádné meetingy na dnes</p>
            ) : (
              <div className="space-y-2">
                {todaysMeetings.slice(0, 4).map((meeting) => {
                  const client = meeting.client_id ? clients.find(c => c.id === meeting.client_id) : null;
                  return (
                    <div key={meeting.id} className="flex items-center gap-3 p-2 rounded-lg border">
                      <div className="p-1.5 rounded bg-primary/10">
                        <Clock className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{meeting.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(meeting.scheduled_at), 'HH:mm')} • {meeting.duration_minutes} min
                          {client && ` • ${client.brand_name || client.name}`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Team Contacts */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Kontakty kolegů
              </CardTitle>
              <Link to="/colleagues">
                <Button variant="ghost" size="sm" className="text-xs h-7">Všichni</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2">
              {activeColleagues.map((colleague) => (
                <div key={colleague.id} className="flex items-center gap-2 p-2 rounded-lg border">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {colleague.full_name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{colleague.full_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{colleague.position}</p>
                  </div>
                  <div className="flex gap-1">
                    <a 
                      href={`mailto:${colleague.email}`} 
                      className="p-1.5 rounded hover:bg-muted"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    </a>
                    {colleague.phone && (
                      <a 
                        href={`tel:${colleague.phone}`} 
                        className="p-1.5 rounded hover:bg-muted"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

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

      {/* Quick Links */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2 justify-center">
            <Link to="/extra-work">
              <Button variant="outline" size="sm" className="gap-2">
                <Package className="h-4 w-4" />
                Vícepráce
              </Button>
            </Link>
            <Link to="/creative-boost">
              <Button variant="outline" size="sm" className="gap-2">
                <Sparkles className="h-4 w-4" />
                Creative Boost
              </Button>
            </Link>
            <Link to="/meetings">
              <Button variant="outline" size="sm" className="gap-2">
                <Calendar className="h-4 w-4" />
                Meetingy
              </Button>
            </Link>
            <Link to="/academy">
              <Button variant="outline" size="sm" className="gap-2">
                <GraduationCap className="h-4 w-4" />
                Akademie
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
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
