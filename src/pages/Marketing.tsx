import { Component, type ErrorInfo, type ReactNode, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { endOfMonth, format, startOfMonth } from 'date-fns';
import { cs } from 'date-fns/locale';
import { ChevronDown } from 'lucide-react';
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
type MainMarketingActivity = 'content_management' | 'video_editing_production' | 'podcast_postproduction' | 'graphic_design';

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
  notes: string;
}

interface MarketingWorkLog {
  id: string;
  colleague_id: string;
  role: MarketingRole;
  main_activity: MainMarketingActivity | null;
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
}

const ROLE_LABELS: Record<MarketingRole, string> = {
  content_manager: 'Content manager',
  video_editor: 'Video editor',
  graphic_designer: 'Grafička',
};

const DEFAULT_MARKETING_COLLEAGUES = [
  { label: 'Kristýn Zborníková - Content Manager', tokens: ['kristyn', 'zbornikov'] },
  { label: 'Jan Bečvář - Video editor', tokens: ['jan', 'becvar'], monthlyMinimum: 45000 },
  { label: 'Michal Bartošek - Video editor', tokens: ['michal', 'bartosek'] },
  { label: 'Alexandra - Graphic Designer', tokens: ['alexandra'] },
  { label: 'Ivana - Graphic Designer', tokens: ['ivana'] },
] as const;

const normalizeForMatch = (value: unknown) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const WORK_TYPE_LABELS: Record<MarketingWorkType, string> = {
  reels_video: 'Reels video z podcastu',
  complex_video: 'Standardní reels video',
  podcast: 'Podcast',
  other_hourly: 'Nestandardní položka (časově náročnější)',
};

const MAIN_ACTIVITY_LABELS: Record<MainMarketingActivity, string> = {
  content_management: 'Content management',
  video_editing_production: 'Video editing a produkce',
  podcast_postproduction: 'Podcast postprodukce',
  graphic_design: 'Graphic design',
};

const FIXED_WORK_REWARD: Record<Exclude<MarketingWorkType, 'other_hourly'>, number> = {
  reels_video: 500,
  complex_video: 1000,
  podcast: 2500,
};

const HOURLY_RATE_OPTIONS = [300, 400, 500, 600, 800, 1000];

const getDefaultMainActivityForRole = (role: MarketingRole): MainMarketingActivity => {
  if (role === 'content_manager') return 'content_management';
  if (role === 'graphic_designer') return 'graphic_design';
  return 'video_editing_production';
};

const getDefaultMainActivityForWorkType = (
  workType: MarketingWorkType,
  role: MarketingRole,
): MainMarketingActivity => {
  if (workType === 'podcast') return 'podcast_postproduction';
  if (workType === 'reels_video' || workType === 'complex_video') return 'video_editing_production';
  return getDefaultMainActivityForRole(role);
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
  const [isMonthlyPlanOpen, setIsMonthlyPlanOpen] = useState(false);
  const [isAnnualPlanOpen, setIsAnnualPlanOpen] = useState(false);
  const [isAnnualRoleBreakdownOpen, setIsAnnualRoleBreakdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'monthly' | 'annual'>('monthly');

  const crmData = useCRMData();
  const leadsData = useLeadsData();
  const prospectsData = useProspectsData();
  const colleagues = Array.isArray(crmData?.colleagues)
    ? crmData.colleagues.filter((item) => item && typeof item === 'object')
    : [];
  const clients = Array.isArray(crmData?.clients)
    ? crmData.clients.filter((item) => item && typeof item === 'object')
    : [];
  const leads = Array.isArray(leadsData?.leads)
    ? leadsData.leads.filter((item) => item && typeof item === 'object')
    : [];
  const prospects = Array.isArray(prospectsData?.prospects)
    ? prospectsData.prospects.filter((item) => item && typeof item === 'object')
    : [];
  const { colleagueId, role, isSuperAdmin } = useUserRole();

  const canManageBudgets = isSuperAdmin || role === 'admin' || role === 'management';
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

  const { data: legacyMarketingRewards = [] } = useQuery({
    queryKey: ['marketing_legacy_rewards', selectedYear, selectedMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_rewards' as never)
        .select('id, amount, client_name')
        .eq('category', 'marketing')
        .gte('activity_date', monthStartIso)
        .lte('activity_date', monthEndIso)
        .or('client_name.is.null,client_name.neq.__marketing_work_log__');
      if (error) throw error;
      return (data || []) as Array<{ id: string; amount: number; client_name: string | null }>;
    },
  });

  const { data: yearlyLegacyMarketingRewards = [] } = useQuery({
    queryKey: ['marketing_legacy_rewards_year', selectedYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_rewards' as never)
        .select('id, amount, client_name, activity_date')
        .eq('category', 'marketing')
        .gte('activity_date', yearStartIso)
        .lte('activity_date', yearEndIso)
        .or('client_name.is.null,client_name.neq.__marketing_work_log__');
      if (error) throw error;
      return (data || []) as Array<{ id: string; amount: number; client_name: string | null; activity_date: string }>;
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
        notes: '',
      });
      return;
    }
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
      notes: monthlyPlan.notes || '',
    });
  }, [monthlyPlan]);

  const [workLogForm, setWorkLogForm] = useState({
    colleague_id: colleagueId || '',
    role: 'content_manager' as MarketingRole,
    work_type: 'reels_video' as MarketingWorkType,
    main_activity: 'video_editing_production' as MainMarketingActivity,
    activity_date: format(now, 'yyyy-MM-dd'),
    title: WORK_TYPE_LABELS.reels_video,
    description: '',
    hours: '',
    hourly_rate: '500',
  });

  type MarketingPlanDraft = {
    planned_total_budget: number;
  };

  const [annualPlanDrafts, setAnnualPlanDrafts] = useState<Record<number, MarketingPlanDraft>>({});

  useEffect(() => {
    const plansByMonth = new Map<number, MarketingMonthlyPlan>();
    yearlyPlans.forEach((plan) => plansByMonth.set(plan.month, plan));
    const nextDrafts: Record<number, MarketingPlanDraft> = {};
    for (let month = 1; month <= 12; month += 1) {
      const plan = plansByMonth.get(month);
      nextDrafts[month] = {
        planned_total_budget: Number(plan?.planned_total_budget || 0),
      };
    }
    setAnnualPlanDrafts(nextDrafts);
  }, [yearlyPlans]);

  const saveAnnualMonthPlanMutation = useMutation({
    mutationFn: async (month: number) => {
      const draft = annualPlanDrafts[month];
      if (!draft) throw new Error('Draft plánu není připraven.');
      const payload = {
        year: selectedYear,
        month,
        planned_total_budget: Number(draft.planned_total_budget || 0),
      };

      const { error } = await supabase
        .from('marketing_monthly_plans' as never)
        .upsert(payload as never, { onConflict: 'year,month' });
      if (error) throw error;
    },
    onSuccess: (_, month) => {
      queryClient.invalidateQueries({ queryKey: ['marketing_monthly_plan', selectedYear, selectedMonth] });
      queryClient.invalidateQueries({ queryKey: ['marketing_yearly_plans', selectedYear] });
      toast.success(`Plán pro ${format(new Date(selectedYear, month - 1, 1), 'LLLL', { locale: cs })} byl uložen.`);
    },
    onError: (error) => {
      console.error(error);
      toast.error('Nepodařilo se uložit roční plán.');
    },
  });

  const saveMonthlyDetailPlanMutation = useMutation({
    mutationFn: async () => {
      const plannedLaborBudget = Number(planForm.planned_content_budget || 0)
        + Number(planForm.planned_graphic_budget || 0)
        + Number(planForm.planned_video_budget || 0)
        + Number(planForm.planned_podcast_postproduction_budget || 0);

      const payload = {
        year: selectedYear,
        month: selectedMonth,
        planned_total_budget: Number(planForm.planned_total_budget || 0),
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
        planned_main_tasks: planForm.planned_main_tasks || '',
        notes: planForm.notes || '',
      };

      const { error } = await supabase
        .from('marketing_monthly_plans' as never)
        .upsert(payload as never, { onConflict: 'year,month' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing_monthly_plan', selectedYear, selectedMonth] });
      queryClient.invalidateQueries({ queryKey: ['marketing_yearly_plans', selectedYear] });
      toast.success('Detailní měsíční plán byl uložen.');
    },
    onError: (error) => {
      console.error(error);
      toast.error('Nepodařilo se uložit detailní měsíční plán.');
    },
  });

  const addWorkLogMutation = useMutation({
    mutationFn: async () => {
      if (!workLogForm.colleague_id) throw new Error('Vyberte kolegu.');
      if (!workLogForm.main_activity) throw new Error('Vyberte hlavní činnost.');
      let amount = 0;
      let title = workLogForm.title.trim();
      let hours: number | null = null;

      if (workLogForm.work_type === 'other_hourly') {
        const parsedHours = Number(workLogForm.hours);
        const parsedHourlyRate = Number(workLogForm.hourly_rate);
        if (!Number.isFinite(parsedHours) || parsedHours <= 0) {
          throw new Error('U hodinové práce vyplňte počet hodin.');
        }
        if (!Number.isFinite(parsedHourlyRate) || parsedHourlyRate <= 0) {
          throw new Error('U hodinové práce vyberte hodinovou sazbu.');
        }
        if (!title) {
          throw new Error('U hodinové práce vyplňte název činnosti.');
        }
        hours = parsedHours;
        amount = parsedHours * parsedHourlyRate;
      } else {
        title = WORK_TYPE_LABELS[workLogForm.work_type];
        amount = FIXED_WORK_REWARD[workLogForm.work_type];
      }

      const payload = {
        colleague_id: workLogForm.colleague_id,
        role: workLogForm.role,
        main_activity: workLogForm.main_activity,
        activity_date: workLogForm.activity_date,
        title,
        description: workLogForm.description.trim() || null,
        hours,
        amount,
      };
      const { error } = await supabase.from('marketing_work_logs' as never).insert(payload as never);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing_work_logs', selectedYear, selectedMonth] });
      setWorkLogForm((prev) => ({
        ...prev,
        work_type: 'reels_video',
        main_activity: 'video_editing_production',
        title: WORK_TYPE_LABELS.reels_video,
        description: '',
        hours: '',
        hourly_rate: '500',
      }));
      toast.success('Marketing práce byla zapsána.');
    },
    onError: (error) => {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Nepodařilo se zapsat marketing práci.');
    },
  });

  const plannedTotalBudget = Number(planForm.planned_total_budget || 0);
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
  const legacyLaborCost = useMemo(
    () => legacyMarketingRewards.reduce((sum, item) => sum + (item.amount || 0), 0),
    [legacyMarketingRewards]
  );
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
  const actualOtherCost = legacyLaborCost + actualOtherSpend;
  const actualTotalCost = actualLaborCost + legacyLaborCost + adSpendTotal;
  const budgetDiff = plannedTotalBudget - actualTotalCost;
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

  const colleagueSummary = useMemo(() => {
    const byColleague = new Map<string, { name: string; amount: number; hours: number; logs: number }>();
    workLogs.forEach((item) => {
      const colleagueId = item.colleague_id || '__unknown__';
      const colleagueName = colleagueNameById.get(colleagueId) || 'Neznámý kolega';
      const existing = byColleague.get(colleagueId) || {
        name: colleagueName,
        amount: 0,
        hours: 0,
        logs: 0,
      };
      existing.amount += item.amount || 0;
      existing.hours += item.hours || 0;
      existing.logs += 1;
      byColleague.set(colleagueId, existing);
    });
    const defaults = defaultMarketingColleagues.map((entry, idx) => {
      const summary = entry.id ? byColleague.get(entry.id) : null;
      if (entry.id) {
        byColleague.delete(entry.id);
      }
      const amount = summary?.amount || 0;
      const monthlyMinimum = typeof entry.monthlyMinimum === 'number' ? entry.monthlyMinimum : null;
      return {
        sortOrder: idx,
        name: entry.label,
        amount,
        hours: summary?.hours || 0,
        logs: summary?.logs || 0,
        monthlyMinimum,
        remainingToMinimum: monthlyMinimum !== null ? Math.max(0, monthlyMinimum - amount) : null,
      };
    });

    const others = Array.from(byColleague.values())
      .sort((a, b) => b.amount - a.amount)
      .map((item, idx) => ({
        sortOrder: 100 + idx,
        ...item,
        monthlyMinimum: null,
        remainingToMinimum: null,
      }));

    return [...defaults, ...others].sort((a, b) => a.sortOrder - b.sortOrder);
  }, [colleagueNameById, defaultMarketingColleagues, workLogs]);

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
    if (!workLogForm.colleague_id && selectableColleagues.length > 0) {
      setWorkLogForm((prev) => ({
        ...prev,
        colleague_id: selectableColleagues[0].id,
      }));
    }
  }, [selectableColleagues, workLogForm.colleague_id]);

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

    const actualLegacyByMonth = new Map<number, number>();
    yearlyLegacyMarketingRewards.forEach((reward) => {
      const date = new Date(reward.activity_date);
      if (!Number.isFinite(date.getTime())) return;
      const month = date.getMonth() + 1;
      actualLegacyByMonth.set(month, (actualLegacyByMonth.get(month) || 0) + (reward.amount || 0));
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
      const actualLabor = (actualWorkByMonth.get(month) || 0) + (actualLegacyByMonth.get(month) || 0);
      const actualTotal = actualLabor + spend.meta + spend.ppc + spend.other;
      const plannedTotal = plan ? (
        (plan.planned_total_budget || 0)
        || ((plan.planned_meta_budget || 0)
          + (plan.planned_ppc_budget || 0)
          + (plan.planned_content_budget || 0)
          + (plan.planned_graphic_budget || 0)
          + (plan.planned_video_budget || 0)
          + (plan.planned_podcast_postproduction_budget || 0)
          + (plan.planned_podcast_studio_rent_budget || 0)
          + (plan.planned_other_budget || 0))
      ) : 0;
      return {
        month,
        monthLabel: format(new Date(selectedYear, idx, 1), 'LLLL', { locale: cs }),
        plan,
        plannedTotal,
        actualTotal,
        diff: plannedTotal - actualTotal,
      };
    });
  }, [selectedYear, yearlyAdSpendEntries, yearlyLegacyMarketingRewards, yearlyPlans, yearlyWorkLogs]);

  const annualSummary = useMemo(() => {
    const plannedTotal = annualRows.reduce((sum, row) => sum + row.plannedTotal, 0);
    const actualTotal = annualRows.reduce((sum, row) => sum + row.actualTotal, 0);
    return {
      plannedTotal,
      actualTotal,
      diff: plannedTotal - actualTotal,
    };
  }, [annualRows]);

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

  const setAnnualDraftValue = <K extends keyof MarketingPlanDraft>(month: number, key: K, value: MarketingPlanDraft[K]) => {
    setAnnualPlanDrafts((prev) => ({
      ...prev,
      [month]: {
        ...(prev[month] || {
          planned_total_budget: 0,
        }),
        [key]: value,
      },
    }));
  };

  const isLoading = isPlanLoading || isWorkLogsLoading || isAdSpendLoading;
  const actualCpl = leadsInMonth > 0 ? actualTotalCost / leadsInMonth : null;
  const plannedCpl = planForm.planned_leads > 0 ? plannedDetailTotalBudget / planForm.planned_leads : null;
  const actualCac = newClientsInMonth > 0 ? actualTotalCost / newClientsInMonth : null;
  const plannedCac = planForm.planned_new_clients > 0 ? plannedDetailTotalBudget / planForm.planned_new_clients : null;

  return (
    <div className="space-y-4 p-3 sm:p-4">
      <PageHeader
        title="📣 Marketing"
        titleAccent="interní přehled"
        description="Cíle, rozpočet, náklady a přínos interního marketingu po měsících."
      />

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'monthly' | 'annual')}>
        <TabsList className="h-8">
          <TabsTrigger value="monthly">Měsíční přehled</TabsTrigger>
          <TabsTrigger value="annual">Roční plán</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly" className="mt-3 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={String(selectedMonth)} onValueChange={(value) => setSelectedMonth(Number(value))}>
          <SelectTrigger className="w-[160px]">
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
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 4 }, (_, idx) => now.getFullYear() - idx).map((year) => (
              <SelectItem key={year} value={String(year)}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Badge variant={canManageBudgets ? 'default' : 'secondary'}>
          Rozpočet upravuje: {canManageBudgets ? 'admin/management' : 'jen ke čtení'}
        </Badge>
      </div>

      <Card className="border-amber-300/60 bg-amber-50/30 dark:bg-amber-950/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Hlavní plán měsíce</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          <div className="space-y-1">
            <Label>Hlavní cíl / úkol měsíce</Label>
            <Textarea
              rows={3}
              value={planForm.planned_main_tasks}
              onChange={(e) => setPlanForm((prev) => ({ ...prev, planned_main_tasks: e.target.value }))}
              placeholder="Např. Spustit webinář, publikovat novou case study..."
              disabled={!canManageBudgets}
            />
          </div>
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={() => saveMonthlyDetailPlanMutation.mutate()}
              disabled={!canManageBudgets || saveMonthlyDetailPlanMutation.isPending}
            >
              Uložit hlavní plán měsíce
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-3">
        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Plánovaný rozpočet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">{Math.round(plannedTotalBudget).toLocaleString('cs-CZ')} Kč</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Skutečné náklady</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{Math.round(actualTotalCost).toLocaleString('cs-CZ')} Kč</p>
            <p className="text-xs text-muted-foreground mt-1">
              práce: {Math.round(actualLaborCost + legacyLaborCost).toLocaleString('cs-CZ')} Kč, spend: {Math.round(adSpendTotal).toLocaleString('cs-CZ')} Kč
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Rozdíl plán vs realita</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${budgetDiff >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
              {budgetDiff >= 0 ? '+' : ''}
              {Math.round(budgetDiff).toLocaleString('cs-CZ')} Kč
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Detailní plán měsíce (editace)</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Collapsible open={isMonthlyPlanOpen} onOpenChange={setIsMonthlyPlanOpen}>
            <CollapsibleTrigger className="group flex w-full items-center justify-between rounded-md border p-2.5 text-left hover:bg-muted/40 transition-colors">
              <div>
                <p className="text-sm font-semibold">Zobrazit detailní plán položek</p>
                <p className="text-xs text-muted-foreground">Content, video, grafika, spend, ostatní + plán leadů/klientů</p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=closed]:-rotate-90" />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 pt-2">
              <div className="grid gap-2 md:grid-cols-3">
                <div className="space-y-1">
                  <Label>Plán content management</Label>
                  <Input type="number" value={planForm.planned_content_budget} onChange={(e) => setPlanForm((prev) => ({ ...prev, planned_content_budget: Number(e.target.value) || 0 }))} />
                </div>
                <div className="space-y-1">
                  <Label>Plán video</Label>
                  <Input type="number" value={planForm.planned_video_budget} onChange={(e) => setPlanForm((prev) => ({ ...prev, planned_video_budget: Number(e.target.value) || 0 }))} />
                </div>
                <div className="space-y-1">
                  <Label>Plán Podcast postprodukce</Label>
                  <Input
                    type="number"
                    value={planForm.planned_podcast_postproduction_budget}
                    onChange={(e) => setPlanForm((prev) => ({ ...prev, planned_podcast_postproduction_budget: Number(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Plán grafika</Label>
                  <Input type="number" value={planForm.planned_graphic_budget} onChange={(e) => setPlanForm((prev) => ({ ...prev, planned_graphic_budget: Number(e.target.value) || 0 }))} />
                </div>
                <div className="space-y-1">
                  <Label>Plán Meta spend</Label>
                  <Input type="number" value={planForm.planned_meta_budget} onChange={(e) => setPlanForm((prev) => ({ ...prev, planned_meta_budget: Number(e.target.value) || 0 }))} />
                </div>
                <div className="space-y-1">
                  <Label>Plán PPC spend</Label>
                  <Input type="number" value={planForm.planned_ppc_budget} onChange={(e) => setPlanForm((prev) => ({ ...prev, planned_ppc_budget: Number(e.target.value) || 0 }))} />
                </div>
                <div className="space-y-1">
                  <Label>Plán ostatní náklady</Label>
                  <Input type="number" value={planForm.planned_other_budget} onChange={(e) => setPlanForm((prev) => ({ ...prev, planned_other_budget: Number(e.target.value) || 0 }))} />
                </div>
                <div className="space-y-1">
                  <Label>Plán pronájem podcastového studia</Label>
                  <Input
                    type="number"
                    value={planForm.planned_podcast_studio_rent_budget}
                    onChange={(e) => setPlanForm((prev) => ({ ...prev, planned_podcast_studio_rent_budget: Number(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Plán zájemců</Label>
                  <Input type="number" value={planForm.planned_prospects} onChange={(e) => setPlanForm((prev) => ({ ...prev, planned_prospects: Number(e.target.value) || 0 }))} />
                </div>
                <div className="space-y-1">
                  <Label>Plán leadů</Label>
                  <Input type="number" value={planForm.planned_leads} onChange={(e) => setPlanForm((prev) => ({ ...prev, planned_leads: Number(e.target.value) || 0 }))} />
                </div>
                <div className="space-y-1">
                  <Label>Plán nových klientů</Label>
                  <Input type="number" value={planForm.planned_new_clients} onChange={(e) => setPlanForm((prev) => ({ ...prev, planned_new_clients: Number(e.target.value) || 0 }))} />
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-muted/20 p-2">
                <p className="text-xs text-muted-foreground">
                  Součet detailního plánu: <span className="font-semibold text-foreground">{Math.round(plannedDetailTotalBudget).toLocaleString('cs-CZ')} Kč</span>
                </p>
                <Button onClick={() => saveMonthlyDetailPlanMutation.mutate()} disabled={!canManageBudgets || saveMonthlyDetailPlanMutation.isPending} size="sm">
                  Uložit detailní plán
                </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      <div className="grid gap-3 xl:grid-cols-2">
        <Card className="border-dashed">
          <CardHeader className="pb-2">
            <CardTitle>Rozpad nákladů podle kolegů (sbalené)</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Collapsible open={isRoleBreakdownOpen} onOpenChange={setIsRoleBreakdownOpen}>
              <CollapsibleTrigger className="group flex w-full items-center justify-between rounded-md border p-2.5 text-left hover:bg-muted/40 transition-colors">
                <div>
                  <p className="text-sm font-semibold">Zobrazit detail rozpadu podle kolegů</p>
                  <p className="text-xs text-muted-foreground">Podle toho, kdo aktivitu zalogoval.</p>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=closed]:-rotate-90" />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 pt-2">
                {colleagueSummary.map((item) => (
                  <div key={item.name} className="flex items-center justify-between rounded-md border p-2.5">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.logs} záznamů, {Number(item.hours || 0).toFixed(1)} h</p>
                      {item.monthlyMinimum !== null && (
                        <p className="text-xs text-muted-foreground">
                          Minimum: {Math.round(item.monthlyMinimum).toLocaleString('cs-CZ')} Kč / měsíc, zbývá:{' '}
                          <span className={item.remainingToMinimum && item.remainingToMinimum > 0 ? 'text-amber-600 font-semibold' : 'text-emerald-600 font-semibold'}>
                            {Math.round(item.remainingToMinimum || 0).toLocaleString('cs-CZ')} Kč
                          </span>
                        </p>
                      )}
                    </div>
                    <p className="font-semibold">{Math.round(item.amount).toLocaleString('cs-CZ')} Kč</p>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">Rozpad je počítaný z konkrétních marketing work logů podle kolegy.</p>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>

        <Card className="border-emerald-300/40 bg-emerald-50/20 dark:bg-emerald-950/10">
          <CardHeader className="pb-2">
            <CardTitle>Přínos marketingu (aktuální měsíc)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 pt-0 text-sm">
            <p>Noví zájemci (lead magnet): <span className="font-semibold">{prospectsInMonth}</span></p>
            <p>Poptávky: <span className="font-semibold">{leadsInMonth}</span></p>
            <p>Noví klienti: <span className="font-semibold">{newClientsInMonth}</span></p>
            <p>Konverze leadů: <span className="font-semibold">{convertedLeadsInMonth}</span></p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-sky-300/40 bg-sky-50/20 dark:bg-sky-950/10">
        <CardHeader className="pb-2">
          <CardTitle>Marketing KPI: plán vs realita</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metrika</TableHead>
                <TableHead className="text-right">Plán</TableHead>
                <TableHead className="text-right">Realita</TableHead>
                <TableHead className="text-right">Odchylka</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Content manager (salary)</TableCell>
                <TableCell className="text-right">{Math.round(planForm.planned_content_budget).toLocaleString('cs-CZ')} Kč</TableCell>
                <TableCell className="text-right">{Math.round(contentWorkCost).toLocaleString('cs-CZ')} Kč</TableCell>
                <TableCell className="text-right">{Math.round(planForm.planned_content_budget - contentWorkCost).toLocaleString('cs-CZ')} Kč</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Video editing a produkce</TableCell>
                <TableCell className="text-right">{Math.round(planForm.planned_video_budget).toLocaleString('cs-CZ')} Kč</TableCell>
                <TableCell className="text-right">{Math.round(pureVideoEditingCost).toLocaleString('cs-CZ')} Kč</TableCell>
                <TableCell className="text-right">{Math.round(planForm.planned_video_budget - pureVideoEditingCost).toLocaleString('cs-CZ')} Kč</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Podcast postprodukce</TableCell>
                <TableCell className="text-right">{Math.round(planForm.planned_podcast_postproduction_budget).toLocaleString('cs-CZ')} Kč</TableCell>
                <TableCell className="text-right">{Math.round(podcastPostproductionCost).toLocaleString('cs-CZ')} Kč</TableCell>
                <TableCell className="text-right">{Math.round(planForm.planned_podcast_postproduction_budget - podcastPostproductionCost).toLocaleString('cs-CZ')} Kč</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Pronájem podcastového studia</TableCell>
                <TableCell className="text-right">{Math.round(planForm.planned_podcast_studio_rent_budget).toLocaleString('cs-CZ')} Kč</TableCell>
                <TableCell className="text-right">—</TableCell>
                <TableCell className="text-right">—</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Graphic design</TableCell>
                <TableCell className="text-right">{Math.round(planForm.planned_graphic_budget).toLocaleString('cs-CZ')} Kč</TableCell>
                <TableCell className="text-right">{Math.round(creativeWorkCost).toLocaleString('cs-CZ')} Kč</TableCell>
                <TableCell className="text-right">{Math.round(planForm.planned_graphic_budget - creativeWorkCost).toLocaleString('cs-CZ')} Kč</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Ad spend</TableCell>
                <TableCell className="text-right">{Math.round(plannedAdSpendBudget).toLocaleString('cs-CZ')} Kč</TableCell>
                <TableCell className="text-right">{Math.round(actualMetaSpend + actualPpcSpend).toLocaleString('cs-CZ')} Kč</TableCell>
                <TableCell className="text-right">{Math.round(plannedAdSpendBudget - (actualMetaSpend + actualPpcSpend)).toLocaleString('cs-CZ')} Kč</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Nástroje / ostatní fix</TableCell>
                <TableCell className="text-right">{Math.round(planForm.planned_other_budget).toLocaleString('cs-CZ')} Kč</TableCell>
                <TableCell className="text-right">{Math.round(actualOtherCost).toLocaleString('cs-CZ')} Kč</TableCell>
                <TableCell className="text-right">{Math.round(planForm.planned_other_budget - actualOtherCost).toLocaleString('cs-CZ')} Kč</TableCell>
              </TableRow>
              <TableRow className="bg-muted/30">
                <TableCell className="font-semibold">Celkem marketing</TableCell>
                <TableCell className="text-right font-semibold">{Math.round(plannedDetailTotalBudget).toLocaleString('cs-CZ')} Kč</TableCell>
                <TableCell className="text-right font-semibold">{Math.round(actualTotalCost).toLocaleString('cs-CZ')} Kč</TableCell>
                <TableCell className="text-right font-semibold">{Math.round(detailBudgetDiff).toLocaleString('cs-CZ')} Kč</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Počet leadů</TableCell>
                <TableCell className="text-right">{planForm.planned_leads}</TableCell>
                <TableCell className="text-right">{leadsInMonth}</TableCell>
                <TableCell className="text-right">{planForm.planned_leads - leadsInMonth}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Cena za lead</TableCell>
                <TableCell className="text-right">{plannedCpl !== null ? `${Math.round(plannedCpl).toLocaleString('cs-CZ')} Kč` : '—'}</TableCell>
                <TableCell className="text-right">{actualCpl !== null ? `${Math.round(actualCpl).toLocaleString('cs-CZ')} Kč` : '—'}</TableCell>
                <TableCell className="text-right">{plannedCpl !== null && actualCpl !== null ? `${Math.round(plannedCpl - actualCpl).toLocaleString('cs-CZ')} Kč` : '—'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Počet nových klientů</TableCell>
                <TableCell className="text-right">{planForm.planned_new_clients}</TableCell>
                <TableCell className="text-right">{newClientsInMonth}</TableCell>
                <TableCell className="text-right">{planForm.planned_new_clients - newClientsInMonth}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Cena za nového klienta</TableCell>
                <TableCell className="text-right">{plannedCac !== null ? `${Math.round(plannedCac).toLocaleString('cs-CZ')} Kč` : '—'}</TableCell>
                <TableCell className="text-right">{actualCac !== null ? `${Math.round(actualCac).toLocaleString('cs-CZ')} Kč` : '—'}</TableCell>
                <TableCell className="text-right">{plannedCac !== null && actualCac !== null ? `${Math.round(plannedCac - actualCac).toLocaleString('cs-CZ')} Kč` : '—'}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Zapsat interní marketing práci</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-1">
              <Label>Role</Label>
              <Select
                value={workLogForm.role}
                onValueChange={(value) => {
                  const nextRole = value as MarketingRole;
                  setWorkLogForm((prev) => ({
                    ...prev,
                    role: nextRole,
                    main_activity: getDefaultMainActivityForWorkType(prev.work_type, nextRole),
                  }));
                }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_LABELS).map(([key, value]) => (
                    <SelectItem key={key} value={key}>{value}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Činnost</Label>
              <Select
                value={workLogForm.work_type}
                onValueChange={(value) => {
                  const workType = value as MarketingWorkType;
                  setWorkLogForm((prev) => ({
                    ...prev,
                    work_type: workType,
                    main_activity: getDefaultMainActivityForWorkType(workType, prev.role),
                    title: workType === 'other_hourly' ? prev.title : WORK_TYPE_LABELS[workType],
                    hours: workType === 'other_hourly' ? prev.hours : '',
                  }));
                }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(WORK_TYPE_LABELS).map(([key, value]) => (
                    <SelectItem key={key} value={key}>{value}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Hlavní činnost (povinné)</Label>
              <Select
                value={workLogForm.main_activity}
                onValueChange={(value) => setWorkLogForm((prev) => ({ ...prev, main_activity: value as MainMarketingActivity }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(MAIN_ACTIVITY_LABELS).map(([key, value]) => (
                    <SelectItem key={key} value={key}>{value}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Kolega</Label>
              <Select
                value={workLogForm.colleague_id}
                onValueChange={(value) => setWorkLogForm((prev) => ({ ...prev, colleague_id: value }))}
                disabled={!canCreateLogsForOthers && !!colleagueId}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {selectableColleagues.map((colleague) => (
                    <SelectItem key={colleague.id} value={colleague.id}>
                      {colleague.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <div className="space-y-1">
              <Label>Datum</Label>
              <Input type="date" value={workLogForm.activity_date} onChange={(e) => setWorkLogForm((prev) => ({ ...prev, activity_date: e.target.value }))} />
            </div>
          </div>
          {workLogForm.work_type === 'other_hourly' ? (
            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
              <div className="space-y-1">
                <Label>Název činnosti</Label>
                <Input
                  value={workLogForm.title}
                  onChange={(e) => setWorkLogForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Např. strategická příprava"
                />
              </div>
              <div className="space-y-1">
                <Label>Hodiny</Label>
                <Input
                  type="number"
                  value={workLogForm.hours}
                  onChange={(e) => setWorkLogForm((prev) => ({ ...prev, hours: e.target.value }))}
                  placeholder="např. 3.5"
                />
              </div>
              <div className="space-y-1">
                <Label>Hodinová sazba (Kč)</Label>
                <Select
                  value={workLogForm.hourly_rate}
                  onValueChange={(value) => setWorkLogForm((prev) => ({ ...prev, hourly_rate: value }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {HOURLY_RATE_OPTIONS.map((hourlyRate) => (
                      <SelectItem key={hourlyRate} value={String(hourlyRate)}>
                        {hourlyRate.toLocaleString('cs-CZ')} Kč / h
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="rounded-md border bg-muted/30 p-2.5">
              <p className="text-sm font-medium">
                Fixní odměna: {FIXED_WORK_REWARD[workLogForm.work_type].toLocaleString('cs-CZ')} Kč
              </p>
              <p className="text-xs text-muted-foreground">
                Pro tuto činnost se částka doplní automaticky.
              </p>
            </div>
          )}
          <div className="space-y-1">
            <Label>Popis (volitelné)</Label>
            <Textarea rows={2} value={workLogForm.description} onChange={(e) => setWorkLogForm((prev) => ({ ...prev, description: e.target.value }))} />
          </div>
          <Button onClick={() => addWorkLogMutation.mutate()} disabled={addWorkLogMutation.isPending}>
            Přidat aktivitu
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Detail interní marketing práce</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Načítám data marketingu…</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Datum</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Kolega</TableHead>
                    <TableHead>Hlavní činnost</TableHead>
                    <TableHead>Aktivita</TableHead>
                    <TableHead className="text-right">Náklad</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-4">
                        Zatím bez marketing aktivit v tomto měsíci.
                      </TableCell>
                    </TableRow>
                  ) : (
                    workLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{new Date(log.activity_date).toLocaleDateString('cs-CZ')}</TableCell>
                        <TableCell>{ROLE_LABELS[log.role]}</TableCell>
                        <TableCell>{colleagueNameById.get(log.colleague_id) || '—'}</TableCell>
                        <TableCell>{MAIN_ACTIVITY_LABELS[resolveMainActivityFromLog(log)]}</TableCell>
                        <TableCell>
                          <p className="font-medium">{log.title}</p>
                          {log.description && <p className="text-xs text-muted-foreground">{log.description}</p>}
                        </TableCell>
                        <TableCell className="text-right">{Math.round(log.amount).toLocaleString('cs-CZ')} Kč</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="annual" className="mt-3 space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <Card className="border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Roční plán rozpočtu</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">{Math.round(annualSummary.plannedTotal).toLocaleString('cs-CZ')} Kč</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Roční skutečné náklady</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{Math.round(annualSummary.actualTotal).toLocaleString('cs-CZ')} Kč</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Roční rozdíl</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${annualSummary.diff >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                  {annualSummary.diff >= 0 ? '+' : ''}
                  {Math.round(annualSummary.diff).toLocaleString('cs-CZ')} Kč
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Nastavení ročního plánu po měsících (sbalené)</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Collapsible open={isAnnualPlanOpen} onOpenChange={setIsAnnualPlanOpen}>
                <CollapsibleTrigger className="group flex w-full items-center justify-between rounded-md border p-2.5 text-left hover:bg-muted/40 transition-colors">
                  <div>
                    <p className="text-sm font-semibold">Zobrazit nastavení měsíčního budgetu</p>
                    <p className="text-xs text-muted-foreground">Na roční úrovni se nastavuje pouze celkový náklad na měsíc.</p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=closed]:-rotate-90" />
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Měsíc</TableHead>
                        <TableHead>Plánovaný měsíční budget</TableHead>
                        <TableHead />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.from({ length: 12 }, (_, idx) => idx + 1).map((month) => {
                        const draft = annualPlanDrafts[month];
                        if (!draft) return null;
                        return (
                          <TableRow key={`draft-${month}`}>
                            <TableCell className="font-medium capitalize">{format(new Date(selectedYear, month - 1, 1), 'LLLL', { locale: cs })}</TableCell>
                            <TableCell><Input type="number" value={draft.planned_total_budget} onChange={(e) => setAnnualDraftValue(month, 'planned_total_budget', Number(e.target.value) || 0)} /></TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                onClick={() => saveAnnualMonthPlanMutation.mutate(month)}
                                disabled={!canManageBudgets || saveAnnualMonthPlanMutation.isPending}
                              >
                                Uložit
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Roční rozpad nákladů podle kolegů (sbalené)</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Collapsible open={isAnnualRoleBreakdownOpen} onOpenChange={setIsAnnualRoleBreakdownOpen}>
                <CollapsibleTrigger className="group flex w-full items-center justify-between rounded-md border p-2.5 text-left hover:bg-muted/40 transition-colors">
                  <div>
                    <p className="text-sm font-semibold">Zobrazit roční rozpad podle kolegů</p>
                    <p className="text-xs text-muted-foreground">Podle toho, kdo aktivity v roce logoval.</p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=closed]:-rotate-90" />
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2 grid gap-2 md:grid-cols-3">
                  {annualColleagueSummary.map((item) => (
                    <div key={item.name} className="rounded-md border p-2.5">
                      <p className="text-sm text-muted-foreground">{item.name}</p>
                      <p className="text-xl font-bold">{Math.round(item.amount).toLocaleString('cs-CZ')} Kč</p>
                      <p className="text-xs text-muted-foreground">{item.logs} záznamů</p>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Roční plán vs realita po měsících</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto pt-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Měsíc</TableHead>
                    <TableHead className="text-right">Plán rozpočet</TableHead>
                    <TableHead className="text-right">Skutečné náklady</TableHead>
                    <TableHead className="text-right">Rozdíl</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {annualRows.map((row) => (
                    <TableRow key={row.month}>
                      <TableCell className="font-medium capitalize">{row.monthLabel}</TableCell>
                      <TableCell className="text-right">{Math.round(row.plannedTotal).toLocaleString('cs-CZ')} Kč</TableCell>
                      <TableCell className="text-right">{Math.round(row.actualTotal).toLocaleString('cs-CZ')} Kč</TableCell>
                      <TableCell className={`text-right font-semibold ${row.diff >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                        {row.diff >= 0 ? '+' : ''}
                        {Math.round(row.diff).toLocaleString('cs-CZ')} Kč
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

