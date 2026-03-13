import { useForm } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertTriangle, Loader2, Search } from 'lucide-react';
import type { Client, ClientStatus, LeadSource } from '@/types/crm';
import { useAuth } from '@/hooks/useAuth';
import { useAresLookup } from '@/hooks/useAresLookup';
import type { CompanySearchResult } from '@/hooks/useAresSearch';
import { CompanySearchInput } from '@/components/shared/CompanySearchInput';
import { toast } from 'sonner';
import { getAvailableClientStatuses, CLIENT_STATUS_LABELS } from '@/lib/statusTransitions';
import { optionalEmail, czechIco, czechDic, isValidUrlInput, normalizeUrlProtocol } from '@/lib/validation';
import { toDateOnlyString } from '@/lib/dbNormalize';

const ACQUISITION_OPTIONS: { value: LeadSource; label: string }[] = [
  { value: 'referral', label: 'Doporučení' },
  { value: 'inbound', label: 'Inbound' },
  { value: 'cold_outreach', label: 'Cold outreach' },
  { value: 'event', label: 'Event/konference' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'website', label: 'Web' },
  { value: 'other', label: 'Jiný' },
];

const INDUSTRY_OPTIONS = [
  { value: 'Ecommerce', label: 'Ecommerce' },
  { value: 'LeadGen', label: 'LeadGen' },
] as const;

function isValidIndustryValue(value: string | undefined): value is typeof INDUSTRY_OPTIONS[number]['value'] {
  if (!value) return false;
  return INDUSTRY_OPTIONS.some((option) => option.value === value);
}

// Acquisition channel enum matching lead sources
const acquisitionChannels = [
  'referral', 'inbound', 'cold_outreach', 'event',
  'linkedin', 'website', 'other'
] as const;

const clientSchema = z.object({
  name: z.string()
    .min(1, 'Název firmy je povinný')
    .max(255, 'Název je příliš dlouhý')
    .transform(s => s.trim()),
  brand_name: z.string()
    .min(1, 'Brand je povinný')
    .max(255, 'Brand je příliš dlouhý')
    .transform(s => s.trim()),
  ico: czechIco,
  dic: czechDic,
  website: z.string()
    .max(500, 'URL je příliš dlouhá')
    .transform(val => val.trim())
    .refine(
      val => val === '' || isValidUrlInput(val),
      'Zadejte platnou URL'
    )
    .transform(val => val === '' ? '' : normalizeUrlProtocol(val)),
  country: z.string()
    .min(1, 'Země je povinná')
    .max(100, 'Název země je příliš dlouhý'),
  industry: z.string()
    .min(1, 'Odvětví je povinné')
    .refine(
      (value) => INDUSTRY_OPTIONS.some((option) => option.value === value),
      'Vyberte odvětví'
    ),
  status: z.enum(['lead', 'active', 'paused', 'lost', 'potential'] as const),
  currency: z.enum(['CZK', 'EUR', 'USD']),
  // Billing - transform empty strings to null for clean database storage
  billing_email: optionalEmail,
  billing_street: z.string().max(255, 'Adresa je příliš dlouhá').transform(val => val?.trim() || null).nullable(),
  billing_city: z.string().max(100, 'Název města je příliš dlouhý').transform(val => val?.trim() || null).nullable(),
  billing_zip: z.string().max(20, 'PSČ je příliš dlouhé').transform(val => val?.trim() || null).nullable(),
  billing_country: z.string().max(100, 'Název země je příliš dlouhý').transform(val => val?.trim() || null).nullable(),
  acquisition_channel: z.enum(acquisitionChannels, {
    errorMap: () => ({ message: 'Vyberte zdroj akvizice' })
  }).or(z.literal('')),
  start_date: z.string()
    .min(1, 'Datum je povinné')
    .refine(val => !isNaN(Date.parse(val)), 'Neplatné datum'),
  notes: z.string().max(5000, 'Poznámky jsou příliš dlouhé'),
}).superRefine((data, ctx) => {
  // Cross-validate DIČ against IČO for Czech legal entities (s.r.o., a.s., etc.)
  // Note: OSVČ (sole proprietors) may have DIČ based on birth number, not IČO
  // Only show warning for 10-digit DIČ (which should match IČO for legal entities)
  if (data.dic && data.ico && data.country === 'Czech Republic') {
    const expectedDic = `CZ${data.ico}`;
    // Only validate if DIČ has exactly 10 digits (CZ + 8 = legal entity format)
    // OSVČ can have 9-10 digit birth numbers which won't match IČO
    if (data.dic.length === 10 && data.dic !== expectedDic) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Pro právnické osoby by DIČ mělo být CZ + IČO. Pokud jde o OSVČ, ignorujte toto upozornění.`,
        path: ['dic'],
      });
    }
  }
});

type ClientFormData = z.infer<typeof clientSchema>;

const CURRENCY_OPTIONS = [
  { value: 'CZK', label: 'CZK' },
  { value: 'EUR', label: 'EUR' },
  { value: 'USD', label: 'USD' },
] as const;

interface ClientFormProps {
  client?: Client;
  hasActiveEngagements?: boolean;
  hasEngagements?: boolean;
  isSuperAdmin?: boolean;
  onSubmit: (data: ClientFormData & { end_date: string | null; created_by: string }) => void;
  onCancel: () => void;
}

export function ClientForm({ client, hasActiveEngagements = false, hasEngagements = false, isSuperAdmin = false, onSubmit, onCancel }: ClientFormProps) {
  const { user } = useAuth();
  const { lookupCompany, isLoading: isLoadingAres } = useAresLookup();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get available status options based on current status and user role
  const currentStatus = client?.status || 'lead';
  const availableStatuses = getAvailableClientStatuses(currentStatus, isSuperAdmin);
  const isCurrencyLocked = hasEngagements || hasActiveEngagements;

  const normalizeClientCurrency = (value: string | undefined): 'CZK' | 'EUR' | 'USD' => {
    if (!value) return 'CZK';
    if (!CURRENCY_OPTIONS.some((option) => option.value === value)) {
      throw new Error(`Neplatná měna klienta: ${value}`);
    }
    return value as 'CZK' | 'EUR' | 'USD';
  };

  const getDefaultValues = (c?: Client): ClientFormData => ({
    name: c?.name || '',
    brand_name: c?.brand_name || '',
    ico: c?.ico || '',
    dic: c?.dic || '',
    website: c?.website || '',
    country: c?.country || 'Czech Republic',
    industry: isValidIndustryValue(c?.industry) ? c.industry : '',
    status: c?.status || 'lead',
    currency: normalizeClientCurrency(c?.currency),
    billing_email: c?.billing_email || '',
    billing_street: c?.billing_street || '',
    billing_city: c?.billing_city || '',
    billing_zip: c?.billing_zip || '',
    billing_country: c?.billing_country || 'Czech Republic',
    acquisition_channel: c?.acquisition_channel || '',
    start_date: c?.start_date || toDateOnlyString(new Date()),
    notes: c?.notes || '',
  });

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: getDefaultValues(client),
  });

  function setCzechCompanyDefaults() {
    form.setValue('country', 'Czech Republic', { shouldDirty: true, shouldValidate: true });
    form.setValue('billing_country', 'Czech Republic', { shouldDirty: true });
  }

  function applyAddressFromLookup(address: string) {
    if (!address) return;
    const addressParts = address.split(',');

    if (addressParts.length >= 2) {
      form.setValue('billing_street', addressParts[0].trim(), { shouldDirty: true });
      const cityZip = addressParts[addressParts.length - 1].trim().split(' ');
      if (cityZip.length >= 2) {
        form.setValue('billing_zip', cityZip[0], { shouldDirty: true });
        form.setValue('billing_city', cityZip.slice(1).join(' '), { shouldDirty: true });
      } else {
        form.setValue('billing_city', cityZip[0], { shouldDirty: true });
      }
      return;
    }

    form.setValue('billing_street', address, { shouldDirty: true });
  }

  function handleCompanySelect(company: CompanySearchResult) {
    form.setValue('name', company.name, { shouldDirty: true, shouldValidate: true });
    form.setValue('ico', company.ico, { shouldDirty: true, shouldValidate: true });
    form.setValue('dic', company.dic || '', { shouldDirty: true, shouldValidate: true });
    form.setValue('billing_street', company.billing_street || '', { shouldDirty: true });
    form.setValue('billing_city', company.billing_city || '', { shouldDirty: true });
    form.setValue('billing_zip', company.billing_zip || '', { shouldDirty: true });
    setCzechCompanyDefaults();

    if (!form.getValues('brand_name').trim()) {
      form.setValue('brand_name', company.name, { shouldDirty: true, shouldValidate: true });
    }

    toast.success('Údaje načteny z ARES');
  }

  async function handleAresLookup() {
    const ico = form.getValues('ico').trim();
    if (!/^\d{7,8}$/.test(ico)) {
      toast.error('Zadejte platné IČO (7 nebo 8 číslic)');
      return;
    }

    const normalizedIco = ico.padStart(8, '0');
    const result = await lookupCompany(normalizedIco);
    if (!result) return;

    form.setValue('name', result.name || '', { shouldDirty: true, shouldValidate: true });
    form.setValue('ico', result.ico || normalizedIco, { shouldDirty: true, shouldValidate: true });
    form.setValue('dic', result.dic || '', { shouldDirty: true, shouldValidate: true });
    applyAddressFromLookup(result.address || '');
    setCzechCompanyDefaults();

    if (!form.getValues('brand_name').trim() && result.name) {
      form.setValue('brand_name', result.name, { shouldDirty: true, shouldValidate: true });
    }

    toast.success('Údaje načteny z ARES');
  }

  // Reset form when client prop changes (switching between edit targets)
  useEffect(() => {
    form.reset(getDefaultValues(client));
  }, [client?.id, form]);

  useEffect(() => {
    if (!client?.id || !client.industry) return;
    if (!isValidIndustryValue(client.industry)) {
      toast.error(`Neplatné odvětví klienta: ${client.industry}. Vyberte Ecommerce nebo LeadGen.`);
    }
  }, [client?.id, client?.industry]);

  const handleSubmit = (data: ClientFormData) => {
    onSubmit({
      ...data,
      dic: data.dic || null,
      billing_email: data.billing_email || null,
      billing_street: data.billing_street || null,
      billing_city: data.billing_city || null,
      billing_zip: data.billing_zip || null,
      billing_country: data.billing_country || null,
      end_date: client?.end_date || null,
      // Preserve original creator, or use current user for new clients
      created_by: client?.created_by || user?.id || '',
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {client && hasActiveEngagements && (
          <Alert className="border-amber-500/30 bg-amber-500/10">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-700 dark:text-amber-400">
              Tento klient má aktivní zakázky. Změny fakturačních údajů se neprojeví v existujících smlouvách.
            </AlertDescription>
          </Alert>
        )}
        {/* Firemní údaje */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm border-b pb-2">Firemní údaje</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Název firmy *</FormLabel>
                  <FormControl>
                    <CompanySearchInput
                      value={field.value}
                      onChange={field.onChange}
                      onSelect={handleCompanySelect}
                      placeholder="Zadejte název firmy (min. 3 znaky)..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="brand_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brand *</FormLabel>
                  <FormControl>
                    <Input placeholder="Brand" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="ico"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>IČO *</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input placeholder="12345678" {...field} />
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAresLookup}
                      disabled={isLoadingAres}
                      className="shrink-0"
                    >
                      {isLoadingAres ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                      <span className="ml-1 hidden sm:inline">ARES</span>
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dic"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>DIČ</FormLabel>
                  <FormControl>
                    <Input placeholder="CZ12345678 / SK1234567890" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Web</FormLabel>
                <FormControl>
                  <Input placeholder="https://example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Země *</FormLabel>
                  <FormControl>
                    <Input placeholder="Czech Republic" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="industry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Odvětví *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Vyberte odvětví" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {INDUSTRY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Vyberte status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {availableStatuses.map(status => (
                      <SelectItem key={status} value={status}>
                        {CLIENT_STATUS_LABELS[status]}
                        {status === currentStatus && ' (aktuální)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {client && currentStatus === 'lost' && !isSuperAdmin && (
                  <p className="text-xs text-muted-foreground">
                    Ztracený klient nelze reaktivovat. Kontaktujte administrátora.
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Fakturační údaje */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm border-b pb-2">Fakturační údaje</h4>

          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Měna *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={!!client && isCurrencyLocked}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Vyberte měnu" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CURRENCY_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {client && isCurrencyLocked && (
                  <p className="text-xs text-muted-foreground">
                    Měna nelze změnit, dokud má klient zakázky.
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="billing_email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fakturační email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="fakturace@firma.cz" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="billing_street"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ulice</FormLabel>
                <FormControl>
                  <Input placeholder="Příkop 843/4" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-4 sm:grid-cols-3">
            <FormField
              control={form.control}
              name="billing_city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Město</FormLabel>
                  <FormControl>
                    <Input placeholder="Brno" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="billing_zip"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PSČ</FormLabel>
                  <FormControl>
                    <Input placeholder="602 00" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="billing_country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Země</FormLabel>
                  <FormControl>
                    <Input placeholder="Czech Republic" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Další údaje */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm border-b pb-2">Další údaje</h4>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="acquisition_channel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Akvizice</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''} disabled={!!client}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Vyberte zdroj" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ACQUISITION_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
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
              name="start_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Datum začátku *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} disabled={!!client} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Poznámky</FormLabel>
                <FormControl>
                  <Textarea placeholder="Interní poznámky..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={() => { form.reset(); onCancel(); }} disabled={isSubmitting}>
            Zrušit
          </Button>
          <Button
            type="button"
            disabled={isSubmitting}
            onClick={async () => {
              const isValid = await form.trigger();
              if (isValid) {
                setIsSubmitting(true);
                try {
                  await onSubmit({
                    ...form.getValues(),
                    dic: form.getValues().dic || null,
                    billing_email: form.getValues().billing_email || null,
                    billing_street: form.getValues().billing_street || null,
                    billing_city: form.getValues().billing_city || null,
                    billing_zip: form.getValues().billing_zip || null,
                    billing_country: form.getValues().billing_country || null,
                    end_date: client?.end_date || null,
                    created_by: client?.created_by || user?.id || '',
                  });
                } finally {
                  setIsSubmitting(false);
                }
              } else {
                const errors = form.formState.errors;
                const errorMessages = Object.entries(errors)
                  .map(([field, error]) => `${field}: ${(error as { message?: string })?.message || 'Neplatné'}`)
                  .join(', ');
                toast.error(`Formulář obsahuje chyby: ${errorMessages}`);
              }
            }}
          >
            {isSubmitting ? 'Ukládám...' : client ? 'Uložit změny' : 'Vytvořit klienta'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
