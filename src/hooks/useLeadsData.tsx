import { useState, useCallback, createContext, useContext, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Lead, LeadStage, LeadNote, LeadChangeType, LeadHistoryEntry } from '@/types/crm';

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
  isLoading: boolean;
  
  // CRUD operations
  addLead: (data: Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'notes' | 'converted_to_client_id' | 'converted_to_engagement_id' | 'converted_at'>) => Promise<Lead>;
  updateLead: (id: string, data: Partial<Lead>) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  
  // Stage management
  updateLeadStage: (id: string, stage: LeadStage) => Promise<void>;
  
  // Notes
  addNote: (leadId: string, text: string) => Promise<void>;
  
  // Helpers
  getLeadById: (id: string) => Lead | undefined;
  getLeadsByStage: (stage: LeadStage) => Lead[];
  getLeadsByOwner: (ownerId: string) => Lead[];
  getLeadHistory: (leadId: string) => LeadHistoryEntry[];
  
  // Conversion
  markLeadAsConverted: (leadId: string, clientId: string, engagementId: string) => Promise<void>;
}

const LeadsDataContext = createContext<LeadsDataContextType | null>(null);

export function LeadsDataProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [leadHistory, setLeadHistory] = useState<LeadHistoryEntry[]>([]);

  const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const now = () => new Date().toISOString();

  // Fetch leads from Supabase
  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('leads').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      // Transform leads to include notes array (will be empty for now)
      return (data || []).map((lead: any) => ({
        ...lead,
        notes: [],
        stage: lead.stage || 'new_lead',
        potential_services: lead.potential_services || [],
        access_request_platforms: lead.access_request_platforms || [],
      }));
    },
  });

  // Add history entry helper (local state for now)
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
      changed_by: '',
      changed_by_name: 'User',
      created_at: now(),
    };
    setLeadHistory(prev => [entry, ...prev]);
  }, []);

  // Mutations
  const addLeadMutation = useMutation({
    mutationFn: async (data: Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'notes' | 'converted_to_client_id' | 'converted_to_engagement_id' | 'converted_at'>) => {
      const insertData = {
        ...data,
        notes: [],
        converted_to_client_id: null,
        converted_to_engagement_id: null,
        converted_at: null,
      };
      const { data: result, error } = await (supabase as any).from('leads').insert(insertData).select().single();
      if (error) throw error;
      return { ...result, notes: [] };
    },
    onSuccess: (newLead) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      addHistoryEntry(newLead.id, 'created', null, null, newLead.company_name);
    },
  });

  const updateLeadMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Lead> }) => {
      const { error } = await (supabase as any).from('leads').update({
        ...data,
        updated_at: now(),
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leads'] }),
  });

  const deleteLeadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('leads').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leads'] }),
  });

  const addLead = useCallback(async (data: Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'notes' | 'converted_to_client_id' | 'converted_to_engagement_id' | 'converted_at'>): Promise<Lead> => {
    return addLeadMutation.mutateAsync(data);
  }, [addLeadMutation]);

  const updateLead = useCallback(async (id: string, data: Partial<Lead>) => {
    const lead = leads.find(l => l.id === id);
    if (!lead) return;
    
    // Log field changes
    Object.keys(data).forEach(key => {
      if (key === 'updated_at' || key === 'updated_by') return;
      const oldVal = String((lead as any)[key] ?? '');
      const newVal = String((data as any)[key] ?? '');
      if (oldVal !== newVal) {
        if (key === 'owner_id') {
          addHistoryEntry(id, 'owner_change', key, oldVal, newVal);
        } else {
          addHistoryEntry(id, 'field_update', key, oldVal, newVal);
        }
      }
    });
    
    await updateLeadMutation.mutateAsync({ id, data });
  }, [leads, updateLeadMutation, addHistoryEntry]);

  const deleteLead = useCallback(async (id: string) => {
    await deleteLeadMutation.mutateAsync(id);
  }, [deleteLeadMutation]);

  const updateLeadStage = useCallback(async (id: string, stage: LeadStage) => {
    const lead = leads.find(l => l.id === id);
    if (!lead) return;
    
    const oldStageLabel = STAGE_LABELS[lead.stage];
    const newStageLabel = STAGE_LABELS[stage];
    
    addHistoryEntry(id, 'stage_change', 'stage', oldStageLabel, newStageLabel);
    
    await updateLeadMutation.mutateAsync({ id, data: { stage } });
  }, [leads, updateLeadMutation, addHistoryEntry]);

  const addNote = useCallback(async (leadId: string, text: string) => {
    // For now, notes are stored in lead history (will be proper table later)
    addHistoryEntry(leadId, 'note_added', null, null, text.substring(0, 100) + (text.length > 100 ? '...' : ''));
    
    // Update lead's updated_at
    await updateLeadMutation.mutateAsync({ id: leadId, data: {} });
  }, [updateLeadMutation, addHistoryEntry]);

  const getLeadById = useCallback((id: string) => leads.find(l => l.id === id), [leads]);
  
  const getLeadsByStage = useCallback((stage: LeadStage) => 
    leads.filter(l => l.stage === stage), [leads]);
  
  const getLeadsByOwner = useCallback((ownerId: string) => 
    leads.filter(l => l.owner_id === ownerId), [leads]);

  const getLeadHistory = useCallback((leadId: string) => 
    leadHistory.filter(h => h.lead_id === leadId), [leadHistory]);

  const markLeadAsConverted = useCallback(async (leadId: string, clientId: string, engagementId: string) => {
    addHistoryEntry(leadId, 'converted', null, null, 'Převedeno na zakázku');
    
    await updateLeadMutation.mutateAsync({
      id: leadId,
      data: {
        stage: 'won' as LeadStage,
        converted_to_client_id: clientId,
        converted_to_engagement_id: engagementId,
        converted_at: now(),
      },
    });
  }, [updateLeadMutation, addHistoryEntry]);

  return (
    <LeadsDataContext.Provider value={{
      leads,
      leadHistory,
      isLoading,
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
