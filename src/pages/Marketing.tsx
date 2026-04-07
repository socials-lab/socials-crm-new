import { Component, type ErrorInfo, type ReactNode, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { endOfMonth, format, startOfMonth } from 'date-fns';
import { cs } from 'date-fns/locale';
import { ChevronDown } from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCRMData } from '@/hooks/useCRMData';
import { useLeadsData } from '@/hooks/useLeadsData';
import { useProspectsData } from '@/hooks/useProspectsData';
import { useUserRole } from '@/hooks/useUserRole';

type MarketingRole = 'content_manager' | 'video_editor' | 'graphic_designer';
type MarketingWorkType = 'reels_video' | 'complex_video' | 'podcast' | 'other_hourly';
type MainMarketingActivity =
  | 'content_management'
  | 'video_editing_production'
  | 'podcast_postproduction'
  | 'graphic_design'
  | 'other';
type MonthlyTaskStatus = 'done' | 'partial' | 'not_done';

interface MonthlyTask {
  id: string;
  text: string;
  status: MonthlyTaskStatus | null;
  feedback: string;
}

function parseMonthlyTasks(raw: unknown): MonthlyTask[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item) => typeof item === 'object' && item !== null)
    .map((item: Record<string, unknown>) => ({
      id: typeof item.id === 'string' ? item.id : crypto.randomUUID(),
      text: typeof item.text === 'string' ? item.text : '',
      status: (['done', 'partial', 'not_done'] as string[]).includes(item.status as string)
        ? (item.status as MonthlyTaskStatus)
        : null,
      feedback: typeof item.feedback === 'string' ? item.feedback : '',
    }));
}

function parseLegacyMainTasks(raw: unknown): MonthlyTask[] {
  if (typeof raw !== 'string' || raw.trim().length === 0) return [];
  const parts = raw
    .split(/\r?\n|•|;/g)
    .map((line) => line.replace(/^[-*]\s*/, '').replace(/^\d+[.)]\s*/, '').trim())
    .filter((line) => line.length > 0);
  return parts.map((text) => ({
    id: crypto.randomUUID(),
    text,
    status: null,
    feedback: '',
  }));
}

function getMutationErrorMessage(error: unknown): string {
  if (error && typeof error === 'object') {
    const e = error as Record<string, unknown>;
    const message = typeof e.message === 'string' ? e.message : '';
    const details = typeof e.details === 'string' ? e.details : '';
    const hint = typeof e.hint === 'string' ? e.hint : '';
    const code = typeof e.code === 'string' ? e.code : '';
    const composed = [message, details, hint, code].filter((v) => v.length > 0).join(' | ');
    if (composed.length > 0) return composed;
  }
  if (error instanceof Error) return error.message;
  return String(error);
}

interface MarketingMonthlyPlan {
  id: string;
  year: number;
  month: number;
  planned_total_budget: number;
  planned_labor_budget: number;
  planned_content_budget: number;
  planned_graphic_budget: number;
  planned_video_budget: number;
  planned_podcast_postproduction_budget: number;
  planned_podcast_studio_rent_budget: number;
  planned_other_budget: number;
  planned_meta_budget: number;
  planned_ppc_budget: number;
  planned_prospects: number;
  planned_leads: number;
  planned_new_clients: number;
  planned_main_tasks: string;
  monthly_tasks: unknown;
  monthly_review: string | null;
  notes: string;
}

type MarketingProject = 'socials' | 'danny' | 'otas';

const MARKETING_PROJECT_LABELS: Record<MarketingProject, string> = {
  socials: 'Socials',
  danny: 'Danny',
  otas: 'Oťas',
};

const ALLOCATION_COLORS = ['#3b82f6', '#f59e0b', '#8b5cf6', '#14b8a6', '#ef4444', '#ec4899', '#64748b'];

interface MarketingWorkLog {
  id: string;
  colleague_id: string;
  role: MarketingRole;
  main_activity: MainMarketingActivity | null;
  project: MarketingProject | null;
  activity_date: string;
  title: string;
  description: string | null;
  hours: number | null;
  amount: number;
}

interface MarketingAdSpendEntry {
  id: string;
  year: number;
  month: number;
  spend_date: string;
  channel: 'meta' | 'ppc' | 'other';
  amount: number;
  note: string | null;
}

const ROLE_LABELS: Record<MarketingRole, string> = {
  content_manager: 'Content manager',
  video_editor: 'Video editor',
  graphic_designer: 'Grafička',
};

const DEFAULT_MARKETING_COLLEAGUES = [
  { label: 'Kristýna Zborníková - Content Manager', tokens: ['kristyna', 'zbornik'], primaryRole: 'content_manager' as MarketingRole },
  { label: 'Jan Bečvář - Video editor', tokens: ['jan', 'becvar'], monthlyMinimum: 45000, primaryRole: 'video_editor' as MarketingRole },
  { label: 'Michal Bartošek - Video editor', tokens: ['michal', 'bartosek'], primaryRole: 'video_editor' as MarketingRole },
  { label: 'Alexandra - Graphic Designer', tokens: ['alexandra'], primaryRole: 'graphic_designer' as MarketingRole },
  { label: 'Ivana - Graphic Designer', tokens: ['ivana'], primaryRole: 'graphic_designer' as MarketingRole },
] as const;

const normalizeForMatch = (value: unknown) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const inferPrimaryRoleFromName = (fullName: string): MarketingRole | null => {
  const normalized = normalizeForMatch(fullName);
  if ((normalized.includes('jan') && normalized.includes('becvar')) || (normalized.includes('michal') && normalized.includes('bartosek'))) {
    return 'video_editor';
  }
  if (normalized.includes('kristyna') && normalized.includes('zbornik')) {
    return 'content_manager';
  }
  if (normalized.includes('alexandra') || normalized.includes('ivana')) {
    return 'graphic_designer';
  }
  return null;
};

const WORK_TYPE_LABELS: Record<MarketingWorkType, string> = {
  reels_video: 'Reels z podcastu',
  complex_video: 'Reklamní reels',
  podcast: 'Podcast postprodukce',
  other_hourly: 'Jiné',
};

const MAIN_ACTIVITY_LABELS: Record<MainMarketingActivity, string> = {
  content_management: 'Content management',
  video_editing_production: 'Video editing',
  podcast_postproduction: 'Podcast postprodukce',
  graphic_design: 'Grafika',
  other: 'Jiná',
};

interface ActivityWorkOption {
  value: MarketingWorkType;
  label: string;
  fixedReward?: number;
}

const ACTIVITY_WORK_OPTIONS: Record<MainMarketingActivity, ActivityWorkOption[]> = {
  content_management: [
    { value: 'other_hourly', label: 'Content management' },
  ],
  video_editing_production: [
    { value: 'reels_video', label: 'Reels z podcastu', fixedReward: 500 },
    { value: 'complex_video', label: 'Reklamní reels', fixedReward: 1000 },
    { value: 'other_hourly', label: 'Jiné' },
  ],
  podcast_postproduction: [
    { value: 'podcast', label: 'Podcast postprodukce', fixedReward: 2500 },
    { value: 'other_hourly', label: 'Jiné' },
  ],
  graphic_design: [
    { value: 'other_hourly', label: 'Grafika' },
  ],
  other: [
    { value: 'other_hourly', label: 'Jiné' },
  ],
};

const getWorkOptionForForm = (mainActivity: MainMarketingActivity, workType: MarketingWorkType): ActivityWorkOption | undefined => {
  return ACTIVITY_WORK_OPTIONS[mainActivity]?.find((o) => o.value === workType);
};

const isHourlyWork = (mainActivity: MainMarketingActivity, workType: MarketingWorkType): boolean => {
  const opt = getWorkOptionForForm(mainActivity, workType);
  return !opt?.fixedReward;
};

const getFixedReward = (mainActivity: MainMarketingActivity, workType: MarketingWorkType): number => {
  return getWorkOptionForForm(mainActivity, workType)?.fixedReward ?? 0;
};

const supportsQuantity = (mainActivity: MainMarketingActivity, workType: MarketingWorkType): boolean => {
  return mainActivity === 'video_editing_production' && (workType === 'reels_video' || workType === 'complex_video');
};

const HOURLY_RATE_OPTIONS = [300, 400, 500, 600, 800, 1000];

const getDefaultMainActivityForRole = (role: MarketingRole): MainMarketingActivity => {
  if (role === 'content_manager') return 'content_management';
  if (role === 'graphic_designer') return 'graphic_design';
  return 'video_editing_production';
};

const getDefaultWorkTypeForActivity = (activity: MainMarketingActivity): MarketingWorkType => {
  return ACTIVITY_WORK_OPTIONS[activity][0].value;
};

const resolveMainActivityFromLog = (log: MarketingWorkLog): MainMarketingActivity => {
  if (log.main_activity && log.main_activity in MAIN_ACTIVITY_LABELS) {
    return log.main_activity;
  }
  if ((log.title || '').trim() === WORK_TYPE_LABELS.podcast) {
    return 'podcast_postproduction';
  }
  return getDefaultMainActivityForRole(log.role);
};

const resolveWorkTypeFromLog = (log: MarketingWorkLog): MarketingWorkType => {
  const title = (log.title || '').trim().toLowerCase();
  if (log.hours && log.hours > 0) return 'other_hourly';
  if (title === 'reels video z podcastu' || title === 'reels z podcastu') return 'reels_video';
  if (title === 'reklamní reels' || title === 'standardní reels video') return 'complex_video';
  if (title === 'podcast postprodukce') return 'podcast';
  return 'other_hourly';
};

const getOutputUnitsFromLog = (log: MarketingWorkLog): number => {
  const mainActivity = resolveMainActivityFromLog(log);
  const workType = resolveWorkTypeFromLog(log);
  const fixedReward = getFixedReward(mainActivity, workType);
  if (supportsQuantity(mainActivity, workType) && fixedReward > 0 && !log.hours) {
    return Math.max(1, Math.round((log.amount || 0) / fixedReward));
  }
  return 1;
};

export default function Marketing() {
  return (
    <MarketingErrorBoundary>
      <MarketingPageContent />
    </MarketingErrorBoundary>
  );
}

type MarketingErrorBoundaryState = {
  hasError: boolean;
  errorMessage: string;
};

class MarketingErrorBoundary extends Component<{ children: ReactNode }, MarketingErrorBoundaryState> {
  state: MarketingErrorBoundaryState = {
    hasError: false,
    errorMessage: '',
  };

  static getDerivedStateFromError(error: unknown): MarketingErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error instanceof Error ? error.message : 'Unknown render error',
    };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error('Marketing page render crash:', error, info);
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="p-4 sm:p-6">
        <Card className="border-destructive/40 bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Marketing se nepodařilo vykreslit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            <p className="text-sm text-muted-foreground">
              Stránka spadla během renderu. Pošli prosím tuto hlášku:
            </p>
            <pre className="rounded border bg-background p-2 text-xs whitespace-pre-wrap break-words">
              {this.state.errorMessage}
            </pre>
            <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
              Obnovit stránku
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
}

function MarketingPageContent() {
  const queryClient = useQueryClient();
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [isRoleBreakdownOpen, setIsRoleBreakdownOpen] = useState(false);
  const [isMainMonthlyPlanOpen, setIsMainMonthlyPlanOpen] = useState(false);
  const [isDetailMonthlyPlanOpen, setIsDetailMonthlyPlanOpen] = useState(false);
  const [isManualCostsOpen, setIsManualCostsOpen] = useState(false);
  const [isWorkLogFormOpen, setIsWorkLogFormOpen] = useState(true);
  const [editingWorkLogId, setEditingWorkLogId] = useState<string | null>(null);
  const [activityFilterColleagueId, setActivityFilterColleagueId] = useState<string>('all');
  const [editingManualCostId, setEditingManualCostId] = useState<string | null>(null);
  const [manualCostForm, setManualCostForm] = useState({
    spend_date: format(now, 'yyyy-MM-dd'),
    amount: '',
    note: '',
  });
  const [isAnnualRoleBreakdownOpen, setIsAnnualRoleBreakdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'monthly' | 'annual'>('monthly');

  const crmData = useCRMData();
  const leadsData = useLeadsData();
  const prospectsData = useProspectsData();

  const rawColleagues = crmData?.colleagues;
  const rawClients = crmData?.clients;
  const rawLeads = leadsData?.leads;
  const rawProspects = prospectsData?.prospects;

  const colleagues = useMemo(
    () => Array.isArray(rawColleagues) ? rawColleagues.filter((item) => item && typeof item === 'object') : [],
    [rawColleagues],
  );
  const clients = useMemo(
    () => Array.isArray(rawClients) ? rawClients.filter((item) => item && typeof item === 'object') : [],
    [rawClients],
  );
  const leads = useMemo(
    () => Array.isArray(rawLeads) ? rawLeads.filter((item) => item && typeof item === 'object') : [],
    [rawLeads],
  );
  const prospects = useMemo(
    () => Array.isArray(rawProspects) ? rawProspects.filter((item) => item && typeof item === 'object') : [],
    [rawProspects],
  );
  const { colleagueId, role, isSuperAdmin } = useUserRole();

  const canManageBudgets = isSuperAdmin || role === 'admin' || role === 'management';
  const canAccessAdminMarketingSections = isSuperAdmin || role === 'admin';
  const canAccessAnnualMarketingOverview = isSuperAdmin || role === 'admin';
  const canCreateLogsForOthers = canManageBudgets;

  const monthStart = startOfMonth(new Date(selectedYear, selectedMonth - 1, 1));
  const monthEnd = endOfMonth(monthStart);
  const monthStartIso = format(monthStart, 'yyyy-MM-dd');
  const monthEndIso = format(monthEnd, 'yyyy-MM-dd');
  const yearStart = startOfMonth(new Date(selectedYear, 0, 1));
  const yearEnd = endOfMonth(new Date(selectedYear, 11, 1));
  const yearStartIso = format(yearStart, 'yyyy-MM-dd');
  const yearEndIso = format(yearEnd, 'yyyy-MM-dd');

  const { data: monthlyPlan, isLoading: isPlanLoading } = useQuery({
    queryKey: ['marketing_monthly_plan', selectedYear, selectedMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketing_monthly_plans' as never)
        .select('*')
        .eq('year', selectedYear)
        .eq('month', selectedMonth)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as MarketingMonthlyPlan | null) || null;
    },
  });

  const { data: yearlyPlans = [] } = useQuery({
    queryKey: ['marketing_yearly_plans', selectedYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketing_monthly_plans' as never)
        .select('*')
        .eq('year', selectedYear)
        .order('month', { ascending: true });
      if (error) throw error;
      return (data as unknown as MarketingMonthlyPlan[]) || [];
    },
  });

  const { data: workLogs = [], isLoading: isWorkLogsLoading } = useQuery({
    queryKey: ['marketing_work_logs', selectedYear, selectedMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketing_work_logs' as never)
        .select('*')
        .gte('activity_date', monthStartIso)
        .lte('activity_date', monthEndIso)
        .order('activity_date', { ascending: false });
      if (error) throw error;
      return (data as unknown as MarketingWorkLog[]) || [];
    },
  });

  const { data: yearlyWorkLogs = [] } = useQuery({
    queryKey: ['marketing_work_logs_year', selectedYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketing_work_logs' as never)
        .select('*')
        .gte('activity_date', yearStartIso)
        .lte('activity_date', yearEndIso);
      if (error) throw error;
      return (data as unknown as MarketingWorkLog[]) || [];
    },
  });

  const { data: adSpendEntries = [], isLoading: isAdSpendLoading } = useQuery({
    queryKey: ['marketing_ad_spend_entries', selectedYear, selectedMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketing_ad_spend_entries' as never)
        .select('*')
        .eq('year', selectedYear)
        .eq('month', selectedMonth);
      if (error) throw error;
      return (data as unknown as MarketingAdSpendEntry[]) || [];
    },
  });

  const { data: yearlyAdSpendEntries = [] } = useQuery({
    queryKey: ['marketing_ad_spend_entries_year', selectedYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketing_ad_spend_entries' as never)
        .select('*')
        .eq('year', selectedYear);
      if (error) throw error;
      return (data as unknown as MarketingAdSpendEntry[]) || [];
    },
  });

  const [planForm, setPlanForm] = useState({
    planned_total_budget: 0,
    planned_content_budget: 0,
    planned_graphic_budget: 0,
    planned_video_budget: 0,
    planned_podcast_postproduction_budget: 0,
    planned_podcast_studio_rent_budget: 0,
    planned_other_budget: 0,
    planned_meta_budget: 0,
    planned_ppc_budget: 0,
    planned_prospects: 0,
    planned_leads: 0,
    planned_new_clients: 0,
    planned_main_tasks: '',
    monthly_tasks: [] as MonthlyTask[],
    monthly_review: '',
    notes: '',
  });

  useEffect(() => {
    if (!monthlyPlan) {
      setPlanForm({
        planned_total_budget: 0,
        planned_content_budget: 0,
        planned_graphic_budget: 0,
        planned_video_budget: 0,
        planned_podcast_postproduction_budget: 0,
        planned_podcast_studio_rent_budget: 0,
        planned_other_budget: 0,
        planned_meta_budget: 0,
        planned_ppc_budget: 0,
        planned_prospects: 0,
        planned_leads: 0,
        planned_new_clients: 0,
        planned_main_tasks: '',
        monthly_tasks: [],
        monthly_review: '',
        notes: '',
      });
      return;
    }
    const parsedMonthlyTasks = parseMonthlyTasks(monthlyPlan.monthly_tasks);
    const legacyMainTasks = parseLegacyMainTasks(monthlyPlan.planned_main_tasks);
    setPlanForm({
      planned_total_budget: Number(monthlyPlan.planned_total_budget || 0),
      planned_content_budget: Number(monthlyPlan.planned_content_budget || 0),
      planned_graphic_budget: Number(monthlyPlan.planned_graphic_budget || 0),
      planned_video_budget: Number(monthlyPlan.planned_video_budget || 0),
      planned_podcast_postproduction_budget: Number(monthlyPlan.planned_podcast_postproduction_budget || 0),
      planned_podcast_studio_rent_budget: Number(monthlyPlan.planned_podcast_studio_rent_budget || 0),
      planned_other_budget: Number(monthlyPlan.planned_other_budget || 0),
      planned_meta_budget: Number(monthlyPlan.planned_meta_budget || 0),
      planned_ppc_budget: Number(monthlyPlan.planned_ppc_budget || 0),
      planned_prospects: Number(monthlyPlan.planned_prospects || 0),
      planned_leads: Number(monthlyPlan.planned_leads || 0),
      planned_new_clients: Number(monthlyPlan.planned_new_clients || 0),
      planned_main_tasks: monthlyPlan.planned_main_tasks || '',
      monthly_tasks: parsedMonthlyTasks.length > 0 ? parsedMonthlyTasks : legacyMainTasks,
      monthly_review: monthlyPlan.monthly_review || '',
      notes: monthlyPlan.notes || '',
    });
  }, [monthlyPlan]);

  const [workLogForm, setWorkLogForm] = useState({
    colleague_id: colleagueId || '',
    role: 'content_manager' as MarketingRole,
    main_activity: 'content_management' as MainMarketingActivity,
    work_type: 'other_hourly' as MarketingWorkType,
    project: 'socials' as MarketingProject,
    activity_date: format(now, 'yyyy-MM-dd'),
    title: '',
    description: '',
    quantity: '1',
    hours: '',
    hourly_rate: '500',
  });

  const saveMonthlyPlanMutation = useMutation({
    mutationFn: async (section: 'main' | 'detail') => {
      const plannedLaborBudget = Number(planForm.planned_content_budget || 0)
        + Number(planForm.planned_graphic_budget || 0)
        + Number(planForm.planned_video_budget || 0)
        + Number(planForm.planned_podcast_postproduction_budget || 0);

      const basePayload = {
        year: selectedYear,
        month: selectedMonth,
      };

      if (section === 'detail') {
        const detailTotal = plannedLaborBudget
          + Number(planForm.planned_podcast_studio_rent_budget || 0)
          + Number(planForm.planned_other_budget || 0)
          + Number(planForm.planned_meta_budget || 0)
          + Number(planForm.planned_ppc_budget || 0);

        const detailPayload = {
          ...basePayload,
          planned_total_budget: detailTotal,
          planned_labor_budget: plannedLaborBudget,
          planned_content_budget: Number(planForm.planned_content_budget || 0),
          planned_graphic_budget: Number(planForm.planned_graphic_budget || 0),
          planned_video_budget: Number(planForm.planned_video_budget || 0),
          planned_podcast_postproduction_budget: Number(planForm.planned_podcast_postproduction_budget || 0),
          planned_podcast_studio_rent_budget: Number(planForm.planned_podcast_studio_rent_budget || 0),
          planned_other_budget: Number(planForm.planned_other_budget || 0),
          planned_meta_budget: Number(planForm.planned_meta_budget || 0),
          planned_ppc_budget: Number(planForm.planned_ppc_budget || 0),
          planned_prospects: Number(planForm.planned_prospects || 0),
          planned_leads: Number(planForm.planned_leads || 0),
          planned_new_clients: Number(planForm.planned_new_clients || 0),
        };
        const { error } = await supabase
          .from('marketing_monthly_plans' as never)
          .upsert(detailPayload as never, { onConflict: 'year,month' });
        if (error) throw error;
        return;
      }

      const mainPayload = {
        ...basePayload,
        planned_labor_budget: plannedLaborBudget,
        planned_main_tasks: (planForm.monthly_tasks
          .map((task) => task.text.trim())
          .filter((text) => text.length > 0)
          .join('\n')) || planForm.planned_main_tasks || '',
        monthly_tasks: planForm.monthly_tasks,
        monthly_review: planForm.monthly_review || '',
        notes: planForm.notes || '',
      };

      const { error } = await supabase
        .from('marketing_monthly_plans' as never)
        .upsert(mainPayload as never, { onConflict: 'year,month' });
      if (error) throw error;
    },
    onSuccess: (_, section) => {
      queryClient.invalidateQueries({ queryKey: ['marketing_monthly_plan', selectedYear, selectedMonth] });
      queryClient.invalidateQueries({ queryKey: ['marketing_yearly_plans', selectedYear] });
      toast.success(
        section === 'main'
          ? 'Hlavní plán měsíce byl uložen.'
          : 'Detailní plán měsíce (rozpočet) byl uložen.',
      );
    },
    onError: (error) => {
      console.error(error);
      const msg = getMutationErrorMessage(error);
      toast.error(`Uložení se nezdařilo: ${msg}`);
    },
  });

  const syncMetaSpendMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('sync-meta-ad-spend', {
        body: {
          year: selectedYear,
          month: selectedMonth,
        },
      });
      if (error) {
        let detail = '';
        try {
          const ctx = (error as unknown as { context?: Response }).context;
          if (ctx instanceof Response) {
            const body = await ctx.json() as { error?: string; details?: string };
            detail = body?.details || body?.error || '';
          }
        } catch { /* ignore parse errors */ }
        throw new Error(detail || error.message || 'Edge Function returned a non-2xx status code');
      }
      if (data?.error) {
        throw new Error(String(data.details || data.error));
      }
      return data as { synced_days?: number; total_spend?: number };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['marketing_ad_spend_entries', selectedYear, selectedMonth] });
      queryClient.invalidateQueries({ queryKey: ['marketing_ad_spend_entries_year', selectedYear] });
      const total = Number(data?.total_spend || 0);
      toast.success(`Meta spend synchronizován (${Math.round(total).toLocaleString('cs-CZ')} Kč).`);
    },
    onError: (error) => {
      console.error(error);
      toast.error(`Sync Meta Ads selhal: ${getMutationErrorMessage(error)}`);
    },
  });

  const buildWorkLogPayload = () => {
    if (!workLogForm.colleague_id) throw new Error('Vyberte kolegu.');
    if (!workLogForm.main_activity) throw new Error('Vyberte hlavní činnost.');
    if (!workLogForm.description.trim()) throw new Error('Vyplňte popis (např. název reelska, epizoda podcastu, případová studie…).');
    const ma = workLogForm.main_activity as MainMarketingActivity;
    const hourly = isHourlyWork(ma, workLogForm.work_type);
    let amount = 0;
    let title = workLogForm.title.trim();
    let hours: number | null = null;

    if (hourly) {
      const parsedHours = Number(workLogForm.hours);
      const parsedHourlyRate = Number(workLogForm.hourly_rate);
      if (!Number.isFinite(parsedHours) || parsedHours <= 0) {
        throw new Error('Vyplňte počet hodin.');
      }
      if (!Number.isFinite(parsedHourlyRate) || parsedHourlyRate <= 0) {
        throw new Error('Vyberte hodinovou sazbu.');
      }
      if (!title) {
        throw new Error('Vyplňte název činnosti.');
      }
      hours = parsedHours;
      amount = parsedHours * parsedHourlyRate;
    } else {
      const opt = getWorkOptionForForm(ma, workLogForm.work_type);
      title = opt?.label || WORK_TYPE_LABELS[workLogForm.work_type];
      const fixedReward = getFixedReward(ma, workLogForm.work_type);
      const parsedQuantity = Number(workLogForm.quantity);
      const quantity = supportsQuantity(ma, workLogForm.work_type) ? parsedQuantity : 1;
      if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isInteger(quantity)) {
        throw new Error('Vyplňte počet kusů jako celé číslo (1, 2, 3…).');
      }
      amount = fixedReward * quantity;
    }

    return {
      colleague_id: workLogForm.colleague_id,
      role: workLogForm.role,
      main_activity: workLogForm.main_activity,
      project: workLogForm.project,
      activity_date: workLogForm.activity_date,
      title,
      description: workLogForm.description.trim(),
      hours,
      amount,
    };
  };

  const resetWorkLogForm = () => {
    setWorkLogForm((prev) => ({
      ...prev,
      main_activity: getDefaultMainActivityForRole(prev.role),
      work_type: getDefaultWorkTypeForActivity(getDefaultMainActivityForRole(prev.role)),
      title: '',
      description: '',
      quantity: '1',
      hours: '',
      hourly_rate: String(colleagueHourlyRateById.get(prev.colleague_id) ?? 500),
    }));
    setEditingWorkLogId(null);
  };

  const addWorkLogMutation = useMutation({
    mutationFn: async () => {
      const payload = buildWorkLogPayload();
      const { error } = await supabase.from('marketing_work_logs' as never).insert(payload as never);
      if (error) throw new Error(getMutationErrorMessage(error));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing_work_logs', selectedYear, selectedMonth] });
      resetWorkLogForm();
      toast.success('Marketing práce byla zapsána.');
    },
    onError: (error) => {
      console.error(error);
      toast.error(`Nepodařilo se zapsat marketing práci: ${getMutationErrorMessage(error)}`);
    },
  });

  const updateWorkLogMutation = useMutation({
    mutationFn: async () => {
      if (!editingWorkLogId) throw new Error('Není vybraná aktivita k úpravě.');
      const payload = buildWorkLogPayload();
      const { error } = await supabase
        .from('marketing_work_logs' as never)
        .update(payload as never)
        .eq('id', editingWorkLogId);
      if (error) throw new Error(getMutationErrorMessage(error));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing_work_logs', selectedYear, selectedMonth] });
      resetWorkLogForm();
      toast.success('Aktivita byla upravena.');
    },
    onError: (error) => {
      console.error(error);
      toast.error(`Nepodařilo se upravit aktivitu: ${getMutationErrorMessage(error)}`);
    },
  });

  const deleteWorkLogMutation = useMutation({
    mutationFn: async (logId: string) => {
      const { error } = await supabase
        .from('marketing_work_logs' as never)
        .delete()
        .eq('id', logId);
      if (error) throw new Error(getMutationErrorMessage(error));
    },
    onSuccess: (_, logId) => {
      queryClient.invalidateQueries({ queryKey: ['marketing_work_logs', selectedYear, selectedMonth] });
      if (editingWorkLogId === logId) {
        resetWorkLogForm();
      }
      toast.success('Aktivita byla smazána.');
    },
    onError: (error) => {
      console.error(error);
      toast.error(`Nepodařilo se smazat aktivitu: ${getMutationErrorMessage(error)}`);
    },
  });

  const resetManualCostForm = () => {
    setManualCostForm({
      spend_date: format(now, 'yyyy-MM-dd'),
      amount: '',
      note: '',
    });
    setEditingManualCostId(null);
  };

  const saveManualCostMutation = useMutation({
    mutationFn: async () => {
      const parsedAmount = Number(manualCostForm.amount);
      if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        throw new Error('Vyplňte částku větší než 0 Kč.');
      }
      if (!manualCostForm.spend_date) {
        throw new Error('Vyplňte datum nákladu.');
      }
      if (!manualCostForm.note.trim()) {
        throw new Error('Vyplňte poznámku k nákladu (např. event, pronájem, produkce).');
      }
      const spendDate = new Date(manualCostForm.spend_date);
      if (!Number.isFinite(spendDate.getTime())) {
        throw new Error('Datum nákladu je neplatné.');
      }

      const payload = {
        year: spendDate.getFullYear(),
        month: spendDate.getMonth() + 1,
        spend_date: manualCostForm.spend_date,
        channel: 'other' as const,
        amount: parsedAmount,
        note: manualCostForm.note.trim(),
      };

      if (editingManualCostId) {
        const { error } = await supabase
          .from('marketing_ad_spend_entries' as never)
          .update(payload as never)
          .eq('id', editingManualCostId)
          .eq('channel', 'other');
        if (error) throw new Error(getMutationErrorMessage(error));
        return;
      }

      const { error } = await supabase
        .from('marketing_ad_spend_entries' as never)
        .insert(payload as never);
      if (error) throw new Error(getMutationErrorMessage(error));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing_ad_spend_entries', selectedYear, selectedMonth] });
      queryClient.invalidateQueries({ queryKey: ['marketing_ad_spend_entries_year', selectedYear] });
      resetManualCostForm();
      toast.success(editingManualCostId ? 'Manuální náklad byl upraven.' : 'Manuální náklad byl přidán.');
    },
    onError: (error) => {
      console.error(error);
      toast.error(`Nepodařilo se uložit manuální náklad: ${getMutationErrorMessage(error)}`);
    },
  });

  const deleteManualCostMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('marketing_ad_spend_entries' as never)
        .delete()
        .eq('id', id)
        .eq('channel', 'other');
      if (error) throw new Error(getMutationErrorMessage(error));
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['marketing_ad_spend_entries', selectedYear, selectedMonth] });
      queryClient.invalidateQueries({ queryKey: ['marketing_ad_spend_entries_year', selectedYear] });
      if (editingManualCostId === id) resetManualCostForm();
      toast.success('Manuální náklad byl smazán.');
    },
    onError: (error) => {
      console.error(error);
      toast.error(`Nepodařilo se smazat manuální náklad: ${getMutationErrorMessage(error)}`);
    },
  });

  const plannedAdSpendBudget = Number(planForm.planned_meta_budget || 0) + Number(planForm.planned_ppc_budget || 0);
  const plannedLaborBudget = Number(planForm.planned_content_budget || 0)
    + Number(planForm.planned_graphic_budget || 0)
    + Number(planForm.planned_video_budget || 0)
    + Number(planForm.planned_podcast_postproduction_budget || 0);
  const plannedDetailTotalBudget = plannedAdSpendBudget
    + plannedLaborBudget
    + Number(planForm.planned_podcast_studio_rent_budget || 0)
    + Number(planForm.planned_other_budget || 0);

  const actualLaborCost = useMemo(() => workLogs.reduce((sum, item) => sum + (item.amount || 0), 0), [workLogs]);
  const adSpendTotal = useMemo(() => adSpendEntries.reduce((sum, item) => sum + (item.amount || 0), 0), [adSpendEntries]);
  const actualMetaSpend = useMemo(
    () => adSpendEntries.filter((entry) => entry.channel === 'meta').reduce((sum, entry) => sum + (entry.amount || 0), 0),
    [adSpendEntries]
  );
  const actualPpcSpend = useMemo(
    () => adSpendEntries.filter((entry) => entry.channel === 'ppc').reduce((sum, entry) => sum + (entry.amount || 0), 0),
    [adSpendEntries]
  );
  const contentWorkCost = useMemo(
    () => workLogs
      .filter((item) => resolveMainActivityFromLog(item) === 'content_management')
      .reduce((sum, item) => sum + (item.amount || 0), 0),
    [workLogs]
  );
  const creativeWorkCost = useMemo(
    () => workLogs
      .filter((item) => resolveMainActivityFromLog(item) === 'graphic_design')
      .reduce((sum, item) => sum + (item.amount || 0), 0),
    [workLogs]
  );
  const videoWorkCost = useMemo(
    () => workLogs
      .filter((item) => resolveMainActivityFromLog(item) === 'video_editing_production')
      .reduce((sum, item) => sum + (item.amount || 0), 0),
    [workLogs]
  );
  const podcastPostproductionCost = useMemo(
    () => workLogs
      .filter((item) => resolveMainActivityFromLog(item) === 'podcast_postproduction')
      .reduce((sum, item) => sum + (item.amount || 0), 0),
    [workLogs]
  );
  const pureVideoEditingCost = videoWorkCost;
  const actualOtherSpend = useMemo(
    () => adSpendEntries.filter((entry) => entry.channel === 'other').reduce((sum, entry) => sum + (entry.amount || 0), 0),
    [adSpendEntries]
  );
  const actualOtherCost = actualOtherSpend;
  const actualTotalCost = actualLaborCost + adSpendTotal;
  const detailBudgetDiff = plannedDetailTotalBudget - actualTotalCost;

  const colleagueNameById = useMemo(() => {
    const map = new Map<string, string>();
    colleagues.forEach((colleague: any) => {
      if (typeof colleague?.id !== 'string') return;
      map.set(colleague.id, colleague?.full_name || 'Neznámý kolega');
    });
    return map;
  }, [colleagues]);

  const defaultMarketingColleagues = useMemo(() => {
    return DEFAULT_MARKETING_COLLEAGUES.map((config) => {
      const found = colleagues.find((colleague: any) => {
        if (typeof colleague?.full_name !== 'string') return false;
        const normalizedName = normalizeForMatch(colleague.full_name || '');
        return config.tokens.every((token) => normalizedName.includes(token));
      });
      return {
        id: found?.id || null,
        label: config.label,
      };
    });
  }, [colleagues]);

  // Map colleague ID → monthly minimum (only for those who have one configured)
  const colleagueMonthlyMinimumById = useMemo(() => {
    const map = new Map<string, number>();
    DEFAULT_MARKETING_COLLEAGUES.forEach((config) => {
      if (!('monthlyMinimum' in config)) return;
      const found = colleagues.find((colleague: any) => {
        if (typeof colleague?.full_name !== 'string') return false;
        const normalized = normalizeForMatch(colleague.full_name || '');
        return config.tokens.every((token) => normalized.includes(token));
      });
      if (found?.id) map.set(found.id, (config as { monthlyMinimum: number }).monthlyMinimum);
    });
    return map;
  }, [colleagues]);

  const colleaguePrimaryRoleById = useMemo(() => {
    const map = new Map<string, MarketingRole>();
    colleagues.forEach((colleague: any) => {
      if (typeof colleague?.id !== 'string' || typeof colleague?.full_name !== 'string') return;
      const inferred = inferPrimaryRoleFromName(colleague.full_name);
      if (inferred) map.set(colleague.id, inferred);
    });
    return map;
  }, [colleagues]);

  const colleagueHourlyRateById = useMemo(() => {
    const map = new Map<string, number>();
    colleagues.forEach((colleague: any) => {
      if (typeof colleague?.id !== 'string') return;
      const rate = Number(colleague?.internal_hourly_cost);
      if (Number.isFinite(rate) && rate > 0) {
        map.set(colleague.id, rate);
      }
    });
    return map;
  }, [colleagues]);

  const availableHourlyRateOptions = useMemo(() => {
    const rates = new Set<number>(HOURLY_RATE_OPTIONS);
    colleagueHourlyRateById.forEach((rate) => rates.add(rate));
    return Array.from(rates).sort((a, b) => a - b);
  }, [colleagueHourlyRateById]);

  const colleagueSummary = useMemo(() => {
    type ActivityEntry = { count: number; totalAmount: number };
    const byColleague = new Map<string, {
      name: string;
      amount: number;
      hours: number;
      logs: number;
      activityMap: Map<string, ActivityEntry>;
    }>();

    workLogs.forEach((item) => {
      const cid = item.colleague_id || '__unknown__';
      const name = colleagueNameById.get(cid) || 'Neznámý kolega';
      const outputUnits = getOutputUnitsFromLog(item);
      if (!byColleague.has(cid)) {
        byColleague.set(cid, { name, amount: 0, hours: 0, logs: 0, activityMap: new Map() });
      }
      const entry = byColleague.get(cid)!;
      entry.amount += item.amount || 0;
      entry.hours += item.hours || 0;
      entry.logs += outputUnits;
      const title = item.title || '(bez názvu)';
      const act = entry.activityMap.get(title) ?? { count: 0, totalAmount: 0 };
      act.count += outputUnits;
      act.totalAmount += item.amount || 0;
      entry.activityMap.set(title, act);
    });

    return Array.from(byColleague.entries())
      .map(([cid, entry]) => {
        const monthlyMinimum = colleagueMonthlyMinimumById.get(cid) ?? null;
        const activities = Array.from(entry.activityMap.entries())
          .map(([title, { count, totalAmount }]) => ({ title, count, totalAmount }))
          .sort((a, b) => b.count - a.count);
        return {
          id: cid,
          name: entry.name,
          amount: entry.amount,
          hours: entry.hours,
          logs: entry.logs,
          activities,
          monthlyMinimum,
          remainingToMinimum: monthlyMinimum !== null ? Math.max(0, monthlyMinimum - entry.amount) : null,
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [colleagueNameById, colleagueMonthlyMinimumById, workLogs]);

  const leadsInMonth = useMemo(() => {
    return leads.filter((lead) => {
      const created = new Date(lead.created_at);
      return Number.isFinite(created.getTime()) && created >= monthStart && created <= monthEnd;
    }).length;
  }, [leads, monthStart, monthEnd]);

  const prospectsInMonth = useMemo(() => {
    return prospects.filter((prospect) => {
      const created = new Date(prospect.created_at);
      return Number.isFinite(created.getTime()) && created >= monthStart && created <= monthEnd;
    }).length;
  }, [prospects, monthStart, monthEnd]);

  const newClientsInMonth = useMemo(() => {
    return clients.filter((client) => {
      const created = new Date(client.created_at);
      return Number.isFinite(created.getTime()) && created >= monthStart && created <= monthEnd;
    }).length;
  }, [clients, monthStart, monthEnd]);

  const convertedLeadsInMonth = useMemo(() => {
    return leads.filter((lead) => {
      if (!lead.converted_at) return false;
      const convertedAt = new Date(lead.converted_at);
      return Number.isFinite(convertedAt.getTime()) && convertedAt >= monthStart && convertedAt <= monthEnd;
    }).length;
  }, [leads, monthStart, monthEnd]);

  const selectableColleagues = useMemo(
    () => colleagues.filter((colleague: any) => (
      colleague?.status === 'active'
      && typeof colleague?.id === 'string'
      && colleague.id.trim().length > 0
      && typeof colleague?.full_name === 'string'
      && colleague.full_name.trim().length > 0
    )),
    [colleagues]
  );

  useEffect(() => {
    if (!canAccessAnnualMarketingOverview && activeTab === 'annual') {
      setActiveTab('monthly');
    }
  }, [activeTab, canAccessAnnualMarketingOverview]);

  const activityFilterOptions = useMemo(() => {
    const byId = new Map<string, string>();
    workLogs.forEach((log) => {
      if (!log.colleague_id) return;
      const name = colleagueNameById.get(log.colleague_id) || 'Neznámý kolega';
      byId.set(log.colleague_id, name);
    });
    return Array.from(byId.entries())
      .map(([id, full_name]) => ({ id, full_name }))
      .sort((a, b) => a.full_name.localeCompare(b.full_name, 'cs'));
  }, [colleagueNameById, workLogs]);

  const filteredWorkLogs = useMemo(() => {
    if (activityFilterColleagueId === 'all') return workLogs;
    return workLogs.filter((log) => log.colleague_id === activityFilterColleagueId);
  }, [activityFilterColleagueId, workLogs]);

  const manualOtherCosts = useMemo(
    () => adSpendEntries
      .filter((entry) => entry.channel === 'other')
      .sort((a, b) => new Date(b.spend_date).getTime() - new Date(a.spend_date).getTime()),
    [adSpendEntries]
  );

  useEffect(() => {
    if (selectableColleagues.length === 0) return;
    const hasLoggedInColleague = !!colleagueId && selectableColleagues.some((c) => c.id === colleagueId);
    const fallbackId = selectableColleagues[0].id;
    const preferredId = hasLoggedInColleague ? colleagueId! : fallbackId;
    const preferredRole = colleaguePrimaryRoleById.get(preferredId);
    const preferredHourlyRate = colleagueHourlyRateById.get(preferredId);

    if (!workLogForm.colleague_id) {
      setWorkLogForm((prev) => ({
        ...prev,
        colleague_id: preferredId,
        role: preferredRole ?? prev.role,
        main_activity: preferredRole
          ? getDefaultMainActivityForRole(preferredRole)
          : prev.main_activity,
        work_type: preferredRole
          ? getDefaultWorkTypeForActivity(getDefaultMainActivityForRole(preferredRole))
          : prev.work_type,
        title: preferredRole ? '' : prev.title,
        hourly_rate: preferredHourlyRate ? String(preferredHourlyRate) : prev.hourly_rate,
      }));
      return;
    }

    // If colleagueId arrives later, replace the temporary fallback selection.
    if (
      hasLoggedInColleague
      && workLogForm.colleague_id !== colleagueId
      && workLogForm.colleague_id === fallbackId
    ) {
      setWorkLogForm((prev) => ({
        ...prev,
        colleague_id: colleagueId!,
        role: colleaguePrimaryRoleById.get(colleagueId!) ?? prev.role,
        main_activity: colleaguePrimaryRoleById.get(colleagueId!)
          ? getDefaultMainActivityForRole(colleaguePrimaryRoleById.get(colleagueId!)!)
          : prev.main_activity,
        work_type: colleaguePrimaryRoleById.get(colleagueId!)
          ? getDefaultWorkTypeForActivity(getDefaultMainActivityForRole(colleaguePrimaryRoleById.get(colleagueId!)!))
          : prev.work_type,
        hourly_rate: colleagueHourlyRateById.get(colleagueId!)
          ? String(colleagueHourlyRateById.get(colleagueId!))
          : prev.hourly_rate,
      }));
    }
  }, [colleagueHourlyRateById, colleagueId, colleaguePrimaryRoleById, selectableColleagues, workLogForm.colleague_id]);

  useEffect(() => {
    if (!workLogForm.colleague_id) return;
    const mappedRole = colleaguePrimaryRoleById.get(workLogForm.colleague_id);
    if (!mappedRole || mappedRole === workLogForm.role) return;
    const mappedMainActivity = getDefaultMainActivityForRole(mappedRole);
    const mappedWorkType = getDefaultWorkTypeForActivity(mappedMainActivity);
    setWorkLogForm((prev) => ({
      ...prev,
      role: mappedRole,
      main_activity: mappedMainActivity,
      work_type: mappedWorkType,
      title: '',
      quantity: '1',
      hourly_rate: String((colleagueHourlyRateById.get(prev.colleague_id) ?? Number(prev.hourly_rate)) || 500),
    }));
  }, [colleagueHourlyRateById, colleaguePrimaryRoleById, workLogForm.colleague_id, workLogForm.role]);

  const annualRows = useMemo(() => {
    const plansByMonth = new Map<number, MarketingMonthlyPlan>();
    yearlyPlans.forEach((plan) => plansByMonth.set(plan.month, plan));

    const actualWorkByMonth = new Map<number, number>();
    yearlyWorkLogs.forEach((log) => {
      const date = new Date(log.activity_date);
      if (!Number.isFinite(date.getTime())) return;
      const month = date.getMonth() + 1;
      actualWorkByMonth.set(month, (actualWorkByMonth.get(month) || 0) + (log.amount || 0));
    });

    const spendByMonth = new Map<number, { meta: number; ppc: number; other: number }>();
    yearlyAdSpendEntries.forEach((entry) => {
      const month = entry.month;
      const existing = spendByMonth.get(month) || { meta: 0, ppc: 0, other: 0 };
      if (entry.channel === 'meta') existing.meta += entry.amount || 0;
      if (entry.channel === 'ppc') existing.ppc += entry.amount || 0;
      if (entry.channel === 'other') existing.other += entry.amount || 0;
      spendByMonth.set(month, existing);
    });

    return Array.from({ length: 12 }, (_, idx) => {
      const month = idx + 1;
      const plan = plansByMonth.get(month);
      const spend = spendByMonth.get(month) || { meta: 0, ppc: 0, other: 0 };
      const actualLabor = actualWorkByMonth.get(month) || 0;
      const actualTotal = actualLabor + spend.meta + spend.ppc + spend.other;
      const plannedTotal = plan ? (
        (plan.planned_meta_budget || 0)
        + (plan.planned_ppc_budget || 0)
        + (plan.planned_content_budget || 0)
        + (plan.planned_graphic_budget || 0)
        + (plan.planned_video_budget || 0)
        + (plan.planned_podcast_postproduction_budget || 0)
        + (plan.planned_podcast_studio_rent_budget || 0)
        + (plan.planned_other_budget || 0)
      ) : 0;
      const actualSpend = spend.meta + spend.ppc + spend.other;
      return {
        month,
        monthLabel: format(new Date(selectedYear, idx, 1), 'LLLL', { locale: cs }),
        plan,
        plannedTotal,
        actualLabor,
        actualSpend,
        actualTotal,
        diff: plannedTotal - actualTotal,
      };
    });
  }, [selectedYear, yearlyAdSpendEntries, yearlyPlans, yearlyWorkLogs]);

  const annualSummary = useMemo(() => {
    const plannedTotal = annualRows.reduce((sum, row) => sum + row.plannedTotal, 0);
    const actualTotal = annualRows.reduce((sum, row) => sum + row.actualTotal, 0);
    const actualLabor = annualRows.reduce((sum, row) => sum + row.actualLabor, 0);
    const actualSpend = annualRows.reduce((sum, row) => sum + row.actualSpend, 0);
    return {
      plannedTotal,
      actualTotal,
      actualLabor,
      actualSpend,
      diff: plannedTotal - actualTotal,
    };
  }, [annualRows]);

  const annualProjectRows = useMemo(() => {
    const byMonth = new Map<number, { socials: number; danny: number; otas: number }>();
    for (let month = 1; month <= 12; month += 1) {
      byMonth.set(month, { socials: 0, danny: 0, otas: 0 });
    }

    yearlyWorkLogs.forEach((log) => {
      const date = new Date(log.activity_date);
      if (!Number.isFinite(date.getTime())) return;
      const month = date.getMonth() + 1;
      const project = log.project;
      if (!project || !byMonth.has(month)) return;
      const bucket = byMonth.get(month)!;
      bucket[project] += Number(log.amount || 0);
    });

    return Array.from({ length: 12 }, (_, idx) => {
      const month = idx + 1;
      const values = byMonth.get(month) || { socials: 0, danny: 0, otas: 0 };
      const total = values.socials + values.danny + values.otas;
      return {
        month,
        monthLabel: format(new Date(selectedYear, idx, 1), 'LLLL', { locale: cs }),
        ...values,
        total,
      };
    });
  }, [selectedYear, yearlyWorkLogs]);

  const annualProjectTotals = useMemo(() => {
    const socials = annualProjectRows.reduce((sum, row) => sum + row.socials, 0);
    const danny = annualProjectRows.reduce((sum, row) => sum + row.danny, 0);
    const otas = annualProjectRows.reduce((sum, row) => sum + row.otas, 0);
    return {
      socials,
      danny,
      otas,
      total: socials + danny + otas,
    };
  }, [annualProjectRows]);

  const annualAllocationData = useMemo(() => {
    let content = 0;
    let video = 0;
    let podcast = 0;
    let graphic = 0;

    yearlyWorkLogs.forEach((log) => {
      const activity = resolveMainActivityFromLog(log);
      const amount = Number(log.amount || 0);
      if (!Number.isFinite(amount) || amount <= 0) return;
      if (activity === 'content_management') content += amount;
      if (activity === 'video_editing_production') video += amount;
      if (activity === 'podcast_postproduction') podcast += amount;
      if (activity === 'graphic_design') graphic += amount;
    });

    const meta = yearlyAdSpendEntries
      .filter((entry) => entry.channel === 'meta')
      .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
    const ppc = yearlyAdSpendEntries
      .filter((entry) => entry.channel === 'ppc')
      .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
    const otherSpend = yearlyAdSpendEntries
      .filter((entry) => entry.channel === 'other')
      .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
    const raw = [
      { key: 'content', label: 'Content management', amount: content },
      { key: 'video', label: 'Video editing', amount: video },
      { key: 'podcast', label: 'Podcast postprodukce', amount: podcast },
      { key: 'graphic', label: 'Grafika', amount: graphic },
      { key: 'meta', label: 'Meta spend', amount: meta },
      { key: 'ppc', label: 'PPC spend', amount: ppc },
      { key: 'other', label: 'Ostatní / fix', amount: otherSpend },
    ].filter((row) => row.amount > 0);

    const total = raw.reduce((sum, row) => sum + row.amount, 0);
    return {
      total,
      rows: raw.map((row) => ({
        ...row,
        percent: total > 0 ? (row.amount / total) * 100 : 0,
      })),
    };
  }, [yearlyAdSpendEntries, yearlyWorkLogs]);

  const annualColleagueSummary = useMemo(() => {
    const byColleague = new Map<string, { name: string; amount: number; logs: number }>();
    yearlyWorkLogs.forEach((item) => {
      const colleagueId = item.colleague_id || '__unknown__';
      const colleagueName = colleagueNameById.get(colleagueId) || 'Neznámý kolega';
      const existing = byColleague.get(colleagueId) || {
        name: colleagueName,
        amount: 0,
        logs: 0,
      };
      existing.amount += item.amount || 0;
      existing.logs += 1;
      byColleague.set(colleagueId, existing);
    });
    const defaults = defaultMarketingColleagues.map((entry, idx) => {
      const summary = entry.id ? byColleague.get(entry.id) : null;
      if (entry.id) {
        byColleague.delete(entry.id);
      }
      return {
        sortOrder: idx,
        name: entry.label,
        amount: summary?.amount || 0,
        logs: summary?.logs || 0,
      };
    });

    const others = Array.from(byColleague.values())
      .sort((a, b) => b.amount - a.amount)
      .map((item, idx) => ({
        sortOrder: 100 + idx,
        ...item,
      }));

    return [...defaults, ...others].sort((a, b) => a.sortOrder - b.sortOrder);
  }, [colleagueNameById, defaultMarketingColleagues, yearlyWorkLogs]);


  const isLoading = isPlanLoading || isWorkLogsLoading || isAdSpendLoading;
  const actualCpl = leadsInMonth > 0 ? actualTotalCost / leadsInMonth : null;
  const plannedCpl = planForm.planned_leads > 0 ? plannedDetailTotalBudget / planForm.planned_leads : null;
  const actualCac = newClientsInMonth > 0 ? actualTotalCost / newClientsInMonth : null;
  const plannedCac = planForm.planned_new_clients > 0 ? plannedDetailTotalBudget / planForm.planned_new_clients : null;
  const canEditLog = (log: MarketingWorkLog) => canCreateLogsForOthers || (colleagueId ? log.colleague_id === colleagueId : false);

  const beginEditWorkLog = (log: MarketingWorkLog) => {
    if (!canEditLog(log)) return;
    const mainActivity = resolveMainActivityFromLog(log);
    const workType = resolveWorkTypeFromLog(log);
    const fixedReward = getFixedReward(mainActivity, workType);
    const quantity = supportsQuantity(mainActivity, workType) && fixedReward > 0
      ? Math.max(1, Math.round((log.amount || 0) / fixedReward))
      : 1;
    const hourlyRate = (log.hours && log.hours > 0) ? Math.round((log.amount || 0) / log.hours) : (colleagueHourlyRateById.get(log.colleague_id) ?? 500);
    setWorkLogForm({
      colleague_id: log.colleague_id,
      role: log.role,
      main_activity: mainActivity,
      work_type: workType,
      project: log.project || 'socials',
      activity_date: log.activity_date,
      title: log.title || '',
      description: log.description || '',
      quantity: String(quantity),
      hours: log.hours ? String(log.hours) : '',
      hourly_rate: String(hourlyRate || 500),
    });
    setEditingWorkLogId(log.id);
    setIsWorkLogFormOpen(true);
  };

  const beginEditManualCost = (entry: MarketingAdSpendEntry) => {
    setManualCostForm({
      spend_date: entry.spend_date,
      amount: String(entry.amount || ''),
      note: entry.note || '',
    });
    setEditingManualCostId(entry.id);
  };

  return (
    <div className="space-y-4 p-3 pb-24 sm:p-4 sm:pb-28">
      <PageHeader
        title="📣 Marketing"
        titleAccent="interní přehled"
        description="Cíle, rozpočet, náklady a přínos interního marketingu po měsících."
      />

      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          const next = value as 'monthly' | 'annual';
          if (next === 'annual' && !canAccessAnnualMarketingOverview) return;
          setActiveTab(next);
        }}
      >
        <TabsList className="h-8">
          <TabsTrigger value="monthly">Měsíční přehled</TabsTrigger>
          {canAccessAnnualMarketingOverview && (
            <TabsTrigger value="annual">Roční přehled</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="monthly" className="mt-3 space-y-3">

          {/* ── Period selector ── */}
          <div className="flex flex-wrap items-center gap-2">
            <Select value={String(selectedMonth)} onValueChange={(value) => setSelectedMonth(Number(value))}>
              <SelectTrigger className="h-8 w-[140px] text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, idx) => idx + 1).map((month) => (
                  <SelectItem key={month} value={String(month)}>
                    {format(new Date(selectedYear, month - 1, 1), 'LLLL', { locale: cs })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={String(selectedYear)} onValueChange={(value) => setSelectedYear(Number(value))}>
              <SelectTrigger className="h-8 w-[90px] text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 4 }, (_, idx) => now.getFullYear() - idx).map((year) => (
                  <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {canManageBudgets && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs"
                onClick={() => syncMetaSpendMutation.mutate()}
                disabled={syncMetaSpendMutation.isPending}
              >
                {syncMetaSpendMutation.isPending ? 'Synchronizuji Meta spend…' : '↻ Načíst spend z Meta Ads'}
              </Button>
            )}
            {canManageBudgets && (
              <Badge variant="outline" className="text-xs h-7">admin / management</Badge>
            )}
          </div>

          {/* ── Hlavní plán – inline collapsible ── */}
          <Collapsible open={isMainMonthlyPlanOpen} onOpenChange={setIsMainMonthlyPlanOpen}>
            <CollapsibleTrigger className="group flex w-full flex-col gap-1.5 rounded-lg border border-amber-200/70 bg-amber-50/40 px-3 py-2 text-left transition-colors hover:bg-amber-50/70 dark:border-amber-800/40 dark:bg-amber-950/20">
              <div className="flex w-full items-center gap-2">
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 shrink-0">Hlavní plán měsíce</span>
                <span className="min-w-0 flex-1 text-xs text-muted-foreground">
                  {planForm.monthly_tasks.length === 0 ? (
                    <em>Zatím nevyplněno — klikni pro editaci</em>
                  ) : (
                    <>
                      <span className="font-medium text-foreground">{planForm.monthly_tasks.length}</span>
                      {' '}bod{planForm.monthly_tasks.length === 1 ? '' : planForm.monthly_tasks.length < 5 ? 'y' : 'ů'}
                      {planForm.monthly_tasks.filter((t) => t.status === 'done').length > 0 && (
                        <span className="ml-2 text-emerald-600">✓ {planForm.monthly_tasks.filter((t) => t.status === 'done').length} splněno</span>
                      )}
                      {planForm.monthly_tasks.filter((t) => t.status === 'partial').length > 0 && (
                        <span className="ml-2 text-amber-600">≈ {planForm.monthly_tasks.filter((t) => t.status === 'partial').length} částečně</span>
                      )}
                      {planForm.monthly_tasks.filter((t) => t.status === 'not_done').length > 0 && (
                        <span className="ml-2 text-destructive">✕ {planForm.monthly_tasks.filter((t) => t.status === 'not_done').length} nesplněno</span>
                      )}
                    </>
                  )}
                </span>
                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
              </div>
              {/* Sbaleno: vždy vidět první 3 body — co se v měsíci řeší */}
              {!isMainMonthlyPlanOpen && planForm.monthly_tasks.length > 0 && (
                <ul className="mt-0.5 space-y-1 border-t border-amber-200/60 pt-2 dark:border-amber-800/40">
                  {planForm.monthly_tasks.slice(0, 3).map((task, idx) => (
                    <li key={task.id} className="flex gap-2 text-xs leading-snug text-foreground">
                      <span className="w-4 shrink-0 font-semibold text-amber-600 tabular-nums">{idx + 1}.</span>
                      <span className="min-w-0 flex-1">
                        {task.text.trim() || <span className="italic text-muted-foreground">(bez názvu)</span>}
                      </span>
                      <span className="shrink-0 text-[10px]" aria-hidden>
                        {task.status === 'done' && <span className="text-emerald-600">✓</span>}
                        {task.status === 'partial' && <span className="text-amber-600">≈</span>}
                        {task.status === 'not_done' && <span className="text-destructive">✕</span>}
                      </span>
                    </li>
                  ))}
                  {planForm.monthly_tasks.length > 3 && (
                    <li className="pl-6 text-[11px] text-muted-foreground">
                      +{planForm.monthly_tasks.length - 3} další…
                    </li>
                  )}
                </ul>
              )}
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-1 rounded-lg border border-amber-200/70 bg-amber-50/20 p-3 space-y-2 dark:border-amber-800/40">

                {/* Task list */}
                {planForm.monthly_tasks.length === 0 && (
                  <p className="text-xs text-muted-foreground py-1">Žádné body — přidej první cíl měsíce.</p>
                )}
                <div className="space-y-2">
                  {planForm.monthly_tasks.map((task, idx) => (
                    <div key={task.id} className="rounded-md border bg-background p-2 space-y-1.5">
                      <div className="flex items-center gap-2">
                        {/* Status select */}
                        <Select
                          value={task.status ?? '__none__'}
                          onValueChange={(val) => {
                            const status = val === '__none__' ? null : val as MonthlyTaskStatus;
                            setPlanForm((prev) => ({
                              ...prev,
                              monthly_tasks: prev.monthly_tasks.map((t) =>
                                t.id === task.id ? { ...t, status } : t
                              ),
                            }));
                          }}
                          disabled={!canManageBudgets}
                        >
                          <SelectTrigger className={`h-7 w-[130px] text-xs shrink-0 ${
                            task.status === 'done' ? 'border-emerald-300 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30' :
                            task.status === 'partial' ? 'border-amber-300 text-amber-700 bg-amber-50 dark:bg-amber-950/30' :
                            task.status === 'not_done' ? 'border-red-300 text-red-700 bg-red-50 dark:bg-red-950/30' :
                            ''
                          }`}>
                            <SelectValue placeholder="nevyhodnoceno" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">— nevyhodnoceno</SelectItem>
                            <SelectItem value="done">✓ Splněno</SelectItem>
                            <SelectItem value="partial">≈ Částečně</SelectItem>
                            <SelectItem value="not_done">✕ Nesplněno</SelectItem>
                          </SelectContent>
                        </Select>
                        {/* Task text */}
                        <Input
                          className="h-7 text-xs flex-1"
                          value={task.text}
                          onChange={(e) => setPlanForm((prev) => ({
                            ...prev,
                            monthly_tasks: prev.monthly_tasks.map((t) =>
                              t.id === task.id ? { ...t, text: e.target.value } : t
                            ),
                          }))}
                          placeholder={`Cíl ${idx + 1}…`}
                          disabled={!canManageBudgets}
                        />
                        {/* Delete */}
                        {canManageBudgets && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive shrink-0"
                            onClick={() => setPlanForm((prev) => ({
                              ...prev,
                              monthly_tasks: prev.monthly_tasks.filter((t) => t.id !== task.id),
                            }))}
                          >
                            ✕
                          </Button>
                        )}
                      </div>
                      {/* Feedback / review on this task */}
                      <Textarea
                        rows={1}
                        className="text-xs resize-none border-dashed bg-muted/20 placeholder:text-muted-foreground/60"
                        value={task.feedback}
                        onChange={(e) => setPlanForm((prev) => ({
                          ...prev,
                          monthly_tasks: prev.monthly_tasks.map((t) =>
                            t.id === task.id ? { ...t, feedback: e.target.value } : t
                          ),
                        }))}
                        placeholder="Komentář / feedback k tomuto bodu…"
                        disabled={!canManageBudgets}
                      />
                    </div>
                  ))}
                </div>

                {/* Add task button */}
                {canManageBudgets && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs w-full border-dashed border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400"
                    onClick={() => setPlanForm((prev) => ({
                      ...prev,
                      monthly_tasks: [...prev.monthly_tasks, { id: crypto.randomUUID(), text: '', status: null, feedback: '' }],
                    }))}
                  >
                    + Přidat bod
                  </Button>
                )}

                {/* Overall monthly review */}
                <div className="border-t border-amber-200/60 pt-2 space-y-1 dark:border-amber-800/40">
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-400">Celkové hodnocení měsíce</p>
                  <Textarea
                    rows={2}
                    className="text-xs resize-none"
                    value={planForm.monthly_review}
                    onChange={(e) => setPlanForm((prev) => ({ ...prev, monthly_review: e.target.value }))}
                    placeholder="Stručné shrnutí — co se povedlo, co ne, co z toho plyne…"
                    disabled={!canManageBudgets}
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <Button
                    size="sm"
                    onClick={() => saveMonthlyPlanMutation.mutate('main')}
                    disabled={!canManageBudgets || saveMonthlyPlanMutation.isPending}
                  >
                    {saveMonthlyPlanMutation.isPending ? 'Ukládám…' : 'Uložit'}
                  </Button>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* ── KPI stats strip ── */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-lg border bg-card px-3 py-2.5">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Plánovaný rozpočet</p>
              <p className="mt-0.5 text-xl font-bold text-primary leading-tight">{Math.round(plannedDetailTotalBudget).toLocaleString('cs-CZ')} Kč</p>
            </div>
            <div className="rounded-lg border bg-card px-3 py-2.5">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Skutečné náklady</p>
              <p className="mt-0.5 text-xl font-bold leading-tight">{Math.round(actualTotalCost).toLocaleString('cs-CZ')} Kč</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">práce {Math.round(actualLaborCost).toLocaleString('cs-CZ')} · spend {Math.round(adSpendTotal).toLocaleString('cs-CZ')}</p>
            </div>
            <div className="rounded-lg border bg-card px-3 py-2.5">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Rozdíl plán / realita</p>
              <p className={`mt-0.5 text-xl font-bold leading-tight ${detailBudgetDiff >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                {detailBudgetDiff >= 0 ? '+' : ''}{Math.round(detailBudgetDiff).toLocaleString('cs-CZ')} Kč
              </p>
            </div>
            <div className="rounded-lg border border-emerald-200/60 bg-emerald-50/30 px-3 py-2.5 dark:border-emerald-800/40 dark:bg-emerald-950/20">
              <p className="text-[11px] font-medium text-emerald-700 uppercase tracking-wide dark:text-emerald-400">Přínos marketingu</p>
              <div className="mt-1 grid grid-cols-2 gap-x-2 gap-y-0.5 text-xs">
                <span className="text-muted-foreground">Zájemci <strong className="text-foreground">{prospectsInMonth}</strong></span>
                <span className="text-muted-foreground">Poptávky <strong className="text-foreground">{leadsInMonth}</strong></span>
                <span className="text-muted-foreground">Klienti <strong className="text-foreground">{newClientsInMonth}</strong></span>
              </div>
            </div>
          </div>

          {/* ── Detailní plán + Rozpad kolegů (side-by-side) ── */}
          {canAccessAdminMarketingSections && (
            <div className="grid gap-2 xl:grid-cols-2">
              <Collapsible open={isDetailMonthlyPlanOpen} onOpenChange={setIsDetailMonthlyPlanOpen}>
              <CollapsibleTrigger className="group flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition-colors hover:bg-muted/40">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Detailní plán měsíce</span>
                  <span className="text-xs text-muted-foreground">{Math.round(plannedDetailTotalBudget).toLocaleString('cs-CZ')} Kč</span>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-1 rounded-lg border p-3 space-y-3">
                  <div className="grid gap-x-3 gap-y-2 grid-cols-2 sm:grid-cols-3">
                    {[
                      { label: 'Content management', key: 'planned_content_budget' as const },
                      { label: 'Video editing', key: 'planned_video_budget' as const },
                      { label: 'Podcast postprodukce', key: 'planned_podcast_postproduction_budget' as const },
                      { label: 'Grafika', key: 'planned_graphic_budget' as const },
                      { label: 'Meta spend', key: 'planned_meta_budget' as const },
                      { label: 'PPC spend', key: 'planned_ppc_budget' as const },
                      { label: 'Ostatní náklady', key: 'planned_other_budget' as const },
                      { label: 'Pronájem studia', key: 'planned_podcast_studio_rent_budget' as const },
                    ].map(({ label, key }) => (
                      <div key={key} className="space-y-0.5">
                        <Label className="text-xs text-muted-foreground">{label}</Label>
                        <Input className="h-7 text-xs" type="number" value={planForm[key]} onChange={(e) => setPlanForm((prev) => ({ ...prev, [key]: Number(e.target.value) || 0 }))} disabled={!canManageBudgets} />
                      </div>
                    ))}
                  </div>
                  <div className="border-t pt-2 grid gap-x-3 gap-y-2 grid-cols-3">
                    {[
                      { label: 'Plán zájemců', key: 'planned_prospects' as const },
                      { label: 'Plán leadů', key: 'planned_leads' as const },
                      { label: 'Plán klientů', key: 'planned_new_clients' as const },
                    ].map(({ label, key }) => (
                      <div key={key} className="space-y-0.5">
                        <Label className="text-xs text-muted-foreground">{label}</Label>
                        <Input className="h-7 text-xs" type="number" value={planForm[key]} onChange={(e) => setPlanForm((prev) => ({ ...prev, [key]: Number(e.target.value) || 0 }))} disabled={!canManageBudgets} />
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-muted/30 px-2.5 py-1.5 text-xs">
                    <span className="text-muted-foreground">Součet: <span className="font-semibold text-foreground">{Math.round(plannedDetailTotalBudget).toLocaleString('cs-CZ')} Kč</span></span>
                    <Button
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => saveMonthlyPlanMutation.mutate('detail')}
                      disabled={!canManageBudgets || saveMonthlyPlanMutation.isPending}
                    >
                      {saveMonthlyPlanMutation.isPending ? 'Ukládám…' : 'Uložit'}
                    </Button>
                  </div>
                </div>
              </CollapsibleContent>
              </Collapsible>

              <Collapsible open={isRoleBreakdownOpen} onOpenChange={setIsRoleBreakdownOpen}>
              <CollapsibleTrigger className="group flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition-colors hover:bg-muted/40">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Rozpad nákladů podle kolegů</span>
                  {colleagueSummary.length > 0 && (
                    <span className="text-xs text-muted-foreground">{colleagueSummary.length} kolegů</span>
                  )}
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                {colleagueSummary.length === 0 ? (
                  <p className="mt-1 rounded-lg border px-3 py-4 text-center text-xs text-muted-foreground">
                    V tomto měsíci zatím nikdo nezalogoval aktivitu.
                  </p>
                ) : (
                  <div className="mt-1 rounded-lg border divide-y overflow-hidden">
                    {colleagueSummary.map((item) => (
                      <div key={item.id} className="px-3 py-2.5">
                        {/* Header row: name + total */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">{item.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.logs} {item.logs === 1 ? 'výstup' : item.logs < 5 ? 'výstupy' : 'výstupů'}
                              {Number(item.hours) > 0 && ` · ${Number(item.hours).toFixed(1)} h`}
                            </p>
                          </div>
                          <span className="text-sm font-bold tabular-nums shrink-0">{Math.round(item.amount).toLocaleString('cs-CZ')} Kč</span>
                        </div>
                        {/* Activity breakdown */}
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {item.activities.map((act) => (
                            <span
                              key={act.title}
                              className="inline-flex items-center rounded-full border bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground"
                            >
                              <span className="font-semibold text-foreground mr-1">{act.count}×</span>
                              {act.title}
                              {act.totalAmount > 0 && (
                                <span className="ml-1 text-muted-foreground/70">· {Math.round(act.totalAmount).toLocaleString('cs-CZ')} Kč</span>
                              )}
                            </span>
                          ))}
                        </div>
                        {/* Monthly minimum bar */}
                        {item.monthlyMinimum !== null && (
                          <div className="mt-2 space-y-0.5">
                            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                              <span>Min. {Math.round(item.monthlyMinimum).toLocaleString('cs-CZ')} Kč / měsíc</span>
                              <span className={item.remainingToMinimum && item.remainingToMinimum > 0 ? 'text-amber-600 font-medium' : 'text-emerald-600 font-medium'}>
                                {item.remainingToMinimum && item.remainingToMinimum > 0
                                  ? `zbývá ${Math.round(item.remainingToMinimum).toLocaleString('cs-CZ')} Kč`
                                  : '✓ splněno'}
                              </span>
                            </div>
                            <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${item.remainingToMinimum && item.remainingToMinimum > 0 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                                style={{ width: `${Math.min(100, (item.amount / item.monthlyMinimum) * 100).toFixed(1)}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CollapsibleContent>
              </Collapsible>
            </div>
          )}

          {/* ── KPI tabulka ── */}
          {canAccessAdminMarketingSections && (
            <Collapsible>
              <CollapsibleTrigger className="group flex w-full items-center justify-between rounded-lg border border-sky-200/60 bg-sky-50/20 px-3 py-2 text-left transition-colors hover:bg-sky-50/40 dark:border-sky-800/40 dark:bg-sky-950/20">
                <span className="text-sm font-medium">Marketing KPI: plán vs realita</span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-1 rounded-lg border overflow-x-auto">
                <Table className="[&_td]:py-1.5 [&_th]:py-1.5 text-sm">
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="text-xs">Metrika</TableHead>
                      <TableHead className="text-right text-xs">Plán</TableHead>
                      <TableHead className="text-right text-xs">Realita</TableHead>
                      <TableHead className="text-right text-xs">Odchylka</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      { label: 'Content management', plan: planForm.planned_content_budget, actual: contentWorkCost },
                      { label: 'Video editing', plan: planForm.planned_video_budget, actual: pureVideoEditingCost },
                      { label: 'Podcast postprodukce', plan: planForm.planned_podcast_postproduction_budget, actual: podcastPostproductionCost },
                      { label: 'Pronájem studia', plan: planForm.planned_podcast_studio_rent_budget, actual: null },
                      { label: 'Graphic design', plan: planForm.planned_graphic_budget, actual: creativeWorkCost },
                      { label: 'Ad spend', plan: plannedAdSpendBudget, actual: actualMetaSpend + actualPpcSpend },
                      { label: 'Ostatní / fix', plan: planForm.planned_other_budget, actual: actualOtherCost },
                    ].map(({ label, plan, actual }) => (
                      <TableRow key={label}>
                        <TableCell className="text-xs">{label}</TableCell>
                        <TableCell className="text-right text-xs tabular-nums">{Math.round(plan).toLocaleString('cs-CZ')} Kč</TableCell>
                        <TableCell className="text-right text-xs tabular-nums">{actual !== null ? `${Math.round(actual).toLocaleString('cs-CZ')} Kč` : '—'}</TableCell>
                        <TableCell className="text-right text-xs tabular-nums">{actual !== null ? `${Math.round(plan - actual).toLocaleString('cs-CZ')} Kč` : '—'}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/40 font-semibold">
                      <TableCell className="text-xs">Celkem</TableCell>
                      <TableCell className="text-right text-xs tabular-nums">{Math.round(plannedDetailTotalBudget).toLocaleString('cs-CZ')} Kč</TableCell>
                      <TableCell className="text-right text-xs tabular-nums">{Math.round(actualTotalCost).toLocaleString('cs-CZ')} Kč</TableCell>
                      <TableCell className={`text-right text-xs tabular-nums ${detailBudgetDiff >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>{Math.round(detailBudgetDiff).toLocaleString('cs-CZ')} Kč</TableCell>
                    </TableRow>
                    <TableRow className="border-t-2">
                      <TableCell className="text-xs text-muted-foreground">Počet leadů</TableCell>
                      <TableCell className="text-right text-xs tabular-nums">{planForm.planned_leads}</TableCell>
                      <TableCell className="text-right text-xs tabular-nums">{leadsInMonth}</TableCell>
                      <TableCell className="text-right text-xs tabular-nums">{planForm.planned_leads - leadsInMonth}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-xs text-muted-foreground">CPL (cena za lead)</TableCell>
                      <TableCell className="text-right text-xs tabular-nums">{plannedCpl !== null ? `${Math.round(plannedCpl).toLocaleString('cs-CZ')} Kč` : '—'}</TableCell>
                      <TableCell className="text-right text-xs tabular-nums">{actualCpl !== null ? `${Math.round(actualCpl).toLocaleString('cs-CZ')} Kč` : '—'}</TableCell>
                      <TableCell className="text-right text-xs tabular-nums">{plannedCpl !== null && actualCpl !== null ? `${Math.round(plannedCpl - actualCpl).toLocaleString('cs-CZ')} Kč` : '—'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-xs text-muted-foreground">Počet nových klientů</TableCell>
                      <TableCell className="text-right text-xs tabular-nums">{planForm.planned_new_clients}</TableCell>
                      <TableCell className="text-right text-xs tabular-nums">{newClientsInMonth}</TableCell>
                      <TableCell className="text-right text-xs tabular-nums">{planForm.planned_new_clients - newClientsInMonth}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-xs text-muted-foreground">CAC (cena za klienta)</TableCell>
                      <TableCell className="text-right text-xs tabular-nums">{plannedCac !== null ? `${Math.round(plannedCac).toLocaleString('cs-CZ')} Kč` : '—'}</TableCell>
                      <TableCell className="text-right text-xs tabular-nums">{actualCac !== null ? `${Math.round(actualCac).toLocaleString('cs-CZ')} Kč` : '—'}</TableCell>
                      <TableCell className="text-right text-xs tabular-nums">{plannedCac !== null && actualCac !== null ? `${Math.round(plannedCac - actualCac).toLocaleString('cs-CZ')} Kč` : '—'}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* ── Manuální marketingové náklady (other spend) ── */}
          {canManageBudgets && (
            <Collapsible open={isManualCostsOpen} onOpenChange={setIsManualCostsOpen}>
              <CollapsibleTrigger className="group flex w-full items-center justify-between rounded-lg border border-amber-200/70 bg-amber-50/30 px-3 py-2 text-left transition-colors hover:bg-amber-50/60 dark:border-amber-800/40 dark:bg-amber-950/20">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Manuální marketingové náklady</span>
                  <span className="text-xs text-muted-foreground">{manualOtherCosts.length} záznamů</span>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-1 rounded-lg border overflow-hidden">
                  <div className="space-y-2 border-b p-3">
                    <div className="grid gap-2 sm:grid-cols-[150px,160px,1fr]">
                      <div className="space-y-0.5">
                        <Label className="text-xs">Datum</Label>
                        <Input
                          className="h-8 text-xs"
                          type="date"
                          value={manualCostForm.spend_date}
                          onChange={(e) => setManualCostForm((prev) => ({ ...prev, spend_date: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-0.5">
                        <Label className="text-xs">Částka (Kč)</Label>
                        <Input
                          className="h-8 text-xs"
                          type="number"
                          value={manualCostForm.amount}
                          onChange={(e) => setManualCostForm((prev) => ({ ...prev, amount: e.target.value }))}
                          placeholder="25000"
                        />
                      </div>
                      <div className="space-y-0.5">
                        <Label className="text-xs">Poznámka</Label>
                        <Input
                          className="h-8 text-xs"
                          value={manualCostForm.note}
                          onChange={(e) => setManualCostForm((prev) => ({ ...prev, note: e.target.value }))}
                          placeholder="Např. event, pronájem prostoru, produkční náklady..."
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {editingManualCostId && (
                        <Button size="sm" variant="outline" onClick={resetManualCostForm} disabled={saveManualCostMutation.isPending}>
                          Zrušit úpravu
                        </Button>
                      )}
                      <Button
                        size="sm"
                        onClick={() => saveManualCostMutation.mutate()}
                        disabled={saveManualCostMutation.isPending}
                      >
                        {editingManualCostId
                          ? (saveManualCostMutation.isPending ? 'Ukládám…' : 'Uložit úpravy')
                          : (saveManualCostMutation.isPending ? 'Přidávám…' : 'Přidat náklad')}
                      </Button>
                    </div>
                  </div>

                  <div className="max-h-[280px] overflow-auto">
                    <Table className="[&_td]:py-1.5 [&_th]:py-1.5">
                      <TableHeader className="sticky top-0 z-10 bg-background">
                        <TableRow className="bg-muted/20">
                          <TableHead className="text-xs w-[90px]">Datum</TableHead>
                          <TableHead className="text-xs">Poznámka</TableHead>
                          <TableHead className="text-right text-xs w-[120px]">Kč</TableHead>
                          <TableHead className="text-right text-xs w-[140px]">Akce</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {manualOtherCosts.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-xs text-muted-foreground py-5">
                              Zatím žádné manuální náklady.
                            </TableCell>
                          </TableRow>
                        ) : (
                          manualOtherCosts.map((entry) => (
                            <TableRow key={entry.id}>
                              <TableCell className="text-xs tabular-nums text-muted-foreground">
                                {new Date(entry.spend_date).toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit' })}
                              </TableCell>
                              <TableCell className="text-xs">{entry.note || '—'}</TableCell>
                              <TableCell className="text-right text-xs font-medium tabular-nums">
                                {Math.round(entry.amount || 0).toLocaleString('cs-CZ')} Kč
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => beginEditManualCost(entry)}>
                                    Upravit
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                                    disabled={deleteManualCostMutation.isPending}
                                    onClick={() => {
                                      if (!window.confirm('Opravdu chcete tento manuální náklad smazat?')) return;
                                      deleteManualCostMutation.mutate(entry.id);
                                    }}
                                  >
                                    Smazat
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* ── Zapsat práci ── */}
          <Collapsible open={isWorkLogFormOpen} onOpenChange={setIsWorkLogFormOpen}>
            <CollapsibleTrigger className="group flex w-full items-center justify-between rounded-lg border border-emerald-200/70 bg-emerald-50/40 px-3 py-2.5 text-left transition-colors hover:bg-emerald-50/70 dark:border-emerald-800/40 dark:bg-emerald-950/20">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Zapsat interní marketing práci</span>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-emerald-500 transition-transform group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-1 rounded-lg border border-emerald-200/50 p-3 space-y-2 dark:border-emerald-800/30">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                  <div className="space-y-0.5">
                    <Label className="text-xs">Projekt</Label>
                    <Select value={workLogForm.project} onValueChange={(value) => setWorkLogForm((prev) => ({ ...prev, project: value as MarketingProject }))}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(MARKETING_PROJECT_LABELS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-0.5">
                    <Label className="text-xs">Kolega</Label>
                    <Select
                      value={workLogForm.colleague_id}
                      onValueChange={(value) => setWorkLogForm((prev) => {
                        const nextRole = colleaguePrimaryRoleById.get(value);
                        const nextHourlyRate = colleagueHourlyRateById.get(value);
                        if (!nextRole) {
                          return {
                            ...prev,
                            colleague_id: value,
                            hourly_rate: nextHourlyRate ? String(nextHourlyRate) : prev.hourly_rate,
                          };
                        }
                        return {
                          ...prev,
                          colleague_id: value,
                          role: nextRole,
                          main_activity: getDefaultMainActivityForRole(nextRole),
                          work_type: getDefaultWorkTypeForActivity(getDefaultMainActivityForRole(nextRole)),
                          title: '',
                          quantity: '1',
                          hourly_rate: nextHourlyRate ? String(nextHourlyRate) : prev.hourly_rate,
                        };
                      })}
                      disabled={!canCreateLogsForOthers && !!colleagueId}
                    >
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{selectableColleagues.map((c) => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-0.5">
                    <Label className="text-xs">Role</Label>
                    <Select value={workLogForm.role} onValueChange={(value) => { const nextRole = value as MarketingRole; const ma = getDefaultMainActivityForRole(nextRole); const wt = getDefaultWorkTypeForActivity(ma); const opt = ACTIVITY_WORK_OPTIONS[ma][0]; setWorkLogForm((prev) => ({ ...prev, role: nextRole, main_activity: ma, work_type: wt, title: opt.fixedReward ? opt.label : '', quantity: supportsQuantity(ma, wt) ? prev.quantity : '1', hours: opt.fixedReward ? '' : prev.hours })); }}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{Object.entries(ROLE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-0.5">
                    <Label className="text-xs">Hlavní činnost</Label>
                    <Select value={workLogForm.main_activity} onValueChange={(value) => { const ma = value as MainMarketingActivity; const opts = ACTIVITY_WORK_OPTIONS[ma]; const existing = opts.find((o) => o.value === workLogForm.work_type); const pick = existing || opts[0]; const hourly = !pick.fixedReward; setWorkLogForm((prev) => ({ ...prev, main_activity: ma, work_type: pick.value, title: hourly ? '' : pick.label, quantity: supportsQuantity(ma, pick.value) ? prev.quantity : '1', hours: hourly ? prev.hours : '' })); }}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{Object.entries(MAIN_ACTIVITY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-0.5">
                    <Label className="text-xs">Činnost</Label>
                    <Select value={workLogForm.work_type} onValueChange={(value) => { const wt = value as MarketingWorkType; const ma = workLogForm.main_activity as MainMarketingActivity; const opt = getWorkOptionForForm(ma, wt); const hourly = !opt?.fixedReward; setWorkLogForm((prev) => ({ ...prev, work_type: wt, title: hourly ? '' : (opt?.label || WORK_TYPE_LABELS[wt]), quantity: supportsQuantity(ma, wt) ? prev.quantity : '1', hours: hourly ? prev.hours : '' })); }}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{ACTIVITY_WORK_OPTIONS[workLogForm.main_activity as MainMarketingActivity]?.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}{o.fixedReward ? ` (${o.fixedReward.toLocaleString('cs-CZ')} Kč)` : ''}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2 items-end">
                  <div className="space-y-0.5">
                    <Label className="text-xs">Datum</Label>
                    <Input className="h-8 text-xs w-36" type="date" value={workLogForm.activity_date} onChange={(e) => setWorkLogForm((prev) => ({ ...prev, activity_date: e.target.value }))} />
                  </div>
                  {isHourlyWork(workLogForm.main_activity as MainMarketingActivity, workLogForm.work_type) ? (
                    <>
                      <div className="space-y-0.5 flex-1">
                        <Label className="text-xs">Název činnosti <span className="text-destructive">*</span></Label>
                        <Input className="h-8 text-xs" value={workLogForm.title} onChange={(e) => setWorkLogForm((prev) => ({ ...prev, title: e.target.value }))} placeholder={getWorkOptionForForm(workLogForm.main_activity as MainMarketingActivity, workLogForm.work_type)?.label || 'Popis…'} />
                      </div>
                      <div className="space-y-0.5 w-20">
                        <Label className="text-xs">Hodiny <span className="text-destructive">*</span></Label>
                        <Input className="h-8 text-xs" type="number" value={workLogForm.hours} onChange={(e) => setWorkLogForm((prev) => ({ ...prev, hours: e.target.value }))} placeholder="3.5" />
                      </div>
                      <div className="space-y-0.5 w-32">
                        <Label className="text-xs">Sazba Kč/h</Label>
                        <Select value={workLogForm.hourly_rate} onValueChange={(value) => setWorkLogForm((prev) => ({ ...prev, hourly_rate: value }))}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>{availableHourlyRateOptions.map((r) => <SelectItem key={r} value={String(r)}>{r.toLocaleString('cs-CZ')} Kč/h</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </>
                  ) : (
                    <>
                      {supportsQuantity(workLogForm.main_activity as MainMarketingActivity, workLogForm.work_type) && (
                        <div className="space-y-0.5 w-20">
                          <Label className="text-xs">Počet (ks)</Label>
                          <Input
                            className="h-8 text-xs"
                            type="number"
                            min={1}
                            step={1}
                            value={workLogForm.quantity}
                            onChange={(e) => setWorkLogForm((prev) => ({ ...prev, quantity: e.target.value }))}
                            placeholder="1"
                          />
                        </div>
                      )}
                      <div className="flex-1 rounded-md border bg-muted/30 px-2.5 py-1.5">
                        <p className="text-xs font-medium">
                          Fixní odměna:{' '}
                          {(
                            getFixedReward(workLogForm.main_activity as MainMarketingActivity, workLogForm.work_type)
                            * (supportsQuantity(workLogForm.main_activity as MainMarketingActivity, workLogForm.work_type)
                              ? Math.max(1, Math.floor(Number(workLogForm.quantity) || 1))
                              : 1)
                          ).toLocaleString('cs-CZ')} Kč
                        </p>
                      </div>
                    </>
                  )}
                </div>
                <div className="space-y-0.5">
                  <Label className="text-xs">Popis <span className="text-destructive">*</span></Label>
                  <Textarea className="text-xs resize-none" rows={1} value={workLogForm.description} onChange={(e) => setWorkLogForm((prev) => ({ ...prev, description: e.target.value }))} placeholder="Např. název reelska, epizoda podcastu, případová studie…" />
                </div>
                <div className="flex items-center gap-2">
                  {editingWorkLogId && (
                    <Button size="sm" variant="outline" onClick={() => resetWorkLogForm()} disabled={updateWorkLogMutation.isPending}>
                      Zrušit úpravu
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={() => (editingWorkLogId ? updateWorkLogMutation.mutate() : addWorkLogMutation.mutate())}
                    disabled={addWorkLogMutation.isPending || updateWorkLogMutation.isPending}
                  >
                    {editingWorkLogId
                      ? (updateWorkLogMutation.isPending ? 'Ukládám…' : 'Uložit úpravy')
                      : (addWorkLogMutation.isPending ? 'Přidávám…' : 'Přidat aktivitu')}
                  </Button>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* ── Work log tabulka ── */}
          <div className="rounded-lg border overflow-hidden">
            <div className="flex items-center justify-between border-b bg-muted/30 px-3 py-1.5">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">Zalogované aktivity</p>
                <Select value={activityFilterColleagueId} onValueChange={setActivityFilterColleagueId}>
                  <SelectTrigger className="h-7 w-[210px] text-xs bg-background">
                    <SelectValue placeholder="Filtrovat podle kolegy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Všichni kolegové</SelectItem>
                    {activityFilterOptions.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {filteredWorkLogs.length} / {workLogs.length}
                </span>
                {isLoading && <p className="text-xs text-muted-foreground">Načítám…</p>}
              </div>
            </div>
            <div className="max-h-[430px] overflow-auto">
              <Table className="[&_td]:py-1.5 [&_th]:py-1.5">
                <TableHeader className="sticky top-0 z-10 bg-background">
                  <TableRow className="bg-muted/20">
                    <TableHead className="text-xs w-[70px]">Datum</TableHead>
                    <TableHead className="text-xs">Kolega</TableHead>
                    <TableHead className="text-xs w-[80px]">Projekt</TableHead>
                    <TableHead className="text-xs">Činnost</TableHead>
                    <TableHead className="text-xs">Aktivita</TableHead>
                    <TableHead className="text-right text-xs w-[100px]">Kč</TableHead>
                    <TableHead className="text-right text-xs w-[140px]">Akce</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWorkLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-6">
                        {activityFilterColleagueId === 'all'
                          ? 'Žádné aktivity v tomto měsíci.'
                          : 'Pro vybraného kolegu nejsou v tomto měsíci žádné aktivity.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredWorkLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-xs tabular-nums text-muted-foreground">{new Date(log.activity_date).toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit' })}</TableCell>
                        <TableCell className="text-xs">{colleagueNameById.get(log.colleague_id) || '—'}</TableCell>
                        <TableCell className="text-xs">
                          {log.project ? (
                            <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                              log.project === 'socials' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' :
                              log.project === 'danny' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' :
                              'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                            }`}>
                              {MARKETING_PROJECT_LABELS[log.project]}
                            </span>
                          ) : '—'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{MAIN_ACTIVITY_LABELS[resolveMainActivityFromLog(log)]}</TableCell>
                        <TableCell className="text-xs">
                          {getOutputUnitsFromLog(log) > 1 && (
                            <span className="mr-1 inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-foreground">
                              {getOutputUnitsFromLog(log)}×
                            </span>
                          )}
                          <span className="font-medium">{log.title}</span>
                          {log.description && <span className="text-muted-foreground"> · {log.description}</span>}
                        </TableCell>
                        <TableCell className="text-right text-xs font-medium tabular-nums">{Math.round(log.amount).toLocaleString('cs-CZ')} Kč</TableCell>
                        <TableCell className="text-right">
                          {canEditLog(log) ? (
                            <div className="flex justify-end gap-1">
                              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => beginEditWorkLog(log)}>
                                Upravit
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                                disabled={deleteWorkLogMutation.isPending}
                                onClick={() => {
                                  if (!window.confirm('Opravdu chcete tuto aktivitu smazat?')) return;
                                  deleteWorkLogMutation.mutate(log.id);
                                }}
                              >
                                Smazat
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

        </TabsContent>

        {canAccessAnnualMarketingOverview && (
        <TabsContent value="annual" className="mt-3 space-y-3">

          {/* ── Year selector ── */}
          <div className="flex flex-wrap items-center gap-2">
            <Select value={String(selectedYear)} onValueChange={(value) => setSelectedYear(Number(value))}>
              <SelectTrigger className="h-8 w-[90px] text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 4 }, (_, idx) => now.getFullYear() - idx).map((year) => (
                  <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ── KPI stats strip (same style as monthly) ── */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-lg border bg-card px-3 py-2.5">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Plánovaný rozpočet</p>
              <p className="mt-0.5 text-xl font-bold text-primary leading-tight">{Math.round(annualSummary.plannedTotal).toLocaleString('cs-CZ')} Kč</p>
            </div>
            <div className="rounded-lg border bg-card px-3 py-2.5">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Skutečné náklady</p>
              <p className="mt-0.5 text-xl font-bold leading-tight">{Math.round(annualSummary.actualTotal).toLocaleString('cs-CZ')} Kč</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">práce {Math.round(annualSummary.actualLabor).toLocaleString('cs-CZ')} · spend {Math.round(annualSummary.actualSpend).toLocaleString('cs-CZ')}</p>
            </div>
            <div className="rounded-lg border bg-card px-3 py-2.5">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Rozdíl plán / realita</p>
              <p className={`mt-0.5 text-xl font-bold leading-tight ${annualSummary.diff >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                {annualSummary.diff >= 0 ? '+' : ''}{Math.round(annualSummary.diff).toLocaleString('cs-CZ')} Kč
              </p>
            </div>
            <div className="rounded-lg border bg-card px-3 py-2.5">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Průměr / měsíc</p>
              <p className="mt-0.5 text-xl font-bold leading-tight">
                {Math.round(annualSummary.actualTotal / 12).toLocaleString('cs-CZ')} Kč
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                plán {Math.round(annualSummary.plannedTotal / 12).toLocaleString('cs-CZ')} Kč/měs
              </p>
            </div>
          </div>

          {/* ── Allocation chart ── */}
          <div className="rounded-lg border p-3">
            <div className="mb-2">
              <p className="text-sm font-medium">Podíl marketingového rozpočtu podle činností a spendu</p>
              <p className="text-xs text-muted-foreground">
                Roční realita: {Math.round(annualAllocationData.total).toLocaleString('cs-CZ')} Kč
              </p>
            </div>
            {annualAllocationData.rows.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4">Zatím nejsou data pro vykreslení grafu.</p>
            ) : (
              <div className="grid gap-3 lg:grid-cols-[320px,1fr] items-center">
                <div className="h-[220px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={annualAllocationData.rows}
                        dataKey="amount"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        outerRadius={82}
                        innerRadius={48}
                      >
                        {annualAllocationData.rows.map((row, idx) => (
                          <Cell key={row.key} fill={ALLOCATION_COLORS[idx % ALLOCATION_COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        formatter={(value: number, _name, entry) => {
                          const payload = entry?.payload as { percent?: number };
                          const percent = payload?.percent ?? 0;
                          return [`${Math.round(Number(value)).toLocaleString('cs-CZ')} Kč (${percent.toFixed(1)} %)`, ''];
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid gap-1.5 sm:grid-cols-2">
                  {annualAllocationData.rows.map((row, idx) => (
                    <div key={row.key} className="flex items-center justify-between rounded border px-2 py-1.5 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: ALLOCATION_COLORS[idx % ALLOCATION_COLORS.length] }} />
                        <span className="truncate">{row.label}</span>
                      </div>
                      <span className="font-semibold tabular-nums">
                        {row.percent.toFixed(1)} %
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Monthly breakdown table ── */}
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="text-xs">Měsíc</TableHead>
                  <TableHead className="text-right text-xs">Plán</TableHead>
                  <TableHead className="text-right text-xs">Práce</TableHead>
                  <TableHead className="text-right text-xs">Spend</TableHead>
                  <TableHead className="text-right text-xs">Skutečné celkem</TableHead>
                  <TableHead className="text-right text-xs">Rozdíl</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {annualRows.map((row) => (
                  <TableRow key={row.month} className={row.actualTotal === 0 && row.plannedTotal === 0 ? 'opacity-40' : ''}>
                    <TableCell className="text-xs font-medium capitalize">{row.monthLabel}</TableCell>
                    <TableCell className="text-right text-xs tabular-nums">{Math.round(row.plannedTotal).toLocaleString('cs-CZ')}</TableCell>
                    <TableCell className="text-right text-xs tabular-nums">{Math.round(row.actualLabor).toLocaleString('cs-CZ')}</TableCell>
                    <TableCell className="text-right text-xs tabular-nums">{Math.round(row.actualSpend).toLocaleString('cs-CZ')}</TableCell>
                    <TableCell className="text-right text-xs tabular-nums font-medium">{Math.round(row.actualTotal).toLocaleString('cs-CZ')}</TableCell>
                    <TableCell className={`text-right text-xs tabular-nums font-semibold ${row.diff >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                      {row.diff >= 0 ? '+' : ''}{Math.round(row.diff).toLocaleString('cs-CZ')}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/40 font-semibold">
                  <TableCell className="text-xs">Celkem</TableCell>
                  <TableCell className="text-right text-xs tabular-nums">{Math.round(annualSummary.plannedTotal).toLocaleString('cs-CZ')}</TableCell>
                  <TableCell className="text-right text-xs tabular-nums">{Math.round(annualSummary.actualLabor).toLocaleString('cs-CZ')}</TableCell>
                  <TableCell className="text-right text-xs tabular-nums">{Math.round(annualSummary.actualSpend).toLocaleString('cs-CZ')}</TableCell>
                  <TableCell className="text-right text-xs tabular-nums">{Math.round(annualSummary.actualTotal).toLocaleString('cs-CZ')}</TableCell>
                  <TableCell className={`text-right text-xs tabular-nums ${annualSummary.diff >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                    {annualSummary.diff >= 0 ? '+' : ''}{Math.round(annualSummary.diff).toLocaleString('cs-CZ')}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* ── Project breakdown table ── */}
          <div className="overflow-x-auto rounded-lg border">
            <div className="border-b bg-muted/30 px-3 py-2">
              <p className="text-sm font-medium">Rozpad podle projektu (interní práce)</p>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/20">
                  <TableHead className="text-xs">Měsíc</TableHead>
                  <TableHead className="text-right text-xs">Socials</TableHead>
                  <TableHead className="text-right text-xs">Danny</TableHead>
                  <TableHead className="text-right text-xs">Oťas</TableHead>
                  <TableHead className="text-right text-xs">Celkem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {annualProjectRows.map((row) => (
                  <TableRow key={`project-${row.month}`} className={row.total === 0 ? 'opacity-40' : ''}>
                    <TableCell className="text-xs font-medium capitalize">{row.monthLabel}</TableCell>
                    <TableCell className="text-right text-xs tabular-nums">{Math.round(row.socials).toLocaleString('cs-CZ')}</TableCell>
                    <TableCell className="text-right text-xs tabular-nums">{Math.round(row.danny).toLocaleString('cs-CZ')}</TableCell>
                    <TableCell className="text-right text-xs tabular-nums">{Math.round(row.otas).toLocaleString('cs-CZ')}</TableCell>
                    <TableCell className="text-right text-xs tabular-nums font-medium">{Math.round(row.total).toLocaleString('cs-CZ')}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/40 font-semibold">
                  <TableCell className="text-xs">Celkem</TableCell>
                  <TableCell className="text-right text-xs tabular-nums">{Math.round(annualProjectTotals.socials).toLocaleString('cs-CZ')}</TableCell>
                  <TableCell className="text-right text-xs tabular-nums">{Math.round(annualProjectTotals.danny).toLocaleString('cs-CZ')}</TableCell>
                  <TableCell className="text-right text-xs tabular-nums">{Math.round(annualProjectTotals.otas).toLocaleString('cs-CZ')}</TableCell>
                  <TableCell className="text-right text-xs tabular-nums">{Math.round(annualProjectTotals.total).toLocaleString('cs-CZ')}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* ── Colleague breakdown (collapsible) ── */}
          <Collapsible open={isAnnualRoleBreakdownOpen} onOpenChange={setIsAnnualRoleBreakdownOpen}>
            <CollapsibleTrigger className="group flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition-colors hover:bg-muted/40">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Rozpad nákladů podle kolegů</span>
                <span className="text-xs text-muted-foreground">
                  {annualColleagueSummary.filter((c) => c.logs > 0).length} aktivních
                </span>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-1 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {annualColleagueSummary.filter((c) => c.logs > 0).map((item) => (
                  <div key={item.name} className="flex items-center justify-between rounded-lg border px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.logs} záznamů</p>
                    </div>
                    <p className="text-sm font-bold tabular-nums">{Math.round(item.amount).toLocaleString('cs-CZ')} Kč</p>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>

        </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

