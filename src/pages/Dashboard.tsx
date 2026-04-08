import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  Package,
  Bell,
  Activity,
  Receipt,
  Wrench,
  PlusCircle,
  BarChart3,
  Send,
  FileSignature,
  UserMinus,
  CheckCircle2,
  CalendarCheck,
  UserCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, subDays, isAfter, parseISO, addDays, differenceInDays, differenceInCalendarDays, formatDistanceToNow, startOfMonth, endOfMonth } from 'date-fns';
import { cs } from 'date-fns/locale';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { useCRMData } from '@/hooks/useCRMData';
import { useLeadsData } from '@/hooks/useLeadsData';
import { useMeetingsData } from '@/hooks/useMeetingsData';
import { useApplicantsData } from '@/hooks/useApplicantsData';
import { useUserRole } from '@/hooks/useUserRole';
import { useModificationRequests } from '@/hooks/useModificationRequests';
import { useCreativeBoostData } from '@/hooks/useCreativeBoostData';
import { useUpsellApprovals } from '@/hooks/useUpsellApprovals';
import { useTeamEarnings } from '@/hooks/useTeamEarnings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getUpcomingBirthdays, formatBirthdayShort } from '@/utils/birthdayUtils';
import { getEngagementMonthlyRevenue } from '@/utils/engagementRevenueUtils';
import { buildColleagueInvoiceData } from '@/components/colleagues/TeamInvoicingOverview';
import { supabase } from '@/integrations/supabase/client';
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

interface HistoryRowBase {
  id: string;
  change_type: string;
  created_at: string | null;
  field_label: string | null;
  old_value: string | null;
  new_value: string | null;
}

type DashboardHistoryRow =
  | (HistoryRowBase & { entity: 'lead'; lead_id: string })
  | (HistoryRowBase & { entity: 'engagement'; engagement_id: string })
  | (HistoryRowBase & { entity: 'client'; client_id: string })
  | (HistoryRowBase & { entity: 'extra_work'; extra_work_id: string })
  | (HistoryRowBase & { entity: 'meeting'; meeting_id: string })
  | (HistoryRowBase & { entity: 'applicant'; applicant_id: string });

const CHANGE_TYPE_LABELS: Record<string, string> = {
  created: 'Vytvořeno',
  deleted: 'Smazáno',
  stage_change: 'Změna stavu',
  status_change: 'Změna stavu',
  field_update: 'Úprava pole',
  owner_change: 'Změna vlastníka',
  note_added: 'Poznámka',
  converted: 'Konverze',
  tier_change: 'Změna tieru',
  contact_added: 'Kontakt přidán',
  contact_removed: 'Kontakt odebrán',
  service_added: 'Služba přidána',
  service_removed: 'Služba odebrána',
  service_updated: 'Služba upravena',
  colleague_assigned: 'Kolega přiřazen',
  colleague_removed: 'Kolega odebrán',
  colleague_updated: 'Kolega upraven',
  end_date_set: 'Nastaven konec',
  invoiced: 'Vyfakturováno',
  rescheduled: 'Přeplánováno',
  cancelled: 'Zrušeno',
  participant_added: 'Účastník přidán',
  participant_removed: 'Účastník odebrán',
};

function getChangeTypeLabel(changeType: string) {
  return CHANGE_TYPE_LABELS[changeType] || changeType;
}

function getFieldChangeSubtitle(entityName: string, oldValue: string | null, newValue: string | null) {
  const fromValue = oldValue && oldValue.trim() !== '' ? oldValue : '(prázdné)';
  const toValue = newValue && newValue.trim() !== '' ? newValue : '(prázdné)';
  return `${entityName}: ${fromValue} -> ${toValue}`;
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
    <div className="flex items-start gap-3 p-3 rounded-xl border border-border/60 bg-muted/20">
      <div className={`p-1.5 rounded-full shrink-0 ${colorClass}`}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="text-sm font-medium break-words">{title}</span>
          <span className="text-xs text-muted-foreground shrink-0">{formatRelativeDate(at)}</span>
        </div>
        <p className="text-xs text-muted-foreground break-words hyphens-auto">{subtitle}</p>
      </div>
      {value !== undefined && value > 0 && (
        <span className={`text-sm font-medium whitespace-nowrap ${isNegative ? 'text-destructive' : 'text-emerald-600'}`}>
          {isNegative ? '-' : '+'}{(value / 1000).toFixed(0)}k
        </span>
      )}
    </div>
  );
}

function ActivityRow({ icon: Icon, label, count, items, colorClass, value, isNegative }: {
  icon: LucideIcon; label: string; count: number; items?: string[]; colorClass: string; value?: number; isNegative?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 border border-border/50">
      <div className={`p-1.5 rounded-full ${colorClass}`}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{label}</span>
          <Badge variant="secondary" className="text-[10px] h-4">{count}</Badge>
        </div>
        {items && items.length > 0 && (
          <p className="text-xs text-muted-foreground truncate">{items.join(', ')}</p>
        )}
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
  const { getColleagueCreditsByClient, getClientMonthSummaries } = useCreativeBoostData();
  const { getApprovedCommissionsForColleague } = useUpsellApprovals();
  const { getColleagueActivities } = useTeamEarnings();
  
  const canSeeFinancials = userCanSeeFinancials || isSuperAdmin;
  const activityFromIso = useMemo(() => subDays(new Date(), 7).toISOString(), []);

  const getTeamInvoicingTotalForMonth = useCallback((year: number, month: number) => {
    const activeColleagues = colleagues.filter((colleague) => colleague.status === 'active');
    return activeColleagues.reduce((sum, colleague) => {
      const activities = getColleagueActivities(colleague.id, year, month);
      const invoiceData = buildColleagueInvoiceData(
        colleague,
        year,
        month,
        assignments,
        engagements,
        clients,
        extraWorks || [],
        activities,
        getColleagueCreditsByClient,
        getApprovedCommissionsForColleague,
      );
      return sum + invoiceData.grandTotal;
    }, 0);
  }, [
    colleagues,
    getColleagueActivities,
    assignments,
    engagements,
    clients,
    extraWorks,
    getColleagueCreditsByClient,
    getApprovedCommissionsForColleague,
  ]);

  const { data: activityHistoryRows = [] } = useQuery({
    queryKey: ['dashboard-activity-history', activityFromIso],
    queryFn: async (): Promise<DashboardHistoryRow[]> => {
      const [leadHistory, engagementHistory, clientHistory, extraWorkHistory, meetingHistory, applicantHistory] = await Promise.all([
        supabase
          .from('lead_history')
          .select('id, lead_id, change_type, created_at, field_label, old_value, new_value')
          .gte('created_at', activityFromIso)
          .order('created_at', { ascending: false })
          .limit(150),
        supabase
          .from('engagement_history')
          .select('id, engagement_id, change_type, created_at, field_label, old_value, new_value')
          .gte('created_at', activityFromIso)
          .order('created_at', { ascending: false })
          .limit(150),
        supabase
          .from('client_history')
          .select('id, client_id, change_type, created_at, field_label, old_value, new_value')
          .gte('created_at', activityFromIso)
          .order('created_at', { ascending: false })
          .limit(150),
        supabase
          .from('extra_work_history')
          .select('id, extra_work_id, change_type, created_at, field_label, old_value, new_value')
          .gte('created_at', activityFromIso)
          .order('created_at', { ascending: false })
          .limit(150),
        supabase
          .from('meeting_history')
          .select('id, meeting_id, change_type, created_at, field_label, old_value, new_value')
          .gte('created_at', activityFromIso)
          .order('created_at', { ascending: false })
          .limit(150),
        supabase
          .from('applicant_history')
          .select('id, applicant_id, change_type, created_at, field_label, old_value, new_value')
          .gte('created_at', activityFromIso)
          .order('created_at', { ascending: false })
          .limit(150),
      ]);

      const firstError = leadHistory.error
        || engagementHistory.error
        || clientHistory.error
        || extraWorkHistory.error
        || meetingHistory.error
        || applicantHistory.error;
      if (firstError) throw firstError;

      return [
        ...(leadHistory.data || []).map((row) => ({ ...row, entity: 'lead' as const })),
        ...(engagementHistory.data || []).map((row) => ({ ...row, entity: 'engagement' as const })),
        ...(clientHistory.data || []).map((row) => ({ ...row, entity: 'client' as const })),
        ...(extraWorkHistory.data || []).map((row) => ({ ...row, entity: 'extra_work' as const })),
        ...(meetingHistory.data || []).map((row) => ({ ...row, entity: 'meeting' as const })),
        ...(applicantHistory.data || []).map((row) => ({ ...row, entity: 'applicant' as const })),
      ];
    },
  });

  // === EXECUTIVE METRICS ===
  const metrics = useMemo(() => {
    const activeClients = clients.filter(c => c.status === 'active');
    const activeEngagements = engagements.filter(e => e.status === 'active');
    const activeEngagementIds = new Set(activeEngagements.map(e => e.id));

    const mrr = activeEngagements.reduce(
      (sum, engagement) => sum + getEngagementMonthlyRevenue(engagement.id, engagement.monthly_fee, engagementServices || []),
      0,
    );
    const arr = mrr * 12;
    
    // Pipeline value (leads not yet won)
    const pipelineValue = leads
      .filter(l => !['won', 'lost', 'postponed'].includes(l.stage))
      .reduce((sum, l) => sum + (l.estimated_price || 0), 0);
    
    // Assignment costs from engagement_assignments (source of truth for delivery costs)
    const assignmentCosts = assignments.reduce((sum, a) => {
      if (!activeEngagementIds.has(a.engagement_id)) return sum;
      return sum + (a.monthly_cost || 0);
    }, 0);
    
    // Keep costs aligned with analytics (assignment-based engagement costs)
    const totalCosts = assignmentCosts;
    
    // Planned margin (absolute) = MRR - Total costs
    const plannedMargin = mrr - totalCosts;
    
    // Profitability % = (MRR - Costs) / MRR * 100
    const profitabilityPercent = mrr > 0 ? ((mrr - totalCosts) / mrr * 100) : 0;
    
    // Gross margin kept for compatibility; currently equals profitability with assignment-based costs
    const grossMargin = profitabilityPercent;
    
    return {
      activeClients: activeClients.length,
      activeEngagements: activeEngagements.length,
      activeColleagues: colleagues.filter(c => c.status === 'active').length,
      mrr,
      arr,
      pipelineValue,
      totalCosts,
      plannedMargin,
      profitabilityPercent,
      grossMargin,
    };
  }, [clients, engagements, colleagues, leads, assignments, engagementServices]);

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

  // === RECENT ACTIVITY FEED (history tables, last 7 days) ===
  const recentEvents = useMemo(() => {
    const leadsById = new Map(leads.map((lead) => [lead.id, lead]));
    const engagementsById = new Map(engagements.map((engagement) => [engagement.id, engagement]));
    const clientsById = new Map(clients.map((client) => [client.id, client]));
    const extraWorksById = new Map((extraWorks || []).map((work) => [work.id, work]));
    const meetingsById = new Map(meetings.map((meeting) => [meeting.id, meeting]));
    const applicantsById = new Map(applicants.map((applicant) => [applicant.id, applicant]));

    const getEventConfig = (entity: DashboardHistoryRow['entity']) => {
      switch (entity) {
        case 'lead':
          return { entityLabel: 'Lead', icon: PlusCircle, colorClass: 'text-slate-600 bg-slate-100 dark:bg-slate-800' };
        case 'engagement':
          return { entityLabel: 'Zakázka', icon: Briefcase, colorClass: 'text-blue-600 bg-blue-100 dark:bg-blue-900' };
        case 'client':
          return { entityLabel: 'Klient', icon: Building2, colorClass: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900' };
        case 'extra_work':
          return { entityLabel: 'Vícepráce', icon: Wrench, colorClass: 'text-violet-600 bg-violet-100 dark:bg-violet-900' };
        case 'meeting':
          return { entityLabel: 'Meeting', icon: Calendar, colorClass: 'text-cyan-600 bg-cyan-100 dark:bg-cyan-900' };
        case 'applicant':
          return { entityLabel: 'Uchazeč', icon: Users, colorClass: 'text-amber-600 bg-amber-100 dark:bg-amber-900' };
      }
    };

    const events: ActivityEvent[] = activityHistoryRows
      .filter((row) => !!row.created_at)
      .map((row) => {
        const config = getEventConfig(row.entity);
        const title = `${config.entityLabel}: ${getChangeTypeLabel(row.change_type)}`;
        const subtitlePrefix = row.field_label ? `${row.field_label} - ` : '';

        if (row.entity === 'lead') {
          const leadName = leadsById.get(row.lead_id)?.company_name || 'Neznámý lead';
          const subtitle = row.change_type === 'field_update' || row.change_type === 'stage_change' || row.change_type === 'owner_change'
            ? `${subtitlePrefix}${getFieldChangeSubtitle(leadName, row.old_value, row.new_value)}`
            : `${subtitlePrefix}${leadName}`;
          return { id: `lead-${row.id}`, title, subtitle, at: row.created_at!, icon: config.icon, colorClass: config.colorClass };
        }

        if (row.entity === 'engagement') {
          const engagement = engagementsById.get(row.engagement_id);
          const engagementName = engagement?.name || 'Neznámá zakázka';
          const clientName = engagement ? (clientsById.get(engagement.client_id)?.brand_name || clientsById.get(engagement.client_id)?.name || 'Bez klienta') : 'Bez klienta';
          const baseName = `${clientName} -> ${engagementName}`;
          const subtitle = row.change_type === 'field_update' || row.change_type === 'status_change'
            ? `${subtitlePrefix}${getFieldChangeSubtitle(baseName, row.old_value, row.new_value)}`
            : `${subtitlePrefix}${baseName}`;
          return { id: `engagement-${row.id}`, title, subtitle, at: row.created_at!, icon: config.icon, colorClass: config.colorClass };
        }

        if (row.entity === 'client') {
          const clientName = clientsById.get(row.client_id)?.brand_name || clientsById.get(row.client_id)?.name || 'Neznámý klient';
          const subtitle = row.change_type === 'field_update' || row.change_type === 'status_change' || row.change_type === 'tier_change'
            ? `${subtitlePrefix}${getFieldChangeSubtitle(clientName, row.old_value, row.new_value)}`
            : `${subtitlePrefix}${clientName}`;
          return { id: `client-${row.id}`, title, subtitle, at: row.created_at!, icon: config.icon, colorClass: config.colorClass };
        }

        if (row.entity === 'extra_work') {
          const workName = extraWorksById.get(row.extra_work_id)?.description || 'Neznámá vícepráce';
          const subtitle = row.change_type === 'field_update' || row.change_type === 'status_change'
            ? `${subtitlePrefix}${getFieldChangeSubtitle(workName, row.old_value, row.new_value)}`
            : `${subtitlePrefix}${workName}`;
          return { id: `extra-work-${row.id}`, title, subtitle, at: row.created_at!, icon: config.icon, colorClass: config.colorClass };
        }

        if (row.entity === 'meeting') {
          const meetingName = meetingsById.get(row.meeting_id)?.title || 'Neznámý meeting';
          const subtitle = row.change_type === 'field_update' || row.change_type === 'status_change' || row.change_type === 'rescheduled'
            ? `${subtitlePrefix}${getFieldChangeSubtitle(meetingName, row.old_value, row.new_value)}`
            : `${subtitlePrefix}${meetingName}`;
          return { id: `meeting-${row.id}`, title, subtitle, at: row.created_at!, icon: config.icon, colorClass: config.colorClass };
        }

        const applicantName = applicantsById.get(row.applicant_id)?.full_name || 'Neznámý uchazeč';
        const subtitle = row.change_type === 'field_update' || row.change_type === 'stage_change'
          ? `${subtitlePrefix}${getFieldChangeSubtitle(applicantName, row.old_value, row.new_value)}`
          : `${subtitlePrefix}${applicantName}`;
        return { id: `applicant-${row.id}`, title, subtitle, at: row.created_at!, icon: config.icon, colorClass: config.colorClass };
      });

    return events
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, 50);
  }, [activityHistoryRows, leads, engagements, clients, extraWorks, meetings, applicants]);

  // === GROUPED RECENT ACTIVITY (last 7 days) ===
  const recentActivity = useMemo(() => {
    const sevenDaysAgo = subDays(new Date(), 7);

    const newLeads = leads
      .filter(l => l.created_at && isAfter(parseISO(l.created_at), sevenDaysAgo))
      .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime());

    const newClients = leads
      .filter(l => l.stage === 'won' && l.converted_at && isAfter(parseISO(l.converted_at), sevenDaysAgo))
      .sort((a, b) => new Date(b.converted_at!).getTime() - new Date(a.converted_at!).getTime());

    const offersSent = leads
      .filter(l => l.offer_sent_at && isAfter(parseISO(l.offer_sent_at), sevenDaysAgo))
      .sort((a, b) => new Date(b.offer_sent_at!).getTime() - new Date(a.offer_sent_at!).getTime());

    const contractsSigned = leads
      .filter(l => l.contract_signed_at && isAfter(parseISO(l.contract_signed_at), sevenDaysAgo))
      .sort((a, b) => new Date(b.contract_signed_at!).getTime() - new Date(a.contract_signed_at!).getTime());

    const lostLeads = leads
      .filter(l => l.stage === 'lost' && l.updated_at && isAfter(parseISO(l.updated_at), sevenDaysAgo))
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

    const newEngagements = engagements
      .filter(e => e.start_date && isAfter(parseISO(e.start_date), sevenDaysAgo))
      .sort((a, b) => new Date(b.start_date!).getTime() - new Date(a.start_date!).getTime());

    const endedEngagements = engagements
      .filter(e => e.end_date && isAfter(parseISO(e.end_date), sevenDaysAgo) && ['completed', 'cancelled'].includes(e.status || ''))
      .sort((a, b) => new Date(b.end_date!).getTime() - new Date(a.end_date!).getTime());

    const newExtraWorks = (extraWorks || [])
      .filter(w => w.created_at && isAfter(parseISO(w.created_at), sevenDaysAgo))
      .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime());

    const approvedExtraWorks = (extraWorks || [])
      .filter(w => w.approval_date && isAfter(parseISO(w.approval_date), sevenDaysAgo))
      .sort((a, b) => new Date(b.approval_date!).getTime() - new Date(a.approval_date!).getTime());

    const newModifications = (pendingRequests || [])
      .filter(r => r.created_at && isAfter(parseISO(r.created_at), sevenDaysAgo))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const approvedModifications = (pendingRequests || [])
      .filter(r => r.reviewed_at && ['approved', 'client_approved'].includes(r.status) && isAfter(parseISO(r.reviewed_at), sevenDaysAgo))
      .sort((a, b) => new Date(b.reviewed_at!).getTime() - new Date(a.reviewed_at!).getTime());

    const newMeetingsScheduled = meetings
      .filter(m => m.created_at && isAfter(parseISO(m.created_at), sevenDaysAgo))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const completedMeetings = meetings
      .filter(m => m.status === 'completed' && m.scheduled_at && isAfter(parseISO(m.scheduled_at), sevenDaysAgo))
      .sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());

    const newApplicants = applicants
      .filter(a => a.created_at && isAfter(parseISO(a.created_at), sevenDaysAgo))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const hiredApplicants = applicants
      .filter(a => a.stage === 'hired' && a.updated_at && isAfter(parseISO(a.updated_at), sevenDaysAgo))
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

    const hasAnyActivity =
      newLeads.length > 0 || newClients.length > 0 || offersSent.length > 0 || contractsSigned.length > 0 || lostLeads.length > 0 ||
      newEngagements.length > 0 || endedEngagements.length > 0 ||
      newExtraWorks.length > 0 || approvedExtraWorks.length > 0 ||
      newModifications.length > 0 || approvedModifications.length > 0 ||
      newMeetingsScheduled.length > 0 || completedMeetings.length > 0 ||
      newApplicants.length > 0 || hiredApplicants.length > 0;

    return {
      newLeads, newClients, offersSent, contractsSigned, lostLeads,
      newEngagements, endedEngagements,
      newExtraWorks, approvedExtraWorks,
      newModifications, approvedModifications,
      newMeetingsScheduled, completedMeetings,
      newApplicants, hiredApplicants,
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
        const totalMonthly = clientEngagements.reduce(
          (sum, e) => sum + getEngagementMonthlyRevenue(e.id, e.monthly_fee, engagementServices || []),
          0,
        );
        return { ...client, totalMonthly };
      })
      .sort((a, b) => b.totalMonthly - a.totalMonthly)
      .slice(0, 5);
    
    // Client concentration (top 5 clients % of revenue)
    const totalRevenue = topClients.reduce((sum, c) => sum + c.totalMonthly, 0);
    const top5Revenue = topClients.slice(0, 5).reduce((sum, c) => sum + c.totalMonthly, 0);
    const concentration = totalRevenue > 0 ? (top5Revenue / metrics.mrr * 100) : 0;
    
    return { atRisk, topClients, concentration };
  }, [clients, engagements, engagementServices, metrics.mrr]);

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

  // === LAST MONTH PERFORMANCE ===
  const lastMonthPerformance = useMemo(() => {
    const now = new Date();
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const year = lastMonthDate.getFullYear();
    const month = lastMonthDate.getMonth() + 1;

    const lastMonthInvoices = (issuedInvoices || []).filter((invoice) => {
        const invoiceDateRaw = invoice.fakturoid_duzp_date || invoice.issued_at;
        if (!invoiceDateRaw) return false;
        const invoiceDate = new Date(invoiceDateRaw);
        if (Number.isNaN(invoiceDate.getTime())) return false;
        return invoiceDate.getFullYear() === year && (invoiceDate.getMonth() + 1) === month;
      });
    const invoicing = lastMonthInvoices
      .reduce((sum, invoice) => sum + Number(invoice.fakturoid_total_without_vat ?? invoice.total_amount ?? 0), 0);

    const teamInvoicing = getTeamInvoicingTotalForMonth(year, month);
    const margin = invoicing - teamInvoicing;

    return {
      monthName: format(lastMonthDate, 'LLLL', { locale: cs }),
      invoicing,
      teamInvoicing,
      margin,
    };
  }, [issuedInvoices, getTeamInvoicingTotalForMonth]);

  // === NEXT MONTH PLAN ===
  const nextMonthPlan = useMemo(() => {
    const now = new Date();
    const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const periodStart = startOfMonth(nextMonthDate);
    const periodEnd = endOfMonth(nextMonthDate);
    const invoiceYear = nextMonthDate.getFullYear();
    const invoiceMonth = nextMonthDate.getMonth() + 1;
    const invoicePeriod = `${invoiceYear}-${String(invoiceMonth).padStart(2, '0')}`;
    const activeEngagementIds = new Set(
      engagements
        .filter((engagement) => {
          if (engagement.status !== 'active') return false;
          const start = engagement.start_date ? new Date(engagement.start_date) : null;
          const end = engagement.end_date ? new Date(engagement.end_date) : null;
          if (!start) return false;
          return start <= periodEnd && (!end || end >= periodStart);
        })
        .map((engagement) => engagement.id)
    );
    const activeEngagements = engagements.filter((engagement) => activeEngagementIds.has(engagement.id));
    const retainerTotal = activeEngagements.reduce(
      (sum, engagement) => sum + getEngagementMonthlyRevenue(engagement.id, engagement.monthly_fee, engagementServices || []),
      0,
    );
    
    const creativeBoostPlan = getClientMonthSummaries(invoiceYear, invoiceMonth)
      .reduce((sum, summary) => sum + (summary.maxCredits * summary.pricePerCredit), 0);

    // Planned revenue in agency overview = active engagements + 100 % CB credits.
    const plannedRevenue = retainerTotal + creativeBoostPlan;
    const plannedTeamInvoicing = getTeamInvoicingTotalForMonth(invoiceYear, invoiceMonth);

    return {
      monthName: format(nextMonthDate, 'LLLL', { locale: cs }),
      retainer: retainerTotal,
      creativeBoost: creativeBoostPlan,
      total: plannedRevenue,
      plannedTeamInvoicing,
      plannedMargin: plannedRevenue - plannedTeamInvoicing,
    };
  }, [engagements, engagementServices, getClientMonthSummaries, getTeamInvoicingTotalForMonth]);

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
          const changes = r.proposed_changes as { price?: number; new_price?: number } | null;
          return sum + (changes?.price ?? changes?.new_price ?? 0);
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
        const totalMonthly = clientEngagements.reduce(
          (sum, e) => sum + getEngagementMonthlyRevenue(e.id, e.monthly_fee, engagementServices || []),
          0,
        );
        const engagementNames = clientEngagements.map(e => e.name).join(', ');
        const startDate = parseISO(client.start_date!);
        const timeAgo = formatDistanceToNow(startDate, { locale: cs, addSuffix: true });
        return { ...client, totalMonthly, engagementNames, timeAgo };
      })
      .sort((a, b) => new Date(b.start_date!).getTime() - new Date(a.start_date!).getTime())
      .slice(0, 5);
    
    return realClients;
  }, [clients, engagements, engagementServices]);

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
          value={canSeeFinancials ? `${(lastMonthPerformance.invoicing / 1000).toFixed(0)}k` : '***'}
          subtitle={canSeeFinancials ? `Za ${lastMonthPerformance.monthName}` : undefined}
          icon={Receipt}
          className="border-primary/30 bg-primary/5"
        />
        <KPICard
          title="💵 Marže"
          value={canSeeFinancials ? `${(lastMonthPerformance.margin / 1000).toFixed(0)}k` : '***'}
          subtitle={canSeeFinancials ? (
            <div className="space-y-1">
              <span>Za {lastMonthPerformance.monthName}</span>
              <span>Celková fakturace týmu: {(lastMonthPerformance.teamInvoicing / 1000).toFixed(0)}k</span>
            </div>
          ) : undefined}
          icon={DollarSign}
          className={lastMonthPerformance.margin >= 0 ? 'border-status-active/30 bg-status-active/5' : 'border-destructive/30 bg-destructive/5'}
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
            title={`📊 Plán tržeb ${nextMonthPlan.monthName}`}
            value={canSeeFinancials ? `${(nextMonthPlan.total / 1000).toFixed(0)}k` : '***'}
            subtitle={canSeeFinancials ? (
              <div className="space-y-1">
                <span>Plán. marže: {(nextMonthPlan.plannedMargin / 1000).toFixed(0)}k</span>
                <span>CB (100 % kreditů): {(nextMonthPlan.creativeBoost / 1000).toFixed(0)}k</span>
                <span>Plán. fakturace týmu: {(nextMonthPlan.plannedTeamInvoicing / 1000).toFixed(0)}k</span>
                <Progress 
                  value={nextMonthPlan.total > 0 ? Math.min(((nextMonthPlan.total - nextMonthPlan.plannedTeamInvoicing) / nextMonthPlan.total) * 100, 100) : 0}
                  className="h-1.5"
                />
              </div>
            ) : undefined}
            icon={BarChart3}
            className={
              nextMonthPlan.plannedMargin >= 0
                ? 'border-status-active/30 bg-status-active/5' 
                : nextMonthPlan.total > 0 
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

        {/* Recent Activity - Grouped by category */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">
              📊 Aktivita posledních 7 dní
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {/* 🎯 Sales & Leady */}
                {(recentActivity.newClients.length > 0 || recentActivity.newLeads.length > 0 ||
                  recentActivity.offersSent.length > 0 || recentActivity.contractsSigned.length > 0 ||
                  recentActivity.lostLeads.length > 0) && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-primary uppercase tracking-wide">🎯 Sales & Leady</p>
                    {recentActivity.newClients.length > 0 && (
                      <ActivityRow icon={UserPlus} label="Noví klienti" count={recentActivity.newClients.length}
                        items={recentActivity.newClients.slice(0, 3).map(l => l.company_name)}
                        colorClass="text-emerald-600 bg-emerald-100 dark:bg-emerald-900"
                        value={canSeeFinancials ? recentActivity.newClients.reduce((s, l) => s + (l.estimated_price || 0), 0) : undefined} />
                    )}
                    {recentActivity.newLeads.length > 0 && (
                      <ActivityRow icon={PlusCircle} label="Nové leady" count={recentActivity.newLeads.length}
                        items={recentActivity.newLeads.slice(0, 3).map(l => l.company_name)}
                        colorClass="text-slate-600 bg-slate-100 dark:bg-slate-800" />
                    )}
                    {recentActivity.offersSent.length > 0 && (
                      <ActivityRow icon={Send} label="Odeslané nabídky" count={recentActivity.offersSent.length}
                        items={recentActivity.offersSent.slice(0, 3).map(l => l.company_name)}
                        colorClass="text-pink-600 bg-pink-100 dark:bg-pink-900" />
                    )}
                    {recentActivity.contractsSigned.length > 0 && (
                      <ActivityRow icon={FileSignature} label="Podepsané smlouvy" count={recentActivity.contractsSigned.length}
                        items={recentActivity.contractsSigned.slice(0, 3).map(l => l.company_name)}
                        colorClass="text-emerald-600 bg-emerald-100 dark:bg-emerald-900" />
                    )}
                    {recentActivity.lostLeads.length > 0 && (
                      <ActivityRow icon={TrendingDown} label="Ztracené leady" count={recentActivity.lostLeads.length}
                        items={recentActivity.lostLeads.slice(0, 3).map(l => l.company_name)}
                        colorClass="text-red-600 bg-red-100 dark:bg-red-900"
                        value={canSeeFinancials ? recentActivity.lostLeads.reduce((s, l) => s + (l.estimated_price || 0), 0) : undefined}
                        isNegative />
                    )}
                  </div>
                )}

                {/* 📁 Zakázky & Vícepráce */}
                {(recentActivity.newEngagements.length > 0 || recentActivity.endedEngagements.length > 0 ||
                  recentActivity.newExtraWorks.length > 0 || recentActivity.approvedExtraWorks.length > 0) && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-primary uppercase tracking-wide">📁 Zakázky & Vícepráce</p>
                    {recentActivity.newEngagements.length > 0 && (
                      <ActivityRow icon={Briefcase} label="Nové zakázky" count={recentActivity.newEngagements.length}
                        items={recentActivity.newEngagements.slice(0, 3).map(e => e.name)}
                        colorClass="text-blue-600 bg-blue-100 dark:bg-blue-900" />
                    )}
                    {recentActivity.endedEngagements.length > 0 && (
                      <ActivityRow icon={UserMinus} label="Ukončené zakázky" count={recentActivity.endedEngagements.length}
                        items={recentActivity.endedEngagements.slice(0, 3).map(e => e.name)}
                        colorClass="text-muted-foreground bg-muted" />
                    )}
                    {recentActivity.newExtraWorks.length > 0 && (
                      <ActivityRow icon={Wrench} label="Nové vícepráce" count={recentActivity.newExtraWorks.length}
                        colorClass="text-violet-600 bg-violet-100 dark:bg-violet-900"
                        value={canSeeFinancials ? recentActivity.newExtraWorks.reduce((s, w) => s + w.amount, 0) : undefined} />
                    )}
                    {recentActivity.approvedExtraWorks.length > 0 && (
                      <ActivityRow icon={CheckCircle} label="Schválené vícepráce" count={recentActivity.approvedExtraWorks.length}
                        colorClass="text-green-600 bg-green-100 dark:bg-green-900"
                        value={canSeeFinancials ? recentActivity.approvedExtraWorks.reduce((s, w) => s + w.amount, 0) : undefined} />
                    )}
                  </div>
                )}

                {/* ✏️ Návrhy změn */}
                {(recentActivity.newModifications.length > 0 || recentActivity.approvedModifications.length > 0) && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-primary uppercase tracking-wide">✏️ Návrhy změn</p>
                    {recentActivity.newModifications.length > 0 && (
                      <ActivityRow icon={FileText} label="Nové návrhy" count={recentActivity.newModifications.length}
                        items={recentActivity.newModifications.slice(0, 3).map(m => m.engagement_name)}
                        colorClass="text-amber-600 bg-amber-100 dark:bg-amber-900" />
                    )}
                    {recentActivity.approvedModifications.length > 0 && (
                      <ActivityRow icon={CheckCircle2} label="Schválené návrhy" count={recentActivity.approvedModifications.length}
                        items={recentActivity.approvedModifications.slice(0, 3).map(m => m.engagement_name)}
                        colorClass="text-green-600 bg-green-100 dark:bg-green-900" />
                    )}
                  </div>
                )}

                {/* 📅 Schůzky */}
                {(recentActivity.newMeetingsScheduled.length > 0 || recentActivity.completedMeetings.length > 0) && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-primary uppercase tracking-wide">📅 Schůzky</p>
                    {recentActivity.newMeetingsScheduled.length > 0 && (
                      <ActivityRow icon={Calendar} label="Naplánované" count={recentActivity.newMeetingsScheduled.length}
                        items={recentActivity.newMeetingsScheduled.slice(0, 3).map(m => m.title)}
                        colorClass="text-blue-600 bg-blue-100 dark:bg-blue-900" />
                    )}
                    {recentActivity.completedMeetings.length > 0 && (
                      <ActivityRow icon={CalendarCheck} label="Proběhlé" count={recentActivity.completedMeetings.length}
                        items={recentActivity.completedMeetings.slice(0, 3).map(m => m.title)}
                        colorClass="text-teal-600 bg-teal-100 dark:bg-teal-900" />
                    )}
                  </div>
                )}

                {/* 👥 Recruitment */}
                {(recentActivity.newApplicants.length > 0 || recentActivity.hiredApplicants.length > 0) && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-primary uppercase tracking-wide">👥 Recruitment</p>
                    {recentActivity.newApplicants.length > 0 && (
                      <ActivityRow icon={Users} label="Noví uchazeči" count={recentActivity.newApplicants.length}
                        items={recentActivity.newApplicants.slice(0, 3).map(a => a.full_name)}
                        colorClass="text-slate-600 bg-slate-100 dark:bg-slate-800" />
                    )}
                    {recentActivity.hiredApplicants.length > 0 && (
                      <ActivityRow icon={UserCheck} label="Přijatí" count={recentActivity.hiredApplicants.length}
                        items={recentActivity.hiredApplicants.slice(0, 3).map(a => a.full_name)}
                        colorClass="text-emerald-600 bg-emerald-100 dark:bg-emerald-900" />
                    )}
                  </div>
                )}

                {/* Detailed feed below */}
                {recentEvents.length > 0 && (
                  <div className="space-y-2 border-t pt-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">📋 Podrobný log</p>
                    {recentEvents.slice(0, 20).map((event) => (
                      <ActivityFeedRow key={event.id} {...event} />
                    ))}
                  </div>
                )}

                {!recentActivity.hasAnyActivity && recentEvents.length === 0 && (
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
                🆕 Nové zakázky
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
