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
import { CalendarIcon, Info, Plus } from 'lucide-react';
import { useCRMData } from '@/hooks/useCRMData';
import { useModificationRequests } from '@/hooks/useModificationRequests';
import { useAuth } from '@/hooks/useAuth';
import type { ModificationRequestType, ServiceTier } from '@/types/crm';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ProposeModificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const REQUEST_TYPE_LABELS: Record<ModificationRequestType, string> = {
  add_service: 'Přidání nové služby',
  update_service_price: 'Změna ceny služby',
  deactivate_service: 'Deaktivace služby',
  add_assignment: 'Přiřazení kolegy',
  update_assignment: 'Změna odměny kolegy',
  remove_assignment: 'Odebrání kolegy',
};

export function ProposeModificationDialog({ open, onOpenChange }: ProposeModificationDialogProps) {
  const { engagements, clients, services, colleagues, engagementServices, assignments, getEngagementServicesByEngagementId, getAssignmentsByEngagementId } = useCRMData();
  const { createRequest, isCreating } = useModificationRequests();
  const { user } = useAuth();
  
  // Find colleague record for current user
  const currentUserColleague = colleagues.find(c => c.profile_id === user?.id);

  // Form state
  const [selectedEngagementId, setSelectedEngagementId] = useState<string>('');
  const [requestType, setRequestType] = useState<ModificationRequestType>('add_service');
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
  const [cbMaxCredits, setCbMaxCredits] = useState<number>(50);
  const [cbPricePerCredit, setCbPricePerCredit] = useState<number>(400);
  const [cbColleagueReward, setCbColleagueReward] = useState<number>(80);

  // For update_service_price
  const [selectedEngagementServiceId, setSelectedEngagementServiceId] = useState<string>('');
  const [newPrice, setNewPrice] = useState<number>(0);

  // Assignment-related fields
  const [selectedColleagueId, setSelectedColleagueId] = useState<string>('');
  const [roleOnEngagement, setRoleOnEngagement] = useState('');
  const [costModel, setCostModel] = useState<'hourly' | 'fixed_monthly' | 'percentage'>('fixed_monthly');
  const [hourlyCost, setHourlyCost] = useState<number>(0);
  const [monthlyCost, setMonthlyCost] = useState<number>(0);
  const [percentageOfRevenue, setPercentageOfRevenue] = useState<number>(0);

  // For update_assignment / remove_assignment
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('');

  // Detect Creative Boost
  const CREATIVE_BOOST_CODE = 'CREATIVE_BOOST';
  const selectedService = services.find(s => s.id === selectedServiceId);
  const isCreativeBoost = selectedService?.code === CREATIVE_BOOST_CODE;
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

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedEngagementId('');
      setRequestType('add_service');
      setEffectiveFrom(new Date());
      setUpsoldById('none');
      setNote('');
      setSelectedServiceId('');
      setServiceName('');
      setServicePrice(0);
      setServiceCurrency('CZK');
      setServiceBillingType('monthly');
      setSelectedTier('none');
      setCbMaxCredits(50);
      setCbPricePerCredit(400);
      setCbColleagueReward(80);
      setSelectedEngagementServiceId('');
      setNewPrice(0);
      setSelectedColleagueId('');
      setRoleOnEngagement('');
      setCostModel('fixed_monthly');
      setHourlyCost(0);
      setMonthlyCost(0);
      setPercentageOfRevenue(0);
      setSelectedAssignmentId('');
    }
  }, [open]);

  // Auto-fill service name when selecting from catalog
  useEffect(() => {
    if (selectedServiceId && selectedServiceId !== 'custom') {
      const service = services.find(s => s.id === selectedServiceId);
      if (service) {
        setServiceName(service.name);
        if (service.code === CREATIVE_BOOST_CODE) {
          // Creative Boost: set defaults, price is calculated from credits
          setCbMaxCredits(50);
          setCbPricePerCredit(400);
          setCbColleagueReward(80);
          setServicePrice(0); // Price is calculated
          setSelectedTier('none');
        } else if (service.service_type === 'core') {
          // Core service with tiers
          setSelectedTier('growth');
          const growthPricing = service.tier_pricing?.find((p: any) => p.tier === 'growth');
          setServicePrice(growthPricing?.price ?? service.base_price ?? 0);
        } else {
          // Addon or other service
          setServicePrice(service.base_price || 0);
          setSelectedTier('none');
        }
      }
    }
  }, [selectedServiceId, services]);

  // Auto-fill price when selecting engagement service for update
  useEffect(() => {
    if (selectedEngagementServiceId) {
      const engService = currentEngagementServices.find(es => es.id === selectedEngagementServiceId);
      if (engService) {
        setNewPrice(engService.price);
      }
    }
  }, [selectedEngagementServiceId, currentEngagementServices]);

  const handleSubmit = async () => {
    if (!selectedEngagementId) return;

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
            creative_boost_colleague_reward_per_credit: cbColleagueReward,
          };
        } else {
          proposed_changes = {
            service_id: selectedServiceId === 'custom' ? null : selectedServiceId,
            name: serviceName,
            price: servicePrice,
            currency: serviceCurrency,
            billing_type: serviceBillingType,
            selected_tier: selectedTier === 'none' ? null : selectedTier,
          };
        }
        break;
      case 'update_service_price':
        const oldService = currentEngagementServices.find(es => es.id === selectedEngagementServiceId);
        proposed_changes = {
          engagement_service_id: selectedEngagementServiceId,
          old_price: oldService?.price || 0,
          new_price: newPrice,
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
      case 'remove_assignment':
        proposed_changes = {
          engagement_assignment_id: selectedAssignmentId,
        };
        break;
    }

    try {
      await createRequest({
        engagement_id: selectedEngagementId,
        request_type: requestType,
        proposed_changes: proposed_changes as any,
        engagement_service_id: ['update_service_price', 'deactivate_service'].includes(requestType) 
          ? selectedEngagementServiceId 
          : null,
        engagement_assignment_id: ['update_assignment', 'remove_assignment'].includes(requestType)
          ? selectedAssignmentId
          : null,
        effective_from: effectiveFrom ? format(effectiveFrom, 'yyyy-MM-dd') : null,
        upsold_by_id: upsoldById === 'none' ? null : upsoldById,
        note: note || null,
      });
      
      // Just close the dialog - upgrade offer will be created at approval time
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create modification request:', error);
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
            <Plus className="h-5 w-5" />
            Navrhnout úpravu zakázky
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Engagement Selection */}
          <div className="space-y-2">
            <Label>Zakázka *</Label>
            <Select value={selectedEngagementId} onValueChange={setSelectedEngagementId}>
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

          {/* Request Type */}
          <div className="space-y-2">
            <Label>Typ úpravy *</Label>
            <Select value={requestType} onValueChange={(v) => setRequestType(v as ModificationRequestType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(REQUEST_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ADD SERVICE FIELDS */}
          {requestType === 'add_service' && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <h4 className="font-medium">Nová služba</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Služba z katalogu</Label>
                  <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Vyberte službu" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">Vlastní služba</SelectItem>
                      {services.filter(s => s.is_active).map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name}
                        </SelectItem>
                      ))}
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

                  <div className="space-y-2">
                    <Label>🎨 Odměna za kredit pro grafika (CZK)</Label>
                    <Input 
                      type="number" 
                      value={cbColleagueReward} 
                      onChange={(e) => setCbColleagueReward(Number(e.target.value))}
                      min={0}
                    />
                    <p className="text-xs text-muted-foreground">Doporučeno: 80 Kč</p>
                  </div>

                  <div className="pt-2 border-t space-y-1">
                    <p className="text-sm font-medium">
                      Měsíční fakturace: <span className="text-primary">{(cbMaxCredits * cbPricePerCredit).toLocaleString('cs-CZ')} CZK</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      = {cbMaxCredits} kreditů × {cbPricePerCredit} Kč/kredit
                    </p>
                    {cbColleagueReward > 0 && (
                      <>
                        <p className="text-sm font-medium mt-2">
                          Odměna pro grafika: <span className="text-green-600">{(cbMaxCredits * cbColleagueReward).toLocaleString('cs-CZ')} CZK/měsíc</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          = {cbMaxCredits} kreditů × {cbColleagueReward} Kč/kredit
                        </p>
                      </>
                    )}
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
                          <SelectItem value="growth">GROWTH</SelectItem>
                          <SelectItem value="pro">PRO</SelectItem>
                          <SelectItem value="elite">ELITE</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* UPDATE SERVICE PRICE FIELDS */}
          {requestType === 'update_service_price' && selectedEngagementId && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <h4 className="font-medium">Změna ceny</h4>
              
              <div className="space-y-2">
                <Label>Služba *</Label>
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

              <div className="space-y-2">
                <Label>Nová cena *</Label>
                <Input 
                  type="number" 
                  value={newPrice} 
                  onChange={(e) => setNewPrice(Number(e.target.value))}
                />
              </div>
            </div>
          )}

          {/* DEACTIVATE SERVICE FIELDS */}
          {requestType === 'deactivate_service' && selectedEngagementId && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <h4 className="font-medium">Deaktivace služby</h4>
              
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
          {requestType === 'add_assignment' && selectedEngagementId && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <h4 className="font-medium">Přiřazení kolegy</h4>
              
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
            </div>
          )}

          {/* UPDATE ASSIGNMENT FIELDS */}
          {requestType === 'update_assignment' && selectedEngagementId && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <h4 className="font-medium">Změna odměny kolegy</h4>
              
              <div className="space-y-2">
                <Label>Kolega *</Label>
                <Select value={selectedAssignmentId} onValueChange={setSelectedAssignmentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Vyberte přiřazení" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentAssignments.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {getColleagueName(a.colleague_id)} ({a.role_on_engagement || 'bez role'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nový model odměny</Label>
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
                    <Label>Nová měsíční odměna (CZK)</Label>
                    <Input 
                      type="number" 
                      value={monthlyCost} 
                      onChange={(e) => setMonthlyCost(Number(e.target.value))}
                    />
                  </div>
                )}

                {costModel === 'hourly' && (
                  <div className="space-y-2">
                    <Label>Nová hodinová sazba (CZK)</Label>
                    <Input 
                      type="number" 
                      value={hourlyCost} 
                      onChange={(e) => setHourlyCost(Number(e.target.value))}
                    />
                  </div>
                )}

                {costModel === 'percentage' && (
                  <div className="space-y-2">
                    <Label>Nové % z revenue</Label>
                    <Input 
                      type="number" 
                      value={percentageOfRevenue} 
                      onChange={(e) => setPercentageOfRevenue(Number(e.target.value))}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* REMOVE ASSIGNMENT FIELDS */}
          {requestType === 'remove_assignment' && selectedEngagementId && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <h4 className="font-medium">Odebrání kolegy</h4>
              
              <div className="space-y-2">
                <Label>Kolega k odebrání *</Label>
                <Select value={selectedAssignmentId} onValueChange={setSelectedAssignmentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Vyberte přiřazení" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentAssignments.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {getColleagueName(a.colleague_id)} ({a.role_on_engagement || 'bez role'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

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

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Zrušit
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isCreating || !selectedEngagementId}
          >
            {isCreating ? 'Odesílám...' : 'Odeslat ke schválení'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
