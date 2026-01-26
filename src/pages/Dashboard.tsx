import { useMemo } from 'react';
import { 
  Building2, 
  FileText, 
  Users,
  Target,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  CheckCircle,
  Calendar,
  Cake,
  DollarSign,
  ArrowRight,
  Briefcase,
  UserPlus,
  UserMinus,
  Package,
  Bell,
  Activity,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, subDays, isAfter, parseISO } from 'date-fns';
import { cs } from 'date-fns/locale';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { useCRMData } from '@/hooks/useCRMData';
import { useLeadsData } from '@/hooks/useLeadsData';
import { useMeetingsData } from '@/hooks/useMeetingsData';
import { useUserRole } from '@/hooks/useUserRole';
import { useModificationRequests } from '@/hooks/useModificationRequests';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { getUpcomingBirthdays, formatBirthdayShort } from '@/utils/birthdayUtils';

export default function Dashboard() {
  const { leads } = useLeadsData();
  const { clients, engagements, colleagues, extraWorks } = useCRMData();
  const { getTodaysMeetings } = useMeetingsData();
  const { isSuperAdmin, canSeeFinancials: userCanSeeFinancials } = useUserRole();
  const { pendingRequests } = useModificationRequests();
  
  const canSeeFinancials = userCanSeeFinancials || isSuperAdmin;

  // === EXECUTIVE METRICS ===
  const metrics = useMemo(() => {
    const activeClients = clients.filter(c => c.status === 'active');
    const activeEngagements = engagements.filter(e => e.status === 'active');
    const activeColleagues = colleagues.filter(c => c.status === 'active');
    
    // MRR calculation
    const mrr = activeEngagements.reduce((sum, e) => sum + (e.monthly_fee || 0), 0);
    const arr = mrr * 12;
    
    // Pipeline value (leads not yet won)
    const pipelineValue = leads
      .filter(l => !['won', 'lost', 'postponed'].includes(l.stage))
      .reduce((sum, l) => sum + (l.estimated_price || 0), 0);
    
    // Team costs (simplified)
    const teamCosts = activeColleagues.reduce((sum, c) => 
      sum + (c.monthly_fixed_cost || 0) + ((c.internal_hourly_cost || 0) * (c.capacity_hours_per_month || 0)), 0);
    
    // Gross margin estimate
    const grossMargin = mrr > 0 ? ((mrr - teamCosts) / mrr * 100) : 0;
    
    return {
      activeClients: activeClients.length,
      activeEngagements: activeEngagements.length,
      activeColleagues: activeColleagues.length,
      mrr,
      arr,
      pipelineValue,
      teamCosts,
      grossMargin,
    };
  }, [clients, engagements, colleagues, leads]);

  // === PENDING APPROVALS ===
  const pendingApprovals = useMemo(() => {
    const modificationsPending = pendingRequests?.filter(r => r.status === 'pending') || [];
    const modificationsClientApproved = pendingRequests?.filter(r => r.status === 'client_approved') || [];
    const extraWorksPending = extraWorks?.filter(w => w.status === 'pending_approval') || [];
    
    return {
      modifications: modificationsPending,
      clientApproved: modificationsClientApproved,
      extraWorks: extraWorksPending,
      total: modificationsPending.length + modificationsClientApproved.length + extraWorksPending.length,
    };
  }, [pendingRequests, extraWorks]);

  // === RECENT ACTIVITY (last 7 days) ===
  const recentActivity = useMemo(() => {
    const sevenDaysAgo = subDays(new Date(), 7);
    
    // New clients (won leads)
    const newClients = leads
      .filter(l => l.stage === 'won' && l.converted_at && isAfter(parseISO(l.converted_at), sevenDaysAgo))
      .sort((a, b) => new Date(b.converted_at!).getTime() - new Date(a.converted_at!).getTime());
    
    // New engagements started
    const newEngagements = engagements
      .filter(e => e.start_date && isAfter(parseISO(e.start_date), sevenDaysAgo))
      .sort((a, b) => new Date(b.start_date!).getTime() - new Date(a.start_date!).getTime());
    
    // Ended engagements
    const endedEngagements = engagements
      .filter(e => e.end_date && isAfter(parseISO(e.end_date), sevenDaysAgo) && ['completed', 'cancelled'].includes(e.status))
      .sort((a, b) => new Date(b.end_date!).getTime() - new Date(a.end_date!).getTime());
    
    // Lost leads
    const lostLeads = leads
      .filter(l => l.stage === 'lost' && l.updated_at && isAfter(parseISO(l.updated_at), sevenDaysAgo))
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    
    return { newClients, newEngagements, endedEngagements, lostLeads };
  }, [leads, engagements]);

  // === CLIENT HEALTH ===
  const clientHealth = useMemo(() => {
    const activeClients = clients.filter(c => c.status === 'active');
    
    // Clients with low engagement (no active engagements)
    const atRisk = activeClients.filter(client => {
      const clientEngagements = engagements.filter(e => e.client_id === client.id && e.status === 'active');
      return clientEngagements.length === 0;
    });
    
    // Top clients by revenue
    const topClients = activeClients
      .map(client => {
        const clientEngagements = engagements.filter(e => e.client_id === client.id && e.status === 'active');
        const totalMonthly = clientEngagements.reduce((sum, e) => sum + (e.monthly_fee || 0), 0);
        return { ...client, totalMonthly };
      })
      .sort((a, b) => b.totalMonthly - a.totalMonthly)
      .slice(0, 5);
    
    // Client concentration (top 5 clients % of revenue)
    const totalRevenue = topClients.reduce((sum, c) => sum + c.totalMonthly, 0);
    const top5Revenue = topClients.slice(0, 5).reduce((sum, c) => sum + c.totalMonthly, 0);
    const concentration = totalRevenue > 0 ? (top5Revenue / metrics.mrr * 100) : 0;
    
    return { atRisk, topClients, concentration };
  }, [clients, engagements, metrics.mrr]);

  // === TEAM ===
  const upcomingBirthdays = getUpcomingBirthdays(colleagues, 14);
  const todaysMeetings = getTodaysMeetings();

  // === LEADS PIPELINE ===
  const leadsPipeline = useMemo(() => {
    const stages = {
      new_lead: leads.filter(l => l.stage === 'new_lead').length,
      meeting_done: leads.filter(l => l.stage === 'meeting_done').length,
      preparing_offer: leads.filter(l => l.stage === 'preparing_offer').length,
      offer_sent: leads.filter(l => l.stage === 'offer_sent').length,
    };
    return stages;
  }, [leads]);

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      <PageHeader 
        title="🏠 Přehled" 
        titleAccent="agentury"
        description="Executive dashboard – klíčové metriky a změny v agentuře"
      />

      {/* === EXECUTIVE KPIs === */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="📈 MRR"
          value={canSeeFinancials ? `${(metrics.mrr / 1000).toFixed(0)}k` : '***'}
          subtitle={canSeeFinancials ? `ARR: ${(metrics.arr / 1000000).toFixed(1)}M CZK` : undefined}
          icon={TrendingUp}
        />
        <KPICard
          title="🎯 Pipeline"
          value={canSeeFinancials ? `${(metrics.pipelineValue / 1000).toFixed(0)}k` : '***'}
          subtitle={`${Object.values(leadsPipeline).reduce((a, b) => a + b, 0)} aktivních leadů`}
          icon={Target}
        />
        <KPICard
          title="🏢 Klienti"
          value={metrics.activeClients}
          subtitle={`${metrics.activeEngagements} aktivních zakázek`}
          icon={Building2}
        />
        <KPICard
          title="👥 Tým"
          value={metrics.activeColleagues}
          subtitle={canSeeFinancials ? `Náklady: ${(metrics.teamCosts / 1000).toFixed(0)}k/měs` : undefined}
          icon={Users}
        />
      </div>

      {/* === ALERTS & PENDING APPROVALS === */}
      {pendingApprovals.total > 0 && (
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Bell className="h-4 w-4 text-amber-600" />
              ⚠️ Čekající na schválení
              <Badge variant="secondary" className="ml-2">{pendingApprovals.total}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {pendingApprovals.modifications.length > 0 && (
                <Link to="/modifications">
                  <Button variant="outline" size="sm" className="gap-2">
                    <FileText className="h-4 w-4" />
                    {pendingApprovals.modifications.length} návrhů změn
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              )}
              {pendingApprovals.clientApproved.length > 0 && (
                <Link to="/modifications">
                  <Button variant="outline" size="sm" className="gap-2 border-green-300 text-green-700 hover:bg-green-50">
                    <CheckCircle className="h-4 w-4" />
                    {pendingApprovals.clientApproved.length} potvrzeno klientem
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              )}
              {pendingApprovals.extraWorks.length > 0 && (
                <Link to="/extra-work">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Package className="h-4 w-4" />
                    {pendingApprovals.extraWorks.length} víceprací
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* === MAIN CONTENT GRID === */}
      <div className="grid gap-6 lg:grid-cols-2">
        
        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              📊 Aktivita posledních 7 dní
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* New clients */}
            {recentActivity.newClients.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Noví klienti</p>
                {recentActivity.newClients.slice(0, 3).map((lead) => (
                  <div key={lead.id} className="flex items-center gap-3 p-2 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                    <div className="p-1.5 rounded-full bg-green-100 dark:bg-green-900">
                      <UserPlus className="h-3.5 w-3.5 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{lead.company_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(lead.converted_at!), 'd. M.', { locale: cs })}
                        {canSeeFinancials && lead.estimated_price && ` • ${lead.estimated_price.toLocaleString()} CZK`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* New engagements */}
            {recentActivity.newEngagements.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Nové zakázky</p>
                {recentActivity.newEngagements.slice(0, 3).map((engagement) => (
                  <div key={engagement.id} className="flex items-center gap-3 p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                    <div className="p-1.5 rounded-full bg-blue-100 dark:bg-blue-900">
                      <Briefcase className="h-3.5 w-3.5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{engagement.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Start: {format(parseISO(engagement.start_date!), 'd. M.', { locale: cs })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Ended engagements */}
            {recentActivity.endedEngagements.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Ukončené zakázky</p>
                {recentActivity.endedEngagements.slice(0, 2).map((engagement) => (
                  <div key={engagement.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 border">
                    <div className="p-1.5 rounded-full bg-muted">
                      <UserMinus className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{engagement.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Konec: {format(parseISO(engagement.end_date!), 'd. M.', { locale: cs })}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {engagement.status === 'completed' ? 'Dokončeno' : 'Zrušeno'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            {/* Lost leads */}
            {recentActivity.lostLeads.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Ztracené leady</p>
                {recentActivity.lostLeads.slice(0, 2).map((lead) => (
                  <div key={lead.id} className="flex items-center gap-3 p-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                    <div className="p-1.5 rounded-full bg-red-100 dark:bg-red-900">
                      <TrendingDown className="h-3.5 w-3.5 text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{lead.company_name}</p>
                      {canSeeFinancials && lead.estimated_price && (
                        <p className="text-xs text-red-600">-{lead.estimated_price.toLocaleString()} CZK</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {recentActivity.newClients.length === 0 && 
             recentActivity.newEngagements.length === 0 && 
             recentActivity.endedEngagements.length === 0 && 
             recentActivity.lostLeads.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Žádné změny za posledních 7 dní
              </p>
            )}
          </CardContent>
        </Card>

        {/* Leads Pipeline */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                🎯 Sales pipeline
              </CardTitle>
              <Link to="/leads">
                <Button variant="ghost" size="sm" className="text-xs">
                  Zobrazit vše
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {[
                { label: 'Nový lead', value: leadsPipeline.new_lead, color: 'bg-slate-500' },
                { label: 'Po meetingu', value: leadsPipeline.meeting_done, color: 'bg-blue-500' },
                { label: 'Příprava nabídky', value: leadsPipeline.preparing_offer, color: 'bg-amber-500' },
                { label: 'Nabídka odeslána', value: leadsPipeline.offer_sent, color: 'bg-green-500' },
              ].map((stage) => (
                <div key={stage.label} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>{stage.label}</span>
                    <span className="font-medium">{stage.value}</span>
                  </div>
                  <Progress 
                    value={stage.value > 0 ? Math.max(10, (stage.value / Math.max(...Object.values(leadsPipeline), 1)) * 100) : 0} 
                    className="h-2"
                  />
                </div>
              ))}
            </div>

            {canSeeFinancials && metrics.pipelineValue > 0 && (
              <>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Celková hodnota pipeline</span>
                  <span className="font-semibold text-primary">
                    {metrics.pipelineValue.toLocaleString()} CZK
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Client Health */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                ⭐ Top klienti
              </CardTitle>
              <Link to="/clients">
                <Button variant="ghost" size="sm" className="text-xs">
                  Všichni klienti
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {clientHealth.topClients.map((client, index) => (
              <div key={client.id} className="flex items-center gap-3">
                <span className="w-5 text-center text-sm font-medium text-muted-foreground">
                  {index + 1}.
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{client.brand_name || client.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{client.industry || 'Bez odvětví'}</p>
                </div>
                {canSeeFinancials && (
                  <span className="text-sm font-medium text-primary whitespace-nowrap">
                    {client.totalMonthly.toLocaleString()} CZK
                  </span>
                )}
              </div>
            ))}

            {canSeeFinancials && clientHealth.concentration > 50 && (
              <>
                <Separator />
                <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    Top 5 klientů tvoří {clientHealth.concentration.toFixed(0)}% tržeb – vysoká koncentrace
                  </p>
                </div>
              </>
            )}

            {clientHealth.atRisk.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-amber-500" />
                    Klienti bez aktivní zakázky
                  </p>
                  {clientHealth.atRisk.slice(0, 3).map((client) => (
                    <div key={client.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      {client.brand_name || client.name}
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Team Overview */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              👥 Tým & Meetingy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Today's meetings count */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Dnešní meetingy</p>
                  <p className="text-xs text-muted-foreground">Celkem naplánováno</p>
                </div>
              </div>
              <span className="text-2xl font-semibold">{todaysMeetings.length}</span>
            </div>

            {/* Birthdays */}
            {upcomingBirthdays.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <Cake className="h-3 w-3 text-rose-500" />
                  Nadcházející narozeniny
                </p>
                {upcomingBirthdays.slice(0, 3).map((colleague) => (
                  <div 
                    key={colleague.id} 
                    className={`flex items-center gap-3 p-2 rounded-lg border ${
                      colleague.isBirthdayToday 
                        ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800' 
                        : 'bg-card'
                    }`}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {colleague.full_name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{colleague.full_name}</p>
                      <p className="text-xs text-muted-foreground">{colleague.position}</p>
                    </div>
                    {colleague.isBirthdayToday ? (
                      <Badge className="bg-rose-500 text-white text-xs">🎂 Dnes!</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {formatBirthdayShort(colleague.birthday!)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Quick links */}
            <Separator />
            <div className="flex gap-2">
              <Link to="/colleagues" className="flex-1">
                <Button variant="outline" size="sm" className="w-full">
                  <Users className="h-3.5 w-3.5 mr-1.5" />
                  Kolegové
                </Button>
              </Link>
              <Link to="/meetings" className="flex-1">
                <Button variant="outline" size="sm" className="w-full">
                  <Calendar className="h-3.5 w-3.5 mr-1.5" />
                  Meetingy
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions Footer */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/leads">
              <Button variant="outline" size="sm" className="gap-2">
                <Target className="h-4 w-4" />
                Nový lead
              </Button>
            </Link>
            <Link to="/modifications">
              <Button variant="outline" size="sm" className="gap-2">
                <FileText className="h-4 w-4" />
                Návrhy změn
              </Button>
            </Link>
            <Link to="/analytics">
              <Button variant="outline" size="sm" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                Analytika
              </Button>
            </Link>
            <a href="https://notion.so/your-sop-page" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="gap-2">
                <ExternalLink className="h-4 w-4" />
                SOP & Procesy
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
