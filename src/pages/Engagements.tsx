import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO, isSameMonth } from 'date-fns';
import { cs } from 'date-fns/locale';
import { Search, Plus, MoreHorizontal, ChevronDown, ChevronUp, Users, Calendar, UserPlus, Trash2, Pencil, User, Check, X, Briefcase, ExternalLink, Monitor, FileText, ChevronLeft, ChevronRight, CalendarOff, AlertTriangle, Receipt, Clock, Loader2 } from 'lucide-react';
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
import { AssignmentForm } from '@/components/forms/AssignmentForm';
import { AddEngagementServiceDialog } from '@/components/forms/AddEngagementServiceDialog';
import { CreativeBoostCreditOverview } from '@/components/engagements/CreativeBoostCreditOverview';
import { CreateInvoiceFromEngagementDialog } from '@/components/engagements/CreateInvoiceFromEngagementDialog';
import { EngagementInvoicingSection } from '@/components/engagements/EngagementInvoicingStatus';
import { EndEngagementDialog } from '@/components/engagements/EndEngagementDialog';
import { EngagementHistoryDialog } from '@/components/engagements/EngagementHistoryDialog';
import { EditAssignmentDialog } from '@/components/engagements/EditAssignmentDialog';
import { serviceTierConfigs } from '@/constants/services';

// Default reward per credit when not configured in assignment
const DEFAULT_REWARD_PER_CREDIT = 80;
import type { EngagementStatus, EngagementType, Engagement, EngagementAssignment, EngagementService, ServiceTier } from '@/types/crm';
import { ADVERTISING_PLATFORMS } from '@/types/crm';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/sonner';
import { normalizeUrlProtocol } from '@/lib/validation';

// Dynamic lookup for Creative Boost service ID
const CREATIVE_BOOST_SERVICE_NAME = 'Creative Boost';

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
    const cbService = services.find(s => s.name === CREATIVE_BOOST_SERVICE_NAME);
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
  const [editingServicePrice, setEditingServicePrice] = useState<string | null>(null);
  const [tempServicePrice, setTempServicePrice] = useState<string>('');
  
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
    return engagements.filter(engagement => {
      const client = getClientById(engagement.client_id);
      const matchesSearch = 
        engagement.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client?.brand_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client?.name.toLowerCase().includes(searchQuery.toLowerCase());
      
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

  const handleAssignmentSubmit = async (data: Omit<EngagementAssignment, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      await addAssignment(data);
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
      <div className="p-6 flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Načítám zakázky...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
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
          const marginPercent = canSeeFinancials ? getLatestMargin(engagement.id) : null;
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
            .filter(s => s.is_active)
            .reduce((sum, s) => {
              // For Creative Boost, calculate from USED credits for the FILTERED month only
              if (CREATIVE_BOOST_SERVICE_ID && s.service_id === CREATIVE_BOOST_SERVICE_ID) {
                const cbSummary = getClientMonthSummaryByEngagementServiceId(s.id, filterYear, filterMonth);
                // If there's summary data for this month, use estimated invoice
                if (cbSummary) {
                  return sum + cbSummary.estimatedInvoice;
                }
                // If no data for this month, return 0 (not fallback to max)
                return sum;
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
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleExpand(engagement.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary font-semibold text-sm shrink-0">
                    {client?.brand_name.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-sm">{engagement.name}</span>
                    <p className="text-xs text-muted-foreground truncate">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/clients?highlight=${engagement.client_id}`);
                        }}
                        className="text-primary hover:underline"
                      >
                        {client?.brand_name}
                      </button>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
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
                  {canSeeFinancials && (
                    <span className="text-sm font-semibold whitespace-nowrap hidden sm:flex items-center gap-1">
                      {displayAmount.toLocaleString()} {engagement.currency}
                      {engagement.type === 'retainer' && '/měs'}
                      {engagementServicesList.length > 1 && (
                        <span className="text-xs font-normal text-muted-foreground">
                          ({engagementServicesList.filter(s => s.is_active).length} pol.)
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
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
                                {client?.brand_name}
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
                      // Only show active services
                      const engServices = allEngServices.filter(s => s.is_active);
                      const totalServicesPrice = engServices.reduce((sum, s) => sum + s.price, 0);
                      return (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm flex items-center gap-2">
                              <Briefcase className="h-4 w-4 text-muted-foreground" />
                              Služby ({engServices.length})
                              {canSeeFinancials && engServices.length > 0 && (
                                <span className="text-xs font-normal text-muted-foreground">
                                  – {totalServicesPrice.toLocaleString()} CZK
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
                                const isEditing = editingServicePrice === engService.id;
                                const isCreativeBoost = CREATIVE_BOOST_SERVICE_ID !== null && engService.service_id === CREATIVE_BOOST_SERVICE_ID;
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
                                      canSeeFinancials={canSeeFinancials}
                                      assignedColleagueAssignmentId={cbAssignment?.id}
                                      onUpdateSettings={(updates) => {
                                        updateEngagementService(engService.id, { 
                                          creative_boost_max_credits: updates.maxCredits,
                                          creative_boost_price_per_credit: updates.pricePerCredit,
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
                                    className="flex items-center justify-between p-2 rounded-lg bg-background border"
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                                        {service?.code?.charAt(0) || engService.name.charAt(0)}
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <p className="text-sm font-medium">{engService.name}</p>
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
                                                  const tierPricing = service?.tier_pricing?.find(p => p.tier === config.tier);
                                                  const priceLabel = tierPricing?.price 
                                                    ? `${tierPricing.price.toLocaleString()} Kč`
                                                    : 'Individuální';
                                                  return (
                                                    <DropdownMenuItem
                                                      key={config.tier}
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        const newPrice = tierPricing?.price || engService.price;
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
                                    <div className="flex items-center gap-2">
                                      {canSeeFinancials && (
                                        isEditing ? (
                                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                            <Input
                                              type="number"
                                              value={tempServicePrice}
                                              onChange={(e) => setTempServicePrice(e.target.value)}
                                              className="h-6 w-24 text-xs"
                                              placeholder="0"
                                              autoFocus
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                  const price = parseFloat(tempServicePrice) || 0;
                                                  updateEngagementService(engService.id, { price });
                                                  setEditingServicePrice(null);
                                                  toast.success('Cena služby aktualizována');
                                                } else if (e.key === 'Escape') {
                                                  setEditingServicePrice(null);
                                                }
                                              }}
                                            />
                                            <span className="text-xs text-muted-foreground">{engService.currency}</span>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-5 w-5 text-status-active"
                                              onClick={() => {
                                                const price = parseFloat(tempServicePrice) || 0;
                                                updateEngagementService(engService.id, { price });
                                                setEditingServicePrice(null);
                                                toast.success('Cena služby aktualizována');
                                              }}
                                            >
                                              <Check className="h-3 w-3" />
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-5 w-5"
                                              onClick={() => setEditingServicePrice(null)}
                                            >
                                              <X className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        ) : (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setEditingServicePrice(engService.id);
                                              setTempServicePrice(String(engService.price || 0));
                                            }}
                                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors group"
                                            title="Klikněte pro úpravu"
                                          >
                                            <span>
                                              {engService.price.toLocaleString()} {engService.currency}
                                              {engService.billing_type === 'monthly' && '/měs'}
                                            </span>
                                            <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                          </button>
                                        )
                                      )}
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
                      <div className="flex items-center justify-between">
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
                                  {canSeeFinancials && (
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
                                          // Check if this is a Creative Boost assignment with per-credit reward
                                          const perCreditReward = assignment.reward_per_credit ?? DEFAULT_REWARD_PER_CREDIT;
                                          const hasPerCreditReward = assignment.reward_per_credit !== null || (CREATIVE_BOOST_SERVICE_ID && assignment.engagement_service_id && engagementServices.find(es => es.id === assignment.engagement_service_id && es.service_id === CREATIVE_BOOST_SERVICE_ID));

                                          if (hasPerCreditReward && assignment.engagement_service_id) {
                                            const service = engagementServices.find(es => es.id === assignment.engagement_service_id);
                                            if (CREATIVE_BOOST_SERVICE_ID && service?.service_id === CREATIVE_BOOST_SERVICE_ID) {
                                              return `${perCreditReward} Kč/kredit`;
                                            }
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

                    {/* Profitability Section */}
                    {canSeeFinancials && (() => {
                      const engServices = getEngagementServicesByEngagementId(engagement.id);
                      const engAssignments = getAssignmentsByEngagementId(engagement.id).filter(a => !a.end_date);

                      // Calculate total revenue from services
                      const totalRevenue = engServices
                        .filter(s => s.is_active)
                        .reduce((sum, s) => {
                          // For Creative Boost, use estimated invoice from filtered month
                          if (CREATIVE_BOOST_SERVICE_ID && s.service_id === CREATIVE_BOOST_SERVICE_ID) {
                            const cbSummary = getClientMonthSummaryByEngagementServiceId(s.id, filterYear, filterMonth);
                            if (cbSummary) {
                              return sum + cbSummary.estimatedInvoice;
                            }
                            // Fallback to max credits * price per credit
                            const maxCredits = s.creative_boost_max_credits || 0;
                            const pricePerCredit = s.creative_boost_price_per_credit || 400;
                            return sum + (maxCredits * pricePerCredit);
                          }
                          return sum + s.price;
                        }, 0);

                      // Calculate total colleague costs from assignments
                      const totalColleagueCosts = engAssignments.reduce((sum, a) => sum + (a.monthly_cost || 0), 0);

                      // Calculate profit and margin
                      const profit = totalRevenue - totalColleagueCosts;
                      const profitMarginPercent = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

                      // Determine color based on margin
                      const marginColor = profitMarginPercent >= 30
                        ? 'text-status-active'
                        : profitMarginPercent >= 15
                          ? 'text-chart-4'
                          : 'text-destructive';

                      return (
                        <div className="space-y-3">
                          <h4 className="font-medium text-sm flex items-center gap-2">
                            📊 Profitabilita zakázky
                          </h4>
                          <div className="grid grid-cols-2 gap-3">
                            {/* Revenue card */}
                            <div className="p-3 rounded-lg bg-status-active/5 border border-status-active/20">
                              <div className="text-xs text-muted-foreground mb-1">💰 Příjmy</div>
                              <div className="text-lg font-bold text-status-active">
                                {totalRevenue.toLocaleString()} {engagement.currency}
                              </div>
                              <div className="text-[10px] text-muted-foreground">
                                z {engServices.filter(s => s.is_active).length} služeb
                              </div>
                            </div>

                            {/* Costs card */}
                            <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                              <div className="text-xs text-muted-foreground mb-1">🎨 Náklady na kolegy</div>
                              <div className="text-lg font-bold text-destructive">
                                {totalColleagueCosts.toLocaleString()} {engagement.currency}
                              </div>
                              <div className="text-[10px] text-muted-foreground">
                                {engAssignments.length} přiřazených kolegů
                              </div>
                            </div>
                          </div>

                          {/* Profit summary */}
                          <div className="p-3 rounded-lg bg-muted/50 border">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-xs text-muted-foreground mb-1">📈 Čistý zisk</div>
                                <div className={cn("text-xl font-bold", marginColor)}>
                                  {profit.toLocaleString()} {engagement.currency}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs text-muted-foreground mb-1">Marže</div>
                                <div className={cn("text-xl font-bold", marginColor)}>
                                  {profitMarginPercent.toFixed(1)}%
                                </div>
                              </div>
                            </div>
                            {profitMarginPercent < 15 && (
                              <p className="text-xs text-destructive mt-2 flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Nízká marže - zvažte úpravu cen nebo snížení nákladů
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })()}

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
                                    safeUpdateEngagement(engagement.id, { platforms: newPlatforms }, 'Platformy aktualizovány');
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
            return (
              <AssignmentForm
                engagementId={assignmentEngagementId}
                engagementStartDate={eng.start_date}
                engagementEndDate={eng.end_date}
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
        <AddEngagementServiceDialog
          open={isServiceDialogOpen}
          onOpenChange={(open) => {
            setIsServiceDialogOpen(open);
            if (!open) setServiceEngagementId(null);
          }}
          engagementId={serviceEngagementId}
          services={services}
          onSubmit={async (data) => {
            const newService = await addEngagementService(data);
            
            // If Creative Boost service, automatically create record in Creative Boost tab
            if (CREATIVE_BOOST_SERVICE_ID && data.service_id === CREATIVE_BOOST_SERVICE_ID) {
              const engagement = engagements.find(e => e.id === data.engagement_id);
              if (engagement) {
                addClientToMonth(engagement.client_id, currentYear, currentMonth, {
                  minCredits: data.creative_boost_min_credits ?? 30,
                  maxCredits: data.creative_boost_max_credits ?? 50,
                  pricePerCredit: data.creative_boost_price_per_credit ?? 1500,
                  engagementServiceId: newService.id,
                  engagementId: engagement.id,
                  status: 'active',
                });
              }
            }
            
            toast.success('Služba přidána');
          }}
        />
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
          engagementServices={getEngagementServicesByEngagementId(invoiceDialogEngagement.id).filter(s => s.is_active)}
          isLoading={isCreatingInvoice}
          onCreateInvoice={async (data) => {
            setIsCreatingInvoice(true);
            try {
              const client = getClientById(invoiceDialogEngagement.client_id);
              if (!client) throw new Error('Client not found');

              // Calculate period dates
              const periodStart = new Date(data.year, data.month - 1, 1);
              const periodEnd = new Date(data.year, data.month, 0); // Last day of month
              const totalDaysInMonth = periodEnd.getDate();

              // Build invoice data (without status - not a DB column)
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
                currency: data.items[0]?.currency || invoiceDialogEngagement.currency || 'CZK',
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
                period_start: periodStart.toISOString().split('T')[0],
                period_end: periodEnd.toISOString().split('T')[0],
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
              }));

              const createdInvoice = await createInvoiceWithLineItems(invoice, lineItems, [], []);

              // Now sync to Fakturoid
              let fakturoidSuccess = false;
              let fakturoidErrorMessage: string | null = null;

              try {
                const { data: fakturoidResult, error: fakturoidError } = await supabase.functions.invoke(
                  'fakturoid-create-invoice',
                  { body: { invoice_id: createdInvoice.id } }
                );

                if (fakturoidError) {
                  console.warn('Fakturoid sync failed:', fakturoidError);
                  fakturoidErrorMessage = fakturoidError.message || 'Neznámá chyba';
                } else if (fakturoidResult?.error) {
                  console.warn('Fakturoid sync failed:', fakturoidResult.error);
                  fakturoidErrorMessage = fakturoidResult.error;
                } else if (fakturoidResult?.success) {
                  fakturoidSuccess = true;
                }
              } catch (fakturoidErr) {
                console.warn('Fakturoid error:', fakturoidErr);
                fakturoidErrorMessage = 'Nepodařilo se spojit s Fakturoid';
              }

              if (fakturoidSuccess) {
                // Refresh issued_invoices to show the new fakturoid_url
                await queryClient.invalidateQueries({ queryKey: ['issued_invoices'] });
                toast.success(`Faktura za ${data.month}/${data.year} byla vytvořena a odeslána do Fakturoid`);
              } else {
                // Show specific error message
                const errorDetail = fakturoidErrorMessage || 'Neznámá chyba';
                toast.warning(`Faktura vytvořena, ale Fakturoid selhal: ${errorDetail}`);
              }

              setIsInvoiceDialogOpen(false);
              setInvoiceDialogEngagement(null);
            } catch (error) {
              console.error('Failed to create invoice:', error);
              toast.error('Nepodařilo se vytvořit fakturu');
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
        onConfirm={(data) => {
          if (engagementToEnd) {
            // Save end_date and termination fields
            updateEngagement(engagementToEnd.id, {
              end_date: data.end_date,
              termination_reason: data.termination_reason,
              termination_initiated_by: data.termination_initiated_by,
              termination_notes: data.termination_notes || null,
            });
            toast.success(`Spolupráce bude ukončena k ${format(parseISO(data.end_date), 'd. MMMM yyyy', { locale: cs })}`);
            setEngagementToEnd(null);
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
        <EditAssignmentDialog
          open={isEditAssignmentDialogOpen}
          onOpenChange={(open) => {
            setIsEditAssignmentDialogOpen(open);
            if (!open) setEditingAssignment(null);
          }}
          assignment={editingAssignment}
          colleagueName={getColleagueById(editingAssignment.colleague_id)?.full_name || ''}
          isCreativeBoostService={
            CREATIVE_BOOST_SERVICE_ID && editingAssignment.engagement_service_id
              ? engagementServices.find(es => es.id === editingAssignment.engagement_service_id)?.service_id === CREATIVE_BOOST_SERVICE_ID
              : false
          }
          onSave={(data) => {
            updateAssignment(editingAssignment.id, data);
            toast.success('Odměna kolegy byla upravena');
            setEditingAssignment(null);
          }}
        />
      )}
    </div>
  );
}

export default function Engagements() {
  return <EngagementsContent />;
}
