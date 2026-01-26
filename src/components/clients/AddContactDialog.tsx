import { useForm } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Star, Key } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import type { ClientContact, Client } from '@/types/crm';
import { contactSchema as baseContactSchema, type ContactFormData as BaseContactFormData } from '@/lib/validation';
import { useCRMData } from '@/hooks/useCRMData';
import { toast } from 'sonner';

// Extended schema with optional client_id for client selection mode
const contactSchemaWithClient = baseContactSchema.extend({
  client_id: z.string().min(1, 'Vyberte klienta'),
});

type ContactFormDataWithClient = z.infer<typeof contactSchemaWithClient>;

interface AddContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Either provide clientId (fixed client) or showClientSelector (user selects)
  clientId?: string;
  clientName?: string;
  showClientSelector?: boolean;
  clients?: Client[];
  contact?: ClientContact;
  onSubmit: (data: Omit<ClientContact, 'id' | 'created_at' | 'updated_at'>) => void | Promise<void>;
}

const NOTES_MAX_LENGTH = 2000;

// Helper to generate default form values - prevents duplication
const getDefaultValues = (
  contact: ClientContact | undefined,
  clientId: string | undefined
): ContactFormDataWithClient => ({
  client_id: contact?.client_id || clientId || '',
  name: contact?.name || '',
  position: contact?.position || '',
  email: contact?.email || '',
  phone: contact?.phone || '',
  is_primary: contact?.is_primary ?? false,
  is_decision_maker: contact?.is_decision_maker ?? false,
  notes: contact?.notes || '',
});

export function AddContactDialog({
  open,
  onOpenChange,
  clientId,
  clientName,
  showClientSelector = false,
  clients: providedClients,
  contact,
  onSubmit,
}: AddContactDialogProps) {
  const { getPrimaryContact, getClientById, clients: allClients, setContactAsPrimary, updateContact } = useCRMData();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSettingRole, setIsSettingRole] = useState(false);

  // Filter clients to only show active ones (not lost/paused) when showing selector
  // Issue #18: Hide inactive clients from dropdown
  const activeClients = showClientSelector
    ? (providedClients || allClients).filter(c => !['lost', 'paused'].includes(c.status))
    : [];

  // Get client name from props or fetch from CRM data
  const resolvedClientName = clientName || (clientId ? getClientById(clientId)?.name : undefined);

  // Determine which schema to use
  const schema = showClientSelector ? contactSchemaWithClient : baseContactSchema;

  const form = useForm<ContactFormDataWithClient>({
    resolver: zodResolver(schema as z.ZodType<ContactFormDataWithClient>),
    defaultValues: getDefaultValues(contact, clientId),
  });

  const { reset, watch } = form;
  const watchNotes = watch('notes');
  const notesLength = watchNotes?.length || 0;

  // Handler for setting contact as primary
  const handleSetAsPrimary = async () => {
    if (!contact) return;
    setIsSettingRole(true);
    try {
      await setContactAsPrimary(contact.id);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to set primary:', error);
      toast.error('Nepodařilo se nastavit primární kontakt');
    } finally {
      setIsSettingRole(false);
    }
  };

  // Handler for setting contact as decision maker
  const handleSetAsDecisionMaker = async () => {
    if (!contact) return;
    setIsSettingRole(true);
    try {
      await updateContact(contact.id, { is_decision_maker: true });
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to set decision maker:', error);
      toast.error('Nepodařilo se nastavit decision maker');
    } finally {
      setIsSettingRole(false);
    }
  };

  // Reset form when contact prop changes or dialog opens
  useEffect(() => {
    if (open) {
      reset(getDefaultValues(contact, clientId));
    }
  }, [contact, open, reset, clientId]);

  const handleSubmit = async (data: ContactFormDataWithClient) => {
    setIsSubmitting(true);
    try {
      const effectiveClientId = showClientSelector ? data.client_id : clientId;
      if (!effectiveClientId) {
        toast.error('Nebyl vybrán klient');
        return;
      }

      await onSubmit({
        client_id: effectiveClientId,
        name: data.name,
        position: data.position || null,
        email: data.email || null,
        phone: data.phone || null,
        // Preserve existing values when editing, use defaults for new contacts
        // (first contact auto-becomes primary via DB trigger)
        is_primary: contact?.is_primary ?? false,
        is_decision_maker: contact?.is_decision_maker ?? false,
        notes: data.notes,
      });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Contact submission failed:', error);
      const message = error instanceof Error ? error.message : 'Nepodařilo se uložit kontakt';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {contact ? 'Upravit kontakt' : 'Přidat kontakt'}
          </DialogTitle>
          {!showClientSelector && resolvedClientName && (
            <DialogDescription>
              Klient: {resolvedClientName}
            </DialogDescription>
          )}
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Client Selection - only shown when showClientSelector is true */}
            {showClientSelector && (
              <FormField
                control={form.control}
                name="client_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Klient *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Vyberte klienta" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {activeClients.map(client => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="name"
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
              name="position"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pozice</FormLabel>
                  <FormControl>
                    <Input placeholder="Marketing Manager" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="jan@firma.cz" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefon</FormLabel>
                    <FormControl>
                      <Input placeholder="+420 777 123 456" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Role Status Section - only shown when editing existing contact */}
            {contact && (
              <div className="flex flex-wrap gap-2">
                {/* Primary Contact */}
                {contact.is_primary ? (
                  <Badge variant="outline" className="border-yellow-500/50 text-yellow-600 dark:text-yellow-400">
                    <Star className="h-3 w-3 mr-1 fill-current" />
                    Primární kontakt
                  </Badge>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSetAsPrimary}
                    disabled={isSettingRole}
                    className="text-muted-foreground hover:text-yellow-600 hover:border-yellow-500/50"
                  >
                    {isSettingRole ? (
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <Star className="h-3 w-3 mr-1" />
                    )}
                    Nastavit jako primární
                  </Button>
                )}

                {/* Decision Maker */}
                {contact.is_decision_maker ? (
                  <Badge variant="outline" className="border-blue-500/50 text-blue-600 dark:text-blue-400">
                    <Key className="h-3 w-3 mr-1" />
                    Decision maker
                  </Badge>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSetAsDecisionMaker}
                    disabled={isSettingRole}
                    className="text-muted-foreground hover:text-blue-600 hover:border-blue-500/50"
                  >
                    {isSettingRole ? (
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <Key className="h-3 w-3 mr-1" />
                    )}
                    Nastavit jako decision maker
                  </Button>
                )}
              </div>
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Poznámky</FormLabel>
                    <span className={`text-xs ${notesLength > NOTES_MAX_LENGTH * 0.9 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                      {notesLength} / {NOTES_MAX_LENGTH}
                    </span>
                  </div>
                  <FormControl>
                    <Textarea
                      placeholder="Interní poznámky ke kontaktu..."
                      {...field}
                      maxLength={NOTES_MAX_LENGTH}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => { form.reset(); onOpenChange(false); }}
                disabled={isSubmitting}
              >
                Zrušit
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {contact ? 'Uložit změny' : 'Přidat kontakt'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
