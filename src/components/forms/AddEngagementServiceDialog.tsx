import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
import { Label } from '@/components/ui/label';
import { TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { useCRMData } from '@/hooks/useCRMData';
import type { Service, EngagementService, ServiceTier } from '@/types/crm';
import { serviceTierConfigs } from '@/constants/services';
import { convertCurrencyAmount, getExchangeRate } from '@/lib/currency';

const CREATIVE_BOOST_SERVICE_CODE = 'CREATIVE_BOOST';

const engagementServiceSchema = z.object({
  service_id: z.string().min(1, 'Vyberte službu'),
  name: z.string().min(1, 'Název je povinný'),
  price: z.coerce.number().min(0, 'Cena musí být kladná'),
  currency: z.string().min(1, 'Měna je povinná'),
  notes: z.string(),
  // Core service tier
  selected_tier: z.string().nullable(),
  // Creative Boost specific fields
  creative_boost_min_credits: z.coerce.number().nullable(),
  creative_boost_max_credits: z.coerce.number().nullable(),
  creative_boost_price_per_credit: z.coerce.number().nullable(),
  creative_boost_fixed_billing: z.boolean(),
  creative_boost_reward_per_credit_banner: z.coerce.number().nullable(),
  creative_boost_reward_per_credit_video: z.coerce.number().nullable(),
});

type EngagementServiceFormData = z.infer<typeof engagementServiceSchema>;

interface PriceConversionMeta {
  sourceAmount: number;
  sourceCurrency: string;
  targetAmount: number;
  targetCurrency: string;
  rate: number;
  providerDate: string;
}

interface AddEngagementServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  engagementId: string;
  engagementCurrency: string;
  services: Service[];
  existingService?: EngagementService | null;
  onSubmit: (data: Omit<EngagementService, 'id' | 'created_at' | 'updated_at'>) => void | Promise<void>;
}

const isCreativeBoostService = (service?: Service) =>
  service?.code === CREATIVE_BOOST_SERVICE_CODE ||
  service?.name?.toLowerCase().includes('creative boost');

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

export function AddEngagementServiceDialog({
  open,
  onOpenChange,
  engagementId,
  engagementCurrency,
  services,
  existingService = null,
  onSubmit,
}: AddEngagementServiceDialogProps) {
  const { colleagues } = useCRMData();
  const [upsoldById, setUpsoldById] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConvertingPrice, setIsConvertingPrice] = useState(false);
  const [conversionError, setConversionError] = useState<string | null>(null);
  const [priceConversionMeta, setPriceConversionMeta] = useState<PriceConversionMeta | null>(null);
  const [serviceToEngagementRate, setServiceToEngagementRate] = useState<number | null>(null);
  const latestConversionRequestRef = useRef(0);
  
  const activeColleagues = colleagues.filter(c => c.status === 'active');

  const form = useForm<EngagementServiceFormData>({
    resolver: zodResolver(engagementServiceSchema),
    defaultValues: {
      service_id: '',
      name: '',
      price: 0,
      currency: engagementCurrency,
      notes: '',
      selected_tier: null,
      creative_boost_min_credits: null,
      creative_boost_max_credits: null,
      creative_boost_price_per_credit: null,
      creative_boost_fixed_billing: true,
      creative_boost_reward_per_credit_banner: null,
      creative_boost_reward_per_credit_video: null,
    },
  });

  const selectedServiceId = form.watch('service_id');
  const selectedTier = form.watch('selected_tier');
  const isEditing = existingService !== null;

  useEffect(() => {
    if (!open) return;
    if (existingService) {
      form.reset({
        service_id: existingService.service_id,
        name: existingService.name,
        price: existingService.price,
        currency: existingService.currency,
        notes: existingService.notes || '',
        selected_tier: existingService.selected_tier,
        creative_boost_min_credits: existingService.creative_boost_min_credits,
        creative_boost_max_credits: existingService.creative_boost_max_credits,
        creative_boost_price_per_credit: existingService.creative_boost_price_per_credit,
        creative_boost_fixed_billing: existingService.creative_boost_fixed_billing !== false,
        creative_boost_reward_per_credit_banner: existingService.creative_boost_reward_per_credit_banner,
        creative_boost_reward_per_credit_video: existingService.creative_boost_reward_per_credit_video,
      });
      setUpsoldById(existingService.upsold_by_id);
      return;
    }

    form.reset({
      service_id: '',
      name: '',
      price: 0,
      currency: engagementCurrency,
      notes: '',
      selected_tier: null,
      creative_boost_min_credits: null,
      creative_boost_max_credits: null,
      creative_boost_price_per_credit: null,
      creative_boost_fixed_billing: true,
      creative_boost_reward_per_credit_banner: null,
      creative_boost_reward_per_credit_video: null,
    });
    setUpsoldById(null);
  }, [open, engagementCurrency, existingService, form]);

  const selectedService = services.find(s => s.id === selectedServiceId);
  const isCreativeBoost = isCreativeBoostService(selectedService);
  const isCoreService = selectedService?.service_type === 'core';

  useEffect(() => {
    setConversionError(null);
    setPriceConversionMeta(null);
    setServiceToEngagementRate(null);
    setIsConvertingPrice(false);
  }, [selectedServiceId]);

  useEffect(() => {
    const serviceCurrency = selectedService?.currency;
    if (!serviceCurrency || serviceCurrency === engagementCurrency) {
      setServiceToEngagementRate(1);
      return;
    }

    let cancelled = false;
    getExchangeRate(serviceCurrency, engagementCurrency)
      .then(({ rate }) => {
        if (cancelled) return;
        setServiceToEngagementRate(rate);
      })
      .catch((error) => {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : 'Nepodařilo se načíst kurz';
        setConversionError(message);
        setServiceToEngagementRate(null);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedService?.currency, engagementCurrency]);

  async function applyPriceFromService(
    sourceAmount: number,
    sourceCurrency: string,
  ): Promise<void> {
    setConversionError(null);
    setPriceConversionMeta(null);

    if (sourceCurrency === engagementCurrency) {
      form.setValue('price', sourceAmount);
      return;
    }

    const requestId = latestConversionRequestRef.current + 1;
    latestConversionRequestRef.current = requestId;
    setIsConvertingPrice(true);

    try {
      const conversion = await convertCurrencyAmount(sourceAmount, sourceCurrency, engagementCurrency);
      if (latestConversionRequestRef.current !== requestId) {
        return;
      }

      form.setValue('price', conversion.amount);
      setPriceConversionMeta({
        sourceAmount,
        sourceCurrency,
        targetAmount: conversion.amount,
        targetCurrency: engagementCurrency,
        rate: conversion.rate,
        providerDate: conversion.providerDate,
      });
    } catch (error) {
      if (latestConversionRequestRef.current !== requestId) {
        return;
      }
      const message = error instanceof Error ? error.message : 'Nepodařilo se převést cenu';
      setConversionError(message);
      throw error;
    } finally {
      if (latestConversionRequestRef.current === requestId) {
        setIsConvertingPrice(false);
      }
    }
  }

  // Auto-fill name and price when service is selected
  const handleServiceChange = async (serviceId: string) => {
    form.setValue('service_id', serviceId);
    const service = services.find(s => s.id === serviceId);
    if (service) {
      if (!form.getValues('name')) {
        form.setValue('name', service.name);
      }
      // Set default values for Creative Boost
      if (isCreativeBoostService(service)) {
        form.setValue('creative_boost_min_credits', 0);
        form.setValue('creative_boost_max_credits', 50);
        form.setValue('creative_boost_price_per_credit', 400);
        form.setValue('creative_boost_fixed_billing', true);
        form.setValue('creative_boost_reward_per_credit_banner', 80);
        form.setValue('creative_boost_reward_per_credit_video', 80);
        form.setValue('price', 0);
        form.setValue('selected_tier', null);
      } else if (service.service_type === 'core') {
        // Core service - reset and wait for tier selection
        form.setValue('creative_boost_min_credits', null);
        form.setValue('creative_boost_max_credits', null);
        form.setValue('creative_boost_price_per_credit', null);
        form.setValue('creative_boost_fixed_billing', true);
        form.setValue('creative_boost_reward_per_credit_banner', null);
        form.setValue('creative_boost_reward_per_credit_video', null);
        form.setValue('selected_tier', 'growth'); // Default to GROWTH
        // Auto-fill price from GROWTH tier
        const growthPrice = getTierPrice(service, 'growth');
        if (growthPrice === null) {
          form.setValue('price', 0);
        } else {
          try {
            await applyPriceFromService(growthPrice, service.currency);
          } catch (error) {
            console.error('Price conversion error:', error);
          }
        }
        form.setValue('currency', engagementCurrency);
      } else {
        // Add-on service
        form.setValue('creative_boost_min_credits', null);
        form.setValue('creative_boost_max_credits', null);
        form.setValue('creative_boost_price_per_credit', null);
        form.setValue('creative_boost_fixed_billing', true);
        form.setValue('creative_boost_reward_per_credit_banner', null);
        form.setValue('creative_boost_reward_per_credit_video', null);
        form.setValue('selected_tier', null);
        try {
          await applyPriceFromService(service.base_price, service.currency);
        } catch (error) {
          console.error('Price conversion error:', error);
        }
        form.setValue('currency', engagementCurrency);
      }
    }
  };

  // Handle tier change for Core services
  const handleTierChange = async (tier: string) => {
    form.setValue('selected_tier', tier);

    const tierPrice = getTierPrice(selectedService, tier as ServiceTier);
    if (tierPrice !== null) {
      try {
        await applyPriceFromService(tierPrice, selectedService?.currency ?? engagementCurrency);
      } catch (error) {
        console.error('Tier conversion error:', error);
      }
    } else {
      // Individuální kalkulace - set to 0, user must enter manually
      form.setValue('price', 0);
    }
  };

  const handleManualSubmit = async () => {
    const isValid = await form.trigger();
    if (!isValid) {
      const errors = form.formState.errors;
      const errorMessages = Object.entries(errors)
        .map(([field, error]) => `${field}: ${(error as { message?: string })?.message || 'Neplatné'}`)
        .join(', ');
      toast.error(`Formulář obsahuje chyby: ${errorMessages}`);
      return;
    }

    const data = form.getValues();
    const selectedService = services.find(s => s.id === data.service_id);
    if (!selectedService) {
      toast.error('Vyberte službu');
      return;
    }

    // Validate Creative Boost has at least 1 credit
    if (isCreativeBoostService(selectedService)) {
      if (!data.creative_boost_max_credits || data.creative_boost_max_credits <= 0) {
        toast.error('Creative Boost musí mít alespoň 1 kredit');
        return;
      }
      if (!data.creative_boost_price_per_credit || data.creative_boost_price_per_credit <= 0) {
        toast.error('Creative Boost musí mít nastavenou cenu za kredit');
        return;
      }
    }

    const isOneOff = selectedService.billing_type === 'one_off';
    const isCore = selectedService.service_type === 'core';

    setIsSubmitting(true);

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout: operace trvala příliš dlouho')), 30000)
    );

    try {
      await Promise.race([
        onSubmit({
          engagement_id: engagementId,
          service_id: data.service_id,
          name: data.name,
          price: data.price,
          billing_type: selectedService.billing_type,
          currency: engagementCurrency,
          is_active: true,
          notes: data.notes,
          // Core service tier selection
          selected_tier: isCore ? (data.selected_tier as ServiceTier || null) : null,
          creative_boost_min_credits: data.creative_boost_min_credits,
          creative_boost_max_credits: data.creative_boost_max_credits,
          creative_boost_price_per_credit: data.creative_boost_price_per_credit,
          creative_boost_fixed_billing: data.creative_boost_fixed_billing,
          creative_boost_reward_per_credit_banner: data.creative_boost_reward_per_credit_banner,
          creative_boost_reward_per_credit_video: data.creative_boost_reward_per_credit_video,
          // One-off invoicing tracking
          invoicing_status: existingService ? existingService.invoicing_status : (isOneOff ? 'pending' : 'not_applicable'),
          invoiced_at: existingService ? existingService.invoiced_at : null,
          invoiced_in_period: existingService ? existingService.invoiced_in_period : null,
          invoice_id: existingService ? existingService.invoice_id : null,
          // Upsell tracking
          upsold_by_id: upsoldById,
          upsell_commission_percent: upsoldById ? 10 : null,
          // Intro discount is intentionally not set in this flow
          intro_discount_percent: null,
          intro_discount_months: null,
          intro_discount_start_date: null,
        }),
        timeoutPromise
      ]);
      form.reset();
      setUpsoldById(null);
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding service:', error);
      const errorMessage = error instanceof Error ? error.message : 'Neznámá chyba';
      toast.error(`Chyba: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const watchedPrice = form.watch('price');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Upravit službu zakázky' : 'Přidat službu k zakázce'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4">
            <FormField
              control={form.control}
              name="service_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Typ služby</FormLabel>
                  <Select onValueChange={handleServiceChange} value={field.value} disabled={isEditing}>
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
                  {isEditing && (
                    <FormDescription className="text-xs">
                      Typ služby nelze měnit, upravit lze název, cenu a další nastavení.
                    </FormDescription>
                  )}
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
                            {engagementCurrency}
                          </span>
                        </div>
                      </FormControl>
                      <FormDescription className="text-xs">
                        Kolik klient zaplatí za jeden kredit
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="pt-2 border-t space-y-2">
                  <FormField
                    control={form.control}
                    name="creative_boost_fixed_billing"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between gap-3 rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm font-medium">Fixní fakturace</FormLabel>
                          <FormDescription className="text-xs">
                            {field.value
                              ? 'Klient platí celý balíček bez ohledu na čerpání'
                              : 'Klient platí pouze dle skutečně vyčerpaných kreditů'}
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <div>
                    <p className="text-sm font-medium">
                      {form.watch('creative_boost_fixed_billing') ? 'Měsíční fakturace (fixní):' : 'Max. měsíční fakturace (dle čerpání):'}{' '}
                      <span className="text-primary">
                        {((form.watch('creative_boost_max_credits') ?? 0) * (form.watch('creative_boost_price_per_credit') ?? 0)).toLocaleString('cs-CZ')} {engagementCurrency}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      = {form.watch('creative_boost_max_credits') ?? 0} kreditů × {form.watch('creative_boost_price_per_credit') ?? 0} {engagementCurrency}/kredit
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground border-t pt-2 mt-2">
                    💡 Odměna za kredit je globální pro celou zakázku (Creative Boost službu) a lze ji upravit i v přiřazení kolegy.
                  </p>
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
                            const tierPrice = getTierPrice(selectedService, config.tier);
                            const priceLabel = tierPrice !== null
                              ? (
                                selectedService?.currency !== engagementCurrency && serviceToEngagementRate
                                  ? `${tierPrice.toLocaleString('cs-CZ')} ${selectedService?.currency} (~ ${(tierPrice * serviceToEngagementRate).toLocaleString('cs-CZ', { maximumFractionDigits: engagementCurrency === 'CZK' ? 0 : 2 })} ${engagementCurrency})`
                                  : `${tierPrice.toLocaleString('cs-CZ')} ${selectedService?.currency ?? engagementCurrency}`
                              )
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
                      {isConvertingPrice && (
                        <FormDescription className="text-xs">
                          Přepočítávám cenu podle aktuálního kurzu...
                        </FormDescription>
                      )}
                      {priceConversionMeta && (
                        <FormDescription className="text-xs">
                          Cena přepočtena z {priceConversionMeta.sourceAmount.toLocaleString('cs-CZ')} {priceConversionMeta.sourceCurrency}
                          {' '}na {priceConversionMeta.targetAmount.toLocaleString('cs-CZ')} {priceConversionMeta.targetCurrency}
                          {' '}kurzem {priceConversionMeta.rate.toFixed(4)} (datum kurzu {priceConversionMeta.providerDate}).
                        </FormDescription>
                      )}
                      {conversionError && (
                        <FormDescription className="text-xs text-destructive">
                          Nepodařilo se načíst kurz nebo přepočítat cenu: {conversionError}
                        </FormDescription>
                      )}
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
                  <FormLabel>Měna zakázky</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange} disabled>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={engagementCurrency}>
                        {engagementCurrency}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-xs">
                    Služba musí mít stejnou měnu jako zakázka.
                  </FormDescription>
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

            {/* Upsell section */}
            <div className="p-4 rounded-lg bg-muted/50 border space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <Label className="font-medium">Upsell (volitelné)</Label>
              </div>
              <div className="grid gap-2">
                <Label className="text-sm text-muted-foreground">Prodal kolega</Label>
                <Select
                  value={upsoldById || '__none__'}
                  onValueChange={(val) => setUpsoldById(val === '__none__' ? null : val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Žádný upsell" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Žádný upsell</SelectItem>
                    {activeColleagues.map(col => (
                      <SelectItem key={col.id} value={col.id}>
                        {col.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {upsoldById && watchedPrice > 0 && (
                <p className="text-sm text-green-600 font-medium">
                  💰 Provize 10%: {watchedPrice * 0.1} {form.getValues('currency')}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Zrušit
              </Button>
              <Button type="button" onClick={handleManualSubmit} disabled={isSubmitting}>
                {isSubmitting ? (isEditing ? 'Ukládám...' : 'Přidávám...') : (isEditing ? 'Uložit změny' : 'Přidat službu')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
