import { useState, useCallback, createContext, useContext, ReactNode } from 'react';
import { leads as initialLeads } from '@/data/mockData';
import type { Lead, LeadStage, LeadNote, LeadChangeType, LeadHistoryEntry } from '@/types/crm';
import { currentUser } from '@/data/mockData';

// Field labels for history display
const LEAD_FIELD_LABELS: Record<string, string> = {
  company_name: 'Název společnosti',
  ico: 'IČO',
  dic: 'DIČ',
  website: 'Web',
  industry: 'Obor',
  contact_name: 'Kontaktní osoba',
  contact_position: 'Pozice',
  contact_email: 'E-mail kontaktu',
  contact_phone: 'Telefon kontaktu',
  stage: 'Stav',
  owner_id: 'Odpovědná osoba',
  source: 'Zdroj',
  source_custom: 'Vlastní zdroj',
  client_message: 'Zpráva od klienta',
  ad_spend_monthly: 'Měsíční investice do reklamy',
  summary: 'Shrnutí',
  potential_service: 'Potenciální služba',
  offer_type: 'Typ nabídky',
  estimated_price: 'Odhadovaná cena',
  probability_percent: 'Pravděpodobnost',
  offer_url: 'URL nabídky',
  offer_created_at: 'Nabídka vytvořena',
  billing_street: 'Ulice',
  billing_city: 'Město',
  billing_zip: 'PSČ',
  billing_country: 'Země',
  billing_email: 'Fakturační e-mail',
};

const STAGE_LABELS: Record<LeadStage, string> = {
  new_lead: 'Nový lead',
  meeting_done: 'Schůzka proběhla',
  waiting_access: 'Čekáme na přístupy',
  access_received: 'Přístupy přijaty',
  preparing_offer: 'Příprava nabídky',
  offer_sent: 'Nabídka odeslána',
  won: 'Vyhráno',
  lost: 'Prohráno',
  postponed: 'Odloženo',
};

export { STAGE_LABELS };

interface LeadsDataContextType {
  leads: Lead[];
  leadHistory: LeadHistoryEntry[];
  
  // CRUD operations
  addLead: (data: Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'notes' | 'converted_to_client_id' | 'converted_to_engagement_id' | 'converted_at'>) => Lead;
  updateLead: (id: string, data: Partial<Lead>) => void;
  deleteLead: (id: string) => void;
  
  // Stage management
  updateLeadStage: (id: string, stage: LeadStage) => void;
  
  // Notes
  addNote: (leadId: string, text: string) => void;
  
  // Helpers
  getLeadById: (id: string) => Lead | undefined;
  getLeadsByStage: (stage: LeadStage) => Lead[];
  getLeadsByOwner: (ownerId: string) => Lead[];
  getLeadHistory: (leadId: string) => LeadHistoryEntry[];
  
  // Conversion
  markLeadAsConverted: (leadId: string, clientId: string, engagementId: string) => void;
}

const LeadsDataContext = createContext<LeadsDataContextType | null>(null);

export function LeadsDataProvider({ children }: { children: ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [leadHistory, setLeadHistory] = useState<LeadHistoryEntry[]>([]);

  const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const now = () => new Date().toISOString();

  // Add history entry helper
  const addHistoryEntry = useCallback((
    leadId: string,
    changeType: LeadChangeType,
    fieldName: string | null,
    oldValue: string | null,
    newValue: string | null
  ) => {
    const entry: LeadHistoryEntry = {
      id: generateId('lh'),
      lead_id: leadId,
      change_type: changeType,
      field_name: fieldName,
      field_label: fieldName ? LEAD_FIELD_LABELS[fieldName] || fieldName : null,
      old_value: oldValue,
      new_value: newValue,
      changed_by: currentUser.id,
      changed_by_name: currentUser.full_name,
      created_at: now(),
    };
    setLeadHistory(prev => [entry, ...prev]);
  }, []);

  const addLead = useCallback((data: Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'notes' | 'converted_to_client_id' | 'converted_to_engagement_id' | 'converted_at'>): Lead => {
    const newLead: Lead = {
      ...data,
      id: generateId('lead'),
      notes: [],
      converted_to_client_id: null,
      converted_to_engagement_id: null,
      converted_at: null,
      source_custom: data.source_custom ?? null,
      client_message: data.client_message ?? null,
      ad_spend_monthly: data.ad_spend_monthly ?? null,
      offer_created_at: data.offer_created_at ?? null,
      potential_services: data.potential_services ?? [],
      access_request_sent_at: data.access_request_sent_at ?? null,
      access_request_platforms: data.access_request_platforms ?? [],
      access_received_at: data.access_received_at ?? null,
      onboarding_form_sent_at: data.onboarding_form_sent_at ?? null,
      onboarding_form_url: data.onboarding_form_url ?? null,
      onboarding_form_completed_at: data.onboarding_form_completed_at ?? null,
      contract_url: data.contract_url ?? null,
      contract_created_at: data.contract_created_at ?? null,
      created_at: now(),
      updated_at: now(),
    };
    setLeads(prev => [...prev, newLead]);
    
    // Log creation
    addHistoryEntry(newLead.id, 'created', null, null, data.company_name);
    
    return newLead;
  }, [addHistoryEntry]);

  const updateLead = useCallback((id: string, data: Partial<Lead>) => {
    const lead = leads.find(l => l.id === id);
    if (!lead) return;
    
    // Log field changes
    Object.keys(data).forEach(key => {
      if (key === 'updated_at' || key === 'updated_by') return;
      const oldVal = String(lead[key as keyof Lead] ?? '');
      const newVal = String(data[key as keyof Lead] ?? '');
      if (oldVal !== newVal) {
        if (key === 'owner_id') {
          addHistoryEntry(id, 'owner_change', key, oldVal, newVal);
        } else {
          addHistoryEntry(id, 'field_update', key, oldVal, newVal);
        }
      }
    });
    
    setLeads(prev => prev.map(l => 
      l.id === id ? { ...l, ...data, updated_at: now(), updated_by: currentUser.id } : l
    ));
  }, [leads, addHistoryEntry]);

  const deleteLead = useCallback((id: string) => {
    setLeads(prev => prev.filter(l => l.id !== id));
  }, []);

  const updateLeadStage = useCallback((id: string, stage: LeadStage) => {
    const lead = leads.find(l => l.id === id);
    if (!lead) return;
    
    const oldStageLabel = STAGE_LABELS[lead.stage];
    const newStageLabel = STAGE_LABELS[stage];
    
    addHistoryEntry(id, 'stage_change', 'stage', oldStageLabel, newStageLabel);
    
    setLeads(prev => prev.map(l => 
      l.id === id ? { ...l, stage, updated_at: now(), updated_by: currentUser.id } : l
    ));
  }, [leads, addHistoryEntry]);

  const addNote = useCallback((leadId: string, text: string) => {
    const note: LeadNote = {
      id: generateId('note'),
      lead_id: leadId,
      author_id: currentUser.id,
      author_name: currentUser.full_name,
      text,
      created_at: now(),
    };
    
    addHistoryEntry(leadId, 'note_added', null, null, text.substring(0, 100) + (text.length > 100 ? '...' : ''));
    
    setLeads(prev => prev.map(l => 
      l.id === leadId 
        ? { ...l, notes: [note, ...l.notes], updated_at: now() } 
        : l
    ));
  }, [addHistoryEntry]);

  const getLeadById = useCallback((id: string) => leads.find(l => l.id === id), [leads]);
  
  const getLeadsByStage = useCallback((stage: LeadStage) => 
    leads.filter(l => l.stage === stage), [leads]);
  
  const getLeadsByOwner = useCallback((ownerId: string) => 
    leads.filter(l => l.owner_id === ownerId), [leads]);

  const getLeadHistory = useCallback((leadId: string) => 
    leadHistory.filter(h => h.lead_id === leadId), [leadHistory]);

  const markLeadAsConverted = useCallback((leadId: string, clientId: string, engagementId: string) => {
    addHistoryEntry(leadId, 'converted', null, null, 'Převedeno na zakázku');
    
    setLeads(prev => prev.map(l => 
      l.id === leadId ? {
        ...l,
        stage: 'won' as LeadStage,
        converted_to_client_id: clientId,
        converted_to_engagement_id: engagementId,
        converted_at: now(),
        updated_at: now(),
        updated_by: currentUser.id,
      } : l
    ));
  }, [addHistoryEntry]);

  return (
    <LeadsDataContext.Provider value={{
      leads,
      leadHistory,
      addLead,
      updateLead,
      deleteLead,
      updateLeadStage,
      addNote,
      getLeadById,
      getLeadsByStage,
      getLeadsByOwner,
      getLeadHistory,
      markLeadAsConverted,
    }}>
      {children}
    </LeadsDataContext.Provider>
  );
}

export function useLeadsData() {
  const context = useContext(LeadsDataContext);
  if (!context) {
    throw new Error('useLeadsData must be used within a LeadsDataProvider');
  }
  return context;
}
