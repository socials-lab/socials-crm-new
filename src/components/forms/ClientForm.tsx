import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import type { Client, ClientStatus } from '@/types/crm';

const clientSchema = z.object({
  name: z.string().min(1, 'Název firmy je povinný'),
  brand_name: z.string().min(1, 'Brand je povinný'),
  ico: z.string().min(1, 'IČO je povinné'),
  dic: z.string().nullable(),
  website: z.string().url('Zadejte platnou URL').or(z.literal('')),
  country: z.string().min(1, 'Země je povinná'),
  industry: z.string().min(1, 'Odvětví je povinné'),
  status: z.enum(['lead', 'active', 'paused', 'lost', 'potential'] as const),
  // Billing
  billing_email: z.string().email('Zadejte platný email').nullable().or(z.literal('')),
  billing_street: z.string().nullable(),
  billing_city: z.string().nullable(),
  billing_zip: z.string().nullable(),
  billing_country: z.string().nullable(),
  // Contact (legacy, for backwards compatibility)
  main_contact_name: z.string().min(1, 'Jméno kontaktu je povinné'),
  main_contact_email: z.string().email('Zadejte platný email'),
  main_contact_phone: z.string().min(1, 'Telefon je povinný'),
  acquisition_channel: z.string(),
  start_date: z.string().min(1, 'Datum je povinné'),
  notes: z.string(),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface ClientFormProps {
  client?: Client;
  onSubmit: (data: ClientFormData & { end_date: string | null; created_by: string }) => void;
  onCancel: () => void;
}

export function ClientForm({ client, onSubmit, onCancel }: ClientFormProps) {
  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: client?.name || '',
      brand_name: client?.brand_name || '',
      ico: client?.ico || '',
      dic: client?.dic || '',
      website: client?.website || '',
      country: client?.country || 'Czech Republic',
      industry: client?.industry || '',
      status: client?.status || 'lead',
      billing_email: client?.billing_email || '',
      billing_street: client?.billing_street || '',
      billing_city: client?.billing_city || '',
      billing_zip: client?.billing_zip || '',
      billing_country: client?.billing_country || 'Czech Republic',
      main_contact_name: client?.main_contact_name || '',
      main_contact_email: client?.main_contact_email || '',
      main_contact_phone: client?.main_contact_phone || '',
      acquisition_channel: client?.acquisition_channel || '',
      start_date: client?.start_date || new Date().toISOString().split('T')[0],
      notes: client?.notes || '',
    },
  });

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
      created_by: client?.created_by || 'user-1',
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
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
                    <Input placeholder="Firma s.r.o." {...field} />
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
                  <FormControl>
                    <Input placeholder="12345678" {...field} />
                  </FormControl>
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
                    <Input placeholder="CZ12345678" {...field} value={field.value || ''} />
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
                  <FormControl>
                    <Input placeholder="E-commerce" {...field} />
                  </FormControl>
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
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Vyberte status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="active">Aktivní</SelectItem>
                    <SelectItem value="paused">Pozastaveno</SelectItem>
                    <SelectItem value="potential">Potenciální</SelectItem>
                    <SelectItem value="lost">Ztraceno</SelectItem>
                  </SelectContent>
                </Select>
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

        {/* Kontaktní osoba */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm border-b pb-2">Hlavní kontaktní osoba</h4>
          <p className="text-xs text-muted-foreground -mt-2">Další kontakty lze spravovat v detailu klienta</p>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="main_contact_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jméno *</FormLabel>
                  <FormControl>
                    <Input placeholder="Jan Novák" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="main_contact_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="jan@firma.cz" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="main_contact_phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefon *</FormLabel>
                <FormControl>
                  <Input placeholder="+420 777 123 456" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
                  <FormControl>
                    <Input placeholder="Referral, LinkedIn..." {...field} />
                  </FormControl>
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
                    <Input type="date" {...field} />
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
          <Button type="button" variant="outline" onClick={onCancel}>
            Zrušit
          </Button>
          <Button type="submit">
            {client ? 'Uložit změny' : 'Vytvořit klienta'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
