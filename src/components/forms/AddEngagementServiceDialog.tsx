import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, getDaysInMonth, differenceInDays, startOfMonth, endOfMonth, isFirstDayOfMonth } from 'date-fns';
import { cs } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { TrendingUp, CalendarIcon, Calculator, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCRMData } from '@/hooks/useCRMData';
import type { Service, EngagementService, ServiceTier } from '@/types/crm';
import { serviceTierConfigs } from '@/constants/services';

const CREATIVE_BOOST_CODE = 'CREATIVE_BOOST';

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
  creative_boost_colleague_reward_per_credit: z.coerce.number().nullable(),
  // Effective date for prorated billing
  effective_from: z.date().nullable(),
});

type EngagementServiceFormData = z.infer<typeof engagementServiceSchema>;

interface AddEngagementServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  engagementId: string;
  services: Service[];
  onSubmit: (data: Omit<EngagementService, 'id' | 'created_at' | 'updated_at'>) => void;
}

// Proration calculation helper
function calculateProration(effectiveFrom: Date, monthlyPrice: number) {
  const daysInMonth = getDaysInMonth(effectiveFrom);
  const monthEnd = endOfMonth(effectiveFrom);
  const daysRemaining = differenceInDays(monthEnd, effectiveFrom) + 1; // Include start day
  const proratedAmount = Math.round((monthlyPrice / daysInMonth) * daysRemaining);
  const isProrated = !isFirstDayOfMonth(effectiveFrom);
  
  return {
    daysInMonth,
    daysRemaining,
    proratedAmount,
    isProrated,
    percentOfMonth: Math.round((daysRemaining / daysInMonth) * 100),
  };
}

export function AddEngagementServiceDialog({
  open,
  onOpenChange,
  engagementId,
  services,
  onSubmit,
}: AddEngagementServiceDialogProps) {
  const { colleagues } = useCRMData();
  const [upsoldById, setUpsoldById] = useState<string | null>(null);
  
  const activeColleagues = colleagues.filter(c => c.status === 'active');

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
      creative_boost_colleague_reward_per_credit: null,
      effective_from: new Date(), // Default to today
    },
  });

  const selectedServiceId = form.watch('service_id');
  const selectedTier = form.watch('selected_tier');
  const effectiveFrom = form.watch('effective_from');
  const billingType = form.watch('billing_type');
  
  const selectedService = services.find(s => s.id === selectedServiceId);
  const isCreativeBoost = selectedService?.code === CREATIVE_BOOST_CODE;
  const isCoreService = selectedService?.service_type === 'core';

  // Calculate proration info
  const prorationInfo = useMemo(() => {
    if (!effectiveFrom || billingType === 'one_off') return null;
    
    // Get monthly price (for Creative Boost, calculate from credits)
    const monthlyPrice = isCreativeBoost 
      ? (form.watch('creative_boost_max_credits') ?? 0) * (form.watch('creative_boost_price_per_credit') ?? 0)
      : form.watch('price');
    
    if (monthlyPrice <= 0) return null;
    
    return calculateProration(effectiveFrom, monthlyPrice);
  }, [effectiveFrom, billingType, isCreativeBoost, form.watch('price'), form.watch('creative_boost_max_credits'), form.watch('creative_boost_price_per_credit')]);

  // Auto-fill name and price when service is selected
  const handleServiceChange = (serviceId: string) => {
    form.setValue('service_id', serviceId);
    const service = services.find(s => s.id === serviceId);
    if (service) {
      if (!form.getValues('name')) {
        form.setValue('name', service.name);
      }
      if (service.code === CREATIVE_BOOST_CODE) {
        form.setValue('creative_boost_min_credits', 0);
        form.setValue('creative_boost_max_credits', 50);
        form.setValue('creative_boost_price_per_credit', 400);
        form.setValue('creative_boost_colleague_reward_per_credit', 80);
        form.setValue('price', 0);
        form.setValue('selected_tier', null);
      } else if (service.service_type === 'core') {
        form.setValue('creative_boost_min_credits', null);
        form.setValue('creative_boost_max_credits', null);
        form.setValue('creative_boost_price_per_credit', null);
        form.setValue('creative_boost_colleague_reward_per_credit', null);
        form.setValue('selected_tier', 'growth');
        const growthPricing = service.tier_pricing?.find(p => p.tier === 'growth');
        form.setValue('price', growthPricing?.price ?? 0);
        form.setValue('currency', service.currency);
      } else {
        form.setValue('creative_boost_min_credits', null);
        form.setValue('creative_boost_max_credits', null);
        form.setValue('creative_boost_price_per_credit', null);
        form.setValue('creative_boost_colleague_reward_per_credit', null);
        form.setValue('selected_tier', null);
        form.setValue('price', service.base_price);
        form.setValue('currency', service.currency);
      }
    }
  };

  const handleTierChange = (tier: string) => {
    form.setValue('selected_tier', tier);
    if (selectedService?.tier_pricing) {
      const tierPricing = selectedService.tier_pricing.find(p => p.tier === tier);
      if (tierPricing?.price !== null && tierPricing?.price !== undefined) {
        form.setValue('price', tierPricing.price);
      } else {
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
      selected_tier: isCore ? (data.selected_tier as ServiceTier || null) : null,
      creative_boost_min_credits: data.creative_boost_min_credits,
      creative_boost_max_credits: data.creative_boost_max_credits,
      creative_boost_price_per_credit: data.creative_boost_price_per_credit,
      creative_boost_colleague_reward_per_credit: data.creative_boost_colleague_reward_per_credit,
      invoicing_status: isOneOff ? 'pending' : 'not_applicable',
      invoiced_at: null,
      invoiced_in_period: null,
      invoice_id: null,
      upsold_by_id: upsoldById,
      upsell_commission_percent: upsoldById ? 10 : null,
      effective_from: data.effective_from ? format(data.effective_from, 'yyyy-MM-dd') : null,
    });
    form.reset();
    setUpsoldById(null);
    onOpenChange(false);
  };

  const watchedPrice = form.watch('price');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Přidat službu k zakázce</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pb-6">
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
                <h4 className="font-medium text-sm">🎨 Nastavení Creative Boost</h4>
                <FormDescription className="text-xs">
                  Nastavte kreditový balíček pro klienta. Fakturace probíhá měsíčně na základě dohodnutého balíčku.
                </FormDescription>
                
                <FormField
                  control={form.control}
                  name="creative_boost_max_credits"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Měsíční kreditový balíček</FormLabel>
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
                      <FormDescription className="text-xs">
                        Kolik kreditů má klient k dispozici měsíčně
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="creative_boost_price_per_credit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>💰 Cena za kredit pro klienta</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type="number" 
                            min={0} 
                            placeholder="400"
                            className="pr-12"
                            {...field}
                            value={field.value ?? ''}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                            CZK
                          </span>
                        </div>
                      </FormControl>
                      <FormDescription className="text-xs">
                        Kolik klient zaplatí za jeden kredit (doporučeno: 400 Kč)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="creative_boost_colleague_reward_per_credit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>🎨 Odměna za kredit pro grafika</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type="number" 
                            min={0} 
                            placeholder="80"
                            className="pr-12"
                            {...field}
                            value={field.value ?? ''}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                            CZK
                          </span>
                        </div>
                      </FormControl>
                      <FormDescription className="text-xs">
                        Odměna pro přiřazeného kolegu/grafika za každý kredit (doporučeno: 80 Kč)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="pt-2 border-t space-y-2">
                  <div>
                    <p className="text-sm font-medium">
                      Měsíční fakturace: {' '}
                      <span className="text-primary">
                        {((form.watch('creative_boost_max_credits') ?? 0) * (form.watch('creative_boost_price_per_credit') ?? 0)).toLocaleString('cs-CZ')} CZK
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      = {form.watch('creative_boost_max_credits') ?? 0} kreditů × {form.watch('creative_boost_price_per_credit') ?? 0} Kč/kredit
                    </p>
                  </div>
                  {(form.watch('creative_boost_colleague_reward_per_credit') ?? 0) > 0 && (
                    <div>
                      <p className="text-sm font-medium">
                        Odměna pro grafika: {' '}
                        <span className="text-green-600">
                          {((form.watch('creative_boost_max_credits') ?? 0) * (form.watch('creative_boost_colleague_reward_per_credit') ?? 0)).toLocaleString('cs-CZ')} CZK/měsíc
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        = {form.watch('creative_boost_max_credits') ?? 0} kreditů × {form.watch('creative_boost_colleague_reward_per_credit') ?? 0} Kč/kredit
                      </p>
                    </div>
                  )}
                </div>
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

            {/* Effective From Date - for prorated billing */}
            {billingType === 'monthly' && (
              <FormField
                control={form.control}
                name="effective_from"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Od kdy služba platí</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "d. MMMM yyyy", { locale: cs })
                            ) : (
                              <span>Vyberte datum</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ?? undefined}
                          onSelect={field.onChange}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription className="text-xs">
                      Pokud začátek není 1. den měsíce, bude fakturace poměrná.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Proration Calculator */}
            {prorationInfo && prorationInfo.isProrated && (
              <div className="p-4 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 space-y-3">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                  <Calculator className="h-4 w-4" />
                  <span className="font-medium text-sm">Kalkulace poměrné fakturace</span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dní do konce měsíce:</span>
                    <span className="font-medium">{prorationInfo.daysRemaining} z {prorationInfo.daysInMonth}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Procento měsíce:</span>
                    <span className="font-medium">{prorationInfo.percentOfMonth}%</span>
                  </div>
                  <div className="pt-2 border-t border-amber-200 dark:border-amber-800 flex justify-between">
                    <span className="font-medium">Fakturace za {effectiveFrom ? format(effectiveFrom, 'MMMM', { locale: cs }) : 'měsíc'}:</span>
                    <span className="font-bold text-primary">
                      {prorationInfo.proratedAmount.toLocaleString('cs-CZ')} {form.getValues('currency')}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                  <span>Od následujícího měsíce bude fakturována plná částka.</span>
                </div>
              </div>
            )}

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

            {/* Upsell section */}
            <div className="p-4 rounded-lg bg-muted/50 border space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <Label className="font-medium">Upsell (volitelné)</Label>
              </div>
              <div className="grid gap-2">
                <Label className="text-sm text-muted-foreground">Prodal kolega</Label>
                <Select 
                  value={upsoldById || 'none'} 
                  onValueChange={(val) => setUpsoldById(val === 'none' ? null : val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Žádný upsell" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Žádný upsell</SelectItem>
                    {activeColleagues.map(col => (
                      <SelectItem key={col.id} value={col.id}>
                        {col.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {upsoldById && (() => {
                // Calculate commission base - use prorated amount if applicable
                const fullPrice = isCreativeBoost 
                  ? (form.watch('creative_boost_max_credits') ?? 0) * (form.watch('creative_boost_price_per_credit') ?? 0)
                  : watchedPrice;
                
                const commissionBase = prorationInfo?.isProrated 
                  ? prorationInfo.proratedAmount 
                  : fullPrice;
                
                if (commissionBase > 0) {
                  return (
                    <div className="text-sm space-y-1">
                      <p className="text-muted-foreground">
                        Provize 10% z první fakturace ({commissionBase.toLocaleString('cs-CZ')} {form.getValues('currency')}):
                      </p>
                      <p className="text-green-600 font-medium">
                        💰 {Math.round(commissionBase * 0.1).toLocaleString('cs-CZ')} {form.getValues('currency')}
                      </p>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
