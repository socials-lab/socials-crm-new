import { 
  Building2, 
  FileText, 
  Users,
  Target,
  ExternalLink,
  User,
  Mail,
  PartyPopper,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { 
  clients, 
  engagements, 
  colleagues,
  getActiveClients,
  getActiveEngagements,
  getClientById,
  canCurrentUserSeeFinancials,
  getCurrentColleagueId,
} from '@/data/mockData';
import { useLeadsData } from '@/hooks/useLeadsData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const { leads } = useLeadsData();
  const canSeeFinancials = canCurrentUserSeeFinancials();
  const hasColleagueId = !!getCurrentColleagueId();

  // Calculate KPIs
  const activeClients = getActiveClients();
  const activeEngagements = getActiveEngagements();
  const activeColleagues = colleagues.filter(c => c.status === 'active');

  // Won leads (newly acquired clients)
  const wonLeads = leads
    .filter(l => l.stage === 'won')
    .sort((a, b) => new Date(b.converted_at || b.updated_at).getTime() - 
                    new Date(a.converted_at || a.updated_at).getTime())
    .slice(0, 5);

  // Recent engagements for activity feed
  const recentEngagements = engagements
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5);

  // Top clients by revenue
  const topClientsByRevenue = activeClients
    .map(client => {
      const clientEngagements = engagements.filter(e => e.client_id === client.id && e.status === 'active');
      const totalMonthly = clientEngagements.reduce((sum, e) => sum + e.monthly_fee, 0);
      return { ...client, totalMonthly };
    })
    .sort((a, b) => b.totalMonthly - a.totalMonthly)
    .slice(0, 5);


  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 animate-fade-in">
      <PageHeader 
        title="🏠 Přehled" 
        titleAccent="agentury"
        description="Vítej v Socials CRM – tvé centrum pro práci s klienty"
      />

      {/* Mission and Vision */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20 hover:shadow-lg hover:scale-[1.01] transition-all duration-300">
        <CardContent className="flex items-start gap-3 md:gap-4 p-4 md:p-6">
          <div className="p-2 md:p-3 rounded-lg bg-primary/10 shrink-0 transition-transform duration-300 group-hover:scale-110">
            <Target className="h-5 w-5 md:h-6 md:w-6 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-base md:text-lg mb-1 md:mb-2">🎯 Naše mise a vize</h3>
            <p className="text-sm md:text-base text-muted-foreground">
              Pomáháme firmám růst díky výkonnostní reklamě. Pracujeme na projektech, které nás baví a dávají smysl. 
              Organizujeme si práci podle svého života a vždy hledáme způsoby, jak se zlepšit.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2">
        <Card className="hover:border-primary/40 hover:shadow-md hover:scale-[1.02] transition-all duration-200 cursor-pointer group">
          <CardContent className="p-3 md:p-4">
            <a 
              href="https://notion.so/your-sop-page" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-3 md:gap-4"
            >
              <div className="p-2 md:p-3 rounded-lg bg-muted shrink-0 transition-all duration-200 group-hover:bg-primary/10 group-hover:scale-110">
                <FileText className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground transition-colors group-hover:text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm md:text-base flex items-center gap-2">
                  📚 SOP a procesy
                  <ExternalLink className="h-3 w-3 md:h-3.5 md:w-3.5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </h4>
                <p className="text-xs md:text-sm text-muted-foreground line-clamp-1">
                  Všechny důležité informace, přístupy a procesy na jednom místě
                </p>
              </div>
            </a>
          </CardContent>
        </Card>

        {hasColleagueId && (
          <Card className="hover:border-primary/40 hover:shadow-md hover:scale-[1.02] transition-all duration-200 cursor-pointer group">
            <CardContent className="p-3 md:p-4">
              <Link to="/my-work" className="flex items-center gap-3 md:gap-4">
                <div className="p-2 md:p-3 rounded-lg bg-muted shrink-0 transition-all duration-200 group-hover:bg-primary/10 group-hover:scale-110">
                  <User className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground transition-colors group-hover:text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm md:text-base">👤 Můj přehled</h4>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Tvoje zakázky a odměny
                  </p>
                </div>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {/* KPI Cards - horizontal scroll on mobile */}
      <div className="kpi-scroll-container md:grid md:gap-4 md:grid-cols-3">
        <KPICard
          title="🏢 Aktivní klienti"
          value={activeClients.length}
          subtitle={`${clients.filter(c => c.status === 'lead').length} leadů v pipeline`}
          icon={Building2}
          trend={{ value: 12, isPositive: true }}
        />
        <KPICard
          title="📋 Aktivní zakázky"
          value={activeEngagements.length}
          subtitle={`${engagements.filter(e => e.type === 'retainer' && e.status === 'active').length} retainerů, ${engagements.filter(e => e.type === 'one_off' && e.status === 'active').length} projektů`}
          icon={FileText}
        />
        <KPICard
          title="👥 Členové týmu"
          value={activeColleagues.length}
          subtitle={`${colleagues.filter(c => c.is_freelancer && c.status === 'active').length} freelancerů`}
          icon={Users}
        />
      </div>

      {/* Team Contacts + Won Leads */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Team Contacts */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">
              Kontakty týmu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {activeColleagues.map((colleague) => (
                <Link 
                  key={colleague.id}
                  to={`/colleagues?highlight=${colleague.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 hover:border-primary/30 transition-all cursor-pointer"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {colleague.full_name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{colleague.full_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{colleague.position}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    asChild
                    onClick={(e) => e.stopPropagation()}
                  >
                    <a href={`mailto:${colleague.email}`}>
                      <Mail className="h-4 w-4 text-muted-foreground" />
                    </a>
                  </Button>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Won Leads */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <PartyPopper className="h-4 w-4 text-green-500" />
              🎉 Nově vyhrané zakázky
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {wonLeads.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Zatím žádné vyhrané zakázky
              </p>
            ) : (
              wonLeads.map((lead) => (
                <div 
                  key={lead.id} 
                  className="flex items-center justify-between py-3 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-1.5 rounded-full bg-green-100 dark:bg-green-900/30 shrink-0">
                      <PartyPopper className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{lead.company_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{lead.potential_service}</p>
                    </div>
                  </div>
                  {canSeeFinancials && lead.estimated_price && (
                    <span className="text-sm font-medium text-green-600 dark:text-green-400 whitespace-nowrap ml-2">
                      {lead.estimated_price.toLocaleString()} CZK
                    </span>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Clients + Recent Engagements */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Clients */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">
              ⭐ Top klienti dle tržeb
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {topClientsByRevenue.map((client, index) => (
              <div 
                key={client.id} 
                className="flex items-center justify-between py-2 border-b border-border last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-muted-foreground w-5">
                    {index + 1}.
                  </span>
                  <div>
                    <p className="font-medium text-sm">{client.brand_name}</p>
                    <p className="text-xs text-muted-foreground">{client.name}</p>
                  </div>
                </div>
                {canSeeFinancials && (
                  <p className="font-semibold text-sm">
                    {client.totalMonthly.toLocaleString()} CZK
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Engagements */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">
              📋 Poslední zakázky
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {recentEngagements.map((engagement) => {
              const client = getClientById(engagement.client_id);
              return (
                <div 
                  key={engagement.id} 
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{engagement.name}</p>
                    <p className="text-xs text-muted-foreground">{client?.brand_name}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <StatusBadge status={engagement.status} />
                    {canSeeFinancials && (
                      <span className="text-sm font-medium whitespace-nowrap">
                        {engagement.type === 'retainer' 
                          ? `${engagement.monthly_fee.toLocaleString()} CZK/měs`
                          : `${engagement.one_off_fee.toLocaleString()} CZK`
                        }
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
