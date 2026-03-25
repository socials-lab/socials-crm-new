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
import { toast } from '@/components/ui/sonner';
import { Percent } from 'lucide-react';
import type { Service, LeadService, ServiceTier } from '@/types/crm';
import { SERVICE_TIER_CONFIGS } from '@/constants/services';

interface AddLeadServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  services: Service[];
  onSubmit: (service: LeadService) => Promise<void> | void;
}

export function AddLeadServiceDialog({
  open,
  onOpenChange,
  services,
  onSubmit,
}: AddLeadServiceDialogProps) {
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedTier, setSelectedTier] = useState<ServiceTier | null>(null);
  const [priceInput, setPriceInput] = useState('0');
  const [currency, setCurrency] = useState('');
  const [billingType, setBillingType] = useState<'monthly' | 'one_off'>('monthly');
  const [hasIntroDiscount, setHasIntroDiscount] = useState(false);
  const [introDiscountPercent, setIntroDiscountPercent] = useState(10);
  const [introDiscountMonths, setIntroDiscountMonths] = useState(3);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const normalizedServices = services.filter((service): service is Service => (
    Boolean(service) &&
    typeof service.id === 'string' &&
    service.id.trim().length > 0
  ));

  const selectedService = normalizedServices.find(s => s.id === selectedServiceId);
  const isCoreService = selectedService?.service_type === 'core';
  const selectedServiceTierPricing = Array.isArray(selectedService?.tier_pricing)
    ? selectedService.tier_pricing
    : [];

  const handleServiceChange = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    const service = normalizedServices.find(s => s.id === serviceId);
    if (service) {
      setCurrency(service.currency);
      if (service.service_type === 'core') {
        setSelectedTier('growth');
        const tierPricing = Array.isArray(service.tier_pricing) ? service.tier_pricing : [];
        const growthPricing = tierPricing.find(p => p.tier === 'growth');
        setPriceInput(String(growthPricing?.price ?? 0));
      } else {
        setSelectedTier(null);
        setPriceInput(String(service.base_price));
      }
    }
  };

  const handleTierChange = (tier: ServiceTier) => {
    setSelectedTier(tier);
    const tierPricing = selectedServiceTierPricing.find(p => p.tier === tier);
    if (tierPricing?.price !== null && tierPricing?.price !== undefined) {
      setPriceInput(String(tierPricing.price));
    } else {
      setPriceInput('');
    }
  };

  const handleSubmit = async () => {
    if (!selectedService) {
      toast.error('Vyberte službu');
      return;
    }

    const parsedPrice = Number(priceInput);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      toast.error('Zadejte platnou cenu');
      return;
    }
    if (!currency) {
      toast.error('Služba nemá nastavenou měnu');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        id: `lead-svc-${Date.now()}`,
        service_id: selectedServiceId,
        name: selectedService.name,
        selected_tier: isCoreService ? selectedTier : null,
        price: parsedPrice,
        currency,
        billing_type: billingType,
        intro_discount_percent: hasIntroDiscount && billingType === 'monthly' ? introDiscountPercent : null,
        intro_discount_months: hasIntroDiscount && billingType === 'monthly' ? introDiscountMonths : null,
      });

      // Reset form
      setSelectedServiceId('');
      setSelectedTier(null);
      setPriceInput('0');
      setCurrency('');
      setBillingType('monthly');
      setHasIntroDiscount(false);
      setIntroDiscountPercent(10);
      setIntroDiscountMonths(3);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to add service:', error);
      toast.error('Nepodařilo se přidat službu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const numericPrice = Number(priceInput);
  const effectivePrice = Number.isFinite(numericPrice) && numericPrice >= 0 ? numericPrice : 0;
  const discountedPrice = hasIntroDiscount
    ? Math.round(effectivePrice * (1 - introDiscountPercent / 100))
    : effectivePrice;

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
                {normalizedServices.filter(s => s.is_active).map(service => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name}
                  </SelectItem>
                ))}
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
                    const tierPricing = selectedServiceTierPricing.find(p => p.tier === config.tier);
                    const priceLabel = tierPricing?.price 
                      ? `${tierPricing.price.toLocaleString('cs-CZ')} Kč`
                      : 'Individuální kalkulace';
                    const spendLabel = config.max_spend 
                      ? `do ${(config.max_spend/1000).toFixed(0)}K Kč`
                      : `${(config.min_spend!/1000).toFixed(0)}K+ Kč`;
                    return (
                      <SelectItem key={config.tier} value={config.tier}>
                        <span className="font-medium">{config.label}</span>
                        <span className="text-muted-foreground ml-2">({spendLabel})</span>
                        <span className="text-primary ml-2">— {priceLabel}</span>
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
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
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

          {billingType === 'monthly' && (
            <div className="space-y-3 rounded-lg border border-dashed p-3">
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
                        onChange={(e) => {
                          const parsed = Number(e.target.value);
                          if (!Number.isFinite(parsed)) return;
                          setIntroDiscountPercent(Math.min(100, Math.max(1, Math.round(parsed))));
                        }}
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
                        onChange={(e) => {
                          const parsed = Number(e.target.value);
                          if (!Number.isFinite(parsed)) return;
                          setIntroDiscountMonths(Math.min(24, Math.max(1, Math.round(parsed))));
                        }}
                        className="h-8"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded bg-muted/50 p-2">
                    <span className="text-xs text-muted-foreground">
                      Prvních {introDiscountMonths} měs. za:
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground line-through">
                        {effectivePrice.toLocaleString('cs-CZ')} {currency}
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Zrušit
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={!selectedServiceId || isSubmitting}>
              {isSubmitting ? 'Přidávám...' : 'Přidat službu'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
