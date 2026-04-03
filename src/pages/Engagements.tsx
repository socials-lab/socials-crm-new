import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO, isSameMonth } from 'date-fns';
import { cs } from 'date-fns/locale';
import { Search, Plus, MoreHorizontal, ChevronDown, ChevronUp, Users, Calendar, UserPlus, Trash2, Pencil, User, Check, X, Briefcase, ExternalLink, Monitor, FileText, ChevronLeft, ChevronRight, CalendarOff, AlertTriangle, Receipt, Clock, Loader2, Globe } from 'lucide-react';
import { getErrorMessage } from '@/lib/errorUtils';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { useCRMData } from '@/hooks/useCRMData';
import { useCreativeBoostData } from '@/hooks/useCreativeBoostData';
import { useUserRole } from '@/hooks/useUserRole';
import { EngagementForm } from '@/components/forms/EngagementForm';
import { AssignmentForm, type AssignmentFormSubmitData } from '@/components/forms/AssignmentForm';
import { AddEngagementServiceDialog } from '@/components/forms/AddEngagementServiceDialog';
import { CreativeBoostCreditOverview } from '@/components/engagements/CreativeBoostCreditOverview';
import { CreateInvoiceFromEngagementDialog } from '@/components/engagements/CreateInvoiceFromEngagementDialog';
import { EngagementInvoicingSection } from '@/components/engagements/EngagementInvoicingStatus';
import { EngagementFinancialOverview } from '@/components/engagements/EngagementFinancialOverview';
import { EndEngagementDialog } from '@/components/engagements/EndEngagementDialog';
import { EngagementHistoryDialog } from '@/components/engagements/EngagementHistoryDialog';
import { EditAssignmentDialog } from '@/components/engagements/EditAssignmentDialog';
import { serviceTierConfigs } from '@/constants/services';
import { MANAGED_COUNTRIES, getCountryFlag } from '@/constants/countries';

import type { EngagementStatus, EngagementType, Engagement, EngagementAssignment, EngagementService, ServiceTier, Service } from '@/types/crm';
import { ADVERTISING_PLATFORMS } from '@/types/crm';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/sonner';
import { normalizeUrlProtocol } from '@/lib/validation';
import { getClientOptionLabel } from '@/lib/clientOptionLabel';
import { isEngagementServiceActiveInMonth } from '@/lib/engagementServiceLifecycle';
import { invokeWithTimeout } from '@/lib/supabaseUtils';
import { getCreativeBoostExpectedMonthlyRevenue } from '@/utils/engagementRevenueUtils';
import { getEffectiveServicePrice } from '@/utils/introDiscountUtils';

// Dynamic lookup for Creative Boost service ID
const CREATIVE_BOOST_SERVICE_CODE = 'CREATIVE_BOOST';
function isCreativeBoostEngagementService(
  engagementService: { service_id: string; name: string; creative_boost_price_per_credit: number | null; creative_boost_min_credits: number | null; creative_boost_max_credits: number | null; is_active: boolean },
  creativeBoostServiceId: string | null
): boolean {
  if (!engagementService.is_active) {
    return false;
  }
  if (creativeBoostServiceId && engagementService.service_id === creativeBoostServiceId) {
    return true;
  }
  const lowerName = engagementService.name.toLowerCase();
  return (
    engagementService.creative_boost_price_per_credit !== null ||
    engagementService.creative_boost_min_credits !== null ||
    engagementService.creative_boost_max_credits !== null ||
    lowerName.includes('creative boost')
  );
}

function withPromiseTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timeout after ${timeoutMs}ms`)), timeoutMs);
    }),
  ]);
}

function getCreativeBoostEstimatedPayrollCost(service: EngagementService): number {
  if (service.creative_boost_max_credits === null) {
    throw new Error(`Creative Boost service ${service.id} is missing max credits.`);
  }
  if (
    service.creative_boost_reward_per_credit_banner === null ||
    service.creative_boost_reward_per_credit_video === null
  ) {
    throw new Error(`Creative Boost service ${service.id} is missing reward per credit configuration.`);
  }
  const averageReward = (service.creative_boost_reward_per_credit_banner + service.creative_boost_reward_per_credit_video) / 2;
  return service.creative_boost_max_credits * averageReward;
}

const getTierPrice = (service: Service | undefined, tier: ServiceTier): number | null => {
  if (!service || service.service_type !== 'core') return null;

  const tierPricing = service.tier_pricing as unknown;

  if (Array.isArray(tierPricing)) {
    const match = tierPricing.find((item) => item?.tier === tier);
    return typeof match?.price === 'number' ? match.price : null;
  }

  if (tierPricing && typeof tierPricing === 'object') {
    const tierData = (tierPricing as Record<string, { price?: unknown } | undefined>)[tier];
    return typeof tierData?.price === 'number' ? tierData.price : null;
  }

  return null;
};

function EngagementsContent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get('highlight');

  const normalizeOptionalUrl = (value: string) => {
    const trimmed = value.trim();
    return trimmed ? normalizeUrlProtocol(trimmed) : null;
  };
  const highlightedRef = useRef<HTMLDivElement>(null);
  const { isSuperAdmin, canSeeFinancials } = useUserRole();
  const canViewFinancials = isSuperAdmin || canSeeFinancials;

  const {
    clients,
    clientContacts,
    engagements,
    engagementServices,
    colleagues,
    assignments,
    services,
    isLoading,
    getClientById,
    getAssignmentsByEngagementId,
    getColleagueById,
    getEngagementServicesByEngagementId,
    addEngagement,
    updateEngagement,
    addAssignment,
    updateAssignment,
    removeAssignment,
    addEngagementService,
    updateEngagementService,
    deleteEngagement,
    deleteEngagementService,
    getUnbilledOneOffServices,
    getMetricsByEngagementId,
    getEngagementHistory,
    getInvoicesByEngagementId,
    createInvoiceWithLineItems,
  } = useCRMData();

  // Dynamic Creative Boost service ID lookup
  const CREATIVE_BOOST_SERVICE_ID = useMemo(() => {
    const cbService = services.find(
      (service) =>
        service.code?.toLowerCase() === CREATIVE_BOOST_SERVICE_CODE.toLowerCase() ||
        service.name?.toLowerCase().includes('creative boost')
    );
    return cbService?.id || null;
  }, [services]);

  // State for service deletion confirmation
  const [serviceToDelete, setServiceToDelete] = useState<{ id: string; name: string } | null>(null);
  const [engagementToDelete, setEngagementToDelete] = useState<Engagement | null>(null);

  const { 
    getClientMonthSummaryByEngagementServiceId, 
    addClientToMonth,
    getClientMonthByClientId,
    updateClientMonth,
  } = useCreativeBoostData();
  
  // Current month for filters and Creative Boost overview
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  // Monthly filter state
  const [filterYear, setFilterYear] = useState(currentYear);
  const [filterMonth, setFilterMonth] = useState(currentMonth);
  
  // End engagement dialog state
  const [endEngagementDialogOpen, setEndEngagementDialogOpen] = useState(false);
  const [engagementToEnd, setEngagementToEnd] = useState<Engagement | null>(null);

  // Edit assignment dialog state
  const [editingAssignment, setEditingAssignment] = useState<EngagementAssignment | null>(null);
  const [isEditAssignmentDialogOpen, setIsEditAssignmentDialogOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<EngagementStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<EngagementType | 'all'>('all');
  const [expandedEngagementId, setExpandedEngagementId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEngagement, setEditingEngagement] = useState<Engagement | null>(null);
  const [isAssignmentFormOpen, setIsAssignmentFormOpen] = useState(false);
  const [assignmentEngagementId, setAssignmentEngagementId] = useState<string | null>(null);
  const [assignmentToRemove, setAssignmentToRemove] = useState<EngagementAssignment | null>(null);
  
  // Service dialog state
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [serviceEngagementId, setServiceEngagementId] = useState<string | null>(null);
  const [editingEngagementService, setEditingEngagementService] = useState<EngagementService | null>(null);
  
  // Creative Boost - no inline editing state needed, handled by unified component

  // Freelo URL inline editing
  const [editingFreeloId, setEditingFreeloId] = useState<string | null>(null);
  const [tempFreeloUrl, setTempFreeloUrl] = useState<string>('');

  // Document URLs inline editing
  const [editingOfferUrlId, setEditingOfferUrlId] = useState<string | null>(null);
  const [tempOfferUrl, setTempOfferUrl] = useState<string>('');
  const [editingContractUrlId, setEditingContractUrlId] = useState<string | null>(null);
  const [tempContractUrl, setTempContractUrl] = useState<string>('');

  // Create invoice dialog state
  const [invoiceDialogEngagement, setInvoiceDialogEngagement] = useState<Engagement | null>(null);
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);

  // History dialog state
  const [historyEngagement, setHistoryEngagement] = useState<Engagement | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Pagination state
  const INITIAL_PAGE_SIZE = 50;
  const LOAD_MORE_SIZE = 25;
  const [visibleCount, setVisibleCount] = useState(INITIAL_PAGE_SIZE);

  // Handle highlight from URL - with cleanup to prevent memory leak
  useEffect(() => {
    if (highlightId) {
      setExpandedEngagementId(highlightId);
      const timer = setTimeout(() => {
        highlightedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [highlightId]);

  // Helper to check if engagement has unbilled one-off services
  const hasUnbilledOneOffServices = useCallback((engagementId: string): boolean => {
    const services = getEngagementServicesByEngagementId(engagementId);
    return services.some(s => 
      s.billing_type === 'one_off' && 
      s.invoicing_status === 'pending' && 
      s.is_active
    );
  }, [getEngagementServicesByEngagementId]);

  // Helper to check if engagement is active in selected month
  const isEngagementActiveInMonth = useCallback((engagement: Engagement, year: number, month: number): boolean => {
    const monthStart = startOfMonth(new Date(year, month - 1));
    const monthEnd = endOfMonth(new Date(year, month - 1));
    const engagementStart = parseISO(engagement.start_date);
    const engagementEnd = engagement.end_date ? parseISO(engagement.end_date) : null;

    // For one_off engagements
    if (engagement.type === 'one_off') {
      // Always show if has unbilled one-off services (regardless of month)
      if (hasUnbilledOneOffServices(engagement.id)) {
        return true;
      }
      // Otherwise, only show in the month of start_date
      return isSameMonth(engagementStart, monthStart);
    }

    // For retainer/internal engagements, show if active within the month range
    const startsBeforeOrDuringMonth = engagementStart <= monthEnd;
    const endsAfterOrDuringMonth = !engagementEnd || engagementEnd >= monthStart;

    return startsBeforeOrDuringMonth && endsAfterOrDuringMonth;
  }, [hasUnbilledOneOffServices]);

  const filteredEngagements = useMemo(() => {
    const query = searchQuery.toLowerCase();

    return engagements.filter(engagement => {
      const client = getClientById(engagement.client_id);
      const clientLabel = getClientOptionLabel(client ?? {}).toLowerCase();
      const matchesSearch =
        engagement.name.toLowerCase().includes(query) ||
        clientLabel.includes(query) ||
        client?.brand_name?.toLowerCase().includes(query) ||
        client?.name?.toLowerCase().includes(query);

      const matchesStatus = statusFilter === 'all' || engagement.status === statusFilter;
      const matchesType = typeFilter === 'all' || engagement.type === typeFilter;
      const matchesMonth = isEngagementActiveInMonth(engagement, filterYear, filterMonth);

      return matchesSearch && matchesStatus && matchesType && matchesMonth;
    });
  }, [engagements, searchQuery, statusFilter, typeFilter, filterYear, filterMonth, getClientById, isEngagementActiveInMonth]);

  // Apply pagination to filtered engagements
  const paginatedEngagements = useMemo(() => {
    return filteredEngagements.slice(0, visibleCount);
  }, [filteredEngagements, visibleCount]);

  const hasMoreEngagements = filteredEngagements.length > visibleCount;
  const remainingCount = filteredEngagements.length - visibleCount;

  // Reset pagination when filters change
  useEffect(() => {
    setVisibleCount(INITIAL_PAGE_SIZE);
  }, [searchQuery, statusFilter, typeFilter, filterYear, filterMonth]);

  // Month navigation helpers
  const goToPreviousMonth = () => {
    if (filterMonth === 1) {
      setFilterMonth(12);
      setFilterYear(filterYear - 1);
    } else {
      setFilterMonth(filterMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (filterMonth === 12) {
      setFilterMonth(1);
      setFilterYear(filterYear + 1);
    } else {
      setFilterMonth(filterMonth + 1);
    }
  };

  const monthLabel = format(new Date(filterYear, filterMonth - 1), 'LLLL yyyy', { locale: cs });
  const capitalizedMonthLabel = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

  const getLatestMargin = (engagementId: string) => {
    const metrics = getMetricsByEngagementId(engagementId);
    if (metrics.length === 0) return null;
    const latest = metrics.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    })[0];
    return latest.margin_percent;
  };

  const getServiceById = (id: string | null) => {
    if (!id) return null;
    return services.find(s => s.id === id);
  };

  const toggleExpand = (engagementId: string) => {
    setExpandedEngagementId(expandedEngagementId === engagementId ? null : engagementId);
  };

  const handleAddEngagement = () => {
    setEditingEngagement(null);
    setIsFormOpen(true);
  };

  const handleEditEngagement = (engagement: Engagement) => {
    setEditingEngagement(engagement);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (data: Omit<Engagement, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      if (editingEngagement) {
        await updateEngagement(editingEngagement.id, data);
        toast.success('Zakázka byla upravena');
      } else {
        await addEngagement(data);
        toast.success('Zakázka byla vytvořena');
      }
      setIsFormOpen(false);
      setEditingEngagement(null);
    } catch (error) {
      console.error('Failed to save engagement:', error);
      toast.error(getErrorMessage(error, 'Nepodařilo se uložit zakázku'));
    }
  };

  const handleOpenAssignmentForm = (engagementId: string) => {
    setAssignmentEngagementId(engagementId);
    setIsAssignmentFormOpen(true);
  };

  const invalidateAssignmentAndServiceQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['engagement_assignments'] }),
      queryClient.invalidateQueries({ queryKey: ['engagement_services'] }),
      queryClient.invalidateQueries({ queryKey: ['engagement_history'] }),
    ]);
  };

  const handleAssignmentSubmit = async (data: AssignmentFormSubmitData) => {
    try {
      const { _creativeBoostRewards, ...assignmentData } = data;
      const { error } = await supabase.rpc('create_assignment_with_cb_rewards' as never, {
        p_engagement_id: assignmentData.engagement_id,
        p_engagement_service_id: assignmentData.engagement_service_id,
        p_colleague_id: assignmentData.colleague_id,
        p_role_on_engagement: assignmentData.role_on_engagement,
        p_cost_model: assignmentData.cost_model,
        p_hourly_cost: assignmentData.hourly_cost,
        p_monthly_cost: assignmentData.monthly_cost,
        p_percentage_of_revenue: assignmentData.percentage_of_revenue,
        p_reward_per_credit: assignmentData.reward_per_credit,
        p_reward_per_credit_banner: assignmentData.reward_per_credit_banner,
        p_reward_per_credit_video: assignmentData.reward_per_credit_video,
        p_start_date: assignmentData.start_date,
        p_end_date: assignmentData.end_date,
        p_notes: assignmentData.notes,
        p_cb_service_id: _creativeBoostRewards?.engagementServiceId ?? null,
        p_cb_reward_banner: _creativeBoostRewards?.bannerRewardPerCredit ?? null,
        p_cb_reward_video: _creativeBoostRewards?.videoRewardPerCredit ?? null,
      } as never);
      if (error) throw error;
      await invalidateAssignmentAndServiceQueries();
      toast.success('Kolega byl přiřazen');
      setIsAssignmentFormOpen(false);
      setAssignmentEngagementId(null);
    } catch (error) {
      console.error('Failed to add assignment:', error);
      toast.error(getErrorMessage(error, 'Nepodařilo se přiřadit kolegu'));
    }
  };

  const handleRemoveAssignment = async () => {
    if (assignmentToRemove) {
      try {
        await removeAssignment(assignmentToRemove.id);
        toast.success('Přiřazení bylo odebráno');
      } catch (error) {
        console.error('Failed to remove assignment:', error);
        toast.error(getErrorMessage(error, 'Nepodařilo se odebrat přiřazení'));
      }
      setAssignmentToRemove(null);
    }
  };

  const handleDeleteService = async () => {
    if (!serviceToDelete) return;
    try {
      await deleteEngagementService(serviceToDelete.id);
      toast.success('Služba byla odebrána');
    } catch (error) {
      console.error('Failed to delete service:', error);
      toast.error(getErrorMessage(error, 'Nepodařilo se odebrat službu'));
    }
    setServiceToDelete(null);
  };

  const handleDeleteEngagement = async () => {
    if (!engagementToDelete) return;
    try {
      await deleteEngagement(engagementToDelete.id);
      toast.success('Zakázka byla odstraněna');
      if (expandedEngagementId === engagementToDelete.id) {
        setExpandedEngagementId(null);
      }
    } catch (error) {
      console.error('Failed to delete engagement:', error);
      toast.error(getErrorMessage(error, 'Nepodařilo se odstranit zakázku'));
    }
    setEngagementToDelete(null);
  };

  // Safe inline update helpers with error handling
  const safeUpdateEngagement = async (id: string, data: Partial<Engagement>, successMessage: string) => {
    try {
      await updateEngagement(id, data);
      toast.success(successMessage);
    } catch (error) {
      console.error('Failed to update engagement:', error);
      toast.error(getErrorMessage(error, 'Nepodařilo se uložit změnu'));
    }
  };

  const safeUpdateEngagementPlatformsAndCountries = async (
    id: string,
    platforms: string[],
    managedCountries: string[],
    successMessage: string,
  ) => {
    try {
      const { error } = await supabase.rpc('update_engagement_platforms_and_countries', {
        p_engagement_id: id,
        p_platforms: platforms,
        p_managed_countries: managedCountries,
      });

      if (error) {
        throw error;
      }

      queryClient.invalidateQueries({ queryKey: ['engagements'] });
      queryClient.invalidateQueries({ queryKey: ['engagement_history'] });
      toast.success(successMessage);
    } catch (error) {
      console.error('Failed to update engagement platforms/managed countries:', error);
      toast.error(getErrorMessage(error, 'Nepodařilo se uložit změnu'));
    }
  };

  const safeUpdateService = async (id: string, data: Partial<EngagementService>, successMessage: string) => {
    try {
      await updateEngagementService(id, data);
      toast.success(successMessage);
    } catch (error) {
      console.error('Failed to update service:', error);
      toast.error(getErrorMessage(error, 'Nepodařilo se uložit službu'));
    }
  };

  // Show loading state while data is being fetched
  if (isLoading) {
    return (
      <div className="p-4 md:p-6 flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Načítám zakázky...</span>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      <PageHeader
        title="📋 Zakázky"
        titleAccent="& projekty"
        description="Správa kontraktů a projektů"
        actions={
          isSuperAdmin && (
            <Button className="gap-2" onClick={handleAddEngagement}>
              <Plus className="h-4 w-4" />
              Přidat zakázku
            </Button>
          )
        }
      />

      {/* Month navigation */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-[140px] text-center font-medium">{capitalizedMonthLabel}</div>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Hledat zakázky..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as EngagementStatus | 'all')}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Všechny statusy</SelectItem>
            <SelectItem value="active">Aktivní</SelectItem>
            <SelectItem value="planned">Plánováno</SelectItem>
            <SelectItem value="paused">Pozastaveno</SelectItem>
            <SelectItem value="completed">Dokončeno</SelectItem>
            <SelectItem value="cancelled">Zrušeno</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as EngagementType | 'all')}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Typ" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Všechny typy</SelectItem>
            <SelectItem value="retainer">Retainer</SelectItem>
            <SelectItem value="one_off">Jednorázově</SelectItem>
            <SelectItem value="internal">Interní</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filteredEngagements.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            <CalendarOff className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Žádné zakázky pro {capitalizedMonthLabel}</p>
          </Card>
        ) : paginatedEngagements.map((engagement) => {
          const client = getClientById(engagement.client_id);
          const clientLabel = getClientOptionLabel(client ?? {});
          const marginPercent = canViewFinancials ? getLatestMargin(engagement.id) : null;
          const engagementAssignments = getAssignmentsByEngagementId(engagement.id).filter(a => !a.end_date);
          const isExpanded = expandedEngagementId === engagement.id;
          const metrics = getMetricsByEngagementId(engagement.id);
          const invoiceHistory = getInvoicesByEngagementId(engagement.id);
          const latestMetrics = metrics.sort((a, b) => {
            if (a.year !== b.year) return b.year - a.year;
            return b.month - a.month;
          })[0];
          
          // Calculate total amount from all services
          const engagementServicesList = getEngagementServicesByEngagementId(engagement.id);
          const totalServicesAmount = engagementServicesList
            .filter((service) => isEngagementServiceActiveInMonth(service, filterYear, filterMonth))
            .reduce((sum, s) => {
              if (isCreativeBoostEngagementService(s, CREATIVE_BOOST_SERVICE_ID)) {
                return sum + getCreativeBoostExpectedMonthlyRevenue(s);
              }
              return sum + s.price;
            }, 0);
          
          // Use services total if available, otherwise fall back to engagement fees
          const displayAmount = engagementServicesList.length > 0 
            ? totalServicesAmount 
            : (engagement.type === 'retainer' ? engagement.monthly_fee : engagement.one_off_fee);
          
          const hasEndDate = engagement.end_date && engagement.type === 'retainer';
          
          // Check for unbilled one-off items
          const unbilledOneOffItems = engagementServicesList.filter(s => 
            s.billing_type === 'one_off' && 
            s.invoicing_status === 'pending' && 
            s.is_active
          );
          const hasUnbilledItems = unbilledOneOffItems.length > 0;

          return (
            <Card 
              key={engagement.id} 
              ref={highlightId === engagement.id ? highlightedRef : null}
              className={cn(
                "overflow-hidden transition-all",
                highlightId === engagement.id && "ring-2 ring-primary"
              )}
            >
              <div 
                className="flex flex-col gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors sm:flex-row sm:items-center sm:justify-between"
                onClick={() => toggleExpand(engagement.id)}
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
                    {clientLabel.charAt(0) || '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{engagement.name}</span>
                    <p className="truncate text-xs text-muted-foreground">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/clients?highlight=${engagement.client_id}`);
                        }}
                        className="text-primary hover:underline"
                      >
                        {clientLabel}
                      </button>
                      {engagement.managed_countries?.length > 0 && (
                        <span className="ml-1">
                          {engagement.managed_countries.map((code) => getCountryFlag(code)).join(' ')}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex min-w-0 flex-wrap items-center gap-2 sm:shrink-0 sm:justify-end sm:gap-3">
                  {/* Unbilled one-off warning badge */}
                  {hasUnbilledItems && (
                    <Badge variant="outline" className="text-xs whitespace-nowrap bg-amber-50 text-amber-700 border-amber-200 gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      K fakturaci
                    </Badge>
                  )}
                  {/* End date badge for retainers */}
                  {hasEndDate && (
                    <Badge variant="outline" className="text-xs whitespace-nowrap bg-amber-50 text-amber-700 border-amber-200">
                      Končí: {format(parseISO(engagement.end_date!), 'd.M.yyyy')}
                    </Badge>
                  )}
                  {/* Past due warning badge */}
                  {engagement.end_date &&
                   new Date(engagement.end_date) < new Date() &&
                   engagement.status !== 'completed' &&
                   engagement.status !== 'cancelled' && (
                    <Badge variant="destructive" className="text-xs whitespace-nowrap gap-1">
                      <Clock className="h-3 w-3" />
                      Po termínu
                    </Badge>
                  )}
                  {/* Type badge */}
                  <Badge variant="outline" className="text-xs whitespace-nowrap">
                    {engagement.type === 'retainer' ? 'Retainer' : engagement.type === 'one_off' ? 'Jednorázově' : 'Interní'}
                  </Badge>
                  {/* Price - now showing total from services */}
                  {canViewFinancials && (
                    <span className="text-sm font-semibold whitespace-nowrap hidden sm:flex items-center gap-1">
                      {displayAmount.toLocaleString()} {engagement.currency}
                      {engagement.type === 'retainer' && '/měs'}
                      {engagementServicesList.length > 1 && (
                        <span className="text-xs font-normal text-muted-foreground">
                          ({engagementServicesList.filter((service) => isEngagementServiceActiveInMonth(service, filterYear, filterMonth)).length} pol.)
                        </span>
                      )}
                    </span>
                  )}
                  <StatusBadge status={engagement.status} />
                  {isSuperAdmin && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-3.5 w-3.5" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditEngagement(engagement)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Upravit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenAssignmentForm(engagement.id)}>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Přiřadit kolegu
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setInvoiceDialogEngagement(engagement);
                          setIsInvoiceDialogOpen(true);
                        }}>
                          <FileText className="h-4 w-4 mr-2" />
                          Vytvořit fakturu
                        </DropdownMenuItem>
                        {engagement.type === 'retainer' && !engagement.end_date && (
                          <DropdownMenuItem onClick={() => {
                            setEngagementToEnd(engagement);
                            setEndEngagementDialogOpen(true);
                          }}>
                            <CalendarOff className="h-4 w-4 mr-2" />
                            Ukončit spolupráci
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => {
                          setHistoryEngagement(engagement);
                          setIsHistoryOpen(true);
                        }}>
                          <Clock className="h-4 w-4 mr-2" />
                          Historie změn
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setEngagementToDelete(engagement)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Smazat zakázku
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>

              {isExpanded && (
                <CardContent className="border-t bg-muted/30 pt-4">
                  {/* Financial overview - full width above detail grid */}
                  {canViewFinancials && (() => {
                    const engServices = getEngagementServicesByEngagementId(engagement.id);
                    const engAssignments = getAssignmentsByEngagementId(engagement.id).filter(a => !a.end_date);

                    const totalRevenue = engServices
                      .filter((service) => isEngagementServiceActiveInMonth(service, filterYear, filterMonth))
                      .reduce((sum, s) => {
                        if (isCreativeBoostEngagementService(s, CREATIVE_BOOST_SERVICE_ID)) {
                          return sum + getCreativeBoostExpectedMonthlyRevenue(s);
                        }
                        if (s.billing_type === 'monthly') {
                          return sum + getEffectiveServicePrice(
                            s.price,
                            s.intro_discount_percent,
                            s.intro_discount_months,
                            s.intro_discount_start_date,
                          );
                        }
                        return sum + s.price;
                      }, 0);
                    const estimatedCbCost = engServices
                      .filter((service) =>
                        isEngagementServiceActiveInMonth(service, filterYear, filterMonth) &&
                        isCreativeBoostEngagementService(service, CREATIVE_BOOST_SERVICE_ID),
                      )
                      .reduce((sum, service) => sum + getCreativeBoostEstimatedPayrollCost(service), 0);

                    return (
                      <EngagementFinancialOverview
                        revenue={totalRevenue}
                        assignments={engAssignments}
                        currency={engagement.currency}
                        estimatedCbCost={estimatedCbCost}
                      />
                    );
                  })()}

                  <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        Detaily zakázky
                      </h4>
                      {(() => {
                        const contactPerson = clientContacts.find(c => c.id === engagement.contact_person_id);
                        const clientContactsList = clientContacts.filter(c => c.client_id === engagement.client_id);
                        return (
                          <div className="space-y-2 text-sm">
                            <p>
                              <span className="text-muted-foreground">Klient:</span>{' '}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/clients?highlight=${engagement.client_id}`);
                                }}
                                className="text-primary hover:underline"
                              >
                                {clientLabel}
                              </button>
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">Kontakt:</span>
                              <Select
                                value={engagement.contact_person_id ?? '__none__'}
                                onValueChange={(value) => {
                                  const nextContactId = value === '__none__' ? null : value;
                                  safeUpdateEngagement(engagement.id, { contact_person_id: nextContactId }, nextContactId ? 'Kontaktní osoba změněna' : 'Kontaktní osoba odebrána');
                                }}
                              >
                                <SelectTrigger 
                                  className="h-7 w-auto min-w-[140px] text-sm" 
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <SelectValue placeholder="Vybrat kontakt">
                                    {contactPerson ? (
                                      <span className="text-primary">{contactPerson.name}</span>
                                    ) : (
                                      <span className="text-muted-foreground italic">Nevybráno</span>
                                    )}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent onClick={(e) => e.stopPropagation()}>
                                  <SelectItem value="__none__">Bez kontaktu</SelectItem>
                                  {clientContactsList.length > 0 ? (
                                    clientContactsList.map(contact => (
                                      <SelectItem key={contact.id} value={contact.id}>
                                        {contact.name}
                                        {contact.position && ` (${contact.position})`}
                                      </SelectItem>
                                    ))
                                  ) : (
                                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                      Žádné kontakty
                                    </div>
                                  )}
                                </SelectContent>
                              </Select>
                              {contactPerson && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/contacts?highlight=${contactPerson.id}`);
                                  }}
                                  className="text-muted-foreground hover:text-primary"
                                  title="Přejít na kontakt"
                                >
                                  <User className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                            <p><span className="text-muted-foreground">Billing:</span> {
                              engagement.billing_model === 'fixed_fee' ? 'Fixní' : 
                              engagement.billing_model === 'spend_based' ? '% ze spendu' : 'Hybrid'
                            }</p>
                            <p><span className="text-muted-foreground">Začátek:</span> {new Date(engagement.start_date).toLocaleDateString('cs-CZ')}</p>
                            {engagement.end_date && (
                              <p><span className="text-muted-foreground">Konec:</span> {new Date(engagement.end_date).toLocaleDateString('cs-CZ')}</p>
                            )}
                            {engagement.notice_period_months && (
                              <p><span className="text-muted-foreground">Výpovědní lhůta:</span> {engagement.notice_period_months} měsíce</p>
                            )}
                            {engagement.notes && (
                              <p className="pt-2 border-t"><span className="text-muted-foreground">Poznámky:</span> {engagement.notes}</p>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Services section */}
                    {(() => {
                      const allEngServices = getEngagementServicesByEngagementId(engagement.id);
                      // Show services that are active in the selected month (supports scheduled terminations).
                      const engServices = allEngServices.filter((service) =>
                        isEngagementServiceActiveInMonth(service, filterYear, filterMonth),
                      );
                      const totalServicesPrice = engServices.reduce((sum, s) => sum + s.price, 0);
                      return (
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h4 className="font-medium text-sm flex items-center gap-2">
                              <Briefcase className="h-4 w-4 text-muted-foreground" />
                              Služby ({engServices.length})
                              {canViewFinancials && engServices.length > 0 && (
                                <span className="text-xs font-normal text-muted-foreground">
                                  – {totalServicesPrice.toLocaleString()} {engagement.currency}
                                </span>
                              )}
                            </h4>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                setServiceEngagementId(engagement.id);
                                setIsServiceDialogOpen(true);
                              }}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Přidat
                            </Button>
                          </div>
                          <div className="space-y-2">
                            {engServices.length > 0 ? (
                              engServices.map(engService => {
                                const service = services.find(s => s.id === engService.service_id);
                                const isCreativeBoost = isCreativeBoostEngagementService(engService, CREATIVE_BOOST_SERVICE_ID);
                                const cbSummary = isCreativeBoost 
                                  ? getClientMonthSummaryByEngagementServiceId(engService.id, filterYear, filterMonth)
                                  : null;
                                
                                // For Creative Boost, show only the unified card
                                if (isCreativeBoost) {
                                  // Find assignment for this Creative Boost service to get reward
                                  const cbAssignment = engagementAssignments.find(
                                    a => a.engagement_service_id === engService.id
                                  );

                                  return (
                                    <CreativeBoostCreditOverview
                                      key={engService.id}
                                      engagementService={engService}
                                      summary={cbSummary}
                                      year={filterYear}
                                      month={filterMonth}
                                      currency={engagement.currency || 'CZK'}
                                      canSeeFinancials={canViewFinancials}
                                      assignedColleagueAssignmentId={cbAssignment?.id}
                                      onUpdateSettings={(updates) => {
                                        updateEngagementService(engService.id, {
                                          creative_boost_max_credits: updates.maxCredits,
                                          creative_boost_price_per_credit: updates.pricePerCredit,
                                          ...(updates.fixedBilling !== undefined && { creative_boost_fixed_billing: updates.fixedBilling }),
                                          ...(updates.bannerRewardPerCredit !== undefined && { creative_boost_reward_per_credit_banner: updates.bannerRewardPerCredit }),
                                          ...(updates.videoRewardPerCredit !== undefined && { creative_boost_reward_per_credit_video: updates.videoRewardPerCredit }),
                                        });
                                        // Also update Creative Boost client month if exists
                                        const eng = engagements.find(e => e.id === engService.engagement_id);
                                        if (eng) {
                                          const clientMonth = getClientMonthByClientId(eng.client_id, filterYear, filterMonth);
                                          if (clientMonth) {
                                            updateClientMonth(clientMonth.id, {
                                              maxCredits: updates.maxCredits,
                                              pricePerCredit: updates.pricePerCredit,
                                            });
                                          }
                                        }
                                        toast.success('Nastavení kreditů aktualizováno');
                                      }}
                                      onDelete={() => {
                                        setServiceToDelete({ id: engService.id, name: engService.name });
                                      }}
                                    />
                                  );
                                }
                                
                                // Regular services
                                return (
                                  <div 
                                    key={engService.id}
                                    className="flex items-start justify-between gap-3 p-2 rounded-lg bg-background border"
                                  >
                                    <div className="flex min-w-0 flex-1 items-center gap-2">
                                      <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                                        {service?.code?.charAt(0) || engService.name.charAt(0)}
                                      </div>
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                          <p className="truncate text-sm font-medium">{engService.name}</p>
                                          {service?.service_type === 'core' && (
                                            <DropdownMenu>
                                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                <button className="focus:outline-none">
                                                  <Badge 
                                                    variant="secondary" 
                                                    className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 cursor-pointer transition-colors"
                                                  >
                                                    {engService.selected_tier ? engService.selected_tier.toUpperCase() : 'Vybrat'}
                                                    <ChevronDown className="h-2.5 w-2.5 ml-0.5" />
                                                  </Badge>
                                                </button>
                                              </DropdownMenuTrigger>
                                              <DropdownMenuContent align="start" className="w-56">
                                                {serviceTierConfigs.map((config) => {
                                                  const tierPrice = getTierPrice(service, config.tier);
                                                  const priceLabel = tierPrice !== null
                                                    ? `${tierPrice.toLocaleString()} ${engService.currency}`
                                                    : 'Individuální';
                                                  return (
                                                    <DropdownMenuItem
                                                      key={config.tier}
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        const newPrice = tierPrice ?? engService.price;
                                                        updateEngagementService(engService.id, { 
                                                          selected_tier: config.tier as ServiceTier,
                                                          price: newPrice
                                                        });
                                                        toast.success(`Úroveň změněna na ${config.label}`);
                                                      }}
                                                      className={engService.selected_tier === config.tier ? 'bg-accent' : ''}
                                                    >
                                                      <div className="flex flex-col">
                                                        <span className="font-medium">{config.label}</span>
                                                        <span className="text-xs text-muted-foreground">
                                                          {config.spend_description} • {priceLabel}
                                                        </span>
                                                      </div>
                                                    </DropdownMenuItem>
                                                  );
                                                })}
                                              </DropdownMenuContent>
                                            </DropdownMenu>
                                          )}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                          {engService.billing_type === 'monthly' ? 'Měsíčně' : 'Jednorázově'}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="shrink-0 flex items-center gap-2">
                                      {canViewFinancials && (
                                        <span className="text-xs text-muted-foreground">
                                          {engService.price.toLocaleString()} {engService.currency}
                                          {engService.billing_type === 'monthly' && '/měs'}
                                        </span>
                                      )}
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditingEngagementService(engService);
                                          setServiceEngagementId(engagement.id);
                                          setIsServiceDialogOpen(true);
                                        }}
                                      >
                                        <Pencil className="h-3.5 w-3.5" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-destructive hover:text-destructive"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setServiceToDelete({ id: engService.id, name: engService.name });
                                        }}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <p className="text-sm text-muted-foreground py-2">Žádné přiřazené služby</p>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="font-medium text-sm flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          Přiřazení kolegové ({engagementAssignments.length})
                        </h4>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenAssignmentForm(engagement.id);
                          }}
                        >
                          <UserPlus className="h-3 w-3 mr-1" />
                          Přidat
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {engagementAssignments.length > 0 ? (
                          engagementAssignments.map(assignment => {
                            const colleague = getColleagueById(assignment.colleague_id);
                            return (
                              <div 
                                key={assignment.id} 
                                className="flex items-center justify-between p-2 rounded-lg bg-background border"
                              >
                                <div className="flex items-center gap-2">
                                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                                    {colleague?.full_name?.split(' ').map(n => n?.[0] || '').join('') || '?'}
                                  </div>
                                  <div>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/colleagues?highlight=${assignment.colleague_id}`);
                                      }}
                                      className="text-sm font-medium text-primary hover:underline"
                                    >
                                      {colleague?.full_name}
                                    </button>
                                    <p className="text-xs text-muted-foreground">{assignment.role_on_engagement}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {canViewFinancials && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingAssignment(assignment);
                                        setIsEditAssignmentDialogOpen(true);
                                      }}
                                      className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group"
                                      title="Klikněte pro úpravu odměny"
                                    >
                                      <span>
                                        {(() => {
                                          const service = assignment.engagement_service_id
                                            ? engagementServices.find(es => es.id === assignment.engagement_service_id)
                                            : null;
                                          if (service && isCreativeBoostEngagementService(service, CREATIVE_BOOST_SERVICE_ID)) {
                                            if (
                                              service.creative_boost_reward_per_credit_banner === null ||
                                              service.creative_boost_reward_per_credit_video === null
                                            ) {
                                              return 'Chybí B/V odměna';
                                            }
                                            const bannerReward = service.creative_boost_reward_per_credit_banner;
                                            const videoReward = service.creative_boost_reward_per_credit_video;
                                            if (bannerReward === videoReward) {
                                              return `${bannerReward} Kč/kredit`;
                                            }
                                            return `B ${bannerReward} / V ${videoReward} Kč/kredit`;
                                          }

                                          if (assignment.cost_model === 'fixed_monthly' && assignment.monthly_cost) {
                                            return `${assignment.monthly_cost.toLocaleString('cs-CZ')} Kč/měs`;
                                          }
                                          if (assignment.cost_model === 'hourly' && assignment.hourly_cost) {
                                            return `${assignment.hourly_cost.toLocaleString('cs-CZ')} Kč/h`;
                                          }
                                          if (assignment.cost_model === 'percentage' && assignment.percentage_of_revenue) {
                                            return `${assignment.percentage_of_revenue}%`;
                                          }
                                          return '–';
                                        })()}
                                      </span>
                                      <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-destructive hover:text-destructive"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setAssignmentToRemove(assignment);
                                    }}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-sm text-muted-foreground py-2">Žádní přiřazení kolegové</p>
                        )}
                      </div>
                    </div>

                    {/* Invoicing history section */}
                    <EngagementInvoicingSection
                      engagement={engagement}
                      invoices={invoiceHistory}
                      currency={engagement.currency}
                    />

                    {/* Platforms section */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm flex items-center gap-2">
                        <Monitor className="h-4 w-4 text-muted-foreground" />
                        Platformy ({engagement.platforms?.length || 0})
                      </h4>
                      <Popover>
                        <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="outline" className="w-full justify-between h-auto min-h-9 py-2">
                            <span className="text-sm text-left truncate">
                              {engagement.platforms?.length > 0 
                                ? engagement.platforms.join(', ')
                                : 'Vybrat platformy...'}
                            </span>
                            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56 p-2" align="start" onClick={(e) => e.stopPropagation()}>
                          <div className="space-y-1">
                            {ADVERTISING_PLATFORMS.map((platform) => {
                              const isSelected = engagement.platforms?.includes(platform) || false;
                              return (
                                <div
                                  key={platform}
                                  className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer"
                                  onClick={() => {
                                    const currentPlatforms = engagement.platforms || [];
                                    const newPlatforms = isSelected
                                      ? currentPlatforms.filter(p => p !== platform)
                                      : [...currentPlatforms, platform];
                                    void safeUpdateEngagementPlatformsAndCountries(
                                      engagement.id,
                                      newPlatforms,
                                      engagement.managed_countries || [],
                                      'Platformy aktualizovány',
                                    );
                                  }}
                                >
                                  <Checkbox checked={isSelected} />
                                  <span className="text-sm">{platform}</span>
                                </div>
                              );
                            })}
                          </div>
                        </PopoverContent>
                      </Popover>
                      {engagement.platforms?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {engagement.platforms.map((platform) => (
                            <Badge key={platform} variant="secondary" className="text-xs">
                              {platform}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Managed countries section */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        Spravované země ({engagement.managed_countries?.length || 0})
                      </h4>
                      <Popover>
                        <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="outline" className="w-full justify-between h-auto min-h-9 py-2">
                            <span className="text-sm text-left truncate">
                              {engagement.managed_countries?.length > 0
                                ? engagement.managed_countries.map((code) => {
                                    const country = MANAGED_COUNTRIES.find((item) => item.code === code);
                                    if (!country) {
                                      throw new Error(`Unknown managed country code: ${code}`);
                                    }
                                    return `${country.flag} ${country.name}`;
                                  }).join(', ')
                                : 'Vybrat země...'}
                            </span>
                            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-2 max-h-72 overflow-y-auto" align="start" onClick={(e) => e.stopPropagation()}>
                          <div className="space-y-1">
                            {MANAGED_COUNTRIES.map((country) => {
                              const isSelected = engagement.managed_countries?.includes(country.code) || false;
                              return (
                                <div
                                  key={country.code}
                                  className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer"
                                  onClick={() => {
                                    const currentCountries = engagement.managed_countries || [];
                                    const newCountries = isSelected
                                      ? currentCountries.filter((code) => code !== country.code)
                                      : [...currentCountries, country.code];
                                    void safeUpdateEngagementPlatformsAndCountries(
                                      engagement.id,
                                      engagement.platforms || [],
                                      newCountries,
                                      'Spravované země aktualizovány',
                                    );
                                  }}
                                >
                                  <Checkbox checked={isSelected} />
                                  <span className="text-sm">{country.flag} {country.name}</span>
                                </div>
                              );
                            })}
                          </div>
                        </PopoverContent>
                      </Popover>
                      {engagement.managed_countries?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {engagement.managed_countries.map((code) => {
                            const country = MANAGED_COUNTRIES.find((item) => item.code === code);
                            if (!country) {
                              throw new Error(`Unknown managed country code: ${code}`);
                            }
                            return (
                              <Badge key={code} variant="secondary" className="text-xs">
                                {country.flag} {country.name}
                              </Badge>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Documents section - offer and contract links - always visible with inline editing */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        📄 Dokumenty
                      </h4>
                      <div className="space-y-2">
                        {/* Nabídka */}
                        {editingOfferUrlId === engagement.id ? (
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <Input
                              type="text"
                              inputMode="url"
                              value={tempOfferUrl}
                              onChange={(e) => setTempOfferUrl(e.target.value)}
                              className="h-8 text-sm flex-1"
                              placeholder="https://notion.so/..."
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  safeUpdateEngagement(engagement.id, { offer_url: normalizeOptionalUrl(tempOfferUrl) }, 'Odkaz na nabídku uložen');
                                  setEditingOfferUrlId(null);
                                } else if (e.key === 'Escape') {
                                  setEditingOfferUrlId(null);
                                }
                              }}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-status-active"
                              onClick={() => {
                                safeUpdateEngagement(engagement.id, { offer_url: normalizeOptionalUrl(tempOfferUrl) }, 'Odkaz na nabídku uložen');
                                setEditingOfferUrlId(null);
                              }}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setEditingOfferUrlId(null)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : engagement.offer_url ? (
                          <div className="flex items-center gap-2">
                            <a
                              href={engagement.offer_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background border text-sm text-primary hover:bg-muted transition-colors flex-1"
                            >
                              <FileText className="h-4 w-4" />
                              Nabídka v Notion
                              <ExternalLink className="h-3.5 w-3.5 ml-auto" />
                            </a>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingOfferUrlId(engagement.id);
                                setTempOfferUrl(engagement.offer_url || '');
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-sm w-full justify-start text-muted-foreground"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingOfferUrlId(engagement.id);
                              setTempOfferUrl('');
                            }}
                          >
                            <Plus className="h-3.5 w-3.5 mr-1" />
                            Přidat odkaz na nabídku
                          </Button>
                        )}

                        {/* Smlouva */}
                        {editingContractUrlId === engagement.id ? (
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <Input
                              type="text"
                              inputMode="url"
                              value={tempContractUrl}
                              onChange={(e) => setTempContractUrl(e.target.value)}
                              className="h-8 text-sm flex-1"
                              placeholder="https://digisign.cz/..."
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  safeUpdateEngagement(engagement.id, { contract_url: normalizeOptionalUrl(tempContractUrl) }, 'Odkaz na smlouvu uložen');
                                  setEditingContractUrlId(null);
                                } else if (e.key === 'Escape') {
                                  setEditingContractUrlId(null);
                                }
                              }}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-status-active"
                              onClick={() => {
                                safeUpdateEngagement(engagement.id, { contract_url: normalizeOptionalUrl(tempContractUrl) }, 'Odkaz na smlouvu uložen');
                                setEditingContractUrlId(null);
                              }}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setEditingContractUrlId(null)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : engagement.contract_url ? (
                          <div className="flex items-center gap-2">
                            <a
                              href={engagement.contract_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background border text-sm text-primary hover:bg-muted transition-colors flex-1"
                            >
                              <FileText className="h-4 w-4" />
                              Smlouva v DigiSign
                              <ExternalLink className="h-3.5 w-3.5 ml-auto" />
                            </a>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingContractUrlId(engagement.id);
                                setTempContractUrl(engagement.contract_url || '');
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-sm w-full justify-start text-muted-foreground"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingContractUrlId(engagement.id);
                              setTempContractUrl('');
                            }}
                          >
                            <Plus className="h-3.5 w-3.5 mr-1" />
                            Přidat odkaz na smlouvu
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Freelo link - always visible */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm flex items-center gap-2">
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        Projektový nástroj
                      </h4>
                      {editingFreeloId === engagement.id ? (
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <Input
                            type="text"
                            inputMode="url"
                            value={tempFreeloUrl}
                            onChange={(e) => setTempFreeloUrl(e.target.value)}
                            className="h-8 text-sm flex-1"
                            placeholder="https://app.freelo.io/..."
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                safeUpdateEngagement(engagement.id, { freelo_url: normalizeOptionalUrl(tempFreeloUrl) }, 'Freelo odkaz uložen');
                                setEditingFreeloId(null);
                              } else if (e.key === 'Escape') {
                                setEditingFreeloId(null);
                              }
                            }}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-status-active"
                            onClick={() => {
                              safeUpdateEngagement(engagement.id, { freelo_url: normalizeOptionalUrl(tempFreeloUrl) }, 'Freelo odkaz uložen');
                              setEditingFreeloId(null);
                            }}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setEditingFreeloId(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : engagement.freelo_url ? (
                        <div className="flex items-center gap-2">
                          <a
                            href={engagement.freelo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-background border text-sm text-primary hover:bg-muted transition-colors"
                          >
                            <img 
                              src="https://www.freelo.io/favicon.ico" 
                              alt="Freelo" 
                              className="h-4 w-4"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                            Otevřít ve Freelu
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingFreeloId(engagement.id);
                              setTempFreeloUrl(engagement.freelo_url || '');
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingFreeloId(engagement.id);
                            setTempFreeloUrl('');
                          }}
                        >
                          <Plus className="h-3.5 w-3.5 mr-1" />
                          Přidat Freelo odkaz
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}

        {/* Load more button */}
        {hasMoreEngagements && (
          <div className="mt-4 flex flex-col items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setVisibleCount(prev => prev + LOAD_MORE_SIZE)}
              className="min-w-[200px]"
            >
              Načíst další ({remainingCount > LOAD_MORE_SIZE ? LOAD_MORE_SIZE : remainingCount} z {remainingCount})
            </Button>
            <p className="text-xs text-muted-foreground">
              Zobrazeno {paginatedEngagements.length} z {filteredEngagements.length} zakázek
            </p>
          </div>
        )}
      </div>


      <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingEngagement ? 'Upravit zakázku' : 'Nová zakázka'}</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <EngagementForm
              engagement={editingEngagement || undefined}
              clients={clients}
              contacts={clientContacts}
              isSuperAdmin={isSuperAdmin}
              onSubmit={handleFormSubmit}
              onCancel={() => setIsFormOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={isAssignmentFormOpen} onOpenChange={setIsAssignmentFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Přiřadit kolegu k zakázce</DialogTitle>
          </DialogHeader>
          {assignmentEngagementId && (() => {
            const eng = engagements.find(e => e.id === assignmentEngagementId);
            if (!eng) return null;
            const assignmentEngagementServices = getEngagementServicesByEngagementId(assignmentEngagementId);
            return (
              <AssignmentForm
                engagementId={assignmentEngagementId}
                engagementStartDate={eng.start_date}
                engagementEndDate={eng.end_date}
                engagementServices={assignmentEngagementServices}
                creativeBoostServiceId={CREATIVE_BOOST_SERVICE_ID}
                colleagues={colleagues}
                existingAssignments={getAssignmentsByEngagementId(assignmentEngagementId)}
                onSubmit={handleAssignmentSubmit}
                onCancel={() => setIsAssignmentFormOpen(false)}
              />
            );
          })()}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!assignmentToRemove} onOpenChange={() => setAssignmentToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Odebrat přiřazení?</AlertDialogTitle>
            <AlertDialogDescription>
              Opravdu chcete odebrat tohoto kolegu ze zakázky? Tuto akci nelze vrátit.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Zrušit</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveAssignment} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Odebrat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Engagement Service Dialog */}
      {serviceEngagementId && (
        (() => {
          const selectedEngagement = engagements.find(e => e.id === serviceEngagementId);
          if (!selectedEngagement?.currency) {
            throw new Error(`Missing engagement currency for ${serviceEngagementId}`);
          }
          return (
        <AddEngagementServiceDialog
          open={isServiceDialogOpen}
          onOpenChange={(open) => {
            setIsServiceDialogOpen(open);
            if (!open) {
              setServiceEngagementId(null);
              setEditingEngagementService(null);
            }
          }}
          engagementId={serviceEngagementId}
          engagementCurrency={selectedEngagement.currency}
          services={services}
          existingService={editingEngagementService}
          onSubmit={async (data) => {
            if (editingEngagementService) {
              await updateEngagementService(editingEngagementService.id, {
                service_id: data.service_id,
                name: data.name,
                price: data.price,
                billing_type: data.billing_type,
                currency: data.currency,
                notes: data.notes,
                selected_tier: data.selected_tier,
                creative_boost_min_credits: data.creative_boost_min_credits,
                creative_boost_max_credits: data.creative_boost_max_credits,
                creative_boost_price_per_credit: data.creative_boost_price_per_credit,
                creative_boost_fixed_billing: data.creative_boost_fixed_billing,
                creative_boost_reward_per_credit_banner: data.creative_boost_reward_per_credit_banner,
                creative_boost_reward_per_credit_video: data.creative_boost_reward_per_credit_video,
                upsold_by_id: data.upsold_by_id,
                upsell_commission_percent: data.upsell_commission_percent,
              });
              return;
            }

            const newService = await addEngagementService(data);
            const selectedService = services.find((service) => service.id === data.service_id);
            if (!selectedService) throw new Error('Vybraná služba nebyla nalezena');
            
            // If Creative Boost service, automatically create record in Creative Boost tab
            if (selectedService.code === CREATIVE_BOOST_SERVICE_CODE) {
              if (data.creative_boost_max_credits === null || data.creative_boost_price_per_credit === null) {
                throw new Error('Creative Boost vyžaduje počet kreditů a cenu za kredit');
              }
              const engagement = engagements.find(e => e.id === data.engagement_id);
              if (!engagement) throw new Error('Zakázka pro Creative Boost nebyla nalezena');
              await addClientToMonth(engagement.client_id, currentYear, currentMonth, {
                minCredits: data.creative_boost_min_credits ?? undefined,
                maxCredits: data.creative_boost_max_credits,
                pricePerCredit: data.creative_boost_price_per_credit,
                engagementServiceId: newService.id,
                engagementId: engagement.id,
                status: 'active',
              });
            }
            
            toast.success('Služba přidána');
          }}
        />
          );
        })()
      )}

      {invoiceDialogEngagement && (
        <CreateInvoiceFromEngagementDialog
          open={isInvoiceDialogOpen}
          onOpenChange={(open) => {
            if (!isCreatingInvoice) {
              setIsInvoiceDialogOpen(open);
              if (!open) setInvoiceDialogEngagement(null);
            }
          }}
          engagement={invoiceDialogEngagement}
          client={getClientById(invoiceDialogEngagement.client_id)!}
          engagementServices={getEngagementServicesByEngagementId(invoiceDialogEngagement.id)}
          isLoading={isCreatingInvoice}
          onCreateInvoice={async (data) => {
            setIsCreatingInvoice(true);
            try {
              const client = getClientById(invoiceDialogEngagement.client_id);
              if (!client) throw new Error('Client not found');
              if (!client.fakturoid_subject_id) {
                throw new Error(`Klient "${client.brand_name || client.name}" nemá propojení s Fakturoid (fakturoid_subject_id).`);
              }

              // Calculate period dates
              const periodStart = new Date(data.year, data.month - 1, 1);
              const periodEnd = new Date(data.year, data.month, 0); // Last day of month
              const totalDaysInMonth = periodEnd.getDate();

              // Build invoice data
              const invoice = {
                engagement_id: invoiceDialogEngagement.id,
                engagement_name: invoiceDialogEngagement.name,
                client_id: invoiceDialogEngagement.client_id,
                client_name: client.brand_name,
                year: data.year,
                month: data.month,
                fakturoid_id: null,
                fakturoid_url: null,
                line_items: [],
                total_amount: data.items.reduce((sum, item) => sum + item.amount, 0),
                status: 'draft',
                paid_at: null,
                currency: (() => {
                  if (!invoiceDialogEngagement.currency) {
                    throw new Error(`Missing engagement currency for ${invoiceDialogEngagement.id}`);
                  }
                  return invoiceDialogEngagement.currency;
                })(),
                issued_at: new Date().toISOString(),
                issued_by: null,
              };

              // Build line items - use 'engagement' source (valid enum value)
              const lineItems = data.items.map(item => ({
                source: 'engagement' as const,
                engagement_id: invoiceDialogEngagement.id,
                extra_work_id: null,
                engagement_service_id: item.service_id,
                source_description: item.description,
                source_amount: item.amount,
                period_start: format(periodStart, 'yyyy-MM-dd'),
                period_end: format(periodEnd, 'yyyy-MM-dd'),
                prorated_days: totalDaysInMonth,
                total_days_in_month: totalDaysInMonth,
                prorated_amount: item.amount,
                line_description: item.description,
                unit_price: item.amount,
                quantity: 1,
                unit_name: item.hours ? 'hod' : 'ks',
                adjustment_amount: 0,
                adjustment_reason: '',
                final_amount: item.amount,
                is_approved: false,
                note: '',
                hours: item.hours,
                hourly_rate: item.hourly_rate,
                currency: item.currency,
                is_reverse_charge: item.is_reverse_charge,
                vat_rate: 21,
              }));

              const createdInvoice = await withPromiseTimeout(
                createInvoiceWithLineItems(invoice, lineItems, [], []),
                30000,
                'createInvoiceWithLineItems',
              );

              const { data: fakturoidResult, error: fakturoidError } = await invokeWithTimeout<{
                success?: boolean;
                error?: string;
              }>(
                'fakturoid-create-invoice',
                { body: { invoice_id: createdInvoice.id } },
                30000,
              );

              if (fakturoidError || fakturoidResult?.error || !fakturoidResult?.success) {
                const errorDetail = fakturoidResult?.error || fakturoidError?.message || 'Neznámá chyba';
                const rollbackResponse = await withPromiseTimeout(
                  (async () =>
                    await supabase
                      .from('issued_invoices')
                      .delete()
                      .eq('id', createdInvoice.id)
                      .select('id'))(),
                  30000,
                  'localInvoiceRollback',
                );
                const rollbackError = rollbackResponse.error;
                const rollbackSucceeded = !rollbackError && Array.isArray(rollbackResponse.data) && rollbackResponse.data.length > 0;
                if (!rollbackSucceeded) {
                  throw new Error(`Fakturoid export selhal (${errorDetail}) a rollback selhal. Kontaktujte administrátora.`);
                }
                throw new Error(`Fakturoid export selhal (${errorDetail}). Lokální vystavení bylo vráceno zpět.`);
              }

              // Refresh issued_invoices to show the new fakturoid_url
              await queryClient.invalidateQueries({ queryKey: ['issued_invoices'] });
              toast.success(`Faktura za ${data.month}/${data.year} byla vytvořena a odeslána do Fakturoid`);
              setIsInvoiceDialogOpen(false);
              setInvoiceDialogEngagement(null);
            } catch (error) {
              console.error('Failed to create invoice:', error);
              toast.error(getErrorMessage(error, 'Nepodařilo se vytvořit fakturu'));
            } finally {
              setIsCreatingInvoice(false);
            }
          }}
        />
      )}

      {/* End Engagement Dialog */}
      <EndEngagementDialog
        engagement={engagementToEnd}
        open={endEngagementDialogOpen}
        onOpenChange={(open) => {
          setEndEngagementDialogOpen(open);
          if (!open) setEngagementToEnd(null);
        }}
        onConfirm={async (data) => {
          if (engagementToEnd) {
            try {
              // Save end_date and termination fields
              await updateEngagement(engagementToEnd.id, {
                end_date: data.end_date,
                termination_reason: data.termination_reason,
                termination_initiated_by: data.termination_initiated_by,
                termination_notes: data.termination_notes || null,
              });
              toast.success(`Spolupráce bude ukončena k ${format(parseISO(data.end_date), 'd. MMMM yyyy', { locale: cs })}`);
              setEngagementToEnd(null);
            } catch (error) {
              console.error('Failed to end engagement:', error);
              toast.error(getErrorMessage(error, 'Nepodařilo se ukončit spolupráci'));
            }
          }
        }}
      />

      {/* Engagement History Dialog */}
      {historyEngagement && (
        <EngagementHistoryDialog
          open={isHistoryOpen}
          onOpenChange={setIsHistoryOpen}
          engagementId={historyEngagement.id}
          engagementName={historyEngagement.name}
        />
      )}

      {/* Engagement Deletion Confirmation Dialog */}
      <AlertDialog open={!!engagementToDelete} onOpenChange={(open) => !open && setEngagementToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Smazat zakázku?</AlertDialogTitle>
            <AlertDialogDescription>
              Opravdu chcete odstranit zakázku <span className="font-medium">{engagementToDelete?.name}</span>?
              Tato akce je nevratná.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Zrušit</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteEngagement}
            >
              Smazat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Service Deletion Confirmation Dialog */}
      <AlertDialog open={!!serviceToDelete} onOpenChange={(open) => !open && setServiceToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Smazat službu?</AlertDialogTitle>
            <AlertDialogDescription>
              Opravdu chcete odebrat službu <span className="font-medium">{serviceToDelete?.name}</span>?
              Tato akce je nevratná.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Zrušit</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteService}
            >
              Smazat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Assignment Dialog */}
      {editingAssignment && (
        (() => {
          const hasCreativeBoostServiceOnEngagement = getEngagementServicesByEngagementId(editingAssignment.engagement_id).some(
            (engagementService) => isCreativeBoostEngagementService(engagementService, CREATIVE_BOOST_SERVICE_ID)
          );
          const hasCreativeBoostOnAssignmentService =
            !!editingAssignment.engagement_service_id &&
            engagementServices.some(
              (engagementService) =>
                engagementService.id === editingAssignment.engagement_service_id &&
                isCreativeBoostEngagementService(engagementService, CREATIVE_BOOST_SERVICE_ID)
            );
          const isCreativeBoostService = hasCreativeBoostOnAssignmentService || hasCreativeBoostServiceOnEngagement;
          const creativeBoostService =
            (editingAssignment.engagement_service_id
              ? engagementServices.find(
                  (engagementService) =>
                    engagementService.id === editingAssignment.engagement_service_id &&
                    isCreativeBoostEngagementService(engagementService, CREATIVE_BOOST_SERVICE_ID)
                )
              : null) ??
            getEngagementServicesByEngagementId(editingAssignment.engagement_id).find(
              (engagementService) => isCreativeBoostEngagementService(engagementService, CREATIVE_BOOST_SERVICE_ID)
            ) ??
            null;
          return (
        <EditAssignmentDialog
          open={isEditAssignmentDialogOpen}
          onOpenChange={(open) => {
            setIsEditAssignmentDialogOpen(open);
            if (!open) setEditingAssignment(null);
          }}
          assignment={editingAssignment}
          colleagueName={getColleagueById(editingAssignment.colleague_id)?.full_name || ''}
          isCreativeBoostService={isCreativeBoostService}
          creativeBoostServiceId={creativeBoostService?.id ?? null}
          creativeBoostRewardBanner={creativeBoostService?.creative_boost_reward_per_credit_banner ?? null}
          creativeBoostRewardVideo={creativeBoostService?.creative_boost_reward_per_credit_video ?? null}
          onSave={async (data) => {
            const { _creativeBoostServiceRewards, ...assignmentData } = data;
            try {
              const { error } = await supabase.rpc('update_assignment_with_cb_rewards' as never, {
                p_assignment_id: editingAssignment.id,
                p_role_on_engagement: assignmentData.role_on_engagement,
                p_cost_model: assignmentData.cost_model,
                p_hourly_cost: assignmentData.hourly_cost,
                p_monthly_cost: assignmentData.monthly_cost,
                p_percentage_of_revenue: assignmentData.percentage_of_revenue,
                p_reward_per_credit: assignmentData.reward_per_credit,
                p_reward_per_credit_banner: assignmentData.reward_per_credit_banner,
                p_reward_per_credit_video: assignmentData.reward_per_credit_video,
                p_notes: editingAssignment.notes,
                p_cb_service_id: _creativeBoostServiceRewards?.engagementServiceId ?? null,
                p_cb_reward_banner: _creativeBoostServiceRewards?.bannerRewardPerCredit ?? null,
                p_cb_reward_video: _creativeBoostServiceRewards?.videoRewardPerCredit ?? null,
              } as never);
              if (error) throw error;
              await invalidateAssignmentAndServiceQueries();
              toast.success('Odměna kolegy byla upravena');
              setEditingAssignment(null);
            } catch (error) {
              console.error('Failed to save assignment rewards:', error);
              toast.error(getErrorMessage(error, 'Nepodařilo se uložit odměnu'));
            }
          }}
        />
          );
        })()
      )}
    </div>
  );
}

export default function Engagements() {
  return <EngagementsContent />;
}
