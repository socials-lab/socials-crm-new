import { useState, useMemo, useEffect, useRef } from 'react';
import { Plus, Search, Pencil, Trash2, Star, Key, Phone, Mail } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCRMData } from '@/hooks/useCRMData';
import { useUserRole } from '@/hooks/useUserRole';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { AddContactDialog } from '@/components/clients/AddContactDialog';
import type { ClientContact } from '@/types/crm';
import { cn } from '@/lib/utils';

export default function Contacts() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get('highlight');
  const highlightedRef = useRef<HTMLDivElement>(null);

  const { clients, clientContacts, addContact, updateContact, deleteContact, getClientById } = useCRMData();
  
  const { isSuperAdmin: superAdmin } = useUserRole();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ClientContact | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [deleteContactId, setDeleteContactId] = useState<string | null>(null);

  // Handle highlight from URL
  useEffect(() => {
    if (highlightId) {
      setTimeout(() => {
        highlightedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [highlightId]);

  // Enrich contacts with client info
  const enrichedContacts = useMemo(() => {
    return clientContacts.map(contact => ({
      ...contact,
      client: getClientById(contact.client_id),
    }));
  }, [clientContacts, getClientById]);

  // Filter contacts
  const filteredContacts = useMemo(() => {
    return enrichedContacts.filter(contact => {
      const matchesSearch = searchQuery === '' || 
        contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.client?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.position?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesClient = clientFilter === 'all' || contact.client_id === clientFilter;
      
      return matchesSearch && matchesClient;
    });
  }, [enrichedContacts, searchQuery, clientFilter]);

  const handleAddContact = (data: Omit<ClientContact, 'id' | 'created_at' | 'updated_at'>) => {
    addContact(data);
    setIsAddDialogOpen(false);
    setSelectedClientId('');
  };

  const handleEditContact = (data: Omit<ClientContact, 'id' | 'created_at' | 'updated_at'>) => {
    if (editingContact) {
      updateContact(editingContact.id, data);
      setEditingContact(null);
    }
  };

  const handleDeleteContact = () => {
    if (deleteContactId) {
      deleteContact(deleteContactId);
      setDeleteContactId(null);
    }
  };

  const openAddDialog = () => {
    if (clients.length > 0) {
      setSelectedClientId(clients[0].id);
      setIsAddDialogOpen(true);
    }
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader 
        title="📇 Kontakty"
        titleAccent="klientů"
        description="Přehled všech kontaktních osob klientů"
        actions={
          superAdmin && (
            <Button onClick={openAddDialog} disabled={clients.length === 0}>
              <Plus className="h-4 w-4 mr-2" />
              Přidat kontakt
            </Button>
          )
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Hledat podle jména, emailu, telefonu, firmy..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={clientFilter} onValueChange={setClientFilter}>
          <SelectTrigger className="w-full sm:w-[250px]">
            <SelectValue placeholder="Filtr podle klienta" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Všichni klienti</SelectItem>
            {clients.map(client => (
              <SelectItem key={client.id} value={client.id}>
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Contacts Cards */}
      <div className="space-y-3">
        {filteredContacts.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            Žádné kontakty nenalezeny
          </Card>
        ) : (
          filteredContacts.map((contact) => (
            <Card 
              key={contact.id} 
              ref={highlightId === contact.id ? highlightedRef : null}
              className={cn(
                "overflow-hidden transition-all",
                highlightId === contact.id && "ring-2 ring-primary"
              )}
            >
              <div className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Avatar */}
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm shrink-0">
                    {contact.name.charAt(0).toUpperCase()}
                  </div>
                  
                  {/* Name and info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm truncate">{contact.name}</span>
                      {contact.is_primary && (
                        <Badge variant="outline" className="text-xs px-1.5 py-0 h-5 gap-1 border-yellow-500/50 text-yellow-600 shrink-0">
                          <Star className="h-3 w-3" />
                          <span className="hidden sm:inline">Primární</span>
                        </Badge>
                      )}
                      {contact.is_decision_maker && (
                        <Badge variant="outline" className="text-xs px-1.5 py-0 h-5 gap-1 border-blue-500/50 text-blue-600 shrink-0">
                          <Key className="h-3 w-3" />
                          <span className="hidden sm:inline">DM</span>
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      <button
                        onClick={() => navigate(`/clients?highlight=${contact.client_id}`)}
                        className="text-primary hover:underline"
                      >
                        {contact.client?.name}
                      </button>
                      {contact.position && <span> • {contact.position}</span>}
                    </p>
                  </div>
                </div>

                {/* Right side - contact info and actions */}
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  {/* Phone - hidden on mobile */}
                  {contact.phone && (
                    <a 
                      href={`tel:${contact.phone}`} 
                      className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground whitespace-nowrap"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      {contact.phone}
                    </a>
                  )}
                  
                  {/* Email - hidden on mobile and tablet */}
                  {contact.email && (
                    <a 
                      href={`mailto:${contact.email}`} 
                      className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      <span className="truncate max-w-[150px]">{contact.email}</span>
                    </a>
                  )}
                  
                  {/* Action buttons - only for super admin */}
                  {superAdmin && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setEditingContact(contact)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setDeleteContactId(contact.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Add Contact Dialog with Client Selection */}
      {isAddDialogOpen && selectedClientId && (
        <AddContactDialogWithClientSelect
          open={isAddDialogOpen}
          onOpenChange={(open) => {
            setIsAddDialogOpen(open);
            if (!open) setSelectedClientId('');
          }}
          clients={clients}
          selectedClientId={selectedClientId}
          onClientChange={setSelectedClientId}
          onSubmit={handleAddContact}
        />
      )}

      {/* Edit Contact Dialog */}
      {editingContact && (
        <AddContactDialog
          open={!!editingContact}
          onOpenChange={(open) => !open && setEditingContact(null)}
          clientId={editingContact.client_id}
          contact={editingContact}
          onSubmit={handleEditContact}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteContactId} onOpenChange={(open) => !open && setDeleteContactId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Smazat kontakt</AlertDialogTitle>
            <AlertDialogDescription>
              Opravdu chcete smazat tento kontakt? Tato akce je nevratná.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Zrušit</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteContact} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Smazat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Extended dialog component with client selection
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import type { Client } from '@/types/crm';

const contactSchema = z.object({
  name: z.string().min(1, 'Jméno je povinné'),
  position: z.string().nullable(),
  email: z.string().email('Zadejte platný email').nullable().or(z.literal('')),
  phone: z.string().nullable(),
  is_primary: z.boolean(),
  is_decision_maker: z.boolean(),
  notes: z.string(),
});

type ContactFormData = z.infer<typeof contactSchema>;

interface AddContactDialogWithClientSelectProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: Client[];
  selectedClientId: string;
  onClientChange: (clientId: string) => void;
  onSubmit: (data: Omit<ClientContact, 'id' | 'created_at' | 'updated_at'>) => void;
}

function AddContactDialogWithClientSelect({
  open,
  onOpenChange,
  clients,
  selectedClientId,
  onClientChange,
  onSubmit,
}: AddContactDialogWithClientSelectProps) {
  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      position: '',
      email: '',
      phone: '',
      is_primary: false,
      is_decision_maker: false,
      notes: '',
    },
  });

  const handleSubmit = (data: ContactFormData) => {
    onSubmit({
      client_id: selectedClientId,
      name: data.name,
      position: data.position || null,
      email: data.email || null,
      phone: data.phone || null,
      is_primary: data.is_primary,
      is_decision_maker: data.is_decision_maker,
      notes: data.notes,
    });
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Přidat kontakt</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Client Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Klient *</label>
              <Select value={selectedClientId} onValueChange={onClientChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Vyberte klienta" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
                    <FormLabel>Email</FormLabel>
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

            <div className="flex gap-6">
              <FormField
                control={form.control}
                name="is_primary"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">
                      Primární kontakt
                    </FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_decision_maker"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">
                      Decision maker
                    </FormLabel>
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
                    <Textarea placeholder="Interní poznámky ke kontaktu..." {...field} />
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
                Přidat kontakt
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
