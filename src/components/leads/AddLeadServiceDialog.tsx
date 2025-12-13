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
import type { Service, LeadService, ServiceTier } from '@/types/crm';
import { serviceTierConfigs } from '@/data/mockData';

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
        setPrice(growthPricing?.price ?? 0);
      } else {
        setSelectedTier(null);
        setPrice(service.base_price);
      }
    }
  };

  const handleTierChange = (tier: ServiceTier) => {
    setSelectedTier(tier);
    if (selectedService?.tier_pricing) {
      const tierPricing = selectedService.tier_pricing.find(p => p.tier === tier);
      if (tierPricing?.price !== null && tierPricing?.price !== undefined) {
        setPrice(tierPricing.price);
      } else {
        setPrice(0);
      }
    }
  };

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
    });
    
    // Reset form
    setSelectedServiceId('');
    setSelectedTier(null);
    setPrice(0);
    setCurrency('CZK');
    setBillingType('monthly');
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
                {services.filter(s => s.is_active).map(service => (
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
                  {serviceTierConfigs.map((config) => {
                    const tierPricing = selectedService?.tier_pricing?.find(p => p.tier === config.tier);
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
