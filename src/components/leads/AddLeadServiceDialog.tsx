import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Percent } from 'lucide-react';
import type { Service, LeadService, ServiceTier } from '@/types/crm';
import { SERVICE_TIER_CONFIGS } from '@/constants/services';
import { getServiceDetail } from '@/constants/serviceDetails';

interface AddLeadServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  services: Service[];
  onSubmit: (service: LeadService) => void;
}

export function AddLeadServiceDialog({
  open,
  onOpenChange,
  services,
  onSubmit,
}: AddLeadServiceDialogProps) {
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedTier, setSelectedTier] = useState<ServiceTier | null>(null);
  const [price, setPrice] = useState(0);
  const [currency, setCurrency] = useState('CZK');
  const [billingType, setBillingType] = useState<'monthly' | 'one_off'>('monthly');
  const [hasIntroDiscount, setHasIntroDiscount] = useState(false);
  const [introDiscountPercent, setIntroDiscountPercent] = useState(10);
  const [introDiscountMonths, setIntroDiscountMonths] = useState(3);

  const selectedService = services.find(s => s.id === selectedServiceId);
  const isCoreService = selectedService?.service_type === 'core';

  const handleServiceChange = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    const service = services.find(s => s.id === serviceId);
      if (service) {
        setCurrency(service.currency);
        if (service.service_type === 'core') {
          setSelectedTier('growth');
          const growthPricing = service.tier_pricing?.find(p => p.tier === 'growth');
          const constantDetail = getServiceDetail(service.code);
          const constantGrowthPrice = constantDetail?.tierPricing?.growth?.price;
          setPrice(growthPricing?.price ?? constantGrowthPrice ?? 0);
        } else {
          setSelectedTier(null);
          setPrice(service.base_price);
        }
      }
  };

  const handleTierChange = (tier: ServiceTier) => {
    setSelectedTier(tier);
    const dbPricing = selectedService?.tier_pricing?.find(p => p.tier === tier);
    const constantDetail = selectedService ? getServiceDetail(selectedService.code) : undefined;
    const constantPrice = constantDetail?.tierPricing?.[tier as keyof typeof constantDetail.tierPricing]?.price;
    const resolvedPrice = dbPricing?.price ?? constantPrice ?? null;
    if (resolvedPrice !== null) {
      setPrice(resolvedPrice);
    } else {
      setPrice(0);
    }
  };

  const discountedPrice = hasIntroDiscount 
    ? Math.round(price * (1 - introDiscountPercent / 100)) 
    : price;

  const handleSubmit = () => {
    if (!selectedService) return;
    
    onSubmit({
      id: `lead-svc-${Date.now()}`,
      service_id: selectedServiceId,
      name: selectedService.name,
      selected_tier: isCoreService ? selectedTier : null,
      price,
      currency,
      billing_type: billingType,
      intro_discount_percent: hasIntroDiscount ? introDiscountPercent : null,
      intro_discount_months: hasIntroDiscount ? introDiscountMonths : null,
    });
    
    // Reset form
    setSelectedServiceId('');
    setSelectedTier(null);
    setPrice(0);
    setCurrency('CZK');
    setBillingType('monthly');
    setHasIntroDiscount(false);
    setIntroDiscountPercent(10);
    setIntroDiscountMonths(3);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Přidat službu do nabídky</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Služba</Label>
            <Select value={selectedServiceId} onValueChange={handleServiceChange}>
              <SelectTrigger>
                <SelectValue placeholder="Vyberte službu" />
              </SelectTrigger>
              <SelectContent>
                {[...services].filter(s => s.is_active).sort((a, b) => {
                  if (a.service_type !== b.service_type) return a.service_type === 'core' ? -1 : 1;
                  return a.name.localeCompare(b.name, 'cs');
                }).map(service => {
                  const detail = getServiceDetail(service.code);
                  const platforms = detail?.platforms;
                  return (
                    <SelectItem key={service.id} value={service.id}>
                      <div className="flex flex-col">
                        <span>{service.name} <span className="text-muted-foreground">({service.service_type === 'core' ? 'Core' : 'Addon'})</span></span>
                        {platforms && platforms.length > 0 && (
                          <span className="text-[11px] text-muted-foreground leading-tight">
                            {platforms.join(', ')}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {isCoreService && (
            <div className="space-y-2 p-4 rounded-lg bg-muted/50 border">
              <Label>Úroveň služby (dle spendu klienta)</Label>
              <Select 
                value={selectedTier ?? 'growth'} 
                onValueChange={(v) => handleTierChange(v as ServiceTier)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Vyberte úroveň" />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_TIER_CONFIGS.map((config) => {
                    const dbTierPricing = selectedService?.tier_pricing?.find(p => p.tier === config.tier);
                    const constantDetail = selectedService ? getServiceDetail(selectedService.code) : undefined;
                    const constantTierPrice = constantDetail?.tierPricing?.[config.tier as keyof typeof constantDetail.tierPricing];
                    
                    const resolvedPrice = dbTierPricing?.price ?? constantTierPrice?.price ?? null;
                    
                    const priceLabel = resolvedPrice !== null
                      ? `${resolvedPrice.toLocaleString('cs-CZ')} Kč`
                      : 'Individuální kalkulace';
                    const spendLabel = config.max_spend 
                      ? `do ${(config.max_spend/1000).toFixed(0)}K Kč`
                      : `${(config.min_spend!/1000).toFixed(0)}K+ Kč`;
                    return (
                      <SelectItem key={config.tier} value={config.tier}>
                        <span className="font-medium">{config.label}</span>
                        <span className="text-muted-foreground ml-2">({spendLabel})</span>
                        <span className={`ml-2 ${resolvedPrice !== null ? 'text-primary' : 'text-amber-600'}`}>— {priceLabel}</span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Cena</Label>
              <Input 
                type="number" 
                min={0} 
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Typ fakturace</Label>
              <Select value={billingType} onValueChange={(v) => setBillingType(v as 'monthly' | 'one_off')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Měsíčně</SelectItem>
                  <SelectItem value="one_off">Jednorázově</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Intro Discount Section */}
          {billingType === 'monthly' && (
            <div className="space-y-3 p-3 rounded-lg border border-dashed">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Percent className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">Úvodní sleva</Label>
                </div>
                <Switch 
                  checked={hasIntroDiscount} 
                  onCheckedChange={setHasIntroDiscount} 
                />
              </div>
              
              {hasIntroDiscount && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Sleva (%)</Label>
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        value={introDiscountPercent}
                        onChange={(e) => setIntroDiscountPercent(Math.min(100, Math.max(1, Number(e.target.value))))}
                        className="h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Počet měsíců</Label>
                      <Input
                        type="number"
                        min={1}
                        max={24}
                        value={introDiscountMonths}
                        onChange={(e) => setIntroDiscountMonths(Math.min(24, Math.max(1, Number(e.target.value))))}
                        className="h-8"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                    <span className="text-xs text-muted-foreground">
                      Prvních {introDiscountMonths} měs. za:
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs line-through text-muted-foreground">
                        {price.toLocaleString('cs-CZ')} {currency}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {discountedPrice.toLocaleString('cs-CZ')} {currency}/měs
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>Měna</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CZK">CZK</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Zrušit
            </Button>
            <Button onClick={handleSubmit} disabled={!selectedServiceId}>
              Přidat službu
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
