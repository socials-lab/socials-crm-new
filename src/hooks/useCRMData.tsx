import { useState, useCallback, createContext, useContext, ReactNode } from 'react';
import { 
  clients as initialClients, 
  engagements as initialEngagements, 
  colleagues as initialColleagues,
  engagementAssignments as initialAssignments,
  engagementServices as initialEngagementServices,
  clientServices as initialClientServices,
  clientContacts as initialClientContacts,
  services as initialServices,
  engagementMonthlyMetrics,
  extraWorks as initialExtraWorks,
  engagementInvoiceHistory,
  issuedInvoices as initialIssuedInvoices,
} from '@/data/mockData';
import type { 
  Client, 
  ClientContact,
  Engagement, 
  EngagementService,
  Colleague, 
  EngagementAssignment,
  ClientService,
  ExtraWork,
  MonthlyEngagementInvoice,
  Service,
  EngagementHistoryEntry,
  EngagementChangeType,
  EngagementStatus,
  IssuedInvoice,
} from '@/types/crm';
import { currentUser } from '@/data/mockData';

// Field labels for engagement history
const ENGAGEMENT_FIELD_LABELS: Record<string, string> = {
  name: 'Název',
  type: 'Typ',
  billing_model: 'Model fakturace',
  currency: 'Měna',
  monthly_fee: 'Měsíční poplatek',
  one_off_fee: 'Jednorázový poplatek',
  status: 'Stav',
  start_date: 'Datum zahájení',
  end_date: 'Datum ukončení',
  notice_period_months: 'Výpovědní lhůta',
  freelo_url: 'Freelo URL',
  platforms: 'Platformy',
  notes: 'Poznámky',
  contact_person_id: 'Kontaktní osoba',
};

const STATUS_LABELS: Record<EngagementStatus, string> = {
  planned: 'Plánováno',
  active: 'Aktivní',
  paused: 'Pozastaveno',
  completed: 'Dokončeno',
  cancelled: 'Zrušeno',
};

interface CRMDataContextType {
  clients: Client[];
  clientContacts: ClientContact[];
  engagements: Engagement[];
  engagementServices: EngagementService[];
  colleagues: Colleague[];
  assignments: EngagementAssignment[];
  clientServices: (ClientService & { service_id: string })[];
  extraWorks: ExtraWork[];
  
  // Client operations
  addClient: (client: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => Client;
  updateClient: (id: string, data: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  
  // Client Contact operations
  addContact: (contact: Omit<ClientContact, 'id' | 'created_at' | 'updated_at'>) => ClientContact;
  updateContact: (id: string, data: Partial<ClientContact>) => void;
  deleteContact: (id: string) => void;
  getContactsByClientId: (clientId: string) => ClientContact[];
  getPrimaryContact: (clientId: string) => ClientContact | undefined;
  getDecisionMaker: (clientId: string) => ClientContact | undefined;
  
  // Engagement operations
  addEngagement: (engagement: Omit<Engagement, 'id' | 'created_at' | 'updated_at'>) => Engagement;
  updateEngagement: (id: string, data: Partial<Engagement>) => void;
  deleteEngagement: (id: string) => void;
  
  // Engagement Service operations
  addEngagementService: (data: Omit<EngagementService, 'id' | 'created_at' | 'updated_at'>) => EngagementService;
  updateEngagementService: (id: string, data: Partial<EngagementService>) => void;
  deleteEngagementService: (id: string) => void;
  getEngagementServicesByEngagementId: (engagementId: string) => EngagementService[];
  getUnbilledOneOffServices: () => EngagementService[];
  markEngagementServiceAsInvoiced: (id: string, invoiceId: string, invoicePeriod: string) => void;
  
  // Colleague operations
  addColleague: (colleague: Omit<Colleague, 'id' | 'created_at' | 'updated_at'>) => Colleague;
  updateColleague: (id: string, data: Partial<Colleague>) => void;
  deleteColleague: (id: string) => void;
  
  // Assignment operations
  addAssignment: (assignment: Omit<EngagementAssignment, 'id' | 'created_at' | 'updated_at'>) => EngagementAssignment;
  updateAssignment: (id: string, data: Partial<EngagementAssignment>) => void;
  removeAssignment: (id: string) => void;
  getAssignmentsByServiceId: (serviceId: string) => EngagementAssignment[];
  
  // Extra Work operations
  addExtraWork: (data: Omit<ExtraWork, 'id' | 'created_at' | 'updated_at' | 'status' | 'approval_date' | 'approved_by' | 'invoice_id' | 'invoice_number' | 'invoiced_at'>) => ExtraWork;
  updateExtraWork: (id: string, data: Partial<ExtraWork>) => void;
  deleteExtraWork: (id: string) => void;
  getExtraWorksReadyToInvoice: (year: number, month: number) => ExtraWork[];
  markExtraWorkAsInvoiced: (id: string, invoiceId: string, invoiceNumber: string) => void;
  
  // Issued Invoices operations
  issuedInvoices: IssuedInvoice[];
  addIssuedInvoice: (invoice: Omit<IssuedInvoice, 'id' | 'created_at'>) => IssuedInvoice;
  getIssuedInvoicesByYear: (year: number) => IssuedInvoice[];
  getNextInvoiceNumber: (year: number) => string;
  
  // Helper functions
  getClientById: (id: string) => Client | undefined;
  getEngagementById: (id: string) => Engagement | undefined;
  getColleagueById: (id: string) => Colleague | undefined;
  getEngagementsByClientId: (clientId: string) => Engagement[];
  getAssignmentsByEngagementId: (engagementId: string) => EngagementAssignment[];
  getMetricsByEngagementId: (engagementId: string) => typeof engagementMonthlyMetrics;
  getInvoicesByEngagementId: (engagementId: string) => MonthlyEngagementInvoice[];
  
  // Engagement History
  engagementHistory: EngagementHistoryEntry[];
  getEngagementHistory: (engagementId: string) => EngagementHistoryEntry[];
  
  // Service operations
  services: Service[];
  addService: (data: Omit<Service, 'id' | 'created_at' | 'updated_at'>) => Service;
  updateService: (id: string, data: Partial<Service>) => void;
  deleteService: (id: string) => void;
  toggleServiceActive: (id: string) => void;
}

const CRMDataContext = createContext<CRMDataContextType | null>(null);

export function CRMDataProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [clientContacts, setClientContacts] = useState<ClientContact[]>(initialClientContacts);
  const [engagements, setEngagements] = useState<Engagement[]>(initialEngagements);
  const [engagementServicesList, setEngagementServices] = useState<EngagementService[]>(initialEngagementServices);
  const [colleagues, setColleagues] = useState<Colleague[]>(initialColleagues);
  const [assignments, setAssignments] = useState<EngagementAssignment[]>(initialAssignments);
  const [clientServicesList, setClientServices] = useState(initialClientServices);
  const [extraWorks, setExtraWorks] = useState<ExtraWork[]>(initialExtraWorks);
  const [servicesList, setServices] = useState<Service[]>(initialServices);
  const [engagementHistory, setEngagementHistory] = useState<EngagementHistoryEntry[]>([]);
  const [issuedInvoicesList, setIssuedInvoices] = useState<IssuedInvoice[]>(initialIssuedInvoices);

  const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const now = () => new Date().toISOString();

  // Add engagement history entry helper
  const addEngagementHistoryEntry = useCallback((
    engagementId: string,
    changeType: EngagementChangeType,
    fieldName: string | null,
    oldValue: string | null,
    newValue: string | null,
    relatedEntityId: string | null = null,
    relatedEntityName: string | null = null
  ) => {
    const entry: EngagementHistoryEntry = {
      id: generateId('eh'),
      engagement_id: engagementId,
      change_type: changeType,
      field_name: fieldName,
      field_label: fieldName ? ENGAGEMENT_FIELD_LABELS[fieldName] || fieldName : null,
      old_value: oldValue,
      new_value: newValue,
      related_entity_id: relatedEntityId,
      related_entity_name: relatedEntityName,
      changed_by: currentUser.id,
      changed_by_name: currentUser.full_name,
      created_at: now(),
    };
    setEngagementHistory(prev => [entry, ...prev]);
  }, []);

  // Client operations
  const addClient = useCallback((data: Omit<Client, 'id' | 'created_at' | 'updated_at'>): Client => {
    const newClient: Client = {
      ...data,
      id: generateId('cli'),
      created_at: now(),
      updated_at: now(),
    };
    setClients(prev => [...prev, newClient]);
    return newClient;
  }, []);

  const updateClient = useCallback((id: string, data: Partial<Client>) => {
    setClients(prev => prev.map(c => 
      c.id === id ? { ...c, ...data, updated_at: now() } : c
    ));
  }, []);

  const deleteClient = useCallback((id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
    setClientContacts(prev => prev.filter(c => c.client_id !== id));
  }, []);

  // Client Contact operations
  const addContact = useCallback((data: Omit<ClientContact, 'id' | 'created_at' | 'updated_at'>): ClientContact => {
    const newContact: ClientContact = {
      ...data,
      id: generateId('cc'),
      created_at: now(),
      updated_at: now(),
    };
    
    // If this is marked as primary, unset other primary contacts for this client
    if (data.is_primary) {
      setClientContacts(prev => prev.map(c => 
        c.client_id === data.client_id ? { ...c, is_primary: false } : c
      ));
    }
    
    setClientContacts(prev => [...prev, newContact]);
    return newContact;
  }, []);

  const updateContact = useCallback((id: string, data: Partial<ClientContact>) => {
    setClientContacts(prev => {
      const contact = prev.find(c => c.id === id);
      if (!contact) return prev;
      
      // If updating to primary, unset other primaries for this client
      if (data.is_primary) {
        return prev.map(c => {
          if (c.id === id) return { ...c, ...data, updated_at: now() };
          if (c.client_id === contact.client_id) return { ...c, is_primary: false };
          return c;
        });
      }
      
      return prev.map(c => 
        c.id === id ? { ...c, ...data, updated_at: now() } : c
      );
    });
  }, []);

  const deleteContact = useCallback((id: string) => {
    setClientContacts(prev => prev.filter(c => c.id !== id));
  }, []);

  const getContactsByClientId = useCallback((clientId: string) => 
    clientContacts.filter(c => c.client_id === clientId), [clientContacts]);

  const getPrimaryContact = useCallback((clientId: string) => 
    clientContacts.find(c => c.client_id === clientId && c.is_primary), [clientContacts]);

  const getDecisionMaker = useCallback((clientId: string) => 
    clientContacts.find(c => c.client_id === clientId && c.is_decision_maker), [clientContacts]);

  // Engagement operations
  const addEngagement = useCallback((data: Omit<Engagement, 'id' | 'created_at' | 'updated_at'>): Engagement => {
    const newEngagement: Engagement = {
      ...data,
      id: generateId('eng'),
      created_at: now(),
      updated_at: now(),
    };
    setEngagements(prev => [...prev, newEngagement]);
    
    // Log creation
    addEngagementHistoryEntry(newEngagement.id, 'created', null, null, data.name);
    
    return newEngagement;
  }, [addEngagementHistoryEntry]);

  const updateEngagement = useCallback((id: string, data: Partial<Engagement>) => {
    const engagement = engagements.find(e => e.id === id);
    if (!engagement) return;
    
    // Log field changes
    Object.keys(data).forEach(key => {
      if (key === 'updated_at') return;
      const oldVal = engagement[key as keyof Engagement];
      const newVal = data[key as keyof Engagement];
      
      if (String(oldVal ?? '') !== String(newVal ?? '')) {
        if (key === 'status') {
          const oldLabel = STATUS_LABELS[oldVal as EngagementStatus] || String(oldVal);
          const newLabel = STATUS_LABELS[newVal as EngagementStatus] || String(newVal);
          addEngagementHistoryEntry(id, 'status_change', key, oldLabel, newLabel);
        } else if (key === 'end_date' && newVal && !oldVal) {
          addEngagementHistoryEntry(id, 'end_date_set', key, null, String(newVal));
        } else {
          addEngagementHistoryEntry(id, 'field_update', key, String(oldVal ?? ''), String(newVal ?? ''));
        }
      }
    });
    
    setEngagements(prev => prev.map(e => 
      e.id === id ? { ...e, ...data, updated_at: now() } : e
    ));
  }, [engagements, addEngagementHistoryEntry]);

  const deleteEngagement = useCallback((id: string) => {
    setEngagements(prev => prev.filter(e => e.id !== id));
    setEngagementServices(prev => prev.filter(es => es.engagement_id !== id));
    setAssignments(prev => prev.filter(a => a.engagement_id !== id));
  }, []);

  // Engagement Service operations
  const addEngagementService = useCallback((data: Omit<EngagementService, 'id' | 'created_at' | 'updated_at'>): EngagementService => {
    const newService: EngagementService = {
      ...data,
      id: generateId('es'),
      created_at: now(),
      updated_at: now(),
    };
    setEngagementServices(prev => [...prev, newService]);
    
    // Log service addition
    addEngagementHistoryEntry(
      data.engagement_id, 
      'service_added', 
      null, 
      null, 
      data.name,
      newService.id,
      data.name
    );
    
    return newService;
  }, [addEngagementHistoryEntry]);

  const updateEngagementService = useCallback((id: string, data: Partial<EngagementService>) => {
    const service = engagementServicesList.find(es => es.id === id);
    if (!service) return;
    
    // Log significant changes
    if (data.price !== undefined && data.price !== service.price) {
      addEngagementHistoryEntry(
        service.engagement_id,
        'service_updated',
        'price',
        `${service.price} ${service.currency}`,
        `${data.price} ${data.currency || service.currency}`,
        id,
        service.name
      );
    }
    
    setEngagementServices(prev => prev.map(es => 
      es.id === id ? { ...es, ...data, updated_at: now() } : es
    ));
  }, [engagementServicesList, addEngagementHistoryEntry]);

  const deleteEngagementService = useCallback((id: string) => {
    const service = engagementServicesList.find(es => es.id === id);
    if (service) {
      addEngagementHistoryEntry(
        service.engagement_id,
        'service_removed',
        null,
        service.name,
        null,
        id,
        service.name
      );
    }
    
    setEngagementServices(prev => prev.filter(es => es.id !== id));
    // Also remove assignments for this service
    setAssignments(prev => prev.filter(a => a.engagement_service_id !== id));
  }, [engagementServicesList, addEngagementHistoryEntry]);

  const getEngagementServicesByEngagementId = useCallback((engagementId: string) => 
    engagementServicesList.filter(es => es.engagement_id === engagementId), [engagementServicesList]);

  // Get all unbilled one-off services
  const getUnbilledOneOffServices = useCallback(() => 
    engagementServicesList.filter(es => 
      es.billing_type === 'one_off' && 
      es.invoicing_status === 'pending' && 
      es.is_active
    ), [engagementServicesList]);

  // Mark an engagement service as invoiced
  const markEngagementServiceAsInvoiced = useCallback((id: string, invoiceId: string, invoicePeriod: string) => {
    setEngagementServices(prev => prev.map(es => 
      es.id === id ? {
        ...es,
        invoicing_status: 'invoiced' as const,
        invoiced_at: now(),
        invoiced_in_period: invoicePeriod,
        invoice_id: invoiceId,
        updated_at: now(),
      } : es
    ));
  }, []);

  // Colleague operations
  const addColleague = useCallback((data: Omit<Colleague, 'id' | 'created_at' | 'updated_at'>): Colleague => {
    const newColleague: Colleague = {
      ...data,
      id: generateId('col'),
      created_at: now(),
      updated_at: now(),
    };
    setColleagues(prev => [...prev, newColleague]);
    return newColleague;
  }, []);

  const updateColleague = useCallback((id: string, data: Partial<Colleague>) => {
    setColleagues(prev => prev.map(c => 
      c.id === id ? { ...c, ...data, updated_at: now() } : c
    ));
  }, []);

  const deleteColleague = useCallback((id: string) => {
    setColleagues(prev => prev.filter(c => c.id !== id));
  }, []);

  // Assignment operations
  const addAssignment = useCallback((data: Omit<EngagementAssignment, 'id' | 'created_at' | 'updated_at'>): EngagementAssignment => {
    const newAssignment: EngagementAssignment = {
      ...data,
      id: generateId('asg'),
      created_at: now(),
      updated_at: now(),
    };
    setAssignments(prev => [...prev, newAssignment]);
    return newAssignment;
  }, []);

  const updateAssignment = useCallback((id: string, data: Partial<EngagementAssignment>) => {
    setAssignments(prev => prev.map(a => 
      a.id === id ? { ...a, ...data, updated_at: now() } : a
    ));
  }, []);

  const removeAssignment = useCallback((id: string) => {
    setAssignments(prev => prev.filter(a => a.id !== id));
  }, []);

  const getAssignmentsByServiceId = useCallback((serviceId: string) => 
    assignments.filter(a => a.engagement_service_id === serviceId), [assignments]);

  // Extra Work operations
  const addExtraWork = useCallback((data: Omit<ExtraWork, 'id' | 'created_at' | 'updated_at' | 'status' | 'approval_date' | 'approved_by' | 'invoice_id' | 'invoice_number' | 'invoiced_at'>): ExtraWork => {
    const newExtraWork: ExtraWork = {
      ...data,
      id: generateId('ew'),
      status: 'pending_approval',
      approval_date: null,
      approved_by: null,
      invoice_id: null,
      invoice_number: null,
      invoiced_at: null,
      created_at: now(),
      updated_at: now(),
    };
    setExtraWorks(prev => [...prev, newExtraWork]);
    return newExtraWork;
  }, []);

  const updateExtraWork = useCallback((id: string, data: Partial<ExtraWork>) => {
    setExtraWorks(prev => prev.map(ew => 
      ew.id === id ? { ...ew, ...data, updated_at: now() } : ew
    ));
  }, []);

  const deleteExtraWork = useCallback((id: string) => {
    setExtraWorks(prev => prev.filter(ew => ew.id !== id));
  }, []);

  const getExtraWorksReadyToInvoice = useCallback((year: number, month: number) => {
    const targetPeriod = `${year}-${String(month).padStart(2, '0')}`;
    return extraWorks.filter(ew => {
      // New status system - check for ready_to_invoice status
      if (ew.status !== 'ready_to_invoice') return false;
      
      return ew.billing_period === targetPeriod;
    });
  }, [extraWorks]);

  const markExtraWorkAsInvoiced = useCallback((id: string, invoiceId: string, invoiceNumber: string) => {
    setExtraWorks(prev => prev.map(ew => 
      ew.id === id ? {
        ...ew,
        status: 'invoiced' as const,
        invoice_id: invoiceId,
        invoice_number: invoiceNumber,
        invoiced_at: now(),
        updated_at: now(),
      } : ew
    ));
  }, []);

  // Helper functions
  const getClientById = useCallback((id: string) => clients.find(c => c.id === id), [clients]);
  const getEngagementById = useCallback((id: string) => engagements.find(e => e.id === id), [engagements]);
  const getColleagueById = useCallback((id: string) => colleagues.find(c => c.id === id), [colleagues]);
  const getEngagementsByClientId = useCallback((clientId: string) => 
    engagements.filter(e => e.client_id === clientId), [engagements]);
  const getAssignmentsByEngagementId = useCallback((engagementId: string) => 
    assignments.filter(a => a.engagement_id === engagementId), [assignments]);
  const getMetricsByEngagementId = useCallback((engagementId: string) => 
    engagementMonthlyMetrics.filter(m => m.engagement_id === engagementId), []);
  const getInvoicesByEngagementId = useCallback((engagementId: string) => 
    engagementInvoiceHistory.filter(inv => inv.engagement_id === engagementId), []);

  const getEngagementHistory = useCallback((engagementId: string) => 
    engagementHistory.filter(h => h.engagement_id === engagementId), [engagementHistory]);

  // Service operations
  const addService = useCallback((data: Omit<Service, 'id' | 'created_at' | 'updated_at'>): Service => {
    const newService: Service = {
      ...data,
      id: generateId('srv'),
      created_at: now(),
      updated_at: now(),
    };
    setServices(prev => [...prev, newService]);
    return newService;
  }, []);

  const updateService = useCallback((id: string, data: Partial<Service>) => {
    setServices(prev => prev.map(s => 
      s.id === id ? { ...s, ...data, updated_at: now() } : s
    ));
  }, []);

  const deleteService = useCallback((id: string) => {
    setServices(prev => prev.filter(s => s.id !== id));
  }, []);

  const toggleServiceActive = useCallback((id: string) => {
    setServices(prev => prev.map(s => 
      s.id === id ? { ...s, is_active: !s.is_active, updated_at: now() } : s
    ));
  }, []);

  // Issued Invoices operations
  const addIssuedInvoice = useCallback((data: Omit<IssuedInvoice, 'id' | 'created_at'>): IssuedInvoice => {
    const newInvoice: IssuedInvoice = {
      ...data,
      id: generateId('issued'),
      created_at: now(),
    };
    setIssuedInvoices(prev => [...prev, newInvoice]);
    return newInvoice;
  }, []);

  const getIssuedInvoicesByYear = useCallback((year: number) => 
    issuedInvoicesList.filter(inv => inv.year === year), [issuedInvoicesList]);

  const getNextInvoiceNumber = useCallback((year: number) => {
    const yearInvoices = issuedInvoicesList.filter(inv => inv.year === year);
    const maxNumber = yearInvoices.reduce((max, inv) => {
      const match = inv.invoice_number.match(/FV-\d{4}-(\d+)/);
      const num = match ? parseInt(match[1], 10) : 0;
      return Math.max(max, num);
    }, 0);
    const nextNumber = maxNumber + 1;
    return `FV-${year}-${String(nextNumber).padStart(3, '0')}`;
  }, [issuedInvoicesList]);

  return (
    <CRMDataContext.Provider value={{
      clients,
      clientContacts,
      engagements,
      engagementServices: engagementServicesList,
      colleagues,
      assignments,
      clientServices: clientServicesList,
      extraWorks,
      addClient,
      updateClient,
      deleteClient,
      addContact,
      updateContact,
      deleteContact,
      getContactsByClientId,
      getPrimaryContact,
      getDecisionMaker,
      addEngagement,
      updateEngagement,
      deleteEngagement,
      addEngagementService,
      updateEngagementService,
      deleteEngagementService,
      getEngagementServicesByEngagementId,
      getUnbilledOneOffServices,
      markEngagementServiceAsInvoiced,
      addColleague,
      updateColleague,
      deleteColleague,
      addAssignment,
      updateAssignment,
      removeAssignment,
      getAssignmentsByServiceId,
      addExtraWork,
      updateExtraWork,
      deleteExtraWork,
      getExtraWorksReadyToInvoice,
      markExtraWorkAsInvoiced,
      getClientById,
      getEngagementById,
      getColleagueById,
      getEngagementsByClientId,
      getAssignmentsByEngagementId,
      getMetricsByEngagementId,
      getInvoicesByEngagementId,
      engagementHistory,
      getEngagementHistory,
      services: servicesList,
      addService,
      updateService,
      deleteService,
      toggleServiceActive,
      issuedInvoices: issuedInvoicesList,
      addIssuedInvoice,
      getIssuedInvoicesByYear,
      getNextInvoiceNumber,
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
