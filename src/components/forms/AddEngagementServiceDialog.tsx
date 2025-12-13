import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Service, EngagementService, ServiceTier } from '@/types/crm';
import { serviceTierConfigs } from '@/constants/services';

const CREATIVE_BOOST_SERVICE_ID = 'srv-3';

const engagementServiceSchema = z.object({
  service_id: z.string().min(1, 'Vyberte službu'),
  name: z.string().min(1, 'Název je povinný'),
  price: z.coerce.number().min(0, 'Cena musí být kladná'),
  billing_type: z.enum(['monthly', 'one_off'] as const),
  currency: z.string().min(1, 'Měna je povinná'),
  notes: z.string(),
  // Core service tier
  selected_tier: z.string().nullable(),
  // Creative Boost specific fields
  creative_boost_min_credits: z.coerce.number().nullable(),
  creative_boost_max_credits: z.coerce.number().nullable(),
  creative_boost_price_per_credit: z.coerce.number().nullable(),
});

type EngagementServiceFormData = z.infer<typeof engagementServiceSchema>;

interface AddEngagementServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  engagementId: string;
  services: Service[];
  onSubmit: (data: Omit<EngagementService, 'id' | 'created_at' | 'updated_at'>) => void;
}

export function AddEngagementServiceDialog({
  open,
  onOpenChange,
  engagementId,
  services,
  onSubmit,
}: AddEngagementServiceDialogProps) {
  const form = useForm<EngagementServiceFormData>({
    resolver: zodResolver(engagementServiceSchema),
    defaultValues: {
      service_id: '',
      name: '',
      price: 0,
      billing_type: 'monthly',
      currency: 'CZK',
      notes: '',
      selected_tier: null,
      creative_boost_min_credits: null,
      creative_boost_max_credits: null,
      creative_boost_price_per_credit: null,
    },
  });

  const selectedServiceId = form.watch('service_id');
  const selectedTier = form.watch('selected_tier');
  const isCreativeBoost = selectedServiceId === CREATIVE_BOOST_SERVICE_ID;
  
  const selectedService = services.find(s => s.id === selectedServiceId);
  const isCoreService = selectedService?.service_type === 'core';

  // Auto-fill name and price when service is selected
  const handleServiceChange = (serviceId: string) => {
    form.setValue('service_id', serviceId);
    const service = services.find(s => s.id === serviceId);
    if (service) {
      if (!form.getValues('name')) {
        form.setValue('name', service.name);
      }
      // Set default values for Creative Boost
      if (serviceId === CREATIVE_BOOST_SERVICE_ID) {
        form.setValue('creative_boost_min_credits', 0);
        form.setValue('creative_boost_max_credits', 50);
        form.setValue('creative_boost_price_per_credit', 400);
        form.setValue('price', 0);
        form.setValue('selected_tier', null);
      } else if (service.service_type === 'core') {
        // Core service - reset and wait for tier selection
        form.setValue('creative_boost_min_credits', null);
        form.setValue('creative_boost_max_credits', null);
        form.setValue('creative_boost_price_per_credit', null);
        form.setValue('selected_tier', 'growth'); // Default to GROWTH
        // Auto-fill price from GROWTH tier
        const growthPricing = service.tier_pricing?.find(p => p.tier === 'growth');
        form.setValue('price', growthPricing?.price ?? 0);
        form.setValue('currency', service.currency);
      } else {
        // Add-on service
        form.setValue('creative_boost_min_credits', null);
        form.setValue('creative_boost_max_credits', null);
        form.setValue('creative_boost_price_per_credit', null);
        form.setValue('selected_tier', null);
        form.setValue('price', service.base_price);
        form.setValue('currency', service.currency);
      }
    }
  };

  // Handle tier change for Core services
  const handleTierChange = (tier: string) => {
    form.setValue('selected_tier', tier);
    if (selectedService?.tier_pricing) {
      const tierPricing = selectedService.tier_pricing.find(p => p.tier === tier);
      if (tierPricing?.price !== null && tierPricing?.price !== undefined) {
        form.setValue('price', tierPricing.price);
      } else {
        // Individuální kalkulace - set to 0, user must enter manually
        form.setValue('price', 0);
      }
    }
  };

  const handleSubmit = (data: EngagementServiceFormData) => {
    const isOneOff = data.billing_type === 'one_off';
    const selectedService = services.find(s => s.id === data.service_id);
    const isCore = selectedService?.service_type === 'core';
    
    onSubmit({
      engagement_id: engagementId,
      service_id: data.service_id,
      name: data.name,
      price: data.price,
      billing_type: data.billing_type,
      currency: data.currency,
      is_active: true,
      notes: data.notes,
      // Core service tier selection
      selected_tier: isCore ? (data.selected_tier as ServiceTier || null) : null,
      creative_boost_min_credits: data.creative_boost_min_credits,
      creative_boost_max_credits: data.creative_boost_max_credits,
      creative_boost_price_per_credit: data.creative_boost_price_per_credit,
      // One-off invoicing tracking
      invoicing_status: isOneOff ? 'pending' : 'not_applicable',
      invoiced_at: null,
      invoiced_in_period: null,
      invoice_id: null,
    });
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Přidat službu k zakázce</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="service_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Typ služby</FormLabel>
                  <Select onValueChange={handleServiceChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Vyberte službu" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {services.filter(s => s.is_active).map(service => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Název služby (lze upravit)</FormLabel>
                  <FormControl>
                    <Input placeholder="Např. Social Media Management" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Creative Boost specific fields */}
            {isCreativeBoost && (
              <div className="space-y-4 p-4 rounded-lg bg-muted/50 border">
                <h4 className="font-medium text-sm">Nastavení Creative Boost</h4>
                <FormDescription className="text-xs">
                  Nastavte maximální počet kreditů a cenu za kredit. Cena služby bude automaticky počítána podle spotřebovaných kreditů.
                </FormDescription>
                
                <FormField
                  control={form.control}
                  name="creative_boost_max_credits"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max. kreditů</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={0} 
                          placeholder="50"
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="creative_boost_price_per_credit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cena za kredit (CZK)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={0} 
                          placeholder="400"
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Odhad fakturace při max. kreditech: {' '}
                        <span className="font-medium">
                          {((form.watch('creative_boost_max_credits') ?? 0) * (form.watch('creative_boost_price_per_credit') ?? 0)).toLocaleString()} CZK
                        </span>
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Core service tier selection */}
            {isCoreService && !isCreativeBoost && (
              <div className="space-y-4 p-4 rounded-lg bg-muted/50 border">
                <h4 className="font-medium text-sm">Úroveň služby (dle spendu klienta)</h4>
                <FormField
                  control={form.control}
                  name="selected_tier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vyberte úroveň</FormLabel>
                      <Select 
                        onValueChange={handleTierChange} 
                        value={field.value ?? 'growth'}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Vyberte úroveň" />
                          </SelectTrigger>
                        </FormControl>
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {selectedTier === 'elite' && (
                  <FormDescription className="text-xs text-amber-600">
                    Pro úroveň ELITE je nutné zadat cenu manuálně (individuální kalkulace).
                  </FormDescription>
                )}
              </div>
            )}

            {/* Standard price field - hidden for Creative Boost */}
            {!isCreativeBoost && (
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Cena
                        {isCoreService && selectedTier !== 'elite' && (
                          <span className="text-muted-foreground font-normal ml-1">(předvyplněno)</span>
                        )}
                      </FormLabel>
                      <FormControl>
                        <Input type="number" min={0} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="billing_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Typ fakturace</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="monthly">Měsíčně</SelectItem>
                          <SelectItem value="one_off">Jednorázově</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Měna</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="CZK">CZK</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Poznámky</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Interní poznámky ke službě..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Zrušit
              </Button>
              <Button type="submit">
                Přidat službu
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
