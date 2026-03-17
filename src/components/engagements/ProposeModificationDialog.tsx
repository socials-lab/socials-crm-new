import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, getDaysInMonth } from 'date-fns';
import { cs } from 'date-fns/locale';
import { CalendarIcon, Info, Plus, FileText } from 'lucide-react';
import { useCRMData } from '@/hooks/useCRMData';
import { useModificationRequests } from '@/hooks/useModificationRequests';
import { useAuth } from '@/hooks/useAuth';
import type { ModificationRequestType, ServiceTier } from '@/types/crm';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { SERVICE_DETAILS } from '@/constants/serviceDetails';
import { PricingImpactSection } from '@/components/engagements/PricingImpactSection';
import type { PricingSnapshot } from '@/utils/pricingEngine';
import { getServiceRewardRecommendation, getRewardsFromServiceConfig } from '@/constants/serviceRewards';

interface ProposeModificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingRequest?: import('@/data/modificationRequestsMockData').StoredModificationRequest | null;
}

const REQUEST_TYPE_LABELS: Record<ModificationRequestType, string> = {
  add_service: 'Přidání nové služby',
  update_service_price: 'Úprava služby (cena + odměny)',
  deactivate_service: 'Deaktivace služby',
  add_assignment: 'Přiřazení kolegy',
  update_assignment: 'Změna odměny kolegy',
};

// Types visible in the dropdown (update_assignment is merged into update_service_price)
const VISIBLE_REQUEST_TYPES: ModificationRequestType[] = [
  'add_service',
  'update_service_price',
  'deactivate_service',
  'add_assignment',
];

export function ProposeModificationDialog({ open, onOpenChange, editingRequest }: ProposeModificationDialogProps) {
  const { engagements, clients, services, colleagues, engagementServices, assignments, getEngagementServicesByEngagementId, getAssignmentsByEngagementId } = useCRMData();
  const { createRequest, updateRequest, isCreating, isUpdating } = useModificationRequests();
  const { user } = useAuth();
  const isEditMode = !!editingRequest;
  
  // Find colleague record for current user
  const currentUserColleague = colleagues.find(c => c.profile_id === user?.id);

  // Form state
  const [selectedEngagementId, setSelectedEngagementId] = useState<string>('');
  const [requestType, setRequestType] = useState<ModificationRequestType | ''>('');
  const [requestTypeConfirmed, setRequestTypeConfirmed] = useState(false);
  const [effectiveFrom, setEffectiveFrom] = useState<Date | undefined>(new Date());
  const [upsoldById, setUpsoldById] = useState<string>('none');
  const [note, setNote] = useState('');

  // Service-related fields
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [serviceName, setServiceName] = useState('');
  const [servicePrice, setServicePrice] = useState<number>(0);
  const [serviceCurrency, setServiceCurrency] = useState('CZK');
  const [serviceBillingType, setServiceBillingType] = useState<'monthly' | 'one_off'>('monthly');
  const [selectedTier, setSelectedTier] = useState<ServiceTier | 'none'>('none');

  // Creative Boost specific fields
  // Creative Boost specific fields
  const [cbMaxCredits, setCbMaxCredits] = useState<number>(30);
  const [cbPricePerCredit, setCbPricePerCredit] = useState<number>(400);
  const [cbColleagueReward, setCbColleagueReward] = useState<number>(150);
  const [cbEditorReward, setCbEditorReward] = useState<number>(100);

  // AI SEO specific fields
  const [aiSeoColleagueName, setAiSeoColleagueName] = useState<string>('Martin Tomčík');
  const [aiSeoHourlyRate, setAiSeoHourlyRate] = useState<number>(600);
  const [aiSeoHours, setAiSeoHours] = useState<number>(10);

  // For update_service_price (merged with update_assignment)
  const [selectedEngagementServiceId, setSelectedEngagementServiceId] = useState<string>('');
  const [newPrice, setNewPrice] = useState<number>(0);
  // Editable assignments for the selected service (used in update_service_price)
  const [serviceAssignmentEdits, setServiceAssignmentEdits] = useState<Array<{
    assignment_id: string;
    colleague_name: string;
    role: string;
    cost_model: 'hourly' | 'fixed_monthly' | 'percentage';
    old_value: number;
    new_value: number;
  }>>([]);

  // Assignment-related fields
  const [selectedColleagueId, setSelectedColleagueId] = useState<string>('');
  const [roleOnEngagement, setRoleOnEngagement] = useState('');
  const [costModel, setCostModel] = useState<'hourly' | 'fixed_monthly' | 'percentage'>('fixed_monthly');
  const [hourlyCost, setHourlyCost] = useState<number>(0);
  const [monthlyCost, setMonthlyCost] = useState<number>(0);
  const [percentageOfRevenue, setPercentageOfRevenue] = useState<number>(0);
  const [assignmentServiceId, setAssignmentServiceId] = useState<string>('');

  // For update_assignment / remove_assignment
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('');

  // Service description fields for client-facing offer
  const [serviceDescription, setServiceDescription] = useState('');
  const [serviceDeliverables, setServiceDeliverables] = useState('');

  // Pricing engine state
  const [pricingSnapshot, setPricingSnapshot] = useState<PricingSnapshot | null>(null);
  const [pricingInternalCost, setPricingInternalCost] = useState<number>(0);
  const [requiresAdminApproval, setRequiresAdminApproval] = useState(false);

  // Detect Creative Boost & AI SEO
  const CREATIVE_BOOST_CODE = 'CREATIVE_BOOST';
  const AI_SEO_CODE = 'AI_SEO';
  const selectedService = services.find(s => s.id === selectedServiceId);
  const isCreativeBoost = selectedService?.code === CREATIVE_BOOST_CODE;
  const isAiSeo = selectedService?.code === AI_SEO_CODE;
  const isCoreService = selectedService?.service_type === 'core' && !isCreativeBoost;

  // Get engagement-specific services and assignments
  const currentEngagementServices = selectedEngagementId 
    ? getEngagementServicesByEngagementId(selectedEngagementId)
    : [];
  const currentAssignments = selectedEngagementId
    ? getAssignmentsByEngagementId(selectedEngagementId)
    : [];

  // Calculate prorated amount
  const calculateProratedAmount = () => {
    if (!effectiveFrom) return null;
    
    // Get the effective monthly price
    const monthlyPrice = isCreativeBoost 
      ? cbMaxCredits * cbPricePerCredit 
      : servicePrice;
    
    if (monthlyPrice <= 0 || (!isCreativeBoost && serviceBillingType !== 'monthly')) return null;
    
    const daysInMonth = getDaysInMonth(effectiveFrom);
    const startDay = effectiveFrom.getDate();
    const remainingDays = daysInMonth - startDay + 1;
    const proratedAmount = (monthlyPrice / daysInMonth) * remainingDays;
    
    return {
      fullAmount: monthlyPrice,
      proratedAmount: Math.round(proratedAmount),
      remainingDays,
      daysInMonth,
    };
  };

  const prorationInfo = calculateProratedAmount();

  // Pre-fill from editingRequest when opening in edit mode
  useEffect(() => {
    if (open && editingRequest) {
      setSelectedEngagementId(editingRequest.engagement_id);
      setRequestType(editingRequest.request_type);
      setRequestTypeConfirmed(true);
      setEffectiveFrom(editingRequest.effective_from ? new Date(editingRequest.effective_from) : undefined);
      setUpsoldById(editingRequest.upsold_by_id || 'none');
      setNote(editingRequest.note || '');
      setPricingSnapshot(editingRequest.pricing_snapshot || null);

      const changes = editingRequest.proposed_changes as any;

      if (editingRequest.request_type === 'add_service') {
        setSelectedServiceId(changes.service_id || 'custom');
        setServiceName(changes.name || '');
        setServicePrice(changes.price || 0);
        setServiceCurrency(changes.currency || 'CZK');
        setServiceBillingType(changes.billing_type || 'monthly');
        setSelectedTier(changes.selected_tier || 'none');
        setServiceDescription(changes.description || '');
        setServiceDeliverables(changes.deliverables?.join('\n') || '');
        if (changes.creative_boost_max_credits) {
          setCbMaxCredits(changes.creative_boost_max_credits);
          setCbPricePerCredit(changes.creative_boost_price_per_credit || 400);
          setCbColleagueReward(changes.creative_boost_reward_per_credit || 150);
          setCbEditorReward(changes.creative_boost_editor_reward_per_credit || 100);
        }
      } else if (editingRequest.request_type === 'update_service_price') {
        setSelectedEngagementServiceId(changes.engagement_service_id || editingRequest.engagement_service_id || '');
        setNewPrice(changes.new_price || 0);
      } else if (editingRequest.request_type === 'deactivate_service') {
        setSelectedEngagementServiceId(changes.engagement_service_id || editingRequest.engagement_service_id || '');
      } else if (editingRequest.request_type === 'add_assignment') {
        setSelectedColleagueId(changes.colleague_id || '');
        setRoleOnEngagement(changes.role_on_engagement || '');
        setCostModel(changes.cost_model || 'fixed_monthly');
        setHourlyCost(changes.hourly_cost || 0);
        setMonthlyCost(changes.monthly_cost || 0);
        setPercentageOfRevenue(changes.percentage_of_revenue || 0);
      } else if (editingRequest.request_type === 'update_assignment' || editingRequest.request_type === 'remove_assignment') {
        setSelectedAssignmentId(changes.engagement_assignment_id || editingRequest.engagement_assignment_id || '');
        if (editingRequest.request_type === 'update_assignment') {
          setCostModel(changes.cost_model || 'fixed_monthly');
          setHourlyCost(changes.hourly_cost || 0);
          setMonthlyCost(changes.monthly_cost || 0);
          setPercentageOfRevenue(changes.percentage_of_revenue || 0);
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingRequest?.id]);

  // Reset form when dialog closes (only when not in edit mode, or always on close)
  useEffect(() => {
    if (!open) {
      setSelectedEngagementId('');
      setRequestType('');
      setRequestTypeConfirmed(false);
      setEffectiveFrom(new Date());
      setUpsoldById('none');
      setNote('');
      setSelectedServiceId('');
      setServiceName('');
      setServicePrice(0);
      setServiceCurrency('CZK');
      setServiceBillingType('monthly');
      setSelectedTier('none');
      setCbMaxCredits(30);
      setCbPricePerCredit(400);
      setCbColleagueReward(150);
      setCbEditorReward(100);
      setAiSeoColleagueName('Martin Tomčík');
      setAiSeoHourlyRate(600);
      setAiSeoHours(10);
      setSelectedEngagementServiceId('');
      setServiceAssignmentEdits([]);
      setNewPrice(0);
      setSelectedColleagueId('');
      setRoleOnEngagement('');
      setCostModel('fixed_monthly');
      setHourlyCost(0);
      setMonthlyCost(0);
      setPercentageOfRevenue(0);
      setSelectedAssignmentId('');
      setServiceDescription('');
      setServiceDeliverables('');
      setPricingSnapshot(null);
      setPricingInternalCost(0);
      setRequiresAdminApproval(false);
    }
  }, [open]);

  // Auto-fill service name and description when selecting from catalog
  useEffect(() => {
    if (selectedServiceId && selectedServiceId !== 'custom') {
      const service = services.find(s => s.id === selectedServiceId);
      if (service) {
        setServiceName(service.name);
        
        // Load service description from SERVICE_DETAILS or service.description
        const details = SERVICE_DETAILS[service.code];
        if (details) {
          setServiceDescription(details.tagline || '');
          // Use benefits as deliverables (first 4-5 items)
          setServiceDeliverables(details.benefits?.slice(0, 5).join('\n') || '');
        } else {
          setServiceDescription(service.description || '');
          setServiceDeliverables('');
        }
        
        if (service.code === CREATIVE_BOOST_CODE) {
          // Creative Boost: set defaults, price is calculated from credits
          setCbMaxCredits(30);
          setCbPricePerCredit(400);
          setCbColleagueReward(150);
          setCbEditorReward(100);
          setServicePrice(0); // Price is calculated
          setSelectedTier('none');
        } else if (service.service_type === 'core') {
          // Core service with tiers
          setSelectedTier('growth');
          const growthPricing = service.tier_pricing?.find((p: any) => p.tier === 'growth');
          setServicePrice(growthPricing?.price ?? service.base_price ?? 0);
        } else if (service.code === AI_SEO_CODE) {
          // AI SEO: hourly-based with default colleague
          setServicePrice(service.base_price || 0);
          setSelectedTier('none');
          setAiSeoColleagueName('Martin Tomčík');
          setAiSeoHourlyRate(600);
          setAiSeoHours(10);
        } else {
          // Addon or other service
          setServicePrice(service.base_price || 0);
          setSelectedTier('none');
        }
      }
    } else if (selectedServiceId === 'custom') {
      // Custom service - clear description
      setServiceDescription('');
      setServiceDeliverables('');
    }
  }, [selectedServiceId, services]);

  // Auto-fill price and assignments when selecting engagement service for update
  useEffect(() => {
    if (selectedEngagementServiceId) {
      const engService = currentEngagementServices.find(es => es.id === selectedEngagementServiceId);
      if (engService) {
        setNewPrice(engService.price);
      }
      // Load assignments linked to this service (or all for the engagement)
      const serviceAssignments = currentAssignments.filter(
        a => a.engagement_service_id === selectedEngagementServiceId || !a.engagement_service_id
      );
      setServiceAssignmentEdits(
        serviceAssignments.map(a => {
          const colleague = colleagues.find(c => c.id === a.colleague_id);
          const currentValue = a.cost_model === 'hourly' 
            ? (a.hourly_cost || 0) 
            : a.cost_model === 'percentage' 
              ? (a.percentage_of_revenue || 0) 
              : (a.monthly_cost || 0);
          return {
            assignment_id: a.id,
            colleague_name: colleague?.full_name || 'Neznámý',
            role: a.role_on_engagement || '',
            cost_model: a.cost_model || 'fixed_monthly',
            old_value: currentValue,
            new_value: currentValue,
          };
        })
      );
    }
  }, [selectedEngagementServiceId, currentEngagementServices, currentAssignments, colleagues]);

  // Auto-detect role from colleague position for add_assignment
  useEffect(() => {
    if (requestType !== 'add_assignment' || !selectedColleagueId) return;
    const colleague = colleagues.find(c => c.id === selectedColleagueId);
    if (!colleague) return;
    const pos = colleague.position.toLowerCase();
    if (pos.includes('video')) {
      setRoleOnEngagement('Video Editor');
    } else if (pos.includes('design') || pos.includes('grafik')) {
      setRoleOnEngagement('Graphic Designer');
    } else if (pos.includes('ppc') || pos.includes('google')) {
      setRoleOnEngagement('PPC Specialist');
    } else if (pos.includes('meta') || pos.includes('facebook') || pos.includes('social')) {
      setRoleOnEngagement('Meta Ads Specialist');
    } else if (pos.includes('seo')) {
      setRoleOnEngagement('SEO Specialist');
    } else if (pos.includes('sales') || pos.includes('obchod')) {
      setRoleOnEngagement('Sales Specialist');
    } else if (pos.includes('account') || pos.includes('pm') || pos.includes('project')) {
      setRoleOnEngagement('Account Manager');
    }
  }, [selectedColleagueId, requestType, colleagues]);

  // Auto-fill reward from service config when service or colleague changes for add_assignment
  useEffect(() => {
    if (requestType !== 'add_assignment' || !assignmentServiceId) return;
    const engService = currentEngagementServices.find(es => es.id === assignmentServiceId);
    if (!engService) return;

    // Find matching service in catalog
    const catalogService = services.find(s => s.id === engService.service_id);
    const tier = engService.selected_tier || null;
    
    // Try DB reward_config first, then fallback to hardcoded
    let recommended = catalogService?.reward_config 
      ? getRewardsFromServiceConfig(catalogService.reward_config as any, tier)
      : null;
    if (!recommended) {
      recommended = getServiceRewardRecommendation(engService.name, tier);
    }

    if (recommended && recommended.length > 0) {
      // Find match by role if colleague is already selected
      const colleague = colleagues.find(c => c.id === selectedColleagueId);
      const pos = colleague?.position?.toLowerCase() || '';
      
      // Try to match role to colleague position
      let matchedReward = recommended[0]; // default to first
      for (const r of recommended) {
        const roleLower = r.role.toLowerCase();
        if (
          (roleLower.includes('meta') && (pos.includes('meta') || pos.includes('social') || pos.includes('facebook'))) ||
          (roleLower.includes('ppc') && (pos.includes('ppc') || pos.includes('google'))) ||
          (roleLower.includes('graphic') && (pos.includes('design') || pos.includes('grafik'))) ||
          (roleLower.includes('seo') && pos.includes('seo')) ||
          (roleLower.includes('video') && pos.includes('video'))
        ) {
          matchedReward = r;
          break;
        }
      }

      setCostModel(matchedReward.rewardType === 'hourly' ? 'hourly' : matchedReward.rewardType === 'per_credit' ? 'fixed_monthly' : 'fixed_monthly');
      if (matchedReward.rewardType === 'hourly') {
        setHourlyCost(matchedReward.reward);
      } else {
        setMonthlyCost(matchedReward.reward);
      }
    }
  }, [assignmentServiceId, requestType, selectedColleagueId, currentEngagementServices, services, colleagues]);

  const handleSubmit = async () => {
    if (!selectedEngagementId || !requestType) return;

    let proposed_changes: Record<string, unknown> = {};

    switch (requestType) {
      case 'add_service':
        if (isCreativeBoost) {
          // Creative Boost: credit-based pricing
          proposed_changes = {
            service_id: selectedServiceId,
            name: serviceName,
            price: cbMaxCredits * cbPricePerCredit, // Calculated price
            currency: serviceCurrency,
            billing_type: 'monthly',
            selected_tier: null,
            creative_boost_max_credits: cbMaxCredits,
            creative_boost_price_per_credit: cbPricePerCredit,
            creative_boost_reward_per_credit: cbColleagueReward,
            creative_boost_editor_reward_per_credit: cbEditorReward,
          };
        } else if (isAiSeo) {
          // AI SEO: include default colleague info
          proposed_changes = {
            service_id: selectedServiceId,
            name: serviceName,
            price: servicePrice,
            currency: serviceCurrency,
            billing_type: serviceBillingType,
            selected_tier: null,
            description: serviceDescription || undefined,
            deliverables: serviceDeliverables ? serviceDeliverables.split('\n').filter(Boolean) : undefined,
            ai_seo_colleague_name: aiSeoColleagueName,
            ai_seo_hourly_rate: aiSeoHourlyRate,
            ai_seo_hours: aiSeoHours,
            ai_seo_total_reward: aiSeoHourlyRate * aiSeoHours,
          };
        } else {
          proposed_changes = {
            service_id: selectedServiceId === 'custom' ? null : selectedServiceId,
            name: serviceName,
            price: servicePrice,
            currency: serviceCurrency,
            billing_type: serviceBillingType,
            selected_tier: selectedTier === 'none' ? null : selectedTier,
            description: serviceDescription || undefined,
            deliverables: serviceDeliverables ? serviceDeliverables.split('\n').filter(Boolean) : undefined,
          };
        }
        break;
      case 'update_service_price':
        const oldService = currentEngagementServices.find(es => es.id === selectedEngagementServiceId);
        const changedAssignments = serviceAssignmentEdits.filter(a => a.new_value !== a.old_value);
        proposed_changes = {
          engagement_service_id: selectedEngagementServiceId,
          old_price: oldService?.price || 0,
          new_price: newPrice,
          assignment_changes: changedAssignments.length > 0 ? changedAssignments.map(a => ({
            assignment_id: a.assignment_id,
            colleague_name: a.colleague_name,
            role: a.role,
            cost_model: a.cost_model,
            old_value: a.old_value,
            new_value: a.new_value,
          })) : undefined,
        };
        break;
      case 'deactivate_service':
        proposed_changes = {
          engagement_service_id: selectedEngagementServiceId,
        };
        break;
      case 'add_assignment':
        proposed_changes = {
          colleague_id: selectedColleagueId,
          engagement_service_id: assignmentServiceId || null,
          role_on_engagement: roleOnEngagement,
          cost_model: costModel,
          hourly_cost: costModel === 'hourly' ? hourlyCost : null,
          monthly_cost: costModel === 'fixed_monthly' ? monthlyCost : null,
          percentage_of_revenue: costModel === 'percentage' ? percentageOfRevenue : null,
        };
        break;
      case 'update_assignment':
        proposed_changes = {
          engagement_assignment_id: selectedAssignmentId,
          cost_model: costModel,
          hourly_cost: costModel === 'hourly' ? hourlyCost : null,
          monthly_cost: costModel === 'fixed_monthly' ? monthlyCost : null,
          percentage_of_revenue: costModel === 'percentage' ? percentageOfRevenue : null,
        };
        break;
    }

    try {
      if (isEditMode && editingRequest) {
        // Update existing request
        await updateRequest(editingRequest.id, {
          proposed_changes: proposed_changes as any,
          effective_from: effectiveFrom ? format(effectiveFrom, 'yyyy-MM-dd') : null,
          note: note || null,
          upsell_commission_percent: upsoldById === 'none' ? 0 : 10,
        });
      } else {
        await createRequest({
          engagement_id: selectedEngagementId,
          request_type: requestType as ModificationRequestType,
          proposed_changes: proposed_changes as any,
          engagement_service_id: ['update_service_price', 'deactivate_service'].includes(requestType) 
            ? selectedEngagementServiceId 
            : requestType === 'add_assignment' ? (assignmentServiceId || null)
            : null,
          engagement_assignment_id: ['update_assignment'].includes(requestType)
            ? selectedAssignmentId
            : null,
          effective_from: effectiveFrom ? format(effectiveFrom, 'yyyy-MM-dd') : null,
          upsold_by_id: upsoldById === 'none' ? null : upsoldById,
          note: note || null,
          pricing_snapshot: pricingSnapshot,
        });
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save modification request:', error);
    }
  };

  const activeEngagements = engagements.filter(e => e.status === 'active');

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client?.brand_name || client?.name || 'Neznámý klient';
  };

  const getColleagueName = (colleagueId: string) => {
    const colleague = colleagues.find(c => c.id === colleagueId);
    return colleague?.full_name || 'Neznámý kolega';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditMode ? <FileText className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            {isEditMode ? 'Upravit návrh změny' : 'Navrhnout úpravu zakázky'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* ===== STEP 1: Engagement Selection ===== */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">1. Zakázka *</Label>
            <Select value={selectedEngagementId} onValueChange={(v) => {
              setSelectedEngagementId(v);
              // Reset dependent selections
              setSelectedServiceId('');
              setSelectedEngagementServiceId('');
              setSelectedAssignmentId('');
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Vyberte zakázku" />
              </SelectTrigger>
              <SelectContent>
                {activeEngagements.map((engagement) => (
                  <SelectItem key={engagement.id} value={engagement.id}>
                    {getClientName(engagement.client_id)} – {engagement.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ===== STEP 2: Request Type (only after engagement selected) ===== */}
          {selectedEngagementId && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">2. Typ úpravy *</Label>
              <Select value={requestType || undefined} onValueChange={(v) => {
                setRequestType(v as ModificationRequestType);
                setRequestTypeConfirmed(true);
                // Reset type-dependent selections
                setSelectedServiceId('');
                setSelectedEngagementServiceId('');
                setSelectedAssignmentId('');
                setSelectedColleagueId('');
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Vyberte typ úpravy" />
                </SelectTrigger>
                <SelectContent>
                  {VISIBLE_REQUEST_TYPES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {REQUEST_TYPE_LABELS[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* ===== STEP 3: Type-specific fields (only after type selected) ===== */}
          {selectedEngagementId && requestTypeConfirmed && requestType && (
            <>
              {/* ADD SERVICE FIELDS */}
              {requestType === 'add_service' && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                  <h4 className="font-medium">3. Nová služba</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Služba z katalogu</Label>
                      <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Vyberte službu">
                            {selectedServiceId === 'custom' ? 'Vlastní služba' : (() => {
                              const s = services.find(sv => sv.id === selectedServiceId);
                              if (!s) return 'Vyberte službu';
                              return (
                                <span className="flex items-center gap-2">
                                  {s.name}
                                  <span className={cn(
                                    "text-[10px] font-medium uppercase px-1.5 py-0.5 rounded",
                                    s.service_type === 'core'
                                      ? "bg-primary/10 text-primary"
                                      : "bg-muted text-muted-foreground"
                                  )}>
                                    {s.service_type === 'core' ? 'Core' : 'Addon'}
                                  </span>
                                </span>
                              );
                            })()}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="custom">Vlastní služba</SelectItem>
                          {[...services.filter(s => s.is_active)].sort((a, b) => {
                            if (a.service_type === b.service_type) return a.name.localeCompare(b.name);
                            return a.service_type === 'core' ? -1 : 1;
                          }).map((service) => {
                            const details = SERVICE_DETAILS[service.code];
                            const platforms = details?.platforms || [];
                            return (
                              <SelectItem key={service.id} value={service.id}>
                                <div className="flex flex-col gap-0.5">
                                  <span className="flex items-center gap-2">
                                    {service.name}
                                    <span className={cn(
                                      "text-[10px] font-medium uppercase px-1.5 py-0.5 rounded",
                                      service.service_type === 'core'
                                        ? "bg-primary/10 text-primary"
                                        : "bg-muted text-muted-foreground"
                                    )}>
                                      {service.service_type === 'core' ? 'Core' : 'Addon'}
                                    </span>
                                  </span>
                                  {platforms.length > 0 && (
                                    <span className="text-[10px] text-muted-foreground leading-tight">
                                      {platforms.join(' · ')}
                                    </span>
                                  )}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Název služby *</Label>
                      <Input 
                        value={serviceName} 
                        onChange={(e) => setServiceName(e.target.value)}
                        placeholder="Např. Meta Ads SK"
                      />
                    </div>
                  </div>

                  {/* Creative Boost specific fields */}
                  {isCreativeBoost && (
                    <div className="space-y-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
                      <h5 className="font-medium text-sm flex items-center gap-2">🎨 Nastavení Creative Boost</h5>
                      
                      <div className="space-y-2">
                        <Label>Měsíční kreditový balíček</Label>
                        <Input 
                          type="number" 
                          value={cbMaxCredits} 
                          onChange={(e) => setCbMaxCredits(Number(e.target.value))}
                          min={0}
                        />
                        <p className="text-xs text-muted-foreground">Kolik kreditů má klient k dispozici měsíčně</p>
                      </div>

                      <div className="space-y-2">
                        <Label>💰 Cena za kredit pro klienta (CZK)</Label>
                        <Input 
                          type="number" 
                          value={cbPricePerCredit} 
                          onChange={(e) => setCbPricePerCredit(Number(e.target.value))}
                          min={0}
                        />
                        <p className="text-xs text-muted-foreground">Doporučeno: 400 Kč</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>🎨 Odměna za kredit — Grafik (CZK)</Label>
                          <Input 
                            type="number" 
                            value={cbColleagueReward} 
                            onChange={(e) => setCbColleagueReward(Number(e.target.value))}
                            min={0}
                          />
                          <p className="text-xs text-muted-foreground">Doporučeno: 150 Kč</p>
                        </div>
                        <div className="space-y-2">
                          <Label>🎬 Odměna za kredit — Editor (CZK)</Label>
                          <Input 
                            type="number" 
                            value={cbEditorReward} 
                            onChange={(e) => setCbEditorReward(Number(e.target.value))}
                            min={0}
                          />
                          <p className="text-xs text-muted-foreground">Doporučeno: 100 Kč</p>
                        </div>
                      </div>

                      <div className="pt-2 border-t space-y-1">
                        <p className="text-sm font-medium">
                          Měsíční fakturace: <span className="text-primary">{(cbMaxCredits * cbPricePerCredit).toLocaleString('cs-CZ')} CZK</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          = {cbMaxCredits} kreditů × {cbPricePerCredit} Kč/kredit
                        </p>
                        {(cbColleagueReward > 0 || cbEditorReward > 0) && (
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {cbColleagueReward > 0 && (
                              <div>
                                <p className="text-sm font-medium">
                                  Odměna grafik: <span className="text-green-600">{(cbMaxCredits * cbColleagueReward).toLocaleString('cs-CZ')} Kč/měs</span>
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  = {cbMaxCredits} kr. × {cbColleagueReward} Kč
                                </p>
                              </div>
                            )}
                            {cbEditorReward > 0 && (
                              <div>
                                <p className="text-sm font-medium">
                                  Odměna editor: <span className="text-green-600">{(cbMaxCredits * cbEditorReward).toLocaleString('cs-CZ')} Kč/měs</span>
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  = {cbMaxCredits} kr. × {cbEditorReward} Kč
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* AI SEO specific fields */}
                  {isAiSeo && (
                    <div className="space-y-4 p-4 rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800">
                      <h5 className="font-medium text-sm">🤖 AI SEO – Řešitel & odměna</h5>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm">Řešitel</Label>
                          <Input 
                            value={aiSeoColleagueName}
                            onChange={(e) => setAiSeoColleagueName(e.target.value)}
                            className="text-sm"
                          />
                          <p className="text-xs text-muted-foreground">SEO specialista</p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Hodinová sazba (Kč)</Label>
                          <Input 
                            type="number"
                            value={aiSeoHourlyRate}
                            onChange={(e) => setAiSeoHourlyRate(Number(e.target.value))}
                            className="text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Počet hodin / měsíc</Label>
                          <Input 
                            type="number"
                            value={aiSeoHours}
                            onChange={(e) => setAiSeoHours(Number(e.target.value))}
                            className="text-sm"
                          />
                        </div>
                      </div>

                      <div className="text-sm font-medium">
                        Celková měsíční odměna: <span className="text-green-600 dark:text-green-400">{(aiSeoHourlyRate * aiSeoHours).toLocaleString('cs-CZ')} Kč</span>
                        <span className="text-muted-foreground ml-1">({aiSeoHours}h × {aiSeoHourlyRate} Kč)</span>
                      </div>
                    </div>
                  )}

                  {/* Standard service fields (non-Creative Boost) */}
                  {!isCreativeBoost && (
                    <>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Cena *</Label>
                          <Input 
                            type="number" 
                            value={servicePrice} 
                            onChange={(e) => setServicePrice(Number(e.target.value))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Měna</Label>
                          <Select value={serviceCurrency} onValueChange={setServiceCurrency}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="CZK">CZK</SelectItem>
                              <SelectItem value="EUR">EUR</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Fakturace</Label>
                          <Select value={serviceBillingType} onValueChange={(v) => setServiceBillingType(v as 'monthly' | 'one_off')}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="monthly">Měsíční</SelectItem>
                              <SelectItem value="one_off">Jednorázová</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Tier selector only for core services */}
                      {isCoreService && (
                        <div className="space-y-2">
                          <Label>Tier</Label>
                          <Select value={selectedTier} onValueChange={(v) => setSelectedTier(v as ServiceTier | 'none')}>
                            <SelectTrigger>
                              <SelectValue placeholder="Vyberte tier" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Žádný</SelectItem>
                              <SelectItem value="growth">
                                <span className="flex flex-col">
                                  <span>GROWTH</span>
                                  <span className="text-[10px] text-muted-foreground">spend do 400 000 Kč</span>
                                </span>
                              </SelectItem>
                              <SelectItem value="pro">
                                <span className="flex flex-col">
                                  <span>PRO</span>
                                  <span className="text-[10px] text-muted-foreground">spend 400 – 800 000 Kč</span>
                                </span>
                              </SelectItem>
                              <SelectItem value="elite">
                                <span className="flex flex-col">
                                  <span>ELITE</span>
                                  <span className="text-[10px] text-muted-foreground">spend nad 800 000 Kč</span>
                                </span>
                              </SelectItem>
                            </SelectContent>
                          </Select>

                          {/* Platform info for core services */}
                          {selectedService && (
                            <p className="text-xs text-muted-foreground">
                              Platformy:{' '}
                              <span className="font-medium text-foreground">
                                {selectedService.code === 'PPC_BOOST' && 'Google Ads + S-klik'}
                                {selectedService.code === 'PERFORMANCE_BOOST' && 'Meta Ads, Google Ads, S-klik'}
                                {selectedService.code === 'SOCIALS_BOOST' && 'Meta Ads'}
                              </span>
                            </p>
                          )}
                        </div>
                      )}

                      {/* Service description for client */}
                      <div className="space-y-4 mt-4 p-4 rounded-lg bg-blue-50 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <h5 className="font-medium text-sm text-blue-900 dark:text-blue-300">Popis služby pro klienta</h5>
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-sm">Stručný popis</Label>
                          <Textarea 
                            value={serviceDescription}
                            onChange={(e) => setServiceDescription(e.target.value)}
                            placeholder="Např. Komplexní správa reklamních kampaní na Facebooku a Instagramu"
                            rows={2}
                            className="text-sm"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-sm">Co klient dostane (každý řádek = 1 bod)</Label>
                          <Textarea 
                            value={serviceDeliverables}
                            onChange={(e) => setServiceDeliverables(e.target.value)}
                            placeholder="• Kompletní správa Meta Ads&#10;• Looker Studio reporting 24/7&#10;• Měsíční strategické konzultace"
                            rows={4}
                            className="text-sm font-mono"
                          />
                        </div>
                        
                        <p className="text-xs text-muted-foreground">
                          ⓘ Pro služby z katalogu se popis načte automaticky - můžete ho upravit
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* UPDATE SERVICE (PRICE + ASSIGNMENTS) FIELDS */}
              {requestType === 'update_service_price' && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                  <h4 className="font-medium">3. Úprava služby</h4>
                  
                  <div className="space-y-2">
                    <Label>Služba *</Label>
                    <Select value={selectedEngagementServiceId} onValueChange={setSelectedEngagementServiceId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Vyberte stávající službu" />
                      </SelectTrigger>
                      <SelectContent>
                        {currentEngagementServices.filter(es => es.is_active).map((es) => (
                          <SelectItem key={es.id} value={es.id}>
                            {es.name} ({es.price.toLocaleString()} {es.currency})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedEngagementServiceId && (
                    <>
                      {/* Price edit */}
                      <div className="space-y-2">
                        <Label>Nová cena (CZK) *</Label>
                        <Input 
                          type="number" 
                          value={newPrice} 
                          onChange={(e) => setNewPrice(Number(e.target.value))}
                        />
                        {(() => {
                          const engService = currentEngagementServices.find(es => es.id === selectedEngagementServiceId);
                          if (engService && newPrice !== engService.price) {
                            const diff = newPrice - engService.price;
                            return (
                              <p className={cn("text-xs font-medium", diff > 0 ? "text-green-600" : "text-destructive")}>
                                {diff > 0 ? '+' : ''}{diff.toLocaleString('cs-CZ')} Kč ({diff > 0 ? '+' : ''}{((diff / engService.price) * 100).toFixed(1)}%)
                              </p>
                            );
                          }
                          return null;
                        })()}
                      </div>

                      {/* Colleague assignments for this service */}
                      {serviceAssignmentEdits.length > 0 && (
                        <div className="space-y-3 pt-2 border-t">
                          <h5 className="text-sm font-medium flex items-center gap-2">
                            👥 Odměny kolegů na této službě
                          </h5>
                          
                          {serviceAssignmentEdits.map((assignment, idx) => (
                            <div key={assignment.assignment_id} className="grid grid-cols-4 gap-3 items-end p-3 rounded-md border bg-background">
                              <div className="col-span-2">
                                <p className="text-sm font-medium">{assignment.colleague_name}</p>
                                <p className="text-xs text-muted-foreground">{assignment.role || 'bez role'}</p>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Aktuální</Label>
                                <p className="text-sm text-muted-foreground">
                                  {assignment.old_value.toLocaleString('cs-CZ')} Kč
                                  <span className="text-[10px] ml-1">
                                    {assignment.cost_model === 'hourly' ? '/h' : assignment.cost_model === 'percentage' ? '%' : '/měs'}
                                  </span>
                                </p>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Nová odměna</Label>
                                <Input
                                  type="number"
                                  value={assignment.new_value}
                                  onChange={(e) => {
                                    const updated = [...serviceAssignmentEdits];
                                    updated[idx] = { ...updated[idx], new_value: Number(e.target.value) };
                                    setServiceAssignmentEdits(updated);
                                  }}
                                  className="h-8 text-sm"
                                />
                              </div>
                            </div>
                          ))}

                          {/* Margin summary */}
                          {(() => {
                            const totalOldCost = serviceAssignmentEdits.reduce((sum, a) => sum + a.old_value, 0);
                            const totalNewCost = serviceAssignmentEdits.reduce((sum, a) => sum + a.new_value, 0);
                            const engService = currentEngagementServices.find(es => es.id === selectedEngagementServiceId);
                            const oldPrice = engService?.price || 0;
                            const oldMargin = oldPrice > 0 ? ((oldPrice - totalOldCost) / oldPrice * 100) : 0;
                            const newMargin = newPrice > 0 ? ((newPrice - totalNewCost) / newPrice * 100) : 0;
                            
                            const getMarginColor = (m: number) => m >= 66 ? 'text-green-600' : m >= 63 ? 'text-orange-500' : 'text-destructive';
                            
                            return (
                              <div className="grid grid-cols-2 gap-3 p-3 rounded-md border bg-muted/50">
                                <div>
                                  <p className="text-xs text-muted-foreground">Aktuální marže služby</p>
                                  <p className={cn("text-sm font-semibold", getMarginColor(oldMargin))}>
                                    {oldMargin.toFixed(1)}% ({(oldPrice - totalOldCost).toLocaleString('cs-CZ')} Kč)
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Nová marže služby</p>
                                  <p className={cn("text-sm font-semibold", getMarginColor(newMargin))}>
                                    {newMargin.toFixed(1)}% ({(newPrice - totalNewCost).toLocaleString('cs-CZ')} Kč)
                                  </p>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {serviceAssignmentEdits.length === 0 && (
                        <p className="text-xs text-muted-foreground italic">
                          K této službě nejsou přiřazeni žádní kolegové.
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* DEACTIVATE SERVICE FIELDS */}
              {requestType === 'deactivate_service' && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                  <h4 className="font-medium">3. Deaktivace služby</h4>
                  
                  <div className="space-y-2">
                    <Label>Služba k deaktivaci *</Label>
                    <Select value={selectedEngagementServiceId} onValueChange={setSelectedEngagementServiceId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Vyberte službu" />
                      </SelectTrigger>
                      <SelectContent>
                        {currentEngagementServices.filter(es => es.is_active).map((es) => (
                          <SelectItem key={es.id} value={es.id}>
                            {es.name} ({es.price.toLocaleString()} {es.currency})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* ADD ASSIGNMENT FIELDS */}
              {requestType === 'add_assignment' && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                  <h4 className="font-medium">3. Přiřazení kolegy ke službě</h4>
                  
                  {/* Service selection */}
                  <div className="space-y-2">
                    <Label>Služba na zakázce *</Label>
                    <Select value={assignmentServiceId} onValueChange={setAssignmentServiceId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Vyberte službu" />
                      </SelectTrigger>
                      <SelectContent>
                        {currentEngagementServices.filter(es => es.is_active).map((es) => (
                          <SelectItem key={es.id} value={es.id}>
                            {es.name} ({es.price?.toLocaleString()} {es.currency})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {assignmentServiceId && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Kolega *</Label>
                          <Select value={selectedColleagueId} onValueChange={setSelectedColleagueId}>
                            <SelectTrigger>
                              <SelectValue placeholder="Vyberte kolegu" />
                            </SelectTrigger>
                            <SelectContent>
                              {colleagues.filter(c => c.status === 'active').map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.full_name} ({c.position})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Role na projektu</Label>
                          <Input 
                            value={roleOnEngagement} 
                            onChange={(e) => setRoleOnEngagement(e.target.value)}
                            placeholder="Např. Specialist"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Model odměny</Label>
                          <Select value={costModel} onValueChange={(v) => setCostModel(v as 'hourly' | 'fixed_monthly' | 'percentage')}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="fixed_monthly">Fixní měsíční</SelectItem>
                              <SelectItem value="hourly">Hodinová</SelectItem>
                              <SelectItem value="percentage">% z revenue</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {costModel === 'fixed_monthly' && (
                          <div className="space-y-2">
                            <Label>Měsíční odměna (CZK)</Label>
                            <Input 
                              type="number" 
                              value={monthlyCost} 
                              onChange={(e) => setMonthlyCost(Number(e.target.value))}
                            />
                          </div>
                        )}

                        {costModel === 'hourly' && (
                          <div className="space-y-2">
                            <Label>Hodinová sazba (CZK)</Label>
                            <Input 
                              type="number" 
                              value={hourlyCost} 
                              onChange={(e) => setHourlyCost(Number(e.target.value))}
                            />
                          </div>
                        )}

                        {costModel === 'percentage' && (
                          <div className="space-y-2">
                            <Label>% z revenue</Label>
                            <Input 
                              type="number" 
                              value={percentageOfRevenue} 
                              onChange={(e) => setPercentageOfRevenue(Number(e.target.value))}
                            />
                          </div>
                        )}
                      </div>

                      {(monthlyCost > 0 || hourlyCost > 0) && (
                        <Alert>
                          <Info className="h-4 w-4" />
                          <AlertDescription>
                            Odměna byla předvyplněna dle konfigurace služby. Můžete ji upravit.
                          </AlertDescription>
                        </Alert>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* UPDATE ASSIGNMENT FIELDS (legacy - hidden from dropdown but kept for backward compat) */}
              {requestType === 'update_assignment' && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                  <h4 className="font-medium">3. Změna odměny kolegy</h4>
                  <p className="text-sm text-muted-foreground">
                    Pro úpravu odměn kolegů použijte typ „Úprava služby (cena + odměny)" – kde uvidíte i marži.
                  </p>
                </div>
              )}


              {/* PRICING IMPACT SECTION - for add_service and update_service_price */}
              {((requestType === 'add_service' && selectedServiceId) || (requestType === 'update_service_price' && selectedEngagementServiceId)) && (() => {
                const selectedEng = engagements.find(e => e.id === selectedEngagementId);
                if (!selectedEng) return null;
                const isAddon = selectedService?.service_type === 'addon';
                return (
                  <PricingImpactSection
                    clientId={selectedEng.client_id}
                    engagementId={selectedEngagementId}
                    proposedPrice={requestType === 'add_service' ? (isCreativeBoost ? cbMaxCredits * cbPricePerCredit : servicePrice) : newPrice}
                    selectedServiceId={selectedServiceId}
                    isAddonService={isAddon}
                    selectedTier={selectedTier === 'none' ? null : selectedTier}
                    onPriceChange={(price) => {
                      if (requestType === 'add_service') setServicePrice(price);
                      else setNewPrice(price);
                    }}
                    onInternalCostChange={setPricingInternalCost}
                    onSnapshotChange={setPricingSnapshot}
                    onRequiresAdminApproval={setRequiresAdminApproval}
                  />
                );
              })()}
            </>
          )}

          {/* ===== STEP 4: Details (only after engagement + type selected) ===== */}
          {selectedEngagementId && requestType && (
            <div className="space-y-4 pt-2 border-t">
              {/* Effective From */}
              <div className="space-y-2">
                <Label>Platnost od</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !effectiveFrom && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {effectiveFrom ? format(effectiveFrom, 'd. MMMM yyyy', { locale: cs }) : 'Vyberte datum'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={effectiveFrom}
                      onSelect={setEffectiveFrom}
                      locale={cs}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Proration Info */}
              {prorationInfo && requestType === 'add_service' && effectiveFrom && effectiveFrom.getDate() > 1 && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Poměrná fakturace:</strong> Služba začíná {format(effectiveFrom, 'd.M.', { locale: cs })} 
                    → fakturace za {format(effectiveFrom, 'MMMM', { locale: cs })}: <strong>{prorationInfo.proratedAmount.toLocaleString()} {serviceCurrency}</strong>
                    {' '}({prorationInfo.remainingDays} z {prorationInfo.daysInMonth} dní)
                  </AlertDescription>
                </Alert>
              )}

              {/* Upsold By (commission tracking) */}
              <div className="space-y-2">
                <Label>Kdo dohodl (pro provizi)</Label>
                <Select value={upsoldById} onValueChange={setUpsoldById}>
                  <SelectTrigger>
                    <SelectValue placeholder="Vyberte kolegu" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nikdo (bez provize)</SelectItem>
                    {colleagues.filter(c => c.status === 'active').map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Commission calculation */}
                {upsoldById !== 'none' && (() => {
                  const commissionBase = requestType === 'add_service'
                    ? (isCreativeBoost ? cbMaxCredits * cbPricePerCredit : servicePrice)
                    : requestType === 'update_service_price'
                      ? Math.max(0, newPrice - (currentEngagementServices.find(es => es.id === selectedEngagementServiceId)?.price || 0))
                      : requestType === 'add_assignment'
                        ? (costModel === 'fixed_monthly' ? monthlyCost : costModel === 'hourly' ? hourlyCost : 0)
                        : 0;
                  const commission = Math.round(commissionBase * 0.1);
                  const upsoldColleague = colleagues.find(c => c.id === upsoldById);
                  if (commissionBase <= 0) return null;
                  return (
                    <div className="rounded-md border bg-muted/30 p-3 space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Provize za upsell (10 %)</p>
                      <p className="text-sm font-semibold">
                        {commission.toLocaleString('cs-CZ')} CZK / měsíc
                      </p>
                      <p className="text-xs text-muted-foreground">
                        = 10 % z {commissionBase.toLocaleString('cs-CZ')} CZK měsíčního fee
                        {upsoldColleague && <> → <span className="font-medium text-foreground">{upsoldColleague.full_name}</span></>}
                      </p>
                    </div>
                  );
                })()}
              </div>

              {/* Note */}
              <div className="space-y-2">
                <Label>Poznámka</Label>
                <Textarea 
                  value={note} 
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Např. Klient požádal o rozšíření služeb po meetingu..."
                  rows={3}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Zrušit
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={(isCreating || isUpdating) || !selectedEngagementId}
          >
            {isEditMode
              ? (isUpdating ? 'Ukládám...' : 'Uložit změny')
              : (isCreating ? 'Odesílám...' : 'Odeslat ke schválení')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
