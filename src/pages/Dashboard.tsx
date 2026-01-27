import { useMemo, useState } from 'react';
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
  Receipt,
  Wrench,
  Send,
  FileSignature,
  CheckCircle2,
  CalendarCheck,
  UserCheck,
  ChevronDown,
  ChevronRight,
  PlusCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, subDays, isAfter, parseISO, addMonths } from 'date-fns';
import { cs } from 'date-fns/locale';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { useCRMData } from '@/hooks/useCRMData';
import { useLeadsData } from '@/hooks/useLeadsData';
import { useMeetingsData } from '@/hooks/useMeetingsData';
import { useApplicantsData } from '@/hooks/useApplicantsData';
import { useUserRole } from '@/hooks/useUserRole';
import { useModificationRequests } from '@/hooks/useModificationRequests';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { getUpcomingBirthdays, formatBirthdayShort } from '@/utils/birthdayUtils';
import type { LucideIcon } from 'lucide-react';

// Helper component for activity rows
interface ActivityRowProps {
  icon: LucideIcon;
  label: string;
  count: number;
  items?: string[];
  colorClass: string;
  value?: number;
  isNegative?: boolean;
}

function ActivityRow({ icon: Icon, label, count, items, colorClass, value, isNegative }: ActivityRowProps) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 border border-border/50">
      <div className={`p-1.5 rounded-full ${colorClass}`}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{label}</span>
          <Badge variant="secondary" className="text-xs h-5 px-1.5">{count}</Badge>
        </div>
        {items && items.length > 0 && (
          <p className="text-xs text-muted-foreground truncate">
            {items.join(', ')}
          </p>
        )}
      </div>
      {value !== undefined && value > 0 && (
        <span className={`text-sm font-medium whitespace-nowrap ${isNegative ? 'text-red-600' : 'text-emerald-600'}`}>
          {isNegative ? '-' : '+'}{(value / 1000).toFixed(0)}k
        </span>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { leads } = useLeadsData();
  const { clients, engagements, colleagues, extraWorks, engagementServices, assignments } = useCRMData();
  const { getTodaysMeetings, meetings } = useMeetingsData();
  const { applicants } = useApplicantsData();
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

  // === RECENT ACTIVITY (last 7 days) - COMPREHENSIVE ===
  const recentActivity = useMemo(() => {
    const sevenDaysAgo = subDays(new Date(), 7);
    
    // === LEADS ===
    // Nové leady
    const newLeads = leads
      .filter(l => l.created_at && isAfter(parseISO(l.created_at), sevenDaysAgo))
      .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime());
    
    // Konvertované leady (won)
    const newClients = leads
      .filter(l => l.stage === 'won' && l.converted_at && isAfter(parseISO(l.converted_at), sevenDaysAgo))
      .sort((a, b) => new Date(b.converted_at!).getTime() - new Date(a.converted_at!).getTime());
    
    // Odeslané nabídky
    const offersSent = leads
      .filter(l => l.offer_sent_at && isAfter(parseISO(l.offer_sent_at), sevenDaysAgo))
      .sort((a, b) => new Date(b.offer_sent_at!).getTime() - new Date(a.offer_sent_at!).getTime());
    
    // Podepsané smlouvy
    const contractsSigned = leads
      .filter(l => l.contract_signed_at && isAfter(parseISO(l.contract_signed_at), sevenDaysAgo))
      .sort((a, b) => new Date(b.contract_signed_at!).getTime() - new Date(a.contract_signed_at!).getTime());
    
    // Lost leads
    const lostLeads = leads
      .filter(l => l.stage === 'lost' && l.updated_at && isAfter(parseISO(l.updated_at), sevenDaysAgo))
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    
    // === ENGAGEMENTS ===
    const newEngagements = engagements
      .filter(e => e.start_date && isAfter(parseISO(e.start_date), sevenDaysAgo))
      .sort((a, b) => new Date(b.start_date!).getTime() - new Date(a.start_date!).getTime());
    
    const endedEngagements = engagements
      .filter(e => e.end_date && isAfter(parseISO(e.end_date), sevenDaysAgo) && ['completed', 'cancelled'].includes(e.status || ''))
      .sort((a, b) => new Date(b.end_date!).getTime() - new Date(a.end_date!).getTime());
    
    // === EXTRA WORKS ===
    const newExtraWorks = (extraWorks || [])
      .filter(w => w.created_at && isAfter(parseISO(w.created_at), sevenDaysAgo))
      .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime());
    
    const approvedExtraWorks = (extraWorks || [])
      .filter(w => w.approval_date && isAfter(parseISO(w.approval_date), sevenDaysAgo))
      .sort((a, b) => new Date(b.approval_date!).getTime() - new Date(a.approval_date!).getTime());
    
    // === MODIFICATIONS ===
    const newModifications = (pendingRequests || [])
      .filter(r => r.created_at && isAfter(parseISO(r.created_at), sevenDaysAgo))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    const approvedModifications = (pendingRequests || [])
      .filter(r => r.reviewed_at && ['approved', 'client_approved'].includes(r.status) && isAfter(parseISO(r.reviewed_at), sevenDaysAgo))
      .sort((a, b) => new Date(b.reviewed_at!).getTime() - new Date(a.reviewed_at!).getTime());
    
    // === MEETINGS ===
    const newMeetingsScheduled = meetings
      .filter(m => m.created_at && isAfter(parseISO(m.created_at), sevenDaysAgo))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    const completedMeetings = meetings
      .filter(m => m.status === 'completed' && m.scheduled_at && isAfter(parseISO(m.scheduled_at), sevenDaysAgo))
      .sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());
    
    // === APPLICANTS ===
    const newApplicants = applicants
      .filter(a => a.created_at && isAfter(parseISO(a.created_at), sevenDaysAgo))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    const hiredApplicants = applicants
      .filter(a => a.stage === 'hired' && a.updated_at && isAfter(parseISO(a.updated_at), sevenDaysAgo))
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    
    // Check if there's any activity
    const hasAnyActivity = 
      newLeads.length > 0 || newClients.length > 0 || offersSent.length > 0 || contractsSigned.length > 0 || lostLeads.length > 0 ||
      newEngagements.length > 0 || endedEngagements.length > 0 ||
      newExtraWorks.length > 0 || approvedExtraWorks.length > 0 ||
      newModifications.length > 0 || approvedModifications.length > 0 ||
      newMeetingsScheduled.length > 0 || completedMeetings.length > 0 ||
      newApplicants.length > 0 || hiredApplicants.length > 0;
    
    return {
      // Leads
      newLeads,
      newClients,
      offersSent,
      contractsSigned,
      lostLeads,
      // Engagements
      newEngagements,
      endedEngagements,
      // Extra works
      newExtraWorks,
      approvedExtraWorks,
      // Modifications
      newModifications,
      approvedModifications,
      // Meetings
      newMeetingsScheduled,
      completedMeetings,
      // Applicants
      newApplicants,
      hiredApplicants,
      // Meta
      hasAnyActivity,
    };
  }, [leads, engagements, extraWorks, pendingRequests, meetings, applicants]);

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

  // === TEAM WORKLOAD ===
  const teamWorkload = useMemo(() => {
    const activeColleagues = colleagues.filter(c => c.status === 'active');
    const activeEngagementIds = engagements
      .filter(e => e.status === 'active')
      .map(e => e.id);
    
    const colleaguesWithWorkload = activeColleagues.map(colleague => {
      // Count active assignments for this colleague
      const activeAssignments = assignments.filter(
        a => a.colleague_id === colleague.id && activeEngagementIds.includes(a.engagement_id)
      ).length;
      const maxEngagements = colleague.max_engagements ?? 5;
      const utilizationPercent = Math.round((activeAssignments / maxEngagements) * 100);
      const isFullyUtilized = activeAssignments >= maxEngagements;
      
      return {
        ...colleague,
        activeAssignments,
        maxEngagements,
        utilizationPercent,
        isFullyUtilized,
      };
    });

    const fullyUtilized = colleaguesWithWorkload.filter(c => c.isFullyUtilized);
    const averageUtilization = colleaguesWithWorkload.length > 0
      ? Math.round(colleaguesWithWorkload.reduce((sum, c) => sum + c.utilizationPercent, 0) / colleaguesWithWorkload.length)
      : 0;

    return {
      colleagues: colleaguesWithWorkload,
      fullyUtilized,
      averageUtilization,
      totalActive: activeColleagues.length,
    };
  }, [colleagues, engagements, assignments]);

  // === LEADS PIPELINE (all 9 stages) ===
  const leadsPipeline = useMemo(() => ({
    new_lead: leads.filter(l => l.stage === 'new_lead').length,
    meeting_done: leads.filter(l => l.stage === 'meeting_done').length,
    waiting_access: leads.filter(l => l.stage === 'waiting_access').length,
    access_received: leads.filter(l => l.stage === 'access_received').length,
    preparing_offer: leads.filter(l => l.stage === 'preparing_offer').length,
    offer_sent: leads.filter(l => l.stage === 'offer_sent').length,
    won: leads.filter(l => l.stage === 'won').length,
    lost: leads.filter(l => l.stage === 'lost').length,
    postponed: leads.filter(l => l.stage === 'postponed').length,
  }), [leads]);

  // === NEXT MONTH INVOICING ===
  const nextMonthInvoicing = useMemo(() => {
    const activeEngagements = engagements.filter(e => e.status === 'active');
    const retainerTotal = activeEngagements.reduce((sum, e) => sum + (e.monthly_fee || 0), 0);
    
    const extraWorksToInvoice = extraWorks
      ?.filter(w => w.status === 'ready_to_invoice')
      .reduce((sum, w) => sum + w.amount, 0) || 0;
    
    const oneOffPending = engagementServices
      ?.filter(s => s.billing_type === 'one_off' && s.invoicing_status === 'pending')
      .reduce((sum, s) => sum + (s.price || 0), 0) || 0;
    
    return {
      retainer: retainerTotal,
      extraWorks: extraWorksToInvoice,
      oneOff: oneOffPending,
      total: retainerTotal + extraWorksToInvoice + oneOffPending,
    };
  }, [engagements, extraWorks, engagementServices]);

  // === MODIFICATIONS PIPELINE ===
  const modificationsPipeline = useMemo(() => {
    const requests = pendingRequests || [];
    return {
      pending: requests.filter(r => r.status === 'pending').length,
      approved: requests.filter(r => r.status === 'approved').length,
      client_approved: requests.filter(r => r.status === 'client_approved').length,
      totalValue: requests
        .filter(r => ['pending', 'approved', 'client_approved'].includes(r.status))
        .reduce((sum, r) => {
          const changes = r.proposed_changes as any;
          return sum + (changes?.price || changes?.new_price || 0);
        }, 0),
    };
  }, [pendingRequests]);

  // === EXTRA WORKS PIPELINE ===
  const extraWorksPipeline = useMemo(() => {
    const works = extraWorks || [];
    return {
      pending_approval: works.filter(w => w.status === 'pending_approval').length,
      in_progress: works.filter(w => w.status === 'in_progress').length,
      ready_to_invoice: works.filter(w => w.status === 'ready_to_invoice').length,
      totalValue: works
        .filter(w => ['pending_approval', 'in_progress', 'ready_to_invoice'].includes(w.status))
        .reduce((sum, w) => sum + w.amount, 0),
    };
  }, [extraWorks]);

  // Active pipeline leads (excluding closed stages)
  const activePipelineLeads = useMemo(() => 
    leadsPipeline.new_lead + leadsPipeline.meeting_done + leadsPipeline.waiting_access + 
    leadsPipeline.access_received + leadsPipeline.preparing_offer + leadsPipeline.offer_sent
  , [leadsPipeline]);

  // Next month name
  const nextMonthName = format(addMonths(new Date(), 1), 'LLLL', { locale: cs });

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      <PageHeader 
        title="🏠 Přehled" 
        titleAccent="agentury"
        description="Executive dashboard – klíčové metriky a změny v agentuře"
      />

      {/* === EXECUTIVE KPIs === */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        <KPICard
          title="📈 MRR"
          value={canSeeFinancials ? `${(metrics.mrr / 1000).toFixed(0)}k` : '***'}
          subtitle={canSeeFinancials ? `ARR: ${(metrics.arr / 1000000).toFixed(1)}M CZK` : undefined}
          icon={TrendingUp}
        />
        <KPICard
          title="💰 Fakturace"
          value={canSeeFinancials ? `${(nextMonthInvoicing.total / 1000).toFixed(0)}k` : '***'}
          subtitle={canSeeFinancials ? `Plánováno na ${nextMonthName}` : undefined}
          icon={Receipt}
          className="border-primary/30 bg-primary/5"
        />
        <KPICard
          title="🎯 Pipeline"
          value={canSeeFinancials ? `${(metrics.pipelineValue / 1000).toFixed(0)}k` : '***'}
          subtitle={`${activePipelineLeads} aktivních leadů`}
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

        {/* Recent Activity - Comprehensive CRM Overview */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              📊 Aktivita posledních 7 dní
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {/* === SALES & LEADY === */}
                {(recentActivity.newLeads.length > 0 || recentActivity.newClients.length > 0 || 
                  recentActivity.offersSent.length > 0 || recentActivity.contractsSigned.length > 0 || 
                  recentActivity.lostLeads.length > 0) && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-primary uppercase tracking-wide flex items-center gap-1.5">
                      <Target className="h-3.5 w-3.5" />
                      Sales & Leady
                    </p>
                    
                    {/* Noví klienti (won) */}
                    {recentActivity.newClients.length > 0 && (
                      <ActivityRow 
                        icon={UserPlus} 
                        label="Noví klienti" 
                        count={recentActivity.newClients.length}
                        items={recentActivity.newClients.slice(0, 3).map(l => l.company_name)}
                        colorClass="text-emerald-600 bg-emerald-100 dark:bg-emerald-900"
                        value={canSeeFinancials ? recentActivity.newClients.reduce((s, l) => s + (l.estimated_price || 0), 0) : undefined}
                      />
                    )}
                    
                    {/* Nové leady */}
                    {recentActivity.newLeads.length > 0 && (
                      <ActivityRow 
                        icon={PlusCircle} 
                        label="Nové leady" 
                        count={recentActivity.newLeads.length}
                        items={recentActivity.newLeads.slice(0, 3).map(l => l.company_name)}
                        colorClass="text-slate-600 bg-slate-100 dark:bg-slate-800"
                      />
                    )}
                    
                    {/* Odeslané nabídky */}
                    {recentActivity.offersSent.length > 0 && (
                      <ActivityRow 
                        icon={Send} 
                        label="Odeslané nabídky" 
                        count={recentActivity.offersSent.length}
                        items={recentActivity.offersSent.slice(0, 3).map(l => l.company_name)}
                        colorClass="text-pink-600 bg-pink-100 dark:bg-pink-900"
                      />
                    )}
                    
                    {/* Podepsané smlouvy */}
                    {recentActivity.contractsSigned.length > 0 && (
                      <ActivityRow 
                        icon={FileSignature} 
                        label="Podepsané smlouvy" 
                        count={recentActivity.contractsSigned.length}
                        items={recentActivity.contractsSigned.slice(0, 3).map(l => l.company_name)}
                        colorClass="text-emerald-600 bg-emerald-100 dark:bg-emerald-900"
                      />
                    )}
                    
                    {/* Ztracené leady */}
                    {recentActivity.lostLeads.length > 0 && (
                      <ActivityRow 
                        icon={TrendingDown} 
                        label="Ztracené leady" 
                        count={recentActivity.lostLeads.length}
                        items={recentActivity.lostLeads.slice(0, 3).map(l => l.company_name)}
                        colorClass="text-red-600 bg-red-100 dark:bg-red-900"
                        value={canSeeFinancials ? recentActivity.lostLeads.reduce((s, l) => s + (l.estimated_price || 0), 0) : undefined}
                        isNegative
                      />
                    )}
                  </div>
                )}
                
                {/* === ZAKÁZKY & VÍCEPRÁCE === */}
                {(recentActivity.newEngagements.length > 0 || recentActivity.endedEngagements.length > 0 ||
                  recentActivity.newExtraWorks.length > 0 || recentActivity.approvedExtraWorks.length > 0) && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-primary uppercase tracking-wide flex items-center gap-1.5">
                      <Briefcase className="h-3.5 w-3.5" />
                      Zakázky & Vícepráce
                    </p>
                    
                    {recentActivity.newEngagements.length > 0 && (
                      <ActivityRow 
                        icon={Briefcase} 
                        label="Nové zakázky" 
                        count={recentActivity.newEngagements.length}
                        items={recentActivity.newEngagements.slice(0, 3).map(e => e.name)}
                        colorClass="text-blue-600 bg-blue-100 dark:bg-blue-900"
                      />
                    )}
                    
                    {recentActivity.endedEngagements.length > 0 && (
                      <ActivityRow 
                        icon={UserMinus} 
                        label="Ukončené zakázky" 
                        count={recentActivity.endedEngagements.length}
                        items={recentActivity.endedEngagements.slice(0, 3).map(e => e.name)}
                        colorClass="text-muted-foreground bg-muted"
                      />
                    )}
                    
                    {recentActivity.newExtraWorks.length > 0 && (
                      <ActivityRow 
                        icon={Wrench} 
                        label="Nové vícepráce" 
                        count={recentActivity.newExtraWorks.length}
                        colorClass="text-violet-600 bg-violet-100 dark:bg-violet-900"
                        value={canSeeFinancials ? recentActivity.newExtraWorks.reduce((s, w) => s + w.amount, 0) : undefined}
                      />
                    )}
                    
                    {recentActivity.approvedExtraWorks.length > 0 && (
                      <ActivityRow 
                        icon={CheckCircle} 
                        label="Schválené vícepráce" 
                        count={recentActivity.approvedExtraWorks.length}
                        colorClass="text-green-600 bg-green-100 dark:bg-green-900"
                        value={canSeeFinancials ? recentActivity.approvedExtraWorks.reduce((s, w) => s + w.amount, 0) : undefined}
                      />
                    )}
                  </div>
                )}
                
                {/* === NÁVRHY ZMĚN === */}
                {(recentActivity.newModifications.length > 0 || recentActivity.approvedModifications.length > 0) && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-primary uppercase tracking-wide flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5" />
                      Návrhy změn
                    </p>
                    
                    {recentActivity.newModifications.length > 0 && (
                      <ActivityRow 
                        icon={FileText} 
                        label="Nové návrhy" 
                        count={recentActivity.newModifications.length}
                        items={recentActivity.newModifications.slice(0, 3).map(m => m.engagement_name)}
                        colorClass="text-amber-600 bg-amber-100 dark:bg-amber-900"
                      />
                    )}
                    
                    {recentActivity.approvedModifications.length > 0 && (
                      <ActivityRow 
                        icon={CheckCircle2} 
                        label="Schválené návrhy" 
                        count={recentActivity.approvedModifications.length}
                        items={recentActivity.approvedModifications.slice(0, 3).map(m => m.engagement_name)}
                        colorClass="text-green-600 bg-green-100 dark:bg-green-900"
                      />
                    )}
                  </div>
                )}
                
                {/* === SCHŮZKY === */}
                {(recentActivity.newMeetingsScheduled.length > 0 || recentActivity.completedMeetings.length > 0) && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-primary uppercase tracking-wide flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      Schůzky
                    </p>
                    
                    {recentActivity.newMeetingsScheduled.length > 0 && (
                      <ActivityRow 
                        icon={Calendar} 
                        label="Naplánované" 
                        count={recentActivity.newMeetingsScheduled.length}
                        items={recentActivity.newMeetingsScheduled.slice(0, 3).map(m => m.title)}
                        colorClass="text-blue-600 bg-blue-100 dark:bg-blue-900"
                      />
                    )}
                    
                    {recentActivity.completedMeetings.length > 0 && (
                      <ActivityRow 
                        icon={CalendarCheck} 
                        label="Proběhlé" 
                        count={recentActivity.completedMeetings.length}
                        items={recentActivity.completedMeetings.slice(0, 3).map(m => m.title)}
                        colorClass="text-teal-600 bg-teal-100 dark:bg-teal-900"
                      />
                    )}
                  </div>
                )}
                
                {/* === RECRUITMENT === */}
                {(recentActivity.newApplicants.length > 0 || recentActivity.hiredApplicants.length > 0) && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-primary uppercase tracking-wide flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      Recruitment
                    </p>
                    
                    {recentActivity.newApplicants.length > 0 && (
                      <ActivityRow 
                        icon={Users} 
                        label="Noví uchazeči" 
                        count={recentActivity.newApplicants.length}
                        items={recentActivity.newApplicants.slice(0, 3).map(a => a.full_name)}
                        colorClass="text-slate-600 bg-slate-100 dark:bg-slate-800"
                      />
                    )}
                    
                    {recentActivity.hiredApplicants.length > 0 && (
                      <ActivityRow 
                        icon={UserCheck} 
                        label="Přijatí" 
                        count={recentActivity.hiredApplicants.length}
                        items={recentActivity.hiredApplicants.slice(0, 3).map(a => a.full_name)}
                        colorClass="text-emerald-600 bg-emerald-100 dark:bg-emerald-900"
                      />
                    )}
                  </div>
                )}
                
                {/* Empty state */}
                {!recentActivity.hasAnyActivity && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Žádné změny za posledních 7 dní
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Leads Pipeline - All 9 stages */}
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
            {/* Active pipeline stages */}
            <div className="space-y-2">
              {[
                { label: 'Nový lead', value: leadsPipeline.new_lead, color: 'bg-slate-500' },
                { label: 'Schůzka proběhla', value: leadsPipeline.meeting_done, color: 'bg-blue-500' },
                { label: 'Čekáme na přístupy', value: leadsPipeline.waiting_access, color: 'bg-amber-500' },
                { label: 'Přístupy přijaty', value: leadsPipeline.access_received, color: 'bg-teal-500' },
                { label: 'Příprava nabídky', value: leadsPipeline.preparing_offer, color: 'bg-violet-500' },
                { label: 'Nabídka odeslána', value: leadsPipeline.offer_sent, color: 'bg-pink-500' },
              ].map((stage) => (
                <div key={stage.label} className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${stage.color} shrink-0`} />
                  <span className="text-sm flex-1 truncate">{stage.label}</span>
                  <span className="font-medium text-sm">{stage.value}</span>
                </div>
              ))}
            </div>

            {/* Closed stages */}
            <Separator />
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Uzavřené</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="gap-1 text-status-active border-status-active/30 bg-status-active/10">
                  <CheckCircle className="h-3 w-3" />
                  Vyhráno: {leadsPipeline.won}
                </Badge>
                <Badge variant="outline" className="gap-1 text-status-lost border-status-lost/30 bg-status-lost/10">
                  <TrendingDown className="h-3 w-3" />
                  Prohráno: {leadsPipeline.lost}
                </Badge>
                <Badge variant="outline" className="gap-1 text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Odloženo: {leadsPipeline.postponed}
                </Badge>
              </div>
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

        {/* Modifications Pipeline */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                📝 Návrhy změn
              </CardTitle>
              <Link to="/modifications">
                <Button variant="ghost" size="sm" className="text-xs">
                  Zobrazit vše
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              {[
                { label: 'Čeká na schválení', value: modificationsPipeline.pending, color: 'bg-amber-500' },
                { label: 'Schváleno (čeká klient)', value: modificationsPipeline.approved, color: 'bg-blue-500' },
                { label: 'Klient potvrdil', value: modificationsPipeline.client_approved, color: 'bg-emerald-500' },
              ].map((status) => (
                <div key={status.label} className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${status.color} shrink-0`} />
                  <span className="text-sm flex-1">{status.label}</span>
                  <span className="font-medium text-sm">{status.value}</span>
                </div>
              ))}
            </div>

            {canSeeFinancials && modificationsPipeline.totalValue > 0 && (
              <>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Celková hodnota návrhů</span>
                  <span className="font-semibold text-primary">
                    {modificationsPipeline.totalValue.toLocaleString()} CZK
                  </span>
                </div>
              </>
            )}

            {modificationsPipeline.pending + modificationsPipeline.approved + modificationsPipeline.client_approved === 0 && (
              <p className="text-sm text-muted-foreground text-center py-2">
                Žádné aktivní návrhy změn
              </p>
            )}
          </CardContent>
        </Card>

        {/* Team Overview */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              👥 Tým & Vytížení
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Team Workload Overview */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Activity className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Průměrné vytížení</p>
                  <p className="text-xs text-muted-foreground">{teamWorkload.totalActive} aktivních kolegů</p>
                </div>
              </div>
              <span className="text-2xl font-semibold">{teamWorkload.averageUtilization}%</span>
            </div>

            {/* Fully Utilized Warning */}
            {teamWorkload.fullyUtilized.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 text-amber-500" />
                  Plně vytížení kolegové ({teamWorkload.fullyUtilized.length})
                </p>
                {teamWorkload.fullyUtilized.slice(0, 4).map((colleague) => (
                  <div 
                    key={colleague.id} 
                    className="flex items-center gap-3 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 text-xs">
                        {colleague.full_name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{colleague.full_name}</p>
                      <p className="text-xs text-muted-foreground">{colleague.position}</p>
                    </div>
                    <Badge variant="outline" className="gap-1 text-amber-700 border-amber-300 bg-amber-100 dark:bg-amber-900 dark:text-amber-300 text-xs">
                      <AlertTriangle className="h-3 w-3" />
                      {colleague.activeAssignments}/{colleague.maxEngagements}
                    </Badge>
                  </div>
                ))}
              </div>
            )}

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

        {/* Extra Works Pipeline */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Wrench className="h-4 w-4 text-primary" />
                🔧 Aktivní vícepráce
              </CardTitle>
              <Link to="/extra-work">
                <Button variant="ghost" size="sm" className="text-xs">
                  Zobrazit vše
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              {[
                { label: 'Ke schválení', value: extraWorksPipeline.pending_approval, color: 'bg-amber-500' },
                { label: 'V řešení', value: extraWorksPipeline.in_progress, color: 'bg-blue-500' },
                { label: 'K fakturaci', value: extraWorksPipeline.ready_to_invoice, color: 'bg-emerald-500' },
              ].map((status) => (
                <div key={status.label} className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${status.color} shrink-0`} />
                  <span className="text-sm flex-1">{status.label}</span>
                  <span className="font-medium text-sm">{status.value}</span>
                </div>
              ))}
            </div>

            {canSeeFinancials && extraWorksPipeline.totalValue > 0 && (
              <>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Celková hodnota</span>
                  <span className="font-semibold text-primary">
                    {extraWorksPipeline.totalValue.toLocaleString()} CZK
                  </span>
                </div>
              </>
            )}

            {extraWorksPipeline.pending_approval + extraWorksPipeline.in_progress + extraWorksPipeline.ready_to_invoice === 0 && (
              <p className="text-sm text-muted-foreground text-center py-2">
                Žádné aktivní vícepráce
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
