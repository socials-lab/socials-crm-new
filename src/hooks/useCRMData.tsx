import { createContext, useContext, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
  deleteClient: (id: string) => Promise<void>;
  
  // Client Contact operations
  addContact: (contact: Omit<ClientContact, 'id' | 'created_at' | 'updated_at'>) => Promise<ClientContact>;
  updateContact: (id: string, data: Partial<ClientContact>) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
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
    oneOffServiceIds: string[]
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
const transformClient = (row: Record<string, unknown>): Client => ({
  ...row,
  status: row.status || 'active',
  tier: row.tier || 'standard',
  start_date: row.start_date || '',
  created_at: row.created_at || new Date().toISOString(),
  updated_at: row.updated_at || new Date().toISOString(),
});

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
  is_active: row.is_active ?? true,
  created_at: row.created_at || new Date().toISOString(),
  updated_at: row.updated_at || new Date().toISOString(),
});

export function CRMDataProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  // Note: Using 'as any' because Supabase types are auto-generated and tables may not exist yet
  // After running migration, regenerate types with: npx supabase gen types typescript
  
  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase.from('clients').select('*').order('name');
      if (error) throw error;
      return (data || []).map(transformClient);
    },
  });

  const { data: clientContacts = [], isLoading: contactsLoading } = useQuery({
    queryKey: ['client_contacts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('client_contacts').select('*').order('name');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: engagements = [], isLoading: engagementsLoading } = useQuery({
    queryKey: ['engagements'],
    queryFn: async () => {
      const { data, error } = await supabase.from('engagements').select('*').order('name');
      if (error) throw error;
      return (data || []).map(transformEngagement);
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
      const { data, error } = await supabase.from('extra_works').select('*').order('work_date', { ascending: false });
      if (error) throw error;
      return data || [];
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

  // Mutations
  const addClientMutation = useMutation({
    mutationFn: async (data: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => {
      const { data: result, error } = await supabase.from('clients').insert(data).select().single();
      if (error) throw error;
      return transformClient(result);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  });

  const updateClientMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Client> }) => {
      const { error } = await supabase.from('clients').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  });

  const deleteClientMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  });

  const addContactMutation = useMutation({
    mutationFn: async (data: Omit<ClientContact, 'id' | 'created_at' | 'updated_at'>) => {
      const { data: result, error } = await supabase.from('client_contacts').insert(data).select().single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['client_contacts'] }),
  });

  const updateContactMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ClientContact> }) => {
      const { error } = await supabase.from('client_contacts').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['client_contacts'] }),
  });

  const deleteContactMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('client_contacts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['client_contacts'] }),
  });

  const addEngagementMutation = useMutation({
    mutationFn: async (data: Omit<Engagement, 'id' | 'created_at' | 'updated_at'>) => {
      const { data: result, error } = await supabase.from('engagements').insert(data).select().single();
      if (error) throw error;
      const engagement = transformEngagement(result);
      
      // Log creation in history
      await supabase.rpc('log_engagement_change', {
        _engagement_id: engagement.id,
        _change_type: 'created',
        _field_name: null,
        _field_label: null,
        _old_value: null,
        _new_value: engagement.name,
        _related_entity_id: null,
        _related_entity_name: null,
      }).catch(console.error);
      
      return engagement;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagements'] });
      queryClient.invalidateQueries({ queryKey: ['engagement_history'] });
    },
  });

  const updateEngagementMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Engagement> }) => {
      const engagement = engagements.find(e => e.id === id);
      if (!engagement) throw new Error('Engagement not found');
      
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
            }).then(() => {}).catch(console.error)
          );
        }
      });
      
      // Wait for history entries (non-blocking)
      Promise.all(historyPromises).catch(console.error);
      
      const { error } = await supabase.from('engagements').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagements'] });
      queryClient.invalidateQueries({ queryKey: ['engagement_history'] });
    },
  });

  const deleteEngagementMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('engagements').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['engagements'] }),
  });

  const addEngagementServiceMutation = useMutation({
    mutationFn: async (data: Omit<EngagementService, 'id' | 'created_at' | 'updated_at'>) => {
      const { data: result, error } = await supabase.from('engagement_services').insert(data).select().single();
      if (error) throw error;
      
      // Log service addition in history
      await supabase.rpc('log_engagement_change', {
        _engagement_id: data.engagement_id,
        _change_type: 'service_added',
        _field_name: null,
        _field_label: null,
        _old_value: null,
        _new_value: data.name,
        _related_entity_id: result.id,
        _related_entity_name: data.name,
      }).catch(console.error);
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagement_services'] });
      queryClient.invalidateQueries({ queryKey: ['engagement_history'] });
    },
  });

  const updateEngagementServiceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<EngagementService> }) => {
      const service = engagementServices.find(s => s.id === id);
      if (!service) throw new Error('Service not found');
      
      // Log service update in history
      const changedFields = Object.keys(data).filter(key => key !== 'updated_at' && key !== 'created_at');
      if (changedFields.length > 0) {
        await supabase.rpc('log_engagement_change', {
          _engagement_id: service.engagement_id,
          _change_type: 'service_updated',
          _field_name: null,
          _field_label: null,
          _old_value: null,
          _new_value: `Aktualizována služba: ${service.name}`,
          _related_entity_id: id,
          _related_entity_name: service.name,
        }).catch(console.error);
      }
      
      const { error } = await supabase.from('engagement_services').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagement_services'] });
      queryClient.invalidateQueries({ queryKey: ['engagement_history'] });
    },
  });

  const deleteEngagementServiceMutation = useMutation({
    mutationFn: async (id: string) => {
      const service = engagementServices.find(s => s.id === id);
      if (!service) throw new Error('Service not found');
      
      // Log service removal in history
      await supabase.rpc('log_engagement_change', {
        _engagement_id: service.engagement_id,
        _change_type: 'service_removed',
        _field_name: null,
        _field_label: null,
        _old_value: service.name,
        _new_value: null,
        _related_entity_id: id,
        _related_entity_name: service.name,
      }).catch(console.error);
      
      const { error } = await supabase.from('engagement_services').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagement_services'] });
      queryClient.invalidateQueries({ queryKey: ['engagement_history'] });
    },
  });

  const addColleagueMutation = useMutation({
    mutationFn: async (data: Omit<Colleague, 'id' | 'created_at' | 'updated_at'>) => {
      const { data: result, error } = await supabase.from('colleagues').insert(data).select().single();
      if (error) throw error;
      return transformColleague(result);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['colleagues'] }),
  });

  const updateColleagueMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Colleague> }) => {
      const { error } = await supabase.from('colleagues').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['colleagues'] }),
  });

  const deleteColleagueMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('colleagues').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['colleagues'] }),
  });

  const addAssignmentMutation = useMutation({
    mutationFn: async (data: Omit<EngagementAssignment, 'id' | 'created_at' | 'updated_at'>) => {
      const colleague = colleagues.find(c => c.id === data.colleague_id);
      const { data: result, error } = await supabase.from('engagement_assignments').insert(data).select().single();
      if (error) throw error;
      
      // Log assignment in history
      await supabase.rpc('log_engagement_change', {
        _engagement_id: data.engagement_id,
        _change_type: 'colleague_assigned',
        _field_name: null,
        _field_label: null,
        _old_value: null,
        _new_value: colleague?.full_name || 'Unknown',
        _related_entity_id: data.colleague_id,
        _related_entity_name: colleague?.full_name || 'Unknown',
      }).catch(console.error);
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagement_assignments'] });
      queryClient.invalidateQueries({ queryKey: ['engagement_history'] });
    },
  });

  const updateAssignmentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<EngagementAssignment> }) => {
      const assignment = assignments.find(a => a.id === id);
      if (!assignment) throw new Error('Assignment not found');
      
      // Log assignment update in history
      await supabase.rpc('log_engagement_change', {
        _engagement_id: assignment.engagement_id,
        _change_type: 'colleague_updated',
        _field_name: null,
        _field_label: null,
        _old_value: null,
        _new_value: 'Aktualizováno přiřazení kolegy',
        _related_entity_id: assignment.colleague_id,
        _related_entity_name: null,
      }).catch(console.error);
      
      const { error } = await supabase.from('engagement_assignments').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagement_assignments'] });
      queryClient.invalidateQueries({ queryKey: ['engagement_history'] });
    },
  });

  const removeAssignmentMutation = useMutation({
    mutationFn: async (id: string) => {
      const assignment = assignments.find(a => a.id === id);
      if (!assignment) throw new Error('Assignment not found');
      
      const colleague = colleagues.find(c => c.id === assignment.colleague_id);
      
      // Log assignment removal in history
      await supabase.rpc('log_engagement_change', {
        _engagement_id: assignment.engagement_id,
        _change_type: 'colleague_removed',
        _field_name: null,
        _field_label: null,
        _old_value: colleague?.full_name || 'Unknown',
        _new_value: null,
        _related_entity_id: assignment.colleague_id,
        _related_entity_name: colleague?.full_name || 'Unknown',
      }).catch(console.error);
      
      const { error } = await supabase.from('engagement_assignments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagement_assignments'] });
      queryClient.invalidateQueries({ queryKey: ['engagement_history'] });
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['extra_works'] }),
  });

  const updateExtraWorkMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ExtraWork> }) => {
      const { error } = await supabase.from('extra_works').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['extra_works'] }),
  });

  const approveExtraWorkMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      const { error } = await supabase.from('extra_works').update({
        status: 'in_progress',
        approval_date: new Date().toISOString(),
        approved_by: user.id,
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['extra_works'] }),
  });

  const completeExtraWorkMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('extra_works').update({
        status: 'ready_to_invoice',
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['extra_works'] }),
  });

  const deleteExtraWorkMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('extra_works').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['extra_works'] }),
  });

  const addServiceMutation = useMutation({
    mutationFn: async (data: Omit<Service, 'id' | 'created_at' | 'updated_at'>) => {
      const { data: result, error } = await supabase.from('services').insert(data).select().single();
      if (error) throw error;
      return transformService(result);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['services'] }),
  });

  const updateServiceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Service> }) => {
      const { error } = await supabase.from('services').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['services'] }),
  });

  const deleteServiceMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('services').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['services'] }),
  });

  const addIssuedInvoiceMutation = useMutation({
    mutationFn: async (data: Omit<IssuedInvoice, 'id' | 'created_at'>) => {
      const { data: result, error } = await supabase.from('issued_invoices').insert(data).select().single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['issued_invoices'] }),
  });

  const addEngagementMetricMutation = useMutation({
    mutationFn: async (data: Omit<EngagementMonthlyMetrics, 'id' | 'created_at' | 'updated_at'>) => {
      const { data: result, error } = await supabase.from('engagement_monthly_metrics').insert(data).select().single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['engagement_monthly_metrics'] }),
  });

  const updateEngagementMetricMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<EngagementMonthlyMetrics> }) => {
      const { error } = await supabase.from('engagement_monthly_metrics').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['engagement_monthly_metrics'] }),
  });

  const addInvoiceLineItemMutation = useMutation({
    mutationFn: async (data: Omit<InvoiceLineItem, 'id' | 'created_at' | 'updated_at'>) => {
      const { data: result, error } = await supabase.from('invoice_line_items').insert(data).select().single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoice_line_items'] }),
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
    oneOffServiceIds: string[]
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
    
    // Update extra works to invoiced status
    if (extraWorkIds.length > 0) {
      const { error: extraWorkError } = await supabase
        .from('extra_works')
        .update({
          status: 'invoiced',
          invoice_id: createdInvoice.id,
          invoice_number: invoiceNumber,
          invoiced_at: new Date().toISOString(),
        })
        .in('id', extraWorkIds);
      
      if (extraWorkError) throw extraWorkError;
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
    
    // Invalidate queries
    queryClient.invalidateQueries({ queryKey: ['issued_invoices'] });
    queryClient.invalidateQueries({ queryKey: ['invoice_line_items'] });
    queryClient.invalidateQueries({ queryKey: ['extra_works'] });
    queryClient.invalidateQueries({ queryKey: ['engagement_services'] });
    
    return createdInvoice;
  };

  return (
    <CRMDataContext.Provider value={{
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
      addClient: async (data) => addClientMutation.mutateAsync(data),
      updateClient: async (id, data) => updateClientMutation.mutateAsync({ id, data }),
      deleteClient: async (id) => deleteClientMutation.mutateAsync(id),
      
      // Contact operations
      addContact: async (data) => addContactMutation.mutateAsync(data),
      updateContact: async (id, data) => updateContactMutation.mutateAsync({ id, data }),
      deleteContact: async (id) => deleteContactMutation.mutateAsync(id),
      getContactsByClientId,
      getPrimaryContact,
      getDecisionMaker,
      
      // Engagement operations
      addEngagement: async (data) => addEngagementMutation.mutateAsync(data),
      updateEngagement: async (id, data) => updateEngagementMutation.mutateAsync({ id, data }),
      deleteEngagement: async (id) => deleteEngagementMutation.mutateAsync(id),
      
      // Engagement Service operations
      addEngagementService: async (data) => addEngagementServiceMutation.mutateAsync(data),
      updateEngagementService: async (id, data) => updateEngagementServiceMutation.mutateAsync({ id, data }),
      deleteEngagementService: async (id) => deleteEngagementServiceMutation.mutateAsync(id),
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
      addColleague: async (data) => addColleagueMutation.mutateAsync(data),
      updateColleague: async (id, data) => updateColleagueMutation.mutateAsync({ id, data }),
      deleteColleague: async (id) => deleteColleagueMutation.mutateAsync(id),
      
      // Assignment operations
      addAssignment: async (data) => addAssignmentMutation.mutateAsync(data),
      updateAssignment: async (id, data) => updateAssignmentMutation.mutateAsync({ id, data }),
      removeAssignment: async (id) => removeAssignmentMutation.mutateAsync(id),
      getAssignmentsByServiceId,
      
      // Extra Work operations
      addExtraWork: async (data) => addExtraWorkMutation.mutateAsync(data),
      updateExtraWork: async (id, data) => updateExtraWorkMutation.mutateAsync({ id, data }),
      deleteExtraWork: async (id) => deleteExtraWorkMutation.mutateAsync(id),
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
      addService: async (data) => addServiceMutation.mutateAsync(data),
      updateService: async (id, data) => updateServiceMutation.mutateAsync({ id, data }),
      deleteService: async (id) => deleteServiceMutation.mutateAsync(id),
      toggleServiceActive: async (id) => {
        const service = services.find(s => s.id === id);
        if (service) {
          await updateServiceMutation.mutateAsync({ id, data: { is_active: !service.is_active } });
        }
      },
      
      // Issued Invoice operations
      addIssuedInvoice: async (data) => addIssuedInvoiceMutation.mutateAsync(data),
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
    }}>
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
