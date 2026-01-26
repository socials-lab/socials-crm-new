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
  markExtraWorkAsInvoiced: (id: string, invoiceId: string, invoiceNumber: string) => Promise<void>;
  
  // Service operations
  addService: (data: Omit<Service, 'id' | 'created_at' | 'updated_at'>) => Promise<Service>;
  updateService: (id: string, data: Partial<Service>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  toggleServiceActive: (id: string) => Promise<void>;
  
  // Issued Invoices operations
  addIssuedInvoice: (invoice: Omit<IssuedInvoice, 'id' | 'created_at'>) => Promise<IssuedInvoice>;
  getIssuedInvoicesByYear: (year: number) => IssuedInvoice[];
  getNextInvoiceNumber: (year: number) => string;
  
  // Helper functions
  getClientById: (id: string) => Client | undefined;
  getEngagementById: (id: string) => Engagement | undefined;
  getColleagueById: (id: string) => Colleague | undefined;
  getEngagementsByClientId: (clientId: string) => Engagement[];
  getAssignmentsByEngagementId: (engagementId: string) => EngagementAssignment[];
}

const CRMDataContext = createContext<CRMDataContextType | null>(null);

// Helper function to transform DB row to Client type
const transformClient = (row: any): Client => ({
  ...row,
  status: row.status || 'active',
  tier: row.tier || 'standard',
  start_date: row.start_date || '',
  created_at: row.created_at || new Date().toISOString(),
  updated_at: row.updated_at || new Date().toISOString(),
});

const transformEngagement = (row: any): Engagement => ({
  ...row,
  type: row.type || 'retainer',
  billing_model: row.billing_model || 'fixed_fee',
  status: row.status || 'active',
  platforms: row.platforms || [],
  start_date: row.start_date || '',
  created_at: row.created_at || new Date().toISOString(),
  updated_at: row.updated_at || new Date().toISOString(),
});

const transformColleague = (row: any): Colleague => ({
  ...row,
  seniority: row.seniority || 'mid',
  status: row.status || 'active',
  created_at: row.created_at || new Date().toISOString(),
  updated_at: row.updated_at || new Date().toISOString(),
});

const transformService = (row: any): Service => ({
  ...row,
  service_type: row.service_type || 'core',
  category: row.category || 'performance',
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
      const { data, error } = await (supabase as any).from('clients').select('*').order('name');
      if (error) throw error;
      return (data || []).map(transformClient);
    },
  });

  const { data: clientContacts = [], isLoading: contactsLoading } = useQuery({
    queryKey: ['client_contacts'],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('client_contacts').select('*').order('name');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: engagements = [], isLoading: engagementsLoading } = useQuery({
    queryKey: ['engagements'],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('engagements').select('*').order('name');
      if (error) throw error;
      return (data || []).map(transformEngagement);
    },
  });

  const { data: engagementServices = [], isLoading: engServicesLoading } = useQuery({
    queryKey: ['engagement_services'],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('engagement_services').select('*');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: colleagues = [], isLoading: colleaguesLoading } = useQuery({
    queryKey: ['colleagues'],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('colleagues').select('*').order('full_name');
      if (error) throw error;
      return (data || []).map(transformColleague);
    },
  });

  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery({
    queryKey: ['engagement_assignments'],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('engagement_assignments').select('*');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: extraWorks = [], isLoading: extraWorksLoading } = useQuery({
    queryKey: ['extra_works'],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('extra_works').select('*').order('work_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Creative Boost mock service - will be merged with Supabase data
  const CREATIVE_BOOST_SERVICE: Service = {
    id: 'service-creative-boost-mock',
    code: 'CREATIVE_BOOST',
    name: 'Creative Boost',
    service_type: 'addon',
    category: 'creative',
    base_price: 400, // base price per credit
    currency: 'CZK',
    description: 'Kreditový systém pro tvorbu kreativ (bannery, videa, AI foto). Základní cena: 400 Kč/kredit. Cena za kredit se upravuje na úrovni zakázky.',
    is_active: true,
    tier_pricing: null,
    external_url: null,
    default_deliverables: [
      'Kreativní výstupy dle kreditového systému',
      'Bannery, videa, AI foto dle potřeby',
      'Express dodání za příplatek 50%',
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data: services = [], isLoading: servicesLoading } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('services').select('*').order('name');
      if (error) throw error;
      const dbServices = (data || []).map(transformService);
      
      // Add Creative Boost if not already in DB
      const hasCreativeBoost = dbServices.some((s: Service) => 
        s.code === 'CREATIVE_BOOST' || s.name.toLowerCase().includes('creative boost')
      );
      
      if (!hasCreativeBoost) {
        return [...dbServices, CREATIVE_BOOST_SERVICE].sort((a, b) => a.name.localeCompare(b.name));
      }
      
      return dbServices;
    },
  });

  const { data: issuedInvoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ['issued_invoices'],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('issued_invoices').select('*').order('issued_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const isLoading = clientsLoading || contactsLoading || engagementsLoading || 
                    engServicesLoading || colleaguesLoading || assignmentsLoading || 
                    extraWorksLoading || servicesLoading || invoicesLoading;

  // Mutations
  const addClientMutation = useMutation({
    mutationFn: async (data: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => {
      const { data: result, error } = await (supabase as any).from('clients').insert(data).select().single();
      if (error) throw error;
      return transformClient(result);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  });

  const updateClientMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Client> }) => {
      const { error } = await (supabase as any).from('clients').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  });

  const deleteClientMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('clients').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  });

  const addContactMutation = useMutation({
    mutationFn: async (data: Omit<ClientContact, 'id' | 'created_at' | 'updated_at'>) => {
      const { data: result, error } = await (supabase as any).from('client_contacts').insert(data).select().single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['client_contacts'] }),
  });

  const updateContactMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ClientContact> }) => {
      const { error } = await (supabase as any).from('client_contacts').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['client_contacts'] }),
  });

  const deleteContactMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('client_contacts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['client_contacts'] }),
  });

  const addEngagementMutation = useMutation({
    mutationFn: async (data: Omit<Engagement, 'id' | 'created_at' | 'updated_at'>) => {
      const { data: result, error } = await (supabase as any).from('engagements').insert(data).select().single();
      if (error) throw error;
      return transformEngagement(result);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['engagements'] }),
  });

  const updateEngagementMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Engagement> }) => {
      const { error } = await (supabase as any).from('engagements').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['engagements'] }),
  });

  const deleteEngagementMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('engagements').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['engagements'] }),
  });

  const addEngagementServiceMutation = useMutation({
    mutationFn: async (data: Omit<EngagementService, 'id' | 'created_at' | 'updated_at'>) => {
      const { data: result, error } = await (supabase as any).from('engagement_services').insert(data).select().single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['engagement_services'] }),
  });

  const updateEngagementServiceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<EngagementService> }) => {
      const { error } = await (supabase as any).from('engagement_services').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['engagement_services'] }),
  });

  const deleteEngagementServiceMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('engagement_services').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['engagement_services'] }),
  });

  const addColleagueMutation = useMutation({
    mutationFn: async (data: Omit<Colleague, 'id' | 'created_at' | 'updated_at'>) => {
      const { data: result, error } = await (supabase as any).from('colleagues').insert(data).select().single();
      if (error) throw error;
      return transformColleague(result);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['colleagues'] }),
  });

  const updateColleagueMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Colleague> }) => {
      const { error } = await (supabase as any).from('colleagues').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['colleagues'] }),
  });

  const deleteColleagueMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('colleagues').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['colleagues'] }),
  });

  const addAssignmentMutation = useMutation({
    mutationFn: async (data: Omit<EngagementAssignment, 'id' | 'created_at' | 'updated_at'>) => {
      const { data: result, error } = await (supabase as any).from('engagement_assignments').insert(data).select().single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['engagement_assignments'] }),
  });

  const updateAssignmentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<EngagementAssignment> }) => {
      const { error } = await (supabase as any).from('engagement_assignments').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['engagement_assignments'] }),
  });

  const removeAssignmentMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('engagement_assignments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['engagement_assignments'] }),
  });

  const addExtraWorkMutation = useMutation({
    mutationFn: async (data: Omit<ExtraWork, 'id' | 'created_at' | 'updated_at' | 'status' | 'approval_date' | 'approved_by' | 'invoice_id' | 'invoice_number' | 'invoiced_at'>) => {
      const { data: result, error } = await (supabase as any).from('extra_works').insert({
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
      const { error } = await (supabase as any).from('extra_works').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['extra_works'] }),
  });

  const deleteExtraWorkMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('extra_works').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['extra_works'] }),
  });

  const addServiceMutation = useMutation({
    mutationFn: async (data: Omit<Service, 'id' | 'created_at' | 'updated_at'>) => {
      const { data: result, error } = await (supabase as any).from('services').insert(data).select().single();
      if (error) throw error;
      return transformService(result);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['services'] }),
  });

  const updateServiceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Service> }) => {
      const { error } = await (supabase as any).from('services').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['services'] }),
  });

  const deleteServiceMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('services').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['services'] }),
  });

  const addIssuedInvoiceMutation = useMutation({
    mutationFn: async (data: Omit<IssuedInvoice, 'id' | 'created_at'>) => {
      const { data: result, error } = await (supabase as any).from('issued_invoices').insert(data).select().single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['issued_invoices'] }),
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

  const getClientById = (id: string) => clients.find(c => c.id === id);
  const getEngagementById = (id: string) => engagements.find(e => e.id === id);
  const getColleagueById = (id: string) => colleagues.find(c => c.id === id);
  const getEngagementsByClientId = (clientId: string) => 
    engagements.filter(e => e.client_id === clientId);
  const getAssignmentsByEngagementId = (engagementId: string) => 
    assignments.filter(a => a.engagement_id === engagementId);

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
      getNextInvoiceNumber,
      
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
