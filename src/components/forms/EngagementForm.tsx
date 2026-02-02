import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useMemo, useCallback } from 'react';
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
import type { Engagement, Client, ClientContact, EngagementStatus } from '@/types/crm';
import { getAvailableEngagementStatuses, ENGAGEMENT_STATUS_LABELS, canTerminateEngagement } from '@/lib/statusTransitions';
import { toast } from 'sonner';

const engagementSchema = z.object({
  name: z.string().min(1, 'Název je povinný'),
  client_id: z.string().min(1, 'Vyberte klienta'),
  contact_person_id: z.string().nullable(),
  type: z.enum(['retainer', 'one_off', 'internal'] as const),
  billing_model: z.enum(['fixed_fee', 'spend_based', 'hybrid'] as const),
  currency: z.string().min(1, 'Měna je povinná'),
  monthly_fee: z.coerce.number().min(0),
  one_off_fee: z.coerce.number().min(0),
  status: z.enum(['planned', 'active', 'paused', 'completed', 'cancelled'] as const),
  start_date: z.string().min(1, 'Datum je povinné'),
  end_date: z.string().optional(),
  notice_period_months: z.coerce.number().min(0).nullable(),
  notes: z.string(),
}).refine(
  (data) => {
    if (!data.end_date || data.end_date === '') return true;
    return new Date(data.start_date) <= new Date(data.end_date);
  },
  { message: 'Datum ukončení musí být po datu zahájení', path: ['end_date'] }
);

// Helper function to create a schema that validates contact belongs to client
function createEngagementSchemaWithContactValidation(contacts: ClientContact[]) {
  return engagementSchema.refine(
    (data) => {
      // If no contact selected, it's valid
      if (!data.contact_person_id) return true;
      // Check contact belongs to selected client
      const contact = contacts.find(c => c.id === data.contact_person_id);
      return contact ? contact.client_id === data.client_id : false;
    },
    { message: 'Vybraný kontakt nepatří k vybranému klientovi', path: ['contact_person_id'] }
  );
}

type EngagementFormData = z.infer<typeof engagementSchema>;

interface EngagementFormProps {
  engagement?: Engagement;
  clients: Client[];
  contacts: ClientContact[];
  defaultClientId?: string;
  isSuperAdmin?: boolean;
  onSubmit: (data: EngagementFormData) => void;
  onCancel: () => void;
}

export function EngagementForm({
  engagement,
  clients,
  contacts,
  defaultClientId,
  isSuperAdmin = false,
  onSubmit,
  onCancel
}: EngagementFormProps) {
  // Get available status options based on current status and user role
  const currentStatus: EngagementStatus = engagement?.status || 'planned';
  const availableStatuses = getAvailableEngagementStatuses(currentStatus, isSuperAdmin);

  // Use schema with contact-client validation
  const schemaWithContactValidation = createEngagementSchemaWithContactValidation(contacts);

  const form = useForm<EngagementFormData>({
    resolver: zodResolver(schemaWithContactValidation),
    defaultValues: {
      name: engagement?.name || '',
      client_id: engagement?.client_id || defaultClientId || '',
      contact_person_id: engagement?.contact_person_id || null,
      type: engagement?.type || 'retainer',
      billing_model: engagement?.billing_model || 'fixed_fee',
      currency: engagement?.currency || 'CZK',
      monthly_fee: engagement?.monthly_fee || 0,
      one_off_fee: engagement?.one_off_fee || 0,
      status: engagement?.status || 'planned',
      start_date: engagement?.start_date || new Date().toISOString().split('T')[0],
      end_date: engagement?.end_date || '',
      notice_period_months: engagement?.notice_period_months ?? null,
      notes: engagement?.notes || '',
    },
  });

  const engagementType = form.watch('type');
  const selectedClientId = form.watch('client_id');

  // Filter contacts by selected client
  const clientContacts = contacts.filter(c => c.client_id === selectedClientId);

  // Reset contact when client changes (only if it's not the initial client)
  const initialClientId = useMemo(() => engagement?.client_id || defaultClientId, [engagement?.client_id, defaultClientId]);

  // Memoize the reset function to avoid recreating on every render
  const resetContactIfInvalid = useCallback((clientId: string, currentContact: string | null) => {
    if (currentContact) {
      const contactBelongsToClient = contacts.some(
        c => c.id === currentContact && c.client_id === clientId
      );
      if (!contactBelongsToClient) {
        form.setValue('contact_person_id', null);
      }
    }
  }, [contacts, form.setValue]);

  useEffect(() => {
    if (selectedClientId && selectedClientId !== initialClientId) {
      const currentContact = form.getValues('contact_person_id');
      resetContactIfInvalid(selectedClientId, currentContact);
    }
  }, [selectedClientId, initialClientId, resetContactIfInvalid, form.getValues]);

  // Handle form submission with notice period check
  const handleFormSubmit = (data: EngagementFormData) => {
    // Check notice period if changing to completed/cancelled
    if (engagement && (data.status === 'completed' || data.status === 'cancelled') && engagement.status !== data.status) {
      const terminationCheck = canTerminateEngagement(engagement, data.status, isSuperAdmin);
      if (!terminationCheck.allowed) {
        toast.error(terminationCheck.reason);
        return;
      }
    }
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Název zakázky</FormLabel>
              <FormControl>
                <Input placeholder="Performance Ads 2024" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="client_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Klient</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Vyberte klienta" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.brand_name}
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
          name="contact_person_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kontaktní osoba</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                value={field.value || ''} 
                disabled={!selectedClientId}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={selectedClientId ? "Vyberte kontakt" : "Nejprve vyberte klienta"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {clientContacts.map(contact => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.name}
                      {contact.is_decision_maker && ' 🔑'}
                      {contact.is_primary && ' ⭐'}
                      {contact.position && ` (${contact.position})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Typ</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="retainer">Retainer</SelectItem>
                    <SelectItem value="one_off">Jednorázově</SelectItem>
                    <SelectItem value="internal">Interní</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {availableStatuses.map(status => (
                      <SelectItem key={status} value={status}>
                        {ENGAGEMENT_STATUS_LABELS[status]}
                        {status === currentStatus && engagement && ' (aktuální)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {engagement && (currentStatus === 'completed' || currentStatus === 'cancelled') && !isSuperAdmin && (
                  <p className="text-xs text-muted-foreground">
                    Dokončenou/zrušenou zakázku nelze reaktivovat.
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="billing_model"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Billing model</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="fixed_fee">Fixní</SelectItem>
                    <SelectItem value="spend_based">% ze spendu</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Měna</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
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
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {engagementType === 'retainer' && (
            <FormField
              control={form.control}
              name="monthly_fee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Měsíční cena</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          {engagementType === 'one_off' && (
            <FormField
              control={form.control}
              name="one_off_fee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jednorázová cena</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Začátek</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="end_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Konec (volitelné)</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {engagementType === 'retainer' && (
          <FormField
            control={form.control}
            name="notice_period_months"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Výpovědní lhůta (měsíce)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min={0}
                    value={field.value ?? ''} 
                    onChange={e => field.onChange(e.target.value ? Number(e.target.value) : null)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

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

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            Zrušit
          </Button>
          <Button type="submit">
            {engagement ? 'Uložit změny' : 'Vytvořit zakázku'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
