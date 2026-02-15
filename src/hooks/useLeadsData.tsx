import { useState, useCallback, createContext, useContext, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Lead, LeadStage, LeadNote, LeadNoteType, LeadChangeType, LeadHistoryEntry } from '@/types/crm';

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
  addNote: (leadId: string, text: string, noteType?: LeadNoteType, callDate?: string | null, subject?: string | null, recipients?: string[] | null) => Promise<void>;

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

  const now = () => new Date().toISOString();

  // Fetch leads from Supabase
  const { data: leads = [], isLoading: leadsLoading } = useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      // Transform leads - notes is JSONB array, ensure it's always an array
      return (data || []).map((lead: Record<string, unknown>) => ({
        ...lead,
        notes: Array.isArray(lead.notes) ? lead.notes : [],
        stage: lead.stage || 'new_lead',
        potential_services: Array.isArray(lead.potential_services) ? lead.potential_services : [],
        access_request_platforms: Array.isArray(lead.access_request_platforms) ? lead.access_request_platforms : [],
      }));
    },
  });

  // Fetch lead history from Supabase
  const { data: leadHistory = [], isLoading: historyLoading } = useQuery({
    queryKey: ['lead_history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lead_history')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((entry: Record<string, unknown>) => ({
        ...entry,
        field_label: entry.field_label || (entry.field_name ? LEAD_FIELD_LABELS[entry.field_name as string] || entry.field_name : null),
      }));
    },
  });

  const isLoading = leadsLoading || historyLoading;

  // Add history entry helper - uses database function
  const addHistoryEntry = useCallback(async (
    leadId: string,
    changeType: LeadChangeType,
    fieldName: string | null = null,
    fieldLabel: string | null = null,
    oldValue: string | null = null,
    newValue: string | null = null
  ) => {
    const { error } = await supabase.rpc('log_lead_change', {
      _lead_id: leadId,
      _change_type: changeType,
      _field_name: fieldName,
      _field_label: fieldLabel || (fieldName ? LEAD_FIELD_LABELS[fieldName] || fieldName : null),
      _old_value: oldValue,
      _new_value: newValue,
    });

    if (error) {
      console.error('Error logging lead change:', error);
      // Don't throw - history logging shouldn't break the main operation
    } else {
      queryClient.invalidateQueries({ queryKey: ['lead_history'] });
    }
  }, [queryClient]);

  // Mutations
  const addLeadMutation = useMutation({
    mutationFn: async (data: Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'notes' | 'converted_to_client_id' | 'converted_to_engagement_id' | 'converted_at'>) => {
      const insertData = {
        ...data,
        notes: [],
        potential_services: data.potential_services || [],
        access_request_platforms: data.access_request_platforms || [],
        converted_to_client_id: null,
        converted_to_engagement_id: null,
        converted_at: null,
      };
      const { data: result, error } = await supabase.from('leads').insert(insertData).select().single();
      if (error) throw error;
      const newLead = {
        ...result,
        notes: Array.isArray(result.notes) ? result.notes : [],
        potential_services: Array.isArray(result.potential_services) ? result.potential_services : [],
        access_request_platforms: Array.isArray(result.access_request_platforms) ? result.access_request_platforms : [],
      };

      // Log creation in history
      await addHistoryEntry(newLead.id, 'created', null, null, null, newLead.company_name);

      return newLead;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });

  const updateLeadMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Lead> }) => {
      const { error } = await supabase.from('leads').update({
        ...data,
        updated_at: now(),
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leads'] }),
  });

  const deleteLeadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('leads').delete().eq('id', id);
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

    // Log field changes before updating
    const historyPromises: Promise<void>[] = [];
    Object.keys(data).forEach(key => {
      if (key === 'updated_at' || key === 'updated_by' || key === 'notes') return;
      const oldVal = String((lead as Record<string, unknown>)[key] ?? '');
      const newVal = String((data as Record<string, unknown>)[key] ?? '');
      if (oldVal !== newVal) {
        const fieldLabel = LEAD_FIELD_LABELS[key] || key;
        if (key === 'owner_id') {
          historyPromises.push(addHistoryEntry(id, 'owner_change', key, fieldLabel, oldVal, newVal));
        } else {
          historyPromises.push(addHistoryEntry(id, 'field_update', key, fieldLabel, oldVal, newVal));
        }
      }
    });

    // Wait for history entries to be logged (non-blocking)
    Promise.all(historyPromises).then(() => {}).catch(e => console.error('History logging error:', e));

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

    // Log stage change
    await addHistoryEntry(id, 'stage_change', 'stage', LEAD_FIELD_LABELS.stage || 'Stav', oldStageLabel, newStageLabel);

    await updateLeadMutation.mutateAsync({ id, data: { stage } });
  }, [leads, updateLeadMutation, addHistoryEntry]);

  const addNote = useCallback(async (
    leadId: string,
    text: string,
    noteType: LeadNoteType = 'general',
    callDate: string | null = null,
    subject: string | null = null,
    recipients: string[] | null = null
  ) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    // Get current user info for note
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    const authorName = profile?.full_name || user.email || 'Unknown';

    // Create note object
    const newNote: LeadNote = {
      id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      lead_id: leadId,
      author_id: user.id,
      author_name: authorName,
      text,
      note_type: noteType,
      call_date: callDate,
      subject,
      recipients,
      created_at: now(),
    };

    // Append to notes JSONB array
    const currentNotes = Array.isArray(lead.notes) ? lead.notes : [];
    const updatedNotes = [...currentNotes, newNote];

    // Update lead with new notes array
    await updateLeadMutation.mutateAsync({
      id: leadId,
      data: { notes: updatedNotes }
    });

    // Log note addition in history
    const noteTypeLabel = noteType === 'call' ? 'hovor' : noteType === 'internal' ? 'interní poznámka' : noteType === 'email_sent' ? 'odeslaný e-mail' : noteType === 'email_received' ? 'přijatý e-mail' : 'poznámka';
    await addHistoryEntry(leadId, 'note_added', null, null, null, `Přidán ${noteTypeLabel}: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`);
  }, [leads, updateLeadMutation, addHistoryEntry]);

  const getLeadById = useCallback((id: string) => leads.find(l => l.id === id), [leads]);

  const getLeadsByStage = useCallback((stage: LeadStage) =>
    leads.filter(l => l.stage === stage), [leads]);

  const getLeadsByOwner = useCallback((ownerId: string) =>
    leads.filter(l => l.owner_id === ownerId), [leads]);

  const getLeadHistory = useCallback((leadId: string) =>
    leadHistory.filter(h => h.lead_id === leadId), [leadHistory]);

  const markLeadAsConverted = useCallback(async (leadId: string, clientId: string, engagementId: string) => {
    // Log conversion in history
    await addHistoryEntry(leadId, 'converted', null, null, null, `Převedeno na klienta a zakázku`);

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
