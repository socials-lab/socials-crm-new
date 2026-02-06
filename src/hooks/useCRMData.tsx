import { createContext, useContext, ReactNode, useMemo, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getErrorMessage, isPrimaryContactConstraintError, isEngagementReferenceError } from '@/lib/errorUtils';
import type { 
  Client, 
  ClientContact,
  Engagement, 
  EngagementService,
  Colleague, 
  EngagementAssignment,
  ExtraWork,
  Service,
  IssuedInvoice,
  EngagementMonthlyMetrics,
  InvoiceLineItem,
} from '@/types/crm';

interface CRMDataContextType {
  // Data
  clients: Client[];
  clientContacts: ClientContact[];
  engagements: Engagement[];
  engagementServices: EngagementService[];
  colleagues: Colleague[];
  assignments: EngagementAssignment[];
  extraWorks: ExtraWork[];
  services: Service[];
  issuedInvoices: IssuedInvoice[];
  engagementMetrics: EngagementMonthlyMetrics[];
  engagementHistory: Array<Record<string, unknown>>;
  
  // Loading states
  isLoading: boolean;
  
  // Client operations
  addClient: (client: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => Promise<Client>;
  updateClient: (id: string, data: Partial<Client>) => Promise<void>;
  softDeleteClient: (id: string) => Promise<void>;
  
  // Client Contact operations
  addContact: (contact: Omit<ClientContact, 'id' | 'created_at' | 'updated_at'>) => Promise<ClientContact>;
  updateContact: (id: string, data: Partial<ClientContact>) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  setContactAsPrimary: (contactId: string) => Promise<void>;
  canDeleteContact: (contactId: string) => Promise<{ allowed: boolean; reason?: string }>;
  getContactsByClientId: (clientId: string) => ClientContact[];
  getPrimaryContact: (clientId: string) => ClientContact | undefined;
  getDecisionMaker: (clientId: string) => ClientContact | undefined;
  
  // Engagement operations
  addEngagement: (engagement: Omit<Engagement, 'id' | 'created_at' | 'updated_at'>) => Promise<Engagement>;
  updateEngagement: (id: string, data: Partial<Engagement>) => Promise<void>;
  deleteEngagement: (id: string) => Promise<void>;
  
  // Engagement Service operations
  addEngagementService: (data: Omit<EngagementService, 'id' | 'created_at' | 'updated_at'>) => Promise<EngagementService>;
  updateEngagementService: (id: string, data: Partial<EngagementService>) => Promise<void>;
  deleteEngagementService: (id: string) => Promise<void>;
  getEngagementServicesByEngagementId: (engagementId: string) => EngagementService[];
  getUnbilledOneOffServices: () => EngagementService[];
  markEngagementServiceAsInvoiced: (id: string, invoiceId: string, invoicePeriod: string) => Promise<void>;
  
  // Colleague operations
  addColleague: (colleague: Omit<Colleague, 'id' | 'created_at' | 'updated_at'>) => Promise<Colleague>;
  updateColleague: (id: string, data: Partial<Colleague>) => Promise<void>;
  deleteColleague: (id: string) => Promise<void>;
  
  // Assignment operations
  addAssignment: (assignment: Omit<EngagementAssignment, 'id' | 'created_at' | 'updated_at'>) => Promise<EngagementAssignment>;
  updateAssignment: (id: string, data: Partial<EngagementAssignment>) => Promise<void>;
  removeAssignment: (id: string) => Promise<void>;
  getAssignmentsByServiceId: (serviceId: string) => EngagementAssignment[];
  
  // Extra Work operations
  addExtraWork: (data: Omit<ExtraWork, 'id' | 'created_at' | 'updated_at' | 'status' | 'approval_date' | 'approved_by' | 'invoice_id' | 'invoice_number' | 'invoiced_at'>) => Promise<ExtraWork>;
  updateExtraWork: (id: string, data: Partial<ExtraWork>) => Promise<void>;
  deleteExtraWork: (id: string) => Promise<void>;
  getExtraWorksReadyToInvoice: (year: number, month: number) => ExtraWork[];
  getExtraWorksByEngagementId: (engagementId: string) => ExtraWork[];
  approveExtraWork: (id: string) => Promise<void>;
  completeExtraWork: (id: string) => Promise<void>;
  markExtraWorkAsInvoiced: (id: string, invoiceId: string, invoiceNumber: string) => Promise<void>;
  
  // Service operations
  addService: (data: Omit<Service, 'id' | 'created_at' | 'updated_at'>) => Promise<Service>;
  updateService: (id: string, data: Partial<Service>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  toggleServiceActive: (id: string) => Promise<void>;
  
  // Issued Invoices operations
  addIssuedInvoice: (invoice: Omit<IssuedInvoice, 'id' | 'created_at'>) => Promise<IssuedInvoice>;
  getIssuedInvoicesByYear: (year: number) => IssuedInvoice[];
  getInvoicesByEngagementId: (engagementId: string) => IssuedInvoice[];
  getNextInvoiceNumber: (year: number) => string;
  createInvoiceWithLineItems: (
    invoice: Omit<IssuedInvoice, 'id' | 'created_at' | 'invoice_number'>,
    lineItems: Omit<InvoiceLineItem, 'id' | 'created_at' | 'updated_at' | 'invoice_id'>[],
    extraWorkIds: string[],
    oneOffServiceIds: string[],
    creativeBoostClientMonthIds?: string[]
  ) => Promise<IssuedInvoice>;
  
  // Invoice Line Items operations
  invoiceLineItems: InvoiceLineItem[];
  addInvoiceLineItem: (data: Omit<InvoiceLineItem, 'id' | 'created_at' | 'updated_at'>) => Promise<InvoiceLineItem>;
  getLineItemsByInvoiceId: (invoiceId: string) => InvoiceLineItem[];
  
  // Engagement Monthly Metrics operations
  addEngagementMetric: (data: Omit<EngagementMonthlyMetrics, 'id' | 'created_at' | 'updated_at'>) => Promise<EngagementMonthlyMetrics>;
  updateEngagementMetric: (id: string, data: Partial<EngagementMonthlyMetrics>) => Promise<void>;
  getMetricsByEngagementId: (engagementId: string) => EngagementMonthlyMetrics[];
  
  // Engagement History
  getEngagementHistory: (engagementId: string) => Array<Record<string, unknown>>;
  
  // Helper functions
  getClientById: (id: string) => Client | undefined;
  getEngagementById: (id: string) => Engagement | undefined;
  getColleagueById: (id: string) => Colleague | undefined;
  getEngagementsByClientId: (clientId: string) => Engagement[];
  getAssignmentsByEngagementId: (engagementId: string) => EngagementAssignment[];
}

const CRMDataContext = createContext<CRMDataContextType | null>(null);

// Helper function to transform DB row to Client type
// Handles all nullable fields from Supabase to match application types
const transformClient = (row: Record<string, unknown>): Client => ({
  ...row,
  // Required string fields that might be null in DB
  brand_name: (row.brand_name as string) || '',
  country: (row.country as string) || 'Czech Republic',
  industry: (row.industry as string) || '',
  // Enum fields with defaults
  status: (row.status as Client['status']) || 'active',
  tier: (row.tier as Client['tier']) || 'standard',
  // Other potentially null string fields
  acquisition_channel: (row.acquisition_channel as string) || '',
  start_date: (row.start_date as string) || new Date().toISOString().split('T')[0],
  notes: (row.notes as string) || '',
  pinned_notes: (row.pinned_notes as string) || '',
  // Timestamps
  created_at: (row.created_at as string) || new Date().toISOString(),
  updated_at: (row.updated_at as string) || new Date().toISOString(),
}) as Client;

// Helper function to transform DB row to ClientContact type
const transformClientContact = (row: Record<string, unknown>): ClientContact => ({
  ...row,
  is_primary: (row.is_primary as boolean) ?? false,
  is_decision_maker: (row.is_decision_maker as boolean) ?? false,
  notes: (row.notes as string) || '',
  created_at: (row.created_at as string) || new Date().toISOString(),
  updated_at: (row.updated_at as string) || new Date().toISOString(),
}) as ClientContact;

const transformEngagement = (row: Record<string, unknown>): Engagement => ({
  ...row,
  type: row.type || 'retainer',
  billing_model: row.billing_model || 'fixed_fee',
  status: row.status || 'active',
  platforms: row.platforms || [],
  start_date: row.start_date || '',
  created_at: row.created_at || new Date().toISOString(),
  updated_at: row.updated_at || new Date().toISOString(),
});

const transformColleague = (row: Record<string, unknown>): Colleague => ({
  ...row,
  seniority: row.seniority || 'mid',
  status: row.status || 'active',
  created_at: row.created_at || new Date().toISOString(),
  updated_at: row.updated_at || new Date().toISOString(),
});

const transformService = (row: Record<string, unknown>): Service => ({
  ...row,
  service_type: row.service_type || 'core',
  category: row.category || 'performance',
  description: row.description ?? '',
  base_price: row.base_price ?? 0,
  currency: row.currency ?? 'CZK',
  billing_type: (row.billing_type || 'monthly') as 'monthly' | 'one_off',
  is_active: row.is_active ?? true,
  created_at: row.created_at || new Date().toISOString(),
  updated_at: row.updated_at || new Date().toISOString(),
  // Default values for offer generation
  default_deliverables: row.default_deliverables ?? null,
});

export function CRMDataProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  // Note: Using 'as any' because Supabase types are auto-generated and tables may not exist yet
  // After running migration, regenerate types with: npx supabase gen types typescript

  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      // Filter out soft-deleted clients (deleted_at IS NULL)
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .is('deleted_at', null)
        .order('name');
      if (error) throw error;
      return (data || []).map(transformClient);
    },
  });

  const { data: clientContacts = [], isLoading: contactsLoading } = useQuery({
    queryKey: ['client_contacts'],
    queryFn: async () => {
      // Join with clients to filter out contacts of soft-deleted clients
      const { data, error } = await supabase
        .from('client_contacts')
        .select('*, clients!inner(deleted_at)')
        .is('clients.deleted_at', null)
        .order('name');
      if (error) throw error;
      // Remove the clients join data from result
      return (data || []).map(({ clients, ...contact }) => transformClientContact(contact));
    },
  });

  const { data: engagements = [], isLoading: engagementsLoading } = useQuery({
    queryKey: ['engagements'],
    queryFn: async () => {
      // Filter out soft-deleted engagements and engagements of soft-deleted clients
      const { data, error } = await supabase
        .from('engagements')
        .select('*, clients!inner(deleted_at)')
        .is('deleted_at', null)
        .is('clients.deleted_at', null)
        .order('name');
      if (error) throw error;
      // Remove the clients join data from result
      return (data || []).map(({ clients, ...engagement }) => transformEngagement(engagement));
    },
  });

  const { data: engagementServices = [], isLoading: engServicesLoading } = useQuery({
    queryKey: ['engagement_services'],
    queryFn: async () => {
      const { data, error } = await supabase.from('engagement_services').select('*');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: colleagues = [], isLoading: colleaguesLoading } = useQuery({
    queryKey: ['colleagues'],
    queryFn: async () => {
      const { data, error } = await supabase.from('colleagues').select('*').order('full_name');
      if (error) throw error;
      return (data || []).map(transformColleague);
    },
  });

  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery({
    queryKey: ['engagement_assignments'],
    queryFn: async () => {
      const { data, error } = await supabase.from('engagement_assignments').select('*');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: extraWorks = [], isLoading: extraWorksLoading } = useQuery({
    queryKey: ['extra_works'],
    queryFn: async () => {
      // Note: soft delete filter (.is('deleted_at', null)) will be added after migration
      // Currently the column doesn't exist yet
      const { data, error } = await supabase
        .from('extra_works')
        .select('*')
        .order('work_date', { ascending: false });
      if (error) throw error;
      // Filter out soft-deleted items client-side if column exists
      return (data || []).filter(item => !('deleted_at' in item) || item.deleted_at === null);
    },
  });

  const { data: services = [], isLoading: servicesLoading } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const { data, error } = await supabase.from('services').select('*').order('name');
      if (error) throw error;
      return (data || []).map(transformService);
    },
  });

  const { data: issuedInvoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ['issued_invoices'],
    queryFn: async () => {
      const { data, error } = await supabase.from('issued_invoices').select('*').order('issued_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: engagementMetrics = [], isLoading: metricsLoading } = useQuery({
    queryKey: ['engagement_monthly_metrics'],
    queryFn: async () => {
      const { data, error } = await supabase.from('engagement_monthly_metrics').select('*').order('year', { ascending: false }).order('month', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: engagementHistory = [], isLoading: historyLoading } = useQuery({
    queryKey: ['engagement_history'],
    queryFn: async () => {
      const { data, error } = await supabase.from('engagement_history').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: invoiceLineItems = [], isLoading: lineItemsLoading } = useQuery({
    queryKey: ['invoice_line_items'],
    queryFn: async () => {
      const { data, error } = await supabase.from('invoice_line_items').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const isLoading = clientsLoading || contactsLoading || engagementsLoading ||
                    engServicesLoading || colleaguesLoading || assignmentsLoading ||
                    extraWorksLoading || servicesLoading || invoicesLoading ||
                    metricsLoading || historyLoading || lineItemsLoading;

  // Real-time subscriptions for contacts and clients
  useEffect(() => {
    // Track if we've already shown a realtime error toast to avoid spamming
    let hasShownRealtimeError = false;
    const showRealtimeError = (tableName: string, err: unknown) => {
      console.error(`Failed to subscribe to ${tableName} realtime:`, err);
      if (!hasShownRealtimeError) {
        hasShownRealtimeError = true;
        toast.error('Aktualizace v reálném čase nejsou dostupné', {
          description: 'Obnovte stránku pro zobrazení nejnovějších dat',
          duration: 10000,
        });
      }
    };

    // Subscribe to client_contacts changes
    const contactsChannel = supabase
      .channel('client_contacts_realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'client_contacts' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['client_contacts'] });
        }
      )
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR') {
          showRealtimeError('contacts', err);
        }
      });

    // Subscribe to clients changes (for soft-delete sync)
    const clientsChannel = supabase
      .channel('clients_realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'clients' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['clients'] });
          // Also refresh contacts since they filter by client deleted_at
          queryClient.invalidateQueries({ queryKey: ['client_contacts'] });
        }
      )
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR') {
          showRealtimeError('clients', err);
        }
      });

    // Subscribe to engagements changes
    const engagementsChannel = supabase
      .channel('engagements_realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'engagements' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['engagements'] });
          queryClient.invalidateQueries({ queryKey: ['engagement_history'] });
        }
      )
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR') {
          showRealtimeError('engagements', err);
        }
      });

    // Subscribe to engagement_services changes
    const engServicesChannel = supabase
      .channel('engagement_services_realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'engagement_services' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['engagement_services'] });
        }
      )
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR') {
          showRealtimeError('engagement_services', err);
        }
      });

    // Subscribe to engagement_assignments changes
    const assignmentsChannel = supabase
      .channel('engagement_assignments_realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'engagement_assignments' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['engagement_assignments'] });
        }
      )
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR') {
          showRealtimeError('engagement_assignments', err);
        }
      });

    return () => {
      supabase.removeChannel(contactsChannel);
      supabase.removeChannel(clientsChannel);
      supabase.removeChannel(engagementsChannel);
      supabase.removeChannel(engServicesChannel);
      supabase.removeChannel(assignmentsChannel);
    };
  }, [queryClient]);

  // Mutations
  const addClientMutation = useMutation({
    mutationFn: async (data: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => {
      const { data: result, error } = await supabase.from('clients').insert(data).select().single();
      if (error) throw error;
      return transformClient(result);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Klient byl vytvořen');
    },
    onError: (error) => {
      console.error('Failed to create client:', error);
      toast.error('Nepodařilo se vytvořit klienta');
    },
  });

  const updateClientMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Client> }) => {
      const { error } = await supabase.from('clients').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Klient byl uložen');
    },
    onError: (error) => {
      console.error('Failed to update client:', error);
      toast.error('Nepodařilo se uložit klienta');
    },
  });

  // Soft delete client - sets deleted_at timestamp instead of actually deleting
  const softDeleteClientMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc('soft_delete_client', { p_client_id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      // Also invalidate contacts cache since contacts of soft-deleted clients should be hidden
      queryClient.invalidateQueries({ queryKey: ['client_contacts'] });
      // Invalidate engagements as they reference clients
      queryClient.invalidateQueries({ queryKey: ['engagements'] });
      toast.success('Klient byl archivován');
    },
    onError: (error) => {
      console.error('Failed to soft delete client:', error);
      toast.error('Nepodařilo se archivovat klienta');
    },
  });

  const addContactMutation = useMutation({
    mutationFn: async (data: Omit<ClientContact, 'id' | 'created_at' | 'updated_at'>) => {
      const { data: result, error } = await supabase.from('client_contacts').insert(data).select().single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      // Explicitly invalidate cache (realtime may have latency or be disabled)
      queryClient.invalidateQueries({ queryKey: ['client_contacts'] });
      toast.success('Kontakt byl přidán');
    },
    onError: (error) => {
      console.error('Failed to add contact:', error);
      toast.error(getErrorMessage(error, 'Nepodařilo se přidat kontakt'));
    },
  });

  const updateContactMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ClientContact> }) => {
      // If setting is_primary, use the atomic RPC instead
      if (data.is_primary === true) {
        const { data: result, error } = await supabase.rpc('set_contact_as_primary', {
          p_contact_id: id,
        });
        if (error) throw error;
        if (result && !result.success) {
          throw new Error(result.error || 'Nepodařilo se nastavit primární kontakt');
        }
        // Update other fields if any
        const otherData = { ...data };
        delete otherData.is_primary;
        if (Object.keys(otherData).length > 0) {
          const { error: updateError } = await supabase.from('client_contacts').update(otherData).eq('id', id);
          if (updateError) throw updateError;
        }
      } else {
        // Use .select().single() to verify the contact still exists and was updated
        const { data: result, error } = await supabase
          .from('client_contacts')
          .update(data)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        if (!result) {
          throw new Error('Kontakt nebyl nalezen - možná byl smazán jiným uživatelem.');
        }
      }
    },
    onSuccess: () => {
      // Explicitly invalidate cache (realtime may have latency or be disabled)
      queryClient.invalidateQueries({ queryKey: ['client_contacts'] });
      toast.success('Kontakt byl uložen');
    },
    onError: (error) => {
      console.error('Failed to update contact:', error);
      toast.error(getErrorMessage(error, 'Nepodařilo se uložit kontakt'));
    },
  });

  // Dedicated mutation for setting primary contact atomically
  const setContactAsPrimaryMutation = useMutation({
    mutationFn: async (contactId: string) => {
      const { data: result, error } = await supabase.rpc('set_contact_as_primary', {
        p_contact_id: contactId,
      });
      if (error) throw error;
      if (result && !result.success) {
        throw new Error(result.error || 'Nepodařilo se nastavit primární kontakt');
      }
      return result;
    },
    onSuccess: (result) => {
      // Explicitly invalidate cache (realtime may have latency or be disabled)
      queryClient.invalidateQueries({ queryKey: ['client_contacts'] });
      toast.success(result?.message || 'Primární kontakt byl změněn');
    },
    onError: (error) => {
      console.error('Failed to set primary contact:', error);
      toast.error(getErrorMessage(error, 'Nepodařilo se nastavit primární kontakt'));
    },
  });

  const deleteContactMutation = useMutation({
    mutationFn: async (id: string) => {
      // Use soft delete RPC function
      const { data: result, error } = await supabase.rpc('soft_delete_contact', {
        p_contact_id: id,
      });
      if (error) throw error;
      if (result && !result.success) {
        throw new Error(result.error || 'Nepodařilo se smazat kontakt');
      }
      return result;
    },
    onSuccess: (result) => {
      // Explicitly invalidate cache (realtime may have latency or be disabled)
      queryClient.invalidateQueries({ queryKey: ['client_contacts'] });
      toast.success(result?.message || 'Kontakt byl smazán');
    },
    onError: (error) => {
      console.error('Failed to delete contact:', error);
      // Provide specific error for engagement reference
      if (isEngagementReferenceError(error)) {
        toast.error('Kontakt nelze smazat, protože je přiřazen k zakázce');
      } else {
        toast.error(getErrorMessage(error, 'Nepodařilo se smazat kontakt'));
      }
    },
  });

  // Utility function to check if a contact can be deleted
  // Issue #9: Query DB directly instead of using potentially stale cache
  const canDeleteContact = useCallback(async (contactId: string): Promise<{ allowed: boolean; reason?: string }> => {
    // Fetch fresh contact data from database
    const { data: contact, error: contactError } = await supabase
      .from('client_contacts')
      .select('*')
      .eq('id', contactId)
      .is('deleted_at', null)
      .single();

    if (contactError || !contact) {
      return { allowed: false, reason: 'Kontakt nebyl nalezen' };
    }

    // Fetch fresh count of contacts for this client
    const { count: contactCount, error: countError } = await supabase
      .from('client_contacts')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', contact.client_id)
      .is('deleted_at', null);

    if (countError) {
      console.error('Error checking contact count:', countError);
      return { allowed: false, reason: 'Nepodařilo se ověřit počet kontaktů' };
    }

    // Check if it's the only contact for the client
    if (contactCount === 1) {
      return { allowed: false, reason: 'Nelze smazat jediný kontakt klienta. Každý klient musí mít alespoň jeden kontakt.' };
    }

    // Check if it's primary
    if (contact.is_primary) {
      return { allowed: false, reason: 'Nelze smazat primární kontakt. Nejprve nastavte jiný kontakt jako primární.' };
    }

    // Check if contact is used in any engagement
    const { count: engagementCount, error: engError } = await supabase
      .from('engagements')
      .select('id', { count: 'exact', head: true })
      .eq('contact_person_id', contactId);

    if (engError) {
      console.error('Error checking engagement references:', engError);
      return { allowed: false, reason: 'Nepodařilo se ověřit použití kontaktu' };
    }

    if (engagementCount && engagementCount > 0) {
      return { allowed: false, reason: `Kontakt je přiřazen k ${engagementCount} zakázce/zakázkám a nelze ho smazat.` };
    }

    return { allowed: true };
  }, []); // No dependencies - uses fresh DB queries

  const addEngagementMutation = useMutation({
    mutationFn: async (data: Omit<Engagement, 'id' | 'created_at' | 'updated_at'>) => {
      const { data: result, error } = await supabase.from('engagements').insert(data).select().single();
      if (error) throw error;
      const engagement = transformEngagement(result);

      // Log creation in history (non-blocking, errors silently logged)
      supabase.rpc('log_engagement_change', {
        _engagement_id: engagement.id,
        _change_type: 'created',
        _field_name: null,
        _field_label: null,
        _old_value: null,
        _new_value: engagement.name,
        _related_entity_id: null,
        _related_entity_name: null,
      }).then(({ error }) => { if (error) console.error('log_engagement_change error:', error); });

      return engagement;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagements'] });
      queryClient.invalidateQueries({ queryKey: ['engagement_history'] });
      toast.success('Engagement byl vytvořen');
    },
    onError: (error) => {
      console.error('Failed to create engagement:', error);
      toast.error('Nepodařilo se vytvořit engagement');
    },
  });

  const updateEngagementMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Engagement> }) => {
      // Fetch fresh engagement data to avoid stale closure issues
      const { data: engagementData, error: fetchError } = await supabase
        .from('engagements')
        .select('*')
        .eq('id', id)
        .single();
      if (fetchError || !engagementData) throw new Error('Engagement not found');
      const engagement = transformEngagement(engagementData);

      // Log field changes before updating
      const historyPromises: Promise<void>[] = [];
      Object.keys(data).forEach(key => {
        if (key === 'updated_at' || key === 'created_at') return;
        const oldVal = String((engagement as Record<string, unknown>)[key] ?? '');
        const newVal = String((data as Record<string, unknown>)[key] ?? '');
        if (oldVal !== newVal) {
          const changeType = key === 'status' ? 'status_change' : 'field_update';
          const fieldLabel = key === 'status' ? 'Status' : key === 'name' ? 'Název' : key === 'start_date' ? 'Datum začátku' : key === 'end_date' ? 'Datum konce' : key;
          historyPromises.push(
            supabase.rpc('log_engagement_change', {
              _engagement_id: id,
              _change_type: changeType,
              _field_name: key,
              _field_label: fieldLabel,
              _old_value: oldVal,
              _new_value: newVal,
              _related_entity_id: null,
              _related_entity_name: null,
            }).then(({ error }) => { if (error) console.error('log_engagement_change error:', error); })
          );
        }
      });

      // Wait for history entries before proceeding with update
      try {
        await Promise.all(historyPromises);
      } catch (e) {
        console.error('History logging error:', e);
        // Continue with update even if history logging fails
      }

      const { error } = await supabase.from('engagements').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagements'] });
      queryClient.invalidateQueries({ queryKey: ['engagement_history'] });
      toast.success('Engagement byl uložen');
    },
    onError: (error) => {
      console.error('Failed to update engagement:', error);
      toast.error('Nepodařilo se uložit engagement');
    },
  });

  const deleteEngagementMutation = useMutation({
    mutationFn: async (id: string) => {
      // Log deletion to history first (before soft-deleting)
      try {
        await supabase.rpc('log_engagement_change', {
          _engagement_id: id,
          _change_type: 'deleted',
          _field_name: null,
          _field_label: null,
          _old_value: null,
          _new_value: null,
          _related_entity_id: null,
          _related_entity_name: null,
        });
      } catch (e) {
        console.error('Failed to log engagement deletion:', e);
        // Continue with deletion even if logging fails
      }

      // Soft delete by setting deleted_at
      const { error } = await supabase
        .from('engagements')
        .update({ deleted_at: new Date().toISOString(), status: 'cancelled' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      // Cascade invalidation for related entities
      queryClient.invalidateQueries({ queryKey: ['engagements'] });
      queryClient.invalidateQueries({ queryKey: ['engagement_services'] });
      queryClient.invalidateQueries({ queryKey: ['engagement_assignments'] });
      queryClient.invalidateQueries({ queryKey: ['extra_works'] });
      queryClient.invalidateQueries({ queryKey: ['engagement_history'] });
      toast.success('Engagement byl smazán');
    },
    onError: (error) => {
      console.error('Failed to delete engagement:', error);
      toast.error('Nepodařilo se smazat engagement');
    },
  });

  const addEngagementServiceMutation = useMutation({
    mutationFn: async (data: Omit<EngagementService, 'id' | 'created_at' | 'updated_at'>) => {
      const { data: result, error } = await supabase.from('engagement_services').insert(data).select().single();
      if (error) throw error;
      
      // Log service addition in history (non-blocking)
      supabase.rpc('log_engagement_change', {
        _engagement_id: data.engagement_id,
        _change_type: 'service_added',
        _field_name: null,
        _field_label: null,
        _old_value: null,
        _new_value: data.name,
        _related_entity_id: result.id,
        _related_entity_name: data.name,
      }).then(({ error }) => { if (error) console.error('log_engagement_change error:', error); });
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagement_services'] });
      queryClient.invalidateQueries({ queryKey: ['engagement_history'] });
      toast.success('Služba byla přidána');
    },
    onError: (error) => {
      console.error('Failed to add service:', error);
      toast.error('Nepodařilo se přidat službu');
    },
  });

  const updateEngagementServiceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<EngagementService> }) => {
      // Fetch fresh service data to avoid stale closure issues
      const { data: serviceData, error: fetchError } = await supabase
        .from('engagement_services')
        .select('*')
        .eq('id', id)
        .single();
      if (fetchError || !serviceData) throw new Error('Service not found');
      const service = serviceData as EngagementService;
      
      // Log service update in history (non-blocking)
      const changedFields = Object.keys(data).filter(key => key !== 'updated_at' && key !== 'created_at');
      if (changedFields.length > 0) {
        supabase.rpc('log_engagement_change', {
          _engagement_id: service.engagement_id,
          _change_type: 'service_updated',
          _field_name: null,
          _field_label: null,
          _old_value: null,
          _new_value: `Aktualizována služba: ${service.name}`,
          _related_entity_id: id,
          _related_entity_name: service.name,
        }).then(({ error }) => { if (error) console.error('log_engagement_change error:', error); });
      }
      
      const { error } = await supabase.from('engagement_services').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagement_services'] });
      queryClient.invalidateQueries({ queryKey: ['engagement_history'] });
      toast.success('Služba byla uložena');
    },
    onError: (error) => {
      console.error('Failed to update service:', error);
      toast.error('Nepodařilo se uložit službu');
    },
  });

  const deleteEngagementServiceMutation = useMutation({
    mutationFn: async (id: string) => {
      // Fetch fresh service data to avoid stale closure issues
      const { data: serviceData, error: fetchError } = await supabase
        .from('engagement_services')
        .select('*')
        .eq('id', id)
        .single();
      if (fetchError || !serviceData) throw new Error('Service not found');
      const service = serviceData as EngagementService;

      // Log service removal in history (non-blocking)
      supabase.rpc('log_engagement_change', {
        _engagement_id: service.engagement_id,
        _change_type: 'service_removed',
        _field_name: null,
        _field_label: null,
        _old_value: service.name,
        _new_value: null,
        _related_entity_id: id,
        _related_entity_name: service.name,
      }).then(({ error }) => { if (error) console.error('log_engagement_change error:', error); });

      const { error } = await supabase.from('engagement_services').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagement_services'] });
      queryClient.invalidateQueries({ queryKey: ['engagement_history'] });
      toast.success('Služba byla odebrána');
    },
    onError: (error) => {
      console.error('Failed to delete service:', error);
      toast.error('Nepodařilo se odebrat službu');
    },
  });

  const addColleagueMutation = useMutation({
    mutationFn: async (data: Omit<Colleague, 'id' | 'created_at' | 'updated_at'>) => {
      const { data: result, error } = await supabase.from('colleagues').insert(data).select().single();
      if (error) throw error;
      return transformColleague(result);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['colleagues'] });
      toast.success('Kolega byl přidán');
    },
    onError: (error) => {
      console.error('Failed to add colleague:', error);
      toast.error('Nepodařilo se přidat kolegu');
    },
  });

  const updateColleagueMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Colleague> }) => {
      const { error } = await supabase.from('colleagues').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['colleagues'] });
      toast.success('Kolega byl uložen');
    },
    onError: (error) => {
      console.error('Failed to update colleague:', error);
      toast.error('Nepodařilo se uložit kolegu');
    },
  });

  const deleteColleagueMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('colleagues').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['colleagues'] });
      toast.success('Kolega byl smazán');
    },
    onError: (error) => {
      console.error('Failed to delete colleague:', error);
      toast.error('Nepodařilo se smazat kolegu');
    },
  });

  const addAssignmentMutation = useMutation({
    mutationFn: async (data: Omit<EngagementAssignment, 'id' | 'created_at' | 'updated_at'>) => {
      const colleague = colleagues.find(c => c.id === data.colleague_id);
      const { data: result, error } = await supabase.from('engagement_assignments').insert(data).select().single();
      if (error) throw error;

      // Log assignment in history (non-blocking)
      supabase.rpc('log_engagement_change', {
        _engagement_id: data.engagement_id,
        _change_type: 'colleague_assigned',
        _field_name: null,
        _field_label: null,
        _old_value: null,
        _new_value: colleague?.full_name || 'Unknown',
        _related_entity_id: data.colleague_id,
        _related_entity_name: colleague?.full_name || 'Unknown',
      }).then(({ error }) => { if (error) console.error('log_engagement_change error:', error); });

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagement_assignments'] });
      queryClient.invalidateQueries({ queryKey: ['engagement_history'] });
      toast.success('Kolega byl přiřazen');
    },
    onError: (error) => {
      console.error('Failed to add assignment:', error);
      toast.error('Nepodařilo se přiřadit kolegu');
    },
  });

  const updateAssignmentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<EngagementAssignment> }) => {
      // Fetch fresh assignment data to avoid stale closure issues
      const { data: assignmentData, error: fetchError } = await supabase
        .from('engagement_assignments')
        .select('*')
        .eq('id', id)
        .single();
      if (fetchError || !assignmentData) throw new Error('Assignment not found');
      const assignment = assignmentData as EngagementAssignment;

      // Log assignment update in history (non-blocking)
      supabase.rpc('log_engagement_change', {
        _engagement_id: assignment.engagement_id,
        _change_type: 'colleague_updated',
        _field_name: null,
        _field_label: null,
        _old_value: null,
        _new_value: 'Aktualizováno přiřazení kolegy',
        _related_entity_id: assignment.colleague_id,
        _related_entity_name: null,
      }).then(({ error }) => { if (error) console.error('log_engagement_change error:', error); });

      const { error } = await supabase.from('engagement_assignments').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagement_assignments'] });
      queryClient.invalidateQueries({ queryKey: ['engagement_history'] });
      toast.success('Přiřazení bylo uloženo');
    },
    onError: (error) => {
      console.error('Failed to update assignment:', error);
      toast.error('Nepodařilo se uložit přiřazení');
    },
  });

  const removeAssignmentMutation = useMutation({
    mutationFn: async (id: string) => {
      // Fetch fresh assignment data to avoid stale closure issues
      const { data: assignmentData, error: fetchError } = await supabase
        .from('engagement_assignments')
        .select('*')
        .eq('id', id)
        .single();
      if (fetchError || !assignmentData) throw new Error('Assignment not found');
      const assignment = assignmentData as EngagementAssignment;

      // Fetch colleague name for history logging
      const { data: colleagueData } = await supabase
        .from('colleagues')
        .select('full_name')
        .eq('id', assignment.colleague_id)
        .single();
      const colleagueName = colleagueData?.full_name || 'Unknown';

      // Log assignment removal in history (non-blocking)
      supabase.rpc('log_engagement_change', {
        _engagement_id: assignment.engagement_id,
        _change_type: 'colleague_removed',
        _field_name: null,
        _field_label: null,
        _old_value: colleagueName,
        _new_value: null,
        _related_entity_id: assignment.colleague_id,
        _related_entity_name: colleagueName,
      }).then(({ error }) => { if (error) console.error('log_engagement_change error:', error); });

      const { error } = await supabase.from('engagement_assignments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagement_assignments'] });
      queryClient.invalidateQueries({ queryKey: ['engagement_history'] });
      toast.success('Kolega byl odebrán');
    },
    onError: (error) => {
      console.error('Failed to remove assignment:', error);
      toast.error('Nepodařilo se odebrat kolegu');
    },
  });

  const addExtraWorkMutation = useMutation({
    mutationFn: async (data: Omit<ExtraWork, 'id' | 'created_at' | 'updated_at' | 'status' | 'approval_date' | 'approved_by' | 'invoice_id' | 'invoice_number' | 'invoiced_at'>) => {
      const { data: result, error } = await supabase.from('extra_works').insert({
        ...data,
        status: 'pending_approval',
      }).select().single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['extra_works'] });
      toast.success('Extra práce byla vytvořena');
    },
    onError: (error) => {
      console.error('Failed to add extra work:', error);
      toast.error('Nepodařilo se vytvořit extra práci');
    },
  });

  const updateExtraWorkMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ExtraWork> }) => {
      const { error } = await supabase.from('extra_works').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['extra_works'] });
      toast.success('Extra práce byla uložena');
    },
    onError: (error) => {
      console.error('Failed to update extra work:', error);
      toast.error('Nepodařilo se uložit extra práci');
    },
  });

  const approveExtraWorkMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Validate current status before approving
      const { data: current, error: fetchError } = await supabase
        .from('extra_works')
        .select('status')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;
      if (current?.status !== 'pending_approval') {
        throw new Error('Can only approve items with pending_approval status');
      }

      const { error } = await supabase.from('extra_works').update({
        status: 'in_progress',
        approval_date: new Date().toISOString(),
        approved_by: user.id,
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['extra_works'] });
      toast.success('Extra práce byla schválena');
    },
    onError: (error) => {
      console.error('Failed to approve extra work:', error);
      toast.error('Nepodařilo se schválit extra práci');
    },
  });

  const completeExtraWorkMutation = useMutation({
    mutationFn: async (id: string) => {
      // Validate current status before completing
      const { data: current, error: fetchError } = await supabase
        .from('extra_works')
        .select('status')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;
      if (current?.status !== 'in_progress') {
        throw new Error('Can only complete items with in_progress status');
      }

      const { error } = await supabase.from('extra_works').update({
        status: 'ready_to_invoice',
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['extra_works'] });
      toast.success('Extra práce je připravena k fakturaci');
    },
    onError: (error) => {
      console.error('Failed to complete extra work:', error);
      toast.error('Nepodařilo se dokončit extra práci');
    },
  });

  const deleteExtraWorkMutation = useMutation({
    mutationFn: async (id: string) => {
      // Use soft delete via RPC function
      const { error } = await supabase.rpc('soft_delete_extra_work', { p_extra_work_id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['extra_works'] });
      toast.success('Extra práce byla smazána');
    },
    onError: (error) => {
      console.error('Failed to delete extra work:', error);
      toast.error('Nepodařilo se smazat extra práci');
    },
  });

  const addServiceMutation = useMutation({
    mutationFn: async (data: Omit<Service, 'id' | 'created_at' | 'updated_at'>) => {
      const { data: result, error } = await supabase.from('services').insert(data).select().single();
      if (error) throw error;
      return transformService(result);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Služba byla vytvořena');
    },
    onError: (error) => {
      console.error('Failed to add service:', error);
      toast.error('Nepodařilo se vytvořit službu');
    },
  });

  const updateServiceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Service> }) => {
      const { error } = await supabase.from('services').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Služba byla uložena');
    },
    onError: (error) => {
      console.error('Failed to update service:', error);
      toast.error('Nepodařilo se uložit službu');
    },
  });

  const deleteServiceMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('services').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Služba byla smazána');
    },
    onError: (error) => {
      console.error('Failed to delete service:', error);
      toast.error('Nepodařilo se smazat službu');
    },
  });

  const addIssuedInvoiceMutation = useMutation({
    mutationFn: async (data: Omit<IssuedInvoice, 'id' | 'created_at'>) => {
      const { data: result, error } = await supabase.from('issued_invoices').insert(data).select().single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issued_invoices'] });
      toast.success('Faktura byla vytvořena');
    },
    onError: (error) => {
      console.error('Failed to create invoice:', error);
      toast.error('Nepodařilo se vytvořit fakturu');
    },
  });

  const addEngagementMetricMutation = useMutation({
    mutationFn: async (data: Omit<EngagementMonthlyMetrics, 'id' | 'created_at' | 'updated_at'>) => {
      const { data: result, error } = await supabase.from('engagement_monthly_metrics').insert(data).select().single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagement_monthly_metrics'] });
      toast.success('Metrika byla uložena');
    },
    onError: (error) => {
      console.error('Failed to add engagement metric:', error);
      toast.error('Nepodařilo se uložit metriku');
    },
  });

  const updateEngagementMetricMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<EngagementMonthlyMetrics> }) => {
      const { error } = await supabase.from('engagement_monthly_metrics').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagement_monthly_metrics'] });
      toast.success('Metrika byla aktualizována');
    },
    onError: (error) => {
      console.error('Failed to update engagement metric:', error);
      toast.error('Nepodařilo se aktualizovat metriku');
    },
  });

  const addInvoiceLineItemMutation = useMutation({
    mutationFn: async (data: Omit<InvoiceLineItem, 'id' | 'created_at' | 'updated_at'>) => {
      const { data: result, error } = await supabase.from('invoice_line_items').insert(data).select().single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice_line_items'] });
      toast.success('Položka faktury byla přidána');
    },
    onError: (error) => {
      console.error('Failed to add invoice line item:', error);
      toast.error('Nepodařilo se přidat položku faktury');
    },
  });

  // Helper functions
  const getContactsByClientId = (clientId: string) => 
    clientContacts.filter(c => c.client_id === clientId);

  const getPrimaryContact = (clientId: string) => 
    clientContacts.find(c => c.client_id === clientId && c.is_primary);

  const getDecisionMaker = (clientId: string) => 
    clientContacts.find(c => c.client_id === clientId && c.is_decision_maker);

  const getEngagementServicesByEngagementId = (engagementId: string) => 
    engagementServices.filter(es => es.engagement_id === engagementId);

  const getUnbilledOneOffServices = () => 
    engagementServices.filter(es => 
      es.billing_type === 'one_off' && 
      es.invoicing_status === 'pending' && 
      es.is_active
    );

  const getAssignmentsByServiceId = (serviceId: string) => 
    assignments.filter(a => a.engagement_service_id === serviceId);

  const getExtraWorksReadyToInvoice = (year: number, month: number) => {
    const targetPeriod = `${year}-${String(month).padStart(2, '0')}`;
    return extraWorks.filter(ew => 
      ew.status === 'ready_to_invoice' && ew.billing_period === targetPeriod
    );
  };

  const getExtraWorksByEngagementId = (engagementId: string) => 
    extraWorks.filter(ew => ew.engagement_id === engagementId);

  const getClientById = (id: string) => clients.find(c => c.id === id);
  const getEngagementById = (id: string) => engagements.find(e => e.id === id);
  const getColleagueById = (id: string) => colleagues.find(c => c.id === id);
  const getEngagementsByClientId = (clientId: string) => 
    engagements.filter(e => e.client_id === clientId);
  const getAssignmentsByEngagementId = (engagementId: string) => 
    assignments.filter(a => a.engagement_id === engagementId);

  const getMetricsByEngagementId = (engagementId: string) => 
    engagementMetrics.filter(m => m.engagement_id === engagementId);

  const getEngagementHistory = (engagementId: string) => 
    engagementHistory.filter(h => h.engagement_id === engagementId);

  const getInvoicesByEngagementId = (engagementId: string) => 
    issuedInvoices.filter(inv => inv.engagement_id === engagementId);

  const getLineItemsByInvoiceId = (invoiceId: string) => 
    invoiceLineItems.filter(item => item.invoice_id === invoiceId);

  const addEngagementMetric = async (data: Omit<EngagementMonthlyMetrics, 'id' | 'created_at' | 'updated_at'>): Promise<EngagementMonthlyMetrics> => {
    return addEngagementMetricMutation.mutateAsync(data);
  };

  const updateEngagementMetric = async (id: string, data: Partial<EngagementMonthlyMetrics>) => {
    await updateEngagementMetricMutation.mutateAsync({ id, data });
  };

  const getIssuedInvoicesByYear = (year: number) => 
    issuedInvoices.filter(inv => inv.year === year);

  const getNextInvoiceNumber = (year: number) => {
    const yearInvoices = issuedInvoices.filter(inv => inv.year === year);
    const maxNumber = yearInvoices.reduce((max, inv) => {
      const match = inv.invoice_number.match(/FV-\d{4}-(\d+)/);
      const num = match ? parseInt(match[1], 10) : 0;
      return Math.max(max, num);
    }, 0);
    const nextNumber = maxNumber + 1;
    return `FV-${year}-${String(nextNumber).padStart(3, '0')}`;
  };

  const approveExtraWork = async (id: string) => {
    await approveExtraWorkMutation.mutateAsync(id);
  };

  const completeExtraWork = async (id: string) => {
    await completeExtraWorkMutation.mutateAsync(id);
  };

  const addInvoiceLineItem = async (data: Omit<InvoiceLineItem, 'id' | 'created_at' | 'updated_at'>): Promise<InvoiceLineItem> => {
    return addInvoiceLineItemMutation.mutateAsync(data);
  };

  const createInvoiceWithLineItems = async (
    invoice: Omit<IssuedInvoice, 'id' | 'created_at' | 'invoice_number'>,
    lineItems: Omit<InvoiceLineItem, 'id' | 'created_at' | 'updated_at' | 'invoice_id'>[],
    extraWorkIds: string[],
    oneOffServiceIds: string[],
    creativeBoostClientMonthIds: string[] = []
  ): Promise<IssuedInvoice> => {
    // Generate invoice number
    const invoiceNumber = getNextInvoiceNumber(invoice.year);
    
    // Get current user for issued_by
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    // Create invoice
    const { data: createdInvoice, error: invoiceError } = await supabase
      .from('issued_invoices')
      .insert({
        ...invoice,
        invoice_number: invoiceNumber,
        issued_by: user.id,
      })
      .select()
      .single();
    
    if (invoiceError) throw invoiceError;
    
    // Create line items
    const lineItemsWithInvoiceId = lineItems.map(item => ({
      ...item,
      invoice_id: createdInvoice.id,
    }));
    
    if (lineItemsWithInvoiceId.length > 0) {
      const { error: lineItemsError } = await supabase
        .from('invoice_line_items')
        .insert(lineItemsWithInvoiceId);
      
      if (lineItemsError) throw lineItemsError;
    }
    
    // Update extra works to invoiced status - atomic update with status check
    if (extraWorkIds.length > 0) {
      // Atomic update: only update items that are still ready_to_invoice
      // This prevents race conditions where another request invoices the same item
      const { data: updatedWorks, error: extraWorkError } = await supabase
        .from('extra_works')
        .update({
          status: 'invoiced',
          invoice_id: createdInvoice.id,
          invoice_number: invoiceNumber,
          invoiced_at: new Date().toISOString(),
        })
        .in('id', extraWorkIds)
        .eq('status', 'ready_to_invoice')  // Only update if still ready_to_invoice
        .select('id');

      if (extraWorkError) throw extraWorkError;

      // Verify all items were updated (none were already invoiced)
      if (!updatedWorks || updatedWorks.length !== extraWorkIds.length) {
        const updatedIds = new Set(updatedWorks?.map(w => w.id) || []);
        const failedIds = extraWorkIds.filter(id => !updatedIds.has(id));
        throw new Error(`Some extra works could not be invoiced (may have been invoiced already): ${failedIds.join(', ')}`);
      }
    }
    
    // Update one-off services to invoiced status
    if (oneOffServiceIds.length > 0) {
      const { error: serviceError } = await supabase
        .from('engagement_services')
        .update({
          invoicing_status: 'invoiced',
          invoiced_at: new Date().toISOString(),
          invoice_id: createdInvoice.id,
        })
        .in('id', oneOffServiceIds);

      if (serviceError) throw serviceError;
    }

    // Update Creative Boost client months to invoiced status
    if (creativeBoostClientMonthIds.length > 0) {
      // Calculate total credits from line items for this invoice
      const cbLineItems = lineItems.filter(li => li.source === 'creative_boost');
      const totalCredits = cbLineItems.reduce((sum, li) => sum + (li.quantity || 0), 0);
      const totalAmount = cbLineItems.reduce((sum, li) => sum + ((li.unit_price || 0) * (li.quantity || 0)), 0);

      const { error: cbError } = await supabase
        .from('creative_boost_client_months')
        .update({
          invoice_id: createdInvoice.id,
          invoiced_at: new Date().toISOString(),
          invoiced_credits: totalCredits,
          invoiced_amount: totalAmount,
        })
        .in('id', creativeBoostClientMonthIds);

      if (cbError) throw cbError;
    }

    // Invalidate queries
    queryClient.invalidateQueries({ queryKey: ['issued_invoices'] });
    queryClient.invalidateQueries({ queryKey: ['invoice_line_items'] });
    queryClient.invalidateQueries({ queryKey: ['extra_works'] });
    queryClient.invalidateQueries({ queryKey: ['engagement_services'] });
    queryClient.invalidateQueries({ queryKey: ['creative_boost_client_months'] });
    
    return createdInvoice;
  };

  // Memoize context value to prevent unnecessary re-renders
  // Note: Helper functions that filter data will be recreated when data changes,
  // but mutation functions are stable references from useMutation
  const contextValue = useMemo<CRMDataContextType>(() => ({
    clients,
    clientContacts,
    engagements,
    engagementServices,
    colleagues,
    assignments,
    extraWorks,
    services,
    issuedInvoices,
    engagementMetrics,
    engagementHistory,
    invoiceLineItems,
    isLoading,

    // Client operations
    addClient: (data) => addClientMutation.mutateAsync(data),
    updateClient: (id, data) => updateClientMutation.mutateAsync({ id, data }),
    softDeleteClient: (id) => softDeleteClientMutation.mutateAsync(id),

    // Contact operations
    addContact: (data) => addContactMutation.mutateAsync(data),
    updateContact: (id, data) => updateContactMutation.mutateAsync({ id, data }),
    deleteContact: (id) => deleteContactMutation.mutateAsync(id),
    setContactAsPrimary: (contactId) => setContactAsPrimaryMutation.mutateAsync(contactId),
    canDeleteContact,
    getContactsByClientId,
    getPrimaryContact,
    getDecisionMaker,

    // Engagement operations
    addEngagement: (data) => addEngagementMutation.mutateAsync(data),
    updateEngagement: (id, data) => updateEngagementMutation.mutateAsync({ id, data }),
    deleteEngagement: (id) => deleteEngagementMutation.mutateAsync(id),

    // Engagement Service operations
    addEngagementService: (data) => addEngagementServiceMutation.mutateAsync(data),
    updateEngagementService: (id, data) => updateEngagementServiceMutation.mutateAsync({ id, data }),
    deleteEngagementService: (id) => deleteEngagementServiceMutation.mutateAsync(id),
    getEngagementServicesByEngagementId,
    getUnbilledOneOffServices,
    markEngagementServiceAsInvoiced: async (id, invoiceId, invoicePeriod) => {
      await updateEngagementServiceMutation.mutateAsync({
        id,
        data: {
          invoicing_status: 'invoiced',
          invoiced_at: new Date().toISOString(),
          invoiced_in_period: invoicePeriod,
          invoice_id: invoiceId,
        },
      });
    },

    // Colleague operations
    addColleague: (data) => addColleagueMutation.mutateAsync(data),
    updateColleague: (id, data) => updateColleagueMutation.mutateAsync({ id, data }),
    deleteColleague: (id) => deleteColleagueMutation.mutateAsync(id),

    // Assignment operations
    addAssignment: (data) => addAssignmentMutation.mutateAsync(data),
    updateAssignment: (id, data) => updateAssignmentMutation.mutateAsync({ id, data }),
    removeAssignment: (id) => removeAssignmentMutation.mutateAsync(id),
    getAssignmentsByServiceId,

    // Extra Work operations
    addExtraWork: (data) => addExtraWorkMutation.mutateAsync(data),
    updateExtraWork: (id, data) => updateExtraWorkMutation.mutateAsync({ id, data }),
    deleteExtraWork: (id) => deleteExtraWorkMutation.mutateAsync(id),
    getExtraWorksReadyToInvoice,
    getExtraWorksByEngagementId,
    approveExtraWork,
    completeExtraWork,
    markExtraWorkAsInvoiced: async (id, invoiceId, invoiceNumber) => {
      await updateExtraWorkMutation.mutateAsync({
        id,
        data: {
          status: 'invoiced',
          invoice_id: invoiceId,
          invoice_number: invoiceNumber,
          invoiced_at: new Date().toISOString(),
        },
      });
    },

    // Service operations
    addService: (data) => addServiceMutation.mutateAsync(data),
    updateService: (id, data) => updateServiceMutation.mutateAsync({ id, data }),
    deleteService: (id) => deleteServiceMutation.mutateAsync(id),
    toggleServiceActive: async (id) => {
      const service = services.find(s => s.id === id);
      if (service) {
        await updateServiceMutation.mutateAsync({ id, data: { is_active: !service.is_active } });
      }
    },

    // Issued Invoice operations
    addIssuedInvoice: (data) => addIssuedInvoiceMutation.mutateAsync(data),
    getIssuedInvoicesByYear,
    getInvoicesByEngagementId,
    getNextInvoiceNumber,
    createInvoiceWithLineItems,

    // Invoice Line Items operations
    addInvoiceLineItem,
    getLineItemsByInvoiceId,

    // Engagement Monthly Metrics operations
    addEngagementMetric,
    updateEngagementMetric,
    getMetricsByEngagementId,

    // Engagement History
    getEngagementHistory,

    // Helper functions
    getClientById,
    getEngagementById,
    getColleagueById,
    getEngagementsByClientId,
    getAssignmentsByEngagementId,
  }), [
    // Data dependencies
    clients, clientContacts, engagements, engagementServices, colleagues,
    assignments, extraWorks, services, issuedInvoices, engagementMetrics,
    engagementHistory, invoiceLineItems, isLoading,
    // Helper functions that depend on data
    getContactsByClientId, getPrimaryContact, getDecisionMaker,
    getEngagementServicesByEngagementId, getUnbilledOneOffServices,
    getAssignmentsByServiceId, getExtraWorksReadyToInvoice, getExtraWorksByEngagementId,
    getIssuedInvoicesByYear, getInvoicesByEngagementId, getNextInvoiceNumber,
    getLineItemsByInvoiceId, getMetricsByEngagementId, getEngagementHistory,
    getClientById, getEngagementById, getColleagueById, getEngagementsByClientId,
    getAssignmentsByEngagementId, approveExtraWork, completeExtraWork,
    addEngagementMetric, updateEngagementMetric, addInvoiceLineItem, createInvoiceWithLineItems,
    canDeleteContact,
  ]);

  return (
    <CRMDataContext.Provider value={contextValue}>
      {children}
    </CRMDataContext.Provider>
  );
}

export function useCRMData() {
  const context = useContext(CRMDataContext);
  if (!context) {
    throw new Error('useCRMData must be used within a CRMDataProvider');
  }
  return context;
}
