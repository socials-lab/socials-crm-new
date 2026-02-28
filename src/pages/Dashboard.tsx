import { useMemo, useState } from 'react';
import { 
  Building2, 
  FileText, 
  Users,
  Target,
  Percent,
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
  ClipboardList,
  PlusCircle,
  BarChart3,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, subDays, isAfter, parseISO, addDays, differenceInDays, differenceInCalendarDays, formatDistanceToNow } from 'date-fns';
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
import { getUpcomingBirthdays, formatBirthdayShort } from '@/utils/birthdayUtils';
import { getTargetForMonth, calculateActualRevenue, formatCurrencyShort } from '@/utils/businessPlanUtils';
import type { LucideIcon } from 'lucide-react';

interface ActivityEvent {
  id: string;
  title: string;
  subtitle: string;
  at: string;
  icon: LucideIcon;
  colorClass: string;
  value?: number;
  isNegative?: boolean;
}

function formatRelativeDate(dateIso: string) {
  const parsed = parseISO(dateIso);
  const dayDiff = differenceInCalendarDays(new Date(), parsed);
  if (dayDiff <= 0) return 'dnes';
  if (dayDiff === 1) return 'včera';
  if (dayDiff < 7) return `před ${dayDiff} dny`;
  return formatDistanceToNow(parsed, { locale: cs, addSuffix: true });
}

function ActivityFeedRow({ icon: Icon, title, subtitle, at, colorClass, value, isNegative }: ActivityEvent) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-muted/20">
      <div className={`p-1.5 rounded-full shrink-0 ${colorClass}`}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{title}</span>
          <span className="text-xs text-muted-foreground">{formatRelativeDate(at)}</span>
        </div>
        <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
      </div>
      {value !== undefined && value > 0 && (
        <span className={`text-sm font-medium whitespace-nowrap ${isNegative ? 'text-destructive' : 'text-emerald-600'}`}>
          {isNegative ? '-' : '+'}{(value / 1000).toFixed(0)}k
        </span>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { leads } = useLeadsData();
  const { clients, engagements, colleagues, extraWorks, engagementServices, assignments, issuedInvoices } = useCRMData();
  const { getTodaysMeetings, meetings } = useMeetingsData();
  const { applicants } = useApplicantsData();
  const { isSuperAdmin, canSeeFinancials: userCanSeeFinancials } = useUserRole();
  const { pendingRequests } = useModificationRequests();
  
  const canSeeFinancials = userCanSeeFinancials || isSuperAdmin;

  // === BUSINESS PLAN (current month) ===
  const currentMonthPlan = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const monthName = format(now, 'LLLL', { locale: cs });
    
    const target = getTargetForMonth(year, month);
    const { actual, source } = calculateActualRevenue(
      year, month, issuedInvoices || [], engagements, extraWorks || [], engagementServices || []
    );
    const progress = target > 0 ? Math.min((actual / target) * 100, 100) : 0;
    
    return { year, month, monthName, target, actual, progress, source };
  }, [issuedInvoices, engagements, extraWorks, engagementServices]);
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
    
    // Team costs (simplified) - monthly fixed + hourly costs
    const teamCosts = activeColleagues.reduce((sum, c) => 
      sum + (c.monthly_fixed_cost || 0) + ((c.internal_hourly_cost || 0) * (c.capacity_hours_per_month || 0)), 0);
    
    // Assignment costs from engagement_assignments
    const assignmentCosts = assignments.reduce((sum, a) => {
      // Only count assignments for active engagements
      const isActiveEngagement = activeEngagements.some(e => e.id === a.engagement_id);
      if (!isActiveEngagement) return sum;
      return sum + (a.monthly_cost || 0);
    }, 0);
    
    // Total costs = team overhead + assignment costs
    const totalCosts = teamCosts + assignmentCosts;
    
    // Planned margin (absolute) = MRR - Total costs
    const plannedMargin = mrr - totalCosts;
    
    // Profitability % = (MRR - Costs) / MRR * 100
    const profitabilityPercent = mrr > 0 ? ((mrr - totalCosts) / mrr * 100) : 0;
    
    // Gross margin estimate (keeping for backwards compatibility)
    const grossMargin = mrr > 0 ? ((mrr - teamCosts) / mrr * 100) : 0;
    
    return {
      activeClients: activeClients.length,
      activeEngagements: activeEngagements.length,
      activeColleagues: activeColleagues.length,
      mrr,
      arr,
      pipelineValue,
      teamCosts,
      totalCosts,
      plannedMargin,
      profitabilityPercent,
      grossMargin,
    };
  }, [clients, engagements, colleagues, leads, assignments]);

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

  // === RECENT ACTIVITY FEED (last 7 days) ===
  const recentEvents = useMemo(() => {
    const sevenDaysAgo = subDays(new Date(), 7);
    const events: ActivityEvent[] = [];

    leads.forEach((lead) => {
      if (lead.created_at && isAfter(parseISO(lead.created_at), sevenDaysAgo)) {
        events.push({
          id: `lead-created-${lead.id}`,
          title: 'Nový lead',
          subtitle: lead.company_name,
          at: lead.created_at,
          icon: PlusCircle,
          colorClass: 'text-slate-600 bg-slate-100 dark:bg-slate-800',
        });
      }
      if (lead.converted_at && isAfter(parseISO(lead.converted_at), sevenDaysAgo)) {
        events.push({
          id: `lead-converted-${lead.id}`,
          title: 'Nový klient',
          subtitle: `${lead.company_name} -> spolupráce zahájena`,
          at: lead.converted_at,
          icon: UserPlus,
          colorClass: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900',
          value: canSeeFinancials ? (lead.estimated_price || 0) : undefined,
        });
      }
      if (lead.offer_sent_at && isAfter(parseISO(lead.offer_sent_at), sevenDaysAgo)) {
        events.push({
          id: `lead-offer-sent-${lead.id}`,
          title: 'Nabídka odeslána',
          subtitle: `${lead.company_name} -> nabídka připravena`,
          at: lead.offer_sent_at,
          icon: Send,
          colorClass: 'text-pink-600 bg-pink-100 dark:bg-pink-900',
        });
      }
      if (lead.contract_signed_at && isAfter(parseISO(lead.contract_signed_at), sevenDaysAgo)) {
        events.push({
          id: `lead-contract-signed-${lead.id}`,
          title: 'Smlouva podepsána',
          subtitle: `${lead.company_name} -> připraveno k předání`,
          at: lead.contract_signed_at,
          icon: FileSignature,
          colorClass: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900',
          value: canSeeFinancials ? (lead.estimated_price || 0) : undefined,
        });
      }
      if (lead.onboarding_form_completed_at && isAfter(parseISO(lead.onboarding_form_completed_at), sevenDaysAgo)) {
        events.push({
          id: `lead-onboarding-completed-${lead.id}`,
          title: 'Onboarding vyplněn',
          subtitle: `${lead.company_name} -> klient doplnil vstupní data`,
          at: lead.onboarding_form_completed_at,
          icon: ClipboardList,
          colorClass: 'text-cyan-600 bg-cyan-100 dark:bg-cyan-900',
        });
      }
      if (lead.stage === 'lost' && lead.updated_at && isAfter(parseISO(lead.updated_at), sevenDaysAgo)) {
        events.push({
          id: `lead-lost-${lead.id}`,
          title: 'Lead ztracen',
          subtitle: lead.company_name,
          at: lead.updated_at,
          icon: TrendingDown,
          colorClass: 'text-red-600 bg-red-100 dark:bg-red-900',
          value: canSeeFinancials ? (lead.estimated_price || 0) : undefined,
          isNegative: true,
        });
      }
    });

    engagements.forEach((engagement) => {
      if (engagement.start_date && isAfter(parseISO(engagement.start_date), sevenDaysAgo)) {
        const clientName = clients.find((c) => c.id === engagement.client_id)?.brand_name || 'Bez klienta';
        events.push({
          id: `engagement-start-${engagement.id}`,
          title: 'Zakázka zahájena',
          subtitle: `${clientName} -> ${engagement.name}`,
          at: engagement.start_date,
          icon: Briefcase,
          colorClass: 'text-blue-600 bg-blue-100 dark:bg-blue-900',
        });
      }
      if (engagement.end_date && ['completed', 'cancelled'].includes(engagement.status || '') && isAfter(parseISO(engagement.end_date), sevenDaysAgo)) {
        events.push({
          id: `engagement-ended-${engagement.id}`,
          title: 'Zakázka ukončena',
          subtitle: engagement.name,
          at: engagement.end_date,
          icon: UserMinus,
          colorClass: 'text-muted-foreground bg-muted',
        });
      }
    });

    (extraWorks || []).forEach((work) => {
      if (work.created_at && isAfter(parseISO(work.created_at), sevenDaysAgo)) {
        events.push({
          id: `extrawork-created-${work.id}`,
          title: 'Nová vícepráce',
          subtitle: work.description || 'Bez popisu',
          at: work.created_at,
          icon: Wrench,
          colorClass: 'text-violet-600 bg-violet-100 dark:bg-violet-900',
          value: canSeeFinancials ? work.amount : undefined,
        });
      }
      if (work.approval_date && isAfter(parseISO(work.approval_date), sevenDaysAgo)) {
        events.push({
          id: `extrawork-approved-${work.id}`,
          title: 'Vícepráce schválena',
          subtitle: work.description || 'Bez popisu',
          at: work.approval_date,
          icon: CheckCircle,
          colorClass: 'text-green-600 bg-green-100 dark:bg-green-900',
          value: canSeeFinancials ? work.amount : undefined,
        });
      }
    });

    (pendingRequests || []).forEach((request) => {
      if (request.created_at && isAfter(parseISO(request.created_at), sevenDaysAgo)) {
        events.push({
          id: `modification-created-${request.id}`,
          title: 'Nový návrh změny',
          subtitle: request.engagement_name,
          at: request.created_at,
          icon: FileText,
          colorClass: 'text-amber-600 bg-amber-100 dark:bg-amber-900',
        });
      }
      if (request.reviewed_at && ['approved', 'client_approved'].includes(request.status) && isAfter(parseISO(request.reviewed_at), sevenDaysAgo)) {
        events.push({
          id: `modification-approved-${request.id}`,
          title: request.status === 'client_approved' ? 'Návrh potvrzen klientem' : 'Návrh schválen',
          subtitle: request.engagement_name,
          at: request.reviewed_at,
          icon: CheckCircle2,
          colorClass: 'text-green-600 bg-green-100 dark:bg-green-900',
        });
      }
    });

    meetings.forEach((meeting) => {
      if (meeting.created_at && isAfter(parseISO(meeting.created_at), sevenDaysAgo)) {
        events.push({
          id: `meeting-created-${meeting.id}`,
          title: 'Meeting naplánován',
          subtitle: meeting.title,
          at: meeting.created_at,
          icon: Calendar,
          colorClass: 'text-blue-600 bg-blue-100 dark:bg-blue-900',
        });
      }
      if (meeting.status === 'completed' && meeting.scheduled_at && isAfter(parseISO(meeting.scheduled_at), sevenDaysAgo)) {
        events.push({
          id: `meeting-completed-${meeting.id}`,
          title: 'Meeting proběhl',
          subtitle: meeting.title,
          at: meeting.scheduled_at,
          icon: CalendarCheck,
          colorClass: 'text-teal-600 bg-teal-100 dark:bg-teal-900',
        });
      }
    });

    applicants.forEach((applicant) => {
      if (applicant.created_at && isAfter(parseISO(applicant.created_at), sevenDaysAgo)) {
        events.push({
          id: `applicant-created-${applicant.id}`,
          title: 'Nový uchazeč',
          subtitle: applicant.full_name,
          at: applicant.created_at,
          icon: Users,
          colorClass: 'text-slate-600 bg-slate-100 dark:bg-slate-800',
        });
      }
      if (applicant.stage === 'hired' && applicant.updated_at && isAfter(parseISO(applicant.updated_at), sevenDaysAgo)) {
        events.push({
          id: `applicant-hired-${applicant.id}`,
          title: 'Uchazeč přijat',
          subtitle: applicant.full_name,
          at: applicant.updated_at,
          icon: UserCheck,
          colorClass: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900',
        });
      }
    });

    return events
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, 50);
  }, [leads, engagements, extraWorks, pendingRequests, meetings, applicants, clients, canSeeFinancials]);

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

  // === NEW CLIENTS (last 3 months) ===
  const newClientsSection = useMemo(() => {
    const threeMonthsAgo = subDays(new Date(), 90);
    
    const realClients = clients
      .filter(c => c.status === 'active' && c.start_date && isAfter(parseISO(c.start_date), threeMonthsAgo))
      .map(client => {
        const clientEngagements = engagements.filter(e => e.client_id === client.id && e.status === 'active');
        const totalMonthly = clientEngagements.reduce((sum, e) => sum + (e.monthly_fee || 0), 0);
        const engagementNames = clientEngagements.map(e => e.name).join(', ');
        const startDate = parseISO(client.start_date!);
        const timeAgo = formatDistanceToNow(startDate, { locale: cs, addSuffix: true });
        return { ...client, totalMonthly, engagementNames, timeAgo };
      })
      .sort((a, b) => new Date(b.start_date!).getTime() - new Date(a.start_date!).getTime())
      .slice(0, 5);
    
    return realClients;
  }, [clients, engagements]);

  // === ENDING ENGAGEMENTS (next 60 days) ===
  const endingEngagements = useMemo(() => {
    const now = new Date();
    const sixtyDaysFromNow = addDays(now, 60);
    
    const realEnding = engagements
      .filter(e => 
        e.status === 'active' && 
        e.end_date && 
        isAfter(parseISO(e.end_date), now) && 
        !isAfter(parseISO(e.end_date), sixtyDaysFromNow)
      )
      .map(engagement => {
        const client = clients.find(c => c.id === engagement.client_id);
        const endDate = parseISO(engagement.end_date!);
        const daysUntilEnd = differenceInDays(endDate, now);
        const urgency: 'critical' | 'warning' | 'info' = 
          daysUntilEnd < 14 ? 'critical' : daysUntilEnd < 30 ? 'warning' : 'info';
        return { ...engagement, client, daysUntilEnd, urgency };
      })
      .sort((a, b) => a.daysUntilEnd - b.daysUntilEnd);
    
    return realEnding;
  }, [engagements, clients]);

  // Active pipeline leads (excluding closed stages)
  const activePipelineLeads = useMemo(() => 
    leadsPipeline.new_lead + leadsPipeline.meeting_done + leadsPipeline.waiting_access + 
    leadsPipeline.access_received + leadsPipeline.preparing_offer + leadsPipeline.offer_sent
  , [leadsPipeline]);

  // Previous month name (invoicing is for previous month's work)
  const previousMonthName = format(new Date(), 'LLLL', { locale: cs });

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      <PageHeader 
        title="🏠 Přehled" 
        titleAccent="agentury"
        description="Executive dashboard – klíčové metriky a změny v agentuře"
      />

      {/* === EXECUTIVE KPIs === */}
      <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
        <KPICard
          title="💰 Fakturace"
          value={canSeeFinancials ? `${(nextMonthInvoicing.total / 1000).toFixed(0)}k` : '***'}
          subtitle={canSeeFinancials ? `Za ${previousMonthName}` : undefined}
          icon={Receipt}
          className="border-primary/30 bg-primary/5"
        />
        <KPICard
          title="💵 Plán. marže"
          value={canSeeFinancials ? `${(metrics.plannedMargin / 1000).toFixed(0)}k` : '***'}
          subtitle={canSeeFinancials ? `Náklady: ${(metrics.totalCosts / 1000).toFixed(0)}k` : undefined}
          icon={DollarSign}
          className={metrics.plannedMargin >= 0 ? 'border-status-active/30 bg-status-active/5' : 'border-destructive/30 bg-destructive/5'}
        />
        <KPICard
          title="📊 Profitabilita"
          value={canSeeFinancials ? `${metrics.profitabilityPercent.toFixed(0)}%` : '***'}
          subtitle={canSeeFinancials ? 'z MRR' : undefined}
          icon={Percent}
          className={
            metrics.profitabilityPercent >= 30 
              ? 'border-status-active/30 bg-status-active/5' 
              : metrics.profitabilityPercent >= 15 
                ? 'border-amber-500/30 bg-amber-500/5' 
                : 'border-destructive/30 bg-destructive/5'
          }
        />
        <Link to="/analytics" className="block">
          <KPICard
            title={`📊 Plán ${currentMonthPlan.monthName}`}
            value={canSeeFinancials ? `${currentMonthPlan.progress.toFixed(0)}%` : '***'}
            subtitle={canSeeFinancials ? (
              <div className="space-y-1">
                <span>{formatCurrencyShort(currentMonthPlan.actual)} / {formatCurrencyShort(currentMonthPlan.target)} Kč</span>
                <Progress 
                  value={currentMonthPlan.progress} 
                  className="h-1.5"
                />
              </div>
            ) : undefined}
            icon={BarChart3}
            className={
              currentMonthPlan.progress >= 100 
                ? 'border-status-active/30 bg-status-active/5' 
                : currentMonthPlan.progress >= 80 
                  ? 'border-amber-500/30 bg-amber-500/5' 
                  : 'border-destructive/30 bg-destructive/5'
            }
          />
        </Link>
        <KPICard
          title="🎯 Pipeline"
          value={activePipelineLeads}
          subtitle={canSeeFinancials ? `Hodnota: ${(metrics.pipelineValue / 1000).toFixed(0)}k Kč` : undefined}
          icon={Target}
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
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">
              📊 Aktivita posledních 7 dní
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-2">
                {recentEvents.length > 0 ? (
                  recentEvents.map((event) => (
                    <ActivityFeedRow key={event.id} {...event} />
                  ))
                ) : (
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

        {/* NEW CLIENTS - Last 3 Months */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-primary" />
                🆕 Noví klienti
              </CardTitle>
              <Link to="/clients">
                <Button variant="ghost" size="sm" className="text-xs">
                  Všichni klienti
                </Button>
              </Link>
            </div>
            <p className="text-xs text-muted-foreground">Získáni za poslední 3 měsíce</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {newClientsSection.length > 0 ? (
              newClientsSection.map((client) => (
                <div key={client.id} className="p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/50">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{client.brand_name || client.name}</p>
                      {client.engagementNames && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {client.engagementNames}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {client.timeAgo}
                    </span>
                  </div>
                  {canSeeFinancials && client.totalMonthly > 0 && (
                    <div className="mt-2 pt-2 border-t border-emerald-200/50 dark:border-emerald-800/50">
                      <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                        {client.totalMonthly.toLocaleString()} CZK/měsíc
                      </span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Žádní noví klienti za poslední 3 měsíce
              </p>
            )}
          </CardContent>
        </Card>

        {/* ENDING ENGAGEMENTS - Next 60 Days */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                📅 Končící spolupráce
              </CardTitle>
              <Link to="/engagements">
                <Button variant="ghost" size="sm" className="text-xs">
                  Všechny zakázky
                </Button>
              </Link>
            </div>
            <p className="text-xs text-muted-foreground">Zakázky s ukončením v příštích 60 dnech</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {endingEngagements.length > 0 ? (
              endingEngagements.map((engagement) => {
                const urgencyStyles = {
                  critical: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800',
                  warning: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800',
                  info: 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800',
                };
                const urgencyIcon = {
                  critical: '🔴',
                  warning: '🟠',
                  info: '🟡',
                };
                return (
                  <div 
                    key={engagement.id} 
                    className={`p-3 rounded-lg border ${urgencyStyles[engagement.urgency]}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span>{urgencyIcon[engagement.urgency]}</span>
                          <p className="text-sm font-medium truncate">
                            {engagement.client?.brand_name || engagement.client?.name || 'Neznámý klient'}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {engagement.name}
                        </p>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={
                          engagement.urgency === 'critical' 
                            ? 'border-red-300 text-red-700 bg-red-100 dark:bg-red-900 dark:text-red-300' 
                            : engagement.urgency === 'warning'
                              ? 'border-amber-300 text-amber-700 bg-amber-100 dark:bg-amber-900 dark:text-amber-300'
                              : 'border-yellow-300 text-yellow-700 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300'
                        }
                      >
                        za {engagement.daysUntilEnd} dní
                      </Badge>
                    </div>
                    <div className="mt-2 pt-2 border-t border-current/10 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Končí: {format(parseISO(engagement.end_date!), 'd. MMMM yyyy', { locale: cs })}
                      </span>
                      {canSeeFinancials && engagement.monthly_fee && (
                        <span className="text-sm font-medium text-muted-foreground">
                          MRR: {engagement.monthly_fee.toLocaleString()} CZK
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-4">
                <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Žádné spolupráce nekončí v příštích 60 dnech
                </p>
              </div>
            )}

            {/* Process Info */}
            <Separator />
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium">Proces ukončení spolupráce:</p>
              <p>1. Nastavte datum ukončení v detailu zakázky</p>
              <p>2. Běžná výpovědní lhůta je 1 měsíc</p>
              <p>3. Po ukončení změňte status na "Dokončeno"</p>
            </div>
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
